from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List
from app.workflow.state import AgentState

class SearchStrategy(BaseModel):
    search_queries: List[str] = Field(description="A list of specific search queries to find companies matching the ICP.")

planner_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert B2B Sales Strategist. Your goal is to formulate a search strategy to discover companies that match the provided Ideal Customer Profile (ICP) and Business Rules.\n\nGenerate exactly 3 diverse search queries that would yield good company domains when typed into a search engine. Ensure the queries focus on directories, lists, or direct company sites."),
    ("user", "ICP Data: {icp}\nBusiness Rules: {business_rules}")
])

from langchain_core.runnables import RunnableConfig
from app.workflow.nodes.utils import check_pause

def planner_node(state: AgentState, config: RunnableConfig):
    check_pause(config)
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)
    structured_llm = llm.with_structured_output(SearchStrategy)
    
    chain = planner_prompt | structured_llm
    
    max_retries = 3
    import time
    import random
    
    for attempt in range(max_retries):
        try:
            result = chain.invoke({
                "icp": state["icp"],
                "business_rules": state["business_rules"]
            })
            return {"search_queries": result.search_queries}
        except Exception as e:
            if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                if attempt < max_retries - 1:
                    sleep_time = 30 + random.uniform(0, 5) * (attempt + 1)
                    print(f"Rate limited in planner, sleeping {sleep_time:.1f}s... (Attempt {attempt+1})")
                    time.sleep(sleep_time)
                    continue
            print(f"Planner failed: {e}")
            break
            
    return {"search_queries": []}
