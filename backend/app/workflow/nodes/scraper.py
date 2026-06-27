from app.workflow.state import AgentState
from app.workflow.tools import FirecrawlScraperTool
from langchain_core.runnables import RunnableConfig
from app.workflow.nodes.utils import check_pause
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import random
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

def company_scraper_node(state: AgentState, config: RunnableConfig):
    check_pause(config)
    
    scraper_tool = FirecrawlScraperTool()
    scraped_companies = scraper_tool.scrape_companies(state["discovered_urls"])
    
    class CompanyMetadata(BaseModel):
        industry: str = Field(description="The primary industry the company operates in.")
        employee_count: str = Field(description="Estimated employee count (e.g. '10-50', '500+').")
        funding_stage: str = Field(description="Estimated funding stage (e.g. 'Seed', 'Series A', 'Bootstrapped', 'Public').")
        tech_stack: list[str] = Field(description="List of technologies, frameworks, or tools the company appears to use.")
        growth_indicators: list[str] = Field(description="Any indicators of recent growth (hiring, new products, funding news).")
        initial_lead_score: int = Field(description="Initial lead score from 1-100 based purely on how robust and established the company appears.")
        description: str = Field(description="A concise 1-paragraph summary of what the company does.")

    metadata_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert Data Analyst. Extract structured metadata from the company's raw website markdown.\n"
                   "If you cannot find exact data (like employee count or funding), make a highly educated guess based on context (e.g. an 'Enterprise' page usually means 500+ employees, an 'About Us' with 3 founders usually means 1-10)."),
        ("user", "Company Name: {name}\nWebsite Markdown: {markdown}")
    ])
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    structured_llm = llm.with_structured_output(CompanyMetadata)
    chain = metadata_prompt | structured_llm
    
    enriched_companies = []
    
    def process_company(company):
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Optimized context window from 30k down to 15k to save tokens and speed up LLM
                result = chain.invoke({
                    "name": company.get("name"),
                    "markdown": company.get("raw_markdown", "")[:15000]
                })
                
                company["industry"] = result.industry
                company["employee_count"] = result.employee_count
                company["funding_stage"] = result.funding_stage
                company["tech_stack"] = result.tech_stack
                company["growth_indicators"] = result.growth_indicators
                company["lead_score"] = result.initial_lead_score
                company["description"] = result.description
                return company
            except Exception as e:
                if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                    if attempt < max_retries - 1:
                        # Exponential jitter backoff to avoid thundering herd, base 30s for free tier
                        sleep_time = 30 + random.uniform(0, 5) * (attempt + 1)
                        print(f"Rate limited in scraper metadata for {company.get('name')}, sleeping {sleep_time:.1f}s... (Attempt {attempt+1})")
                        time.sleep(sleep_time)
                        continue
                print(f"Metadata extraction failed for {company.get('name')}: {e}")
                company["industry"] = "Unknown"
                company["employee_count"] = "Unknown"
                company["funding_stage"] = "Unknown"
                company["tech_stack"] = []
                company["growth_indicators"] = []
                company["lead_score"] = 50
                if not company.get("description"):
                    company["description"] = "Failed to extract description."
                return company
        return company

    # Process companies in parallel but throttled to 2 for API limits
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(process_company, comp): comp for comp in scraped_companies}
        for future in as_completed(futures):
            enriched_companies.append(future.result())
            
    return {"scraped_companies": enriched_companies}
