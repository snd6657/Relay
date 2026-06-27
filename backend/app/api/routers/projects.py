from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.project import Project, ICP, TargetPersona, BusinessRule
from app.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    # Create Project
    db_project = Project(
        name=project_in.name,
        description=project_in.description,
        is_active=project_in.is_active
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # Create ICP
    db_icp = ICP(
        project_id=db_project.id,
        **project_in.icp.model_dump()
    )
    db.add(db_icp)

    # Create Personas
    for persona_in in project_in.personas:
        db_persona = TargetPersona(
            project_id=db_project.id,
            **persona_in.model_dump()
        )
        db.add(db_persona)

    # Create Business Rules
    for rule_in in project_in.business_rules:
        db_rule = BusinessRule(
            project_id=db_project.id,
            **rule_in.model_dump()
        )
        db.add(db_rule)

    db.commit()
    db.refresh(db_project)
    
    return db_project

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    from app.models.company import DiscoveredCompany
    from app.models.project import Project
    
    analyzed_count = db.query(DiscoveredCompany).count()
    projects_count = db.query(Project).count()
    
    qualified_count = db.query(DiscoveredCompany).filter(DiscoveredCompany.status == "QUALIFIED").count()
    pending_review_count = db.query(DiscoveredCompany).filter(DiscoveredCompany.human_status == "PENDING_REVIEW").count()
    
    recent_qualified = db.query(DiscoveredCompany).filter(DiscoveredCompany.status == "QUALIFIED").order_by(DiscoveredCompany.id.desc()).limit(4).all()
    recent_pending = db.query(DiscoveredCompany).filter(DiscoveredCompany.human_status == "PENDING_REVIEW").order_by(DiscoveredCompany.id.desc()).limit(3).all()
    
    recent_companies = []
    for c in recent_qualified:
        recent_companies.append({
            "id": c.id,
            "name": c.name,
            "domain": c.domain,
            "status": c.status,
            "human_status": c.human_status,
        })
        
    recommendations = []
    for c in recent_pending:
        recommendations.append({
            "id": c.id,
            "companyName": c.name,
            "opportunity": c.recommendation or "Review required for this highly qualified lead.",
            "nextBestAction": "Review and Approve",
            "priority": "high",
        })

    return {
        "stats": {
            "analyzed": analyzed_count,
            "qualified": qualified_count,
            "pending_recommendations": pending_review_count,
            "active_projects": projects_count
        },
        "recent_companies": recent_companies,
        "top_recommendations": recommendations
    }

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@router.get("/", response_model=List[ProjectResponse])
def list_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = db.query(Project).offset(skip).limit(limit).all()
    return projects

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(db_project)
    db.commit()
    return None

@router.get("/{project_id}/companies")
def get_project_companies(project_id: int, db: Session = Depends(get_db)):
    from app.models.company import DiscoveredCompany
    companies = db.query(DiscoveredCompany).filter(DiscoveredCompany.project_id == project_id).all()
    
    # Return formatted for the frontend
    result = []
    for c in companies:
        contacts = [{"first_name": ct.first_name, "last_name": ct.last_name, "email": ct.email, "position": ct.position} for ct in c.contacts]
        result.append({
            "id": c.id,
            "name": c.name,
            "domain": c.domain,
            "description": c.description,
            "status": c.status,
            "human_status": c.human_status,
            "qualification_reason": c.qualification_reason,
            "recommendation": c.recommendation,
            "contacts": contacts,
            "metadata_json": c.metadata_json or {},
            "raw_markdown": c.raw_markdown
        })
    return result


