from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.company import DiscoveredCompany
from pydantic import BaseModel

class RecommendationUpdate(BaseModel):
    status: str

router = APIRouter()

@router.put("/{company_id}")
def update_recommendation(company_id: int, request: RecommendationUpdate, db: Session = Depends(get_db)):
    company = db.query(DiscoveredCompany).filter(DiscoveredCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if request.status == "approved":
        company.human_status = "APPROVED"
    elif request.status == "rejected":
        company.human_status = "REJECTED"
        
    db.commit()
    return {"message": f"Status updated to {company.human_status}"}


@router.get("/")
def get_recommendations(db: Session = Depends(get_db)):
    companies = db.query(DiscoveredCompany).filter(
        DiscoveredCompany.human_status.in_(["PENDING_REVIEW", "APPROVED", "REJECTED"])
    ).order_by(DiscoveredCompany.id.desc()).all()
    
    recs = []
    for c in companies:
        rec_json = c.recommendation_json or {}
        recs.append({
            "id": str(c.id),
            "companyId": c.id,
            "companyName": c.name,
            "projectId": c.project_id,
            "status": "pending" if c.human_status == "PENDING_REVIEW" else ("approved" if c.human_status == "APPROVED" else "rejected"),
            "opportunity": c.recommendation or "No recommendation provided.",
            "priority": "high" if c.lead_score and c.lead_score > 80 else ("medium" if c.lead_score and c.lead_score > 60 else "low"),
            "confidence": c.confidence_score or 50,
            "createdAt": c.created_at.isoformat() if hasattr(c, 'created_at') and c.created_at else "2026-06-27T10:00:00Z",
            "reasoning": rec_json.get("why_company_qualifies", "No reasoning provided."),
            "nextBestAction": rec_json.get("recommended_next_action", "Review company details."),
            "evidence": rec_json.get("supporting_evidence", ["Evidence extracted from company website."])
        })
        
    return recs
