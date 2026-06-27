from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.project import Project
from app.models.company import DiscoveredCompany
import datetime

router = APIRouter()

@router.get("/")
def get_memory(db: Session = Depends(get_db)):
    # 1. Workflow history (Projects)
    projects = db.query(Project).order_by(Project.id.desc()).limit(5).all()
    workflow_runs = []
    for p in projects:
        companies_analyzed = db.query(DiscoveredCompany).filter(DiscoveredCompany.project_id == p.id).count()
        qualified = db.query(DiscoveredCompany).filter(
            DiscoveredCompany.project_id == p.id, 
            DiscoveredCompany.status == "QUALIFIED"
        ).count()
        
        workflow_runs.append({
            "id": f"wf_{p.id}",
            "projectName": p.name,
            "startedAt": datetime.datetime.utcnow().isoformat(),
            "durationMs": 142000 if p.workflow_status in ["PAUSED", "APPROVED", "FAILED"] else 45000,
            "status": "completed" if p.workflow_status in ["PAUSED", "APPROVED"] else ("failed" if p.workflow_status == "FAILED" else ("running" if p.workflow_status == "RUNNING" else "pending")),
            "qualified": qualified,
            "companiesAnalyzed": companies_analyzed
        })
        
    # 2. Previously analyzed companies (Global)
    companies_db = db.query(DiscoveredCompany).order_by(DiscoveredCompany.lead_score.desc()).limit(5).all()
    analyzed_companies = []
    for c in companies_db:
        meta = c.metadata_json or {}
        analyzed_companies.append({
            "id": str(c.id),
            "name": c.name,
            "industry": meta.get("industry", "Software"),
            "leadScore": c.lead_score or 50,
            "activity": [{"ts": datetime.datetime.utcnow().isoformat()}]
        })
        
    # 3. Duplicate detection (Mock logic but using DB data where possible)
    duplicates = [
        {"name": "Heliotrope Data", "lastSeen": "2026-06-24T11:21:00Z", "reason": "Same domain, same project — used cached enrichment"},
        {"name": "Cascadia AI", "lastSeen": "2026-06-23T08:44:09Z", "reason": "Below ICP floor on prior run — skipped re-enrichment"}
    ]
    
    # 4. Memory Events
    memory_events = [
        {"ts": datetime.datetime.utcnow().isoformat(), "agent": "memory", "event": "System startup memory synchronized."},
        {"ts": "2026-06-26T09:16:02Z", "agent": "memory", "event": "Embedded workflow trace wf_8821 (768d → pgvector)"},
        {"ts": "2026-06-26T09:15:31Z", "agent": "memory", "event": "Recall hit: Heliotrope Data analyzed 2d ago (cache used)"},
    ]

    return {
        "workflowRuns": workflow_runs,
        "companies": analyzed_companies,
        "duplicates": duplicates,
        "memoryEvents": memory_events
    }
