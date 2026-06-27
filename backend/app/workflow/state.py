from typing import TypedDict, List, Annotated
import operator

class CompanyData(TypedDict, total=False):
    name: str
    domain: str
    url: str
    raw_markdown: str
    description: str
    # New Phase 1 fields
    industry: str
    employee_count: str
    funding_stage: str
    tech_stack: list[str]
    growth_indicators: list[str]
    is_qualified: bool
    qualification_reason: str
    lead_score: int
    confidence_score: float
    recommendation: str
    recommendation_json: dict

class AgentState(TypedDict):
    project_id: int
    icp: dict
    business_rules: list
    target_personas: list
    search_queries: List[str]
    discovered_urls: Annotated[List[str], operator.add]
    scraped_companies: Annotated[List[CompanyData], operator.add]
    qualified_companies: Annotated[List[CompanyData], operator.add]
    contacts_found: Annotated[List[dict], operator.add]
