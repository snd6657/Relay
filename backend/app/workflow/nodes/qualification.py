from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from app.workflow.state import AgentState
from app.workflow.nodes.utils import check_pause
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import random

class QualificationResult(BaseModel):
    is_qualified: bool = Field(description="True if the company matches the ICP rules, False otherwise.")
    reasoning: str = Field(description="Detailed explanation of why the company was or wasn't qualified.")

qualification_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a lenient Sales Development Representative evaluating companies.\n\n"
               "Compare the Company Data against the ICP and Business Rules.\n"
               "If the company matches SOME of the business rules or generally fits the ICP, approve it.\n"
               "Be highly liberal and forgiving. It is better to approve a borderline company than reject a potential lead. If there is not enough information to disprove a rule, assume they pass."),
    ("user", "Company Data: {company_data}\n\nICP: {icp}\n\nBusiness Rules: {business_rules}")
])

def qualification_node(state: AgentState, config: RunnableConfig):
    check_pause(config)
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    structured_llm = llm.with_structured_output(QualificationResult)
    chain = qualification_prompt | structured_llm
    
    qualified_companies = []
    
    def process_company(company):
        max_retries = 3
        # Very liberal early rejection based on lead score threshold to save tokens
        if company.get("lead_score", 50) < 20:
            company["is_qualified"] = False
            company["qualification_reason"] = "Rejected: Initial Lead Score exceptionally low."
            return company

        for attempt in range(max_retries):
            try:
                # Optimized context window from 50k down to 15k
                result = chain.invoke({
                    "company_data": company.get("raw_markdown", "")[:15000],
                    "icp": state["icp"],
                    "business_rules": state["business_rules"]
                })
                
                # Store qualification reason back into the dict so we can save it to DB later
                company["is_qualified"] = result.is_qualified
                company["qualification_reason"] = result.reasoning
                
                return company
            except Exception as e:
                if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                    if attempt < max_retries - 1:
                        sleep_time = 15 + random.uniform(0, 5) * (attempt + 1)
                        print(f"Rate limited in qualification for {company.get('name')}, sleeping {sleep_time:.1f}s... (Attempt {attempt+1})")
                        time.sleep(sleep_time)
                        continue
                print(f"Qualification failed for {company.get('name')}: {e}")
                company["is_qualified"] = False
                company["qualification_reason"] = f"Error during qualification: {e}"
                return company
        return company

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_company, comp): comp for comp in state.get("scraped_companies", [])}
        for future in as_completed(futures):
            comp = future.result()
            if comp.get("is_qualified"):
                qualified_companies.append(comp)
            
    return {"qualified_companies": qualified_companies}
