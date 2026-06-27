from pydantic import BaseModel, ConfigDict
from typing import List, Optional

# --- Business Rules ---
class BusinessRuleBase(BaseModel):
    rule_type: str
    description: str

class BusinessRuleCreate(BusinessRuleBase):
    pass

class BusinessRuleResponse(BusinessRuleBase):
    id: int
    project_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Target Personas ---
class TargetPersonaBase(BaseModel):
    title: str
    seniority: str
    department: str

class TargetPersonaCreate(TargetPersonaBase):
    pass

class TargetPersonaResponse(TargetPersonaBase):
    id: int
    project_id: int
    model_config = ConfigDict(from_attributes=True)

# --- ICP ---
class ICPBase(BaseModel):
    industries: List[str]
    employee_count_min: Optional[int] = None
    employee_count_max: Optional[int] = None
    revenue_min: Optional[str] = None
    revenue_max: Optional[str] = None
    geographies: List[str]
    keywords: List[str]

class ICPCreate(ICPBase):
    pass

class ICPResponse(ICPBase):
    id: int
    project_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Project ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ProjectCreate(ProjectBase):
    icp: ICPCreate
    personas: List[TargetPersonaCreate] = []
    business_rules: List[BusinessRuleCreate] = []

class ProjectResponse(ProjectBase):
    id: int
    icp: Optional[ICPResponse] = None
    personas: List[TargetPersonaResponse] = []
    business_rules: List[BusinessRuleResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
