from app.workflow.state import AgentState
from app.workflow.tools import TavilySearchTool
from langchain_core.runnables import RunnableConfig
from app.workflow.nodes.utils import check_pause

def market_search_node(state: AgentState, config: RunnableConfig):
    check_pause(config)
    search_tool = TavilySearchTool()
    discovered_urls = search_tool.search(state["search_queries"])
    
    return {"discovered_urls": discovered_urls}
