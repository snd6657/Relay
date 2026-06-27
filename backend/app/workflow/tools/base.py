from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseSearchTool(ABC):
    """Abstract base class for search tools."""
    
    @abstractmethod
    def search(self, queries: List[str]) -> List[str]:
        """
        Executes search queries and returns a list of unique discovered URLs.
        
        Args:
            queries (List[str]): List of search queries.
            
        Returns:
            List[str]: List of discovered URLs.
        """
        pass

class BaseScraperTool(ABC):
    """Abstract base class for scraper tools."""
    
    @abstractmethod
    def scrape_companies(self, urls: List[str]) -> List[Any]:
        """
        Scrapes the provided URLs and returns a list of CompanyData objects.
        
        Args:
            urls (List[str]): List of URLs to scrape.
            
        Returns:
            List[Any]: List of scraped company objects (CompanyData).
        """
        pass

class BaseContactTool(ABC):
    """Abstract base class for contact discovery tools."""
    
    @abstractmethod
    def discover_contacts(self, domain: str, personas: List[Any], limit: int = 50) -> List[Dict[str, Any]]:
        """
        Discovers contacts for a given domain that match the target personas.
        
        Args:
            domain (str): The company domain (e.g., 'example.com').
            personas (List[Any]): List of TargetPersona objects.
            limit (int, optional): Maximum number of contacts to fetch initially.
            
        Returns:
            List[Dict[str, Any]]: List of discovered contact dictionaries.
        """
        pass
