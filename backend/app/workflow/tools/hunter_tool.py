import os
import requests
from typing import List, Dict, Any
from .base import BaseContactTool

class HunterContactTool(BaseContactTool):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("HUNTER_API_KEY")
        if not self.api_key:
            raise ValueError("HUNTER_API_KEY is not set.")

    def discover_contacts(self, domain: str, personas: List[Any], limit: int = 50) -> List[Dict[str, Any]]:
        # personas argument is kept for API compatibility, but Hunter API doesn't filter by persona directly.
        # Filtering is done by the LLM in the contact node later, using the raw contacts fetched here.
        # Alternatively, we could do the LLM filtering here, but we will stick to fetching raw contacts first.
        
        url = "https://api.hunter.io/v2/domain-search"
        params = {
            "domain": domain,
            "limit": limit,
            "api_key": self.api_key
        }
        
        response = requests.get(url, params=params)
        contacts = []
        
        if response.status_code == 200:
            data = response.json().get("data", {})
            emails = data.get("emails", [])
            
            for email_data in emails:
                contact_info = {
                    "company_domain": domain,
                    "first_name": email_data.get("first_name"),
                    "last_name": email_data.get("last_name"),
                    "email": email_data.get("value"),
                    "position": email_data.get("position"),
                    "linkedin_url": email_data.get("linkedin")
                }
                contacts.append(contact_info)
                
        return contacts
