from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    workflow_status = Column(String, default="IDLE") # IDLE, RUNNING, PAUSED, COMPLETED, FAILED

    icp = relationship("ICP", back_populates="project", uselist=False, cascade="all, delete-orphan")
    personas = relationship("TargetPersona", back_populates="project", cascade="all, delete-orphan")
    business_rules = relationship("BusinessRule", back_populates="project", cascade="all, delete-orphan")


class ICP(Base):
    __tablename__ = "icps"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    industries = Column(JSON)  # List of strings e.g. ["SaaS", "Fintech"]
    employee_count_min = Column(Integer, nullable=True)
    employee_count_max = Column(Integer, nullable=True)
    revenue_min = Column(String, nullable=True)
    revenue_max = Column(String, nullable=True)
    geographies = Column(JSON) # List of strings e.g. ["USA", "UK"]
    keywords = Column(JSON)    # List of strings for search

    project = relationship("Project", back_populates="icp")


class TargetPersona(Base):
    __tablename__ = "target_personas"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    title = Column(String) # e.g. "VP of Sales", "CTO"
    seniority = Column(String) # e.g. "C-Level", "Director"
    department = Column(String) # e.g. "Engineering", "Marketing"
    
    project = relationship("Project", back_populates="personas")


class BusinessRule(Base):
    __tablename__ = "business_rules"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    rule_type = Column(String) # e.g. "MUST_HAVE", "MUST_NOT_HAVE"
    description = Column(Text) # e.g. "Company must be B2B"

    project = relationship("Project", back_populates="business_rules")
