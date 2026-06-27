from pydantic import BaseModel, Field
from typing import List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableConfig
from app.workflow.state import AgentState
from app.workflow.nodes.utils import check_pause
from app.workflow.tools import HunterContactTool
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import random

class SelectedContact(BaseModel):
    email: str = Field(description="The email of the matched contact.")
    reasoning: str = Field(description="Why this contact matches the target persona.")

class ContactSelectionResult(BaseModel):
    selected_emails: List[SelectedContact]

selection_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert sales prospector. You have a list of raw contacts from a company.\n"
               "Review the 'Target Personas'.\n"
               "Return ONLY the emails of the contacts whose job titles/positions logically match the Target Personas.\n"
               "Be smart. 'Head of Engineering' matches a 'CTO' persona. 'SVP Sales' matches 'VP of Sales'.\n"
               "If no one matches, return an empty list."),
    ("user", "Target Personas: {personas}\n\nRaw Contacts:\n{contacts}")
])

def contact_discovery_node(state: AgentState, config: RunnableConfig):
    check_pause(config)
    contact_tool = HunterContactTool()
    contacts_found = []
    personas = state.get("target_personas", [])
    
    if not personas:
        return {"contacts_found": contacts_found}
        
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    structured_llm = llm.with_structured_output(ContactSelectionResult)
    chain = selection_prompt | structured_llm
    
    def process_company(company):
        domain = company.get("domain")
        found_for_company = []
        try:
            # Broad Domain Search (fetch top 50 contacts) using the Tool Layer
            raw_contacts = contact_tool.discover_contacts(domain=domain, personas=personas, limit=50)
            
            if not raw_contacts:
                return found_for_company

            # Format raw contacts for the LLM
            raw_contacts_text = ""
            contact_map = {}
            for email_data in raw_contacts:
                email = email_data.get("email")
                position = email_data.get("position")
                first = email_data.get("first_name")
                last = email_data.get("last_name")
                
                if email and position:
                    raw_contacts_text += f"- Email: {email} | Name: {first} {last} | Position: {position}\n"
                    contact_map[email] = email_data
                    
            if not raw_contacts_text:
                return found_for_company
                
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    # Let the LLM pick the best matches
                    result = chain.invoke({
                        "personas": str(personas),
                        "contacts": raw_contacts_text
                    })
                    
                    for selected in result.selected_emails:
                        email_data = contact_map.get(selected.email)
                        if email_data:
                            found_for_company.append(email_data)
                    break
                except Exception as e:
                    if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                        if attempt < max_retries - 1:
                            sleep_time = 15 + random.uniform(0, 5) * (attempt + 1)
                            print(f"Rate limited in contact discovery for {domain}, sleeping {sleep_time:.1f}s... (Attempt {attempt+1})")
                            time.sleep(sleep_time)
                            continue
                    print(f"Contact selection failed for domain {domain}: {e}")
                    break
                    
        except Exception as e:
            print(f"Contact discovery failed for domain {domain}: {e}")
            
        return found_for_company

    # We only search for contacts at QUALIFIED companies
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_company, comp): comp for comp in state.get("qualified_companies", [])}
        for future in as_completed(futures):
            res = future.result()
            if res:
                contacts_found.extend(res)
                
    return {"contacts_found": contacts_found}
