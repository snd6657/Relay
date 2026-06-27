from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.project import Project
from app.models.company import DiscoveredCompany
from app.workflow.graph import app_workflow
from app.workflow.state import AgentState

router = APIRouter()

def run_workflow_background(project_id: int, db: Session):
    # Fetch Project data to initialize State
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project or not db_project.icp:
        return

    # Clear previous checkpoints for this project so a fresh run can start
    import psycopg
    from app.core.config import settings
    try:
        with psycopg.connect(settings.DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM checkpoints WHERE thread_id = %s", (str(project_id),))
                cur.execute("DELETE FROM checkpoint_writes WHERE thread_id = %s", (str(project_id),))
            conn.commit()
    except Exception as e:
        print(f"Error clearing checkpoints: {e}")

    # Prepare initial state
    initial_state: AgentState = {
        "project_id": project_id,
        "icp": db_project.icp.__dict__,
        "business_rules": [rule.__dict__ for rule in db_project.business_rules],
        "target_personas": [persona.__dict__ for persona in db_project.personas],
        "search_queries": [],
        "discovered_urls": [],
        "scraped_companies": [],
        "qualified_companies": [],
        "contacts_found": []
    }
    
    # Remove SQLAlchemy specific state from dicts
    initial_state["icp"].pop("_sa_instance_state", None)
    for rule in initial_state["business_rules"]:
        rule.pop("_sa_instance_state", None)
    for persona in initial_state["target_personas"]:
        persona.pop("_sa_instance_state", None)

    try:
        # Define thread for checkpointer
        config = {"configurable": {"thread_id": str(project_id)}}
        
        # Execute the LangGraph workflow up to the interrupt
        final_state = app_workflow.invoke(initial_state, config=config)
        
        # Check if we hit the breakpoint
        state_config = app_workflow.get_state(config)
        is_paused = len(state_config.next) > 0

        # Save results to database (this could happen before or after approval in a real app,
        # but doing it now allows the dashboard to show the data while pending).
        domain_to_company = {}
        
        # We will also generate the embeddings here before saving
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        embeddings_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        
        for company_data in final_state.get("qualified_companies", []):
            # Only save qualified companies for this demo to save space, or update the existing ones
            embedding = None
            if company_data.get("raw_markdown"):
                try:
                    embedding = embeddings_model.embed_query(company_data["raw_markdown"][:8000])
                except Exception as e:
                    print(f"Embedding failed: {e}")
            
            db_company = DiscoveredCompany(
                project_id=project_id,
                name=company_data.get("name"),
                domain=company_data.get("domain"),
                raw_markdown=company_data.get("raw_markdown"),
                description=company_data.get("description", ""),
                status="QUALIFIED" if company_data.get("is_qualified") else "REJECTED",
                qualification_reason=company_data.get("qualification_reason", ""),
                recommendation=company_data.get("recommendation", ""),
                recommendation_json=company_data.get("recommendation_json", {}),
                lead_score=company_data.get("lead_score"),
                confidence_score=company_data.get("confidence_score"),
                metadata_json={
                    "industry": company_data.get("industry"),
                    "employee_count": company_data.get("employee_count"),
                    "funding_stage": company_data.get("funding_stage"),
                    "tech_stack": company_data.get("tech_stack", []),
                    "growth_indicators": company_data.get("growth_indicators", [])
                },
                embedding=embedding,
                human_status="PENDING_REVIEW" if is_paused else "AUTO_APPROVED"
            )
            db.add(db_company)
            db.flush()
            domain_to_company[company_data.get("domain")] = db_company.id
            
        # Save contacts found
        from app.models.contact import Contact
        for contact_data in final_state.get("contacts_found", []):
            domain = contact_data.get("company_domain")
            company_id = domain_to_company.get(domain)
            if company_id:
                db_contact = Contact(
                    company_id=company_id,
                    first_name=contact_data.get("first_name"),
                    last_name=contact_data.get("last_name"),
                    email=contact_data.get("email"),
                    position=contact_data.get("position"),
                    linkedin_url=contact_data.get("linkedin_url")
                )
                db.add(db_contact)
                
        db.commit()
    except Exception as e:
        print(f"Workflow failed for project {project_id}: {e}")
        db.rollback()
        
        try:
            db_project = db.query(Project).filter(Project.id == project_id).first()
            if db_project:
                db_project.workflow_status = "FAILED"
                db.commit()
        except Exception:
            pass

@router.post("/{project_id}/run", status_code=status.HTTP_202_ACCEPTED)
def trigger_workflow(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if not db_project.icp:
         raise HTTPException(status_code=400, detail="Project requires an ICP to run")
         
    if db_project.workflow_status == "RUNNING":
         raise HTTPException(status_code=409, detail="Workflow is already running for this project.")

    db_project.workflow_status = "RUNNING"
    db.commit()

    background_tasks.add_task(run_workflow_background, project_id, db)
    return {"message": "Workflow started in the background", "project_id": project_id}


class ApprovalRequest(BaseModel):
    approved: bool

@router.post("/{project_id}/resume")
def resume_workflow(project_id: int, request: ApprovalRequest, db: Session = Depends(get_db)):
    config = {"configurable": {"thread_id": str(project_id)}}
    
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if db_project:
        db_project.workflow_status = "RUNNING"
        db.commit()

    # Check if graph is actually paused
    state = app_workflow.get_state(config)
    if not state.next:
        raise HTTPException(status_code=400, detail="Workflow is not pending human approval.")
        
    # Resume the graph by passing None to the node we interrupted before
    app_workflow.invoke(None, config=config)
    
    # Update Database status based on human feedback
    new_status = "APPROVED" if request.approved else "REJECTED"
    db.query(DiscoveredCompany).filter(
        DiscoveredCompany.project_id == project_id,
        DiscoveredCompany.human_status == "PENDING_REVIEW"
    ).update({"human_status": new_status})
    
    db.commit()
    
    return {"message": f"Workflow resumed and status set to {new_status}"}

@router.post("/{project_id}/pause")
def pause_workflow(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db_project.workflow_status = "PAUSED"
    db.commit()
    
    return {"message": "Workflow pause signal sent. It will pause at the next safe boundary."}

@router.get("/status/all")
def get_all_workflow_statuses():
    from app.db.database import SessionLocal
    from app.models.project import Project
    import json
    
    db = SessionLocal()
    projects = db.query(Project).all()
    
    results = []
    
    node_metadata = {
        "planner": {"label": "Planner", "blurb": "Plans the workflow graph and routes state between agents."},
        "market_search": {"label": "Market Intelligence", "blurb": "Scans web to surface candidate companies."},
        "company_scraper": {"label": "Company Intelligence", "blurb": "Extracts detailed metadata and markdown from websites."},
        "qualification": {"label": "Qualification", "blurb": "Scores companies against the ICP rules."},
        "contact_discovery": {"label": "Contact Discovery", "blurb": "Finds key personas and contact information."},
        "recommendation": {"label": "Recommendation Engine", "blurb": "Synthesizes final opportunity rationale."},
        "human_approval": {"label": "Human Review", "blurb": "Awaiting your final approval."}
    }
    
    sequence = [
        "planner", "market_search", "company_scraper", 
        "qualification", "contact_discovery", "recommendation", "human_approval"
    ]
    
    for project in projects:
        thread_id = str(project.id)
        config = {"configurable": {"thread_id": thread_id}}
        
        # Get the latest state for this project
        state = app_workflow.get_state(config)
        
        current_node = "none"
        if state:
            next_nodes = getattr(state, "next", [])
            current_node = next_nodes[0] if next_nodes else "done"
            
            # If the workflow crashed, the current node is stuck and task has error
            if getattr(state, "tasks", None) and hasattr(state.tasks[0], "error") and state.tasks[0].error:
                current_node = "error"
        
        db_status = project.workflow_status or "IDLE"
        pipeline = []
        
        # If the project is IDLE, no state exists yet, or if FAILED and no state, current_node should not be "done"
        if not state and db_status != "COMPLETED":
            current_node = "none"
        if db_status == "FAILED" and current_node == "done":
            current_node = "error"
        
        for i, node_id in enumerate(sequence):
            status = "queued"
            if db_status == "IDLE":
                status = "queued"
            else:
                if current_node == "done":
                    # DB status could be COMPLETED or PAUSED at human_approval
                    if db_status == "FAILED":
                        status = "error"
                    elif db_status == "PAUSED" and node_id == "human_approval":
                        status = "paused"
                    else:
                        status = "done"
                elif current_node == "error" and getattr(state, "tasks", None) and state.tasks[0].name == node_id:
                    status = "error"
                else:
                    try:
                        curr_idx = sequence.index(current_node)
                    except ValueError:
                        curr_idx = 999
                        
                    if i < curr_idx:
                        status = "done"
                    elif i == curr_idx:
                        if db_status == "FAILED":
                            status = "error"
                        elif db_status == "PAUSED":
                            status = "paused"
                        elif node_id == "human_approval" and current_node == "human_approval":
                            status = "paused"
                        else:
                            status = "running"
                    else:
                        status = "queued"
            
            # Additional safety: If a node is before the error node, it's done. But if DB is FAILED, we shouldn't arbitrarily mark things done if they didn't run. 
            # The curr_idx logic handles this.
            
            payload = {}
            if state and hasattr(state, "values"):
                if node_id == "market_search":
                    payload = {"discovered": len(state.values.get("discovered_urls", []))}
                elif node_id == "company_scraper":
                    payload = {"scraped": len(state.values.get("scraped_companies", []))}
                elif node_id == "qualification":
                    payload = {"qualified": len(state.values.get("qualified_companies", []))}
                elif node_id == "contact_discovery":
                    payload = {"contacts": len(state.values.get("contacts_found", []))}
                
            pipeline.append({
                "id": node_id,
                "step": i + 1,
                "label": node_metadata[node_id]["label"],
                "blurb": node_metadata[node_id]["blurb"],
                "status": status,
                "durationMs": 1500, # Estimated demo time
                "progress": 100 if status == "done" else (50 if status in ["running", "paused"] else 0),
                "payloadPreview": json.dumps(payload, indent=2),
                "logs": [f"{status.upper()}: {node_metadata[node_id]['label']}"]
            })
            
        results.append({
            "project_id": project.id,
            "project_name": project.name,
            "workflow_status": db_status,
            "pipeline": pipeline
        })
        
    db.close()
    return {"projects": results}


