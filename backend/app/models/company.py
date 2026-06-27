from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class DiscoveredCompany(Base):
    __tablename__ = "discovered_companies"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    name = Column(String, index=True)
    domain = Column(String, index=True)
    description = Column(Text, nullable=True)
    
    # Raw data from Scraping
    raw_markdown = Column(Text, nullable=True)
    
    # Qualification Status (will be populated in Phase 3)
    status = Column(String, default="PENDING") # PENDING, QUALIFIED, REJECTED
    qualification_reason = Column(Text, nullable=True)
    
    # Phase 4: Memory and Recommendations
    from pgvector.sqlalchemy import Vector
    from sqlalchemy import Float
    recommendation = Column(Text, nullable=True)
    recommendation_json = Column(JSON, nullable=True)
    embedding = Column(Vector(1536), nullable=True)
    human_status = Column(String, default="PENDING_REVIEW") # PENDING_REVIEW, APPROVED, REJECTED
    
    # New Phase 1 fields
    metadata_json = Column(JSON, nullable=True)
    lead_score = Column(Integer, nullable=True)
    confidence_score = Column(Float, nullable=True)

    project = relationship("Project")
    contacts = relationship("Contact", back_populates="company", cascade="all, delete-orphan")
