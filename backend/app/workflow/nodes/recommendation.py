from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field
from app.workflow.state import AgentState
from app.workflow.nodes.utils import check_pause
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import random

class ExplainabilityReport(BaseModel):
    lead_score: int = Field(description="Final lead score from 1-100 combining the initial robustness and the ICP fit.")
    confidence_score: float = Field(description="Confidence from 0.0 to 1.0 that this company is a highly qualified prospect.")
    business_opportunity: str = Field(description="A 1-2 sentence description of the business opportunity.")
    why_company_qualifies: str = Field(description="Specific reasons why this company fits the ICP.")
    supporting_evidence: list[str] = Field(description="Bullet points of evidence from the raw data.")
    recommended_next_action: str = Field(description="Specific recommended action (e.g., 'Email CTO about X').")
    priority: str = Field(description="'High', 'Medium', or 'Low' priority.")

recommendation_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an elite B2B Sales Strategist.\n\n"
               "Review the qualified company's data and our ICP.\n"
               "Generate a detailed Explainability Report containing Lead Score, Confidence Score, Opportunity, Evidence, and Next Action.\n"
               "Make the recommendation specific and actionable."),
    ("user", "Company Data: {company_data}\n\nICP: {icp}")
])

def recommendation_node(state: AgentState, config: RunnableConfig):
    check_pause(config)
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.4)
    structured_llm = llm.with_structured_output(ExplainabilityReport)
    chain = recommendation_prompt | structured_llm
    
    qualified_companies = state.get("qualified_companies", [])
    
    def process_company(company):
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Optimized context window from 50k down to 15k
                result = chain.invoke({
                    "company_data": company.get("raw_markdown", "")[:15000],
                    "icp": state["icp"]
                })
                
                report_md = (
                    f"**Priority:** {result.priority} | **Lead Score:** {result.lead_score}/100 | **Confidence:** {result.confidence_score}\n\n"
                    f"**Opportunity:** {result.business_opportunity}\n\n"
                    f"**Why they qualify:** {result.why_company_qualifies}\n\n"
                    f"**Evidence:**\n" + "\n".join([f"- {e}" for e in result.supporting_evidence]) + "\n\n"
                    f"**Recommended Action:** {result.recommended_next_action}"
                )
                
                company["recommendation"] = report_md
                company["recommendation_json"] = result.dict()
                company["lead_score"] = result.lead_score
                company["confidence_score"] = result.confidence_score
                return company
            except Exception as e:
                if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                    if attempt < max_retries - 1:
                        sleep_time = 15 + random.uniform(0, 5) * (attempt + 1)
                        print(f"Rate limited in recommendation for {company.get('name')}, sleeping {sleep_time:.1f}s... (Attempt {attempt+1})")
                        time.sleep(sleep_time)
                        continue
                print(f"Recommendation failed for {company.get('name')}: {e}")
                company["recommendation"] = "Failed to generate recommendation due to API limits."
                company["is_qualified"] = False
                company["qualification_reason"] = "Disqualified: Failed to generate a recommendation report."
                return company
        return company

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_company, comp): comp for comp in qualified_companies}
        # The list is updated in place, but we wait for completion to ensure synchronization
        for _ in as_completed(futures):
            pass
            
    # Filter out any companies that were disqualified during the recommendation phase
    final_qualified = [c for c in qualified_companies if c.get("is_qualified")]
            
    return {"qualified_companies": final_qualified}
