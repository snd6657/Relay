import os
from typing import List, Any
from urllib.parse import urlparse
from firecrawl import FirecrawlApp
from app.workflow.state import CompanyData
from .base import BaseScraperTool
import concurrent.futures

class FirecrawlScraperTool(BaseScraperTool):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("FIRECRAWL_API_KEY")
        if not self.api_key:
            raise ValueError("FIRECRAWL_API_KEY is not set.")
        self.app = FirecrawlApp(api_key=self.api_key)

    def scrape_companies(self, urls: List[str]) -> List[CompanyData]:
        scraped_companies = []
        
        def scrape_single_url(url: str):
            try:
                parsed_url = urlparse(url)
                domain = parsed_url.netloc.replace("www.", "")
                name = domain.split(".")[0].capitalize()
                
                scrape_result = self.app.scrape_url(url, formats=['markdown'])
                
                if isinstance(scrape_result, dict):
                    markdown_content = scrape_result.get("markdown", "")
                else:
                    markdown_content = getattr(scrape_result, "markdown", "")
                
                if markdown_content:
                    return CompanyData(
                        name=name,
                        domain=domain,
                        url=url,
                        raw_markdown=markdown_content[:50000],
                        description=""
                    )
            except Exception as e:
                print(f"Firecrawl scrape failed for URL '{url}': {e}")
            return None

        # Process concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_url = {executor.submit(scrape_single_url, url): url for url in urls}
            for future in concurrent.futures.as_completed(future_to_url):
                result = future.result()
                if result:
                    scraped_companies.append(result)
                    
        return scraped_companies
