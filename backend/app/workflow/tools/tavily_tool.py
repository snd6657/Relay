import os
from typing import List
from tavily import TavilyClient
from .base import BaseSearchTool

class TavilySearchTool(BaseSearchTool):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("TAVILY_API_KEY")
        if not self.api_key:
            raise ValueError("TAVILY_API_KEY is not set.")
        self.client = TavilyClient(api_key=self.api_key)

    def search(self, queries: List[str]) -> List[str]:
        discovered_urls = []
        
        for query in queries:
            try:
                response = self.client.search(query=query, search_depth="advanced", max_results=3)
                for result in response.get("results", []):
                    # We could add more logic here to filter out non-company domains (e.g. g2.com, linkedin.com)
                    discovered_urls.append(result["url"])
            except Exception as e:
                print(f"Tavily search failed for query '{query}': {e}")
                
        # Deduplicate URLs
        discovered_urls = list(set(discovered_urls))
        return discovered_urls
