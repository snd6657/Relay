from langgraph.graph import StateGraph, START, END
from app.workflow.state import AgentState
from app.workflow.nodes.planner import planner_node
from app.workflow.nodes.search import market_search_node
from app.workflow.nodes.scraper import company_scraper_node
from app.workflow.nodes.qualification import qualification_node
from app.workflow.nodes.contact import contact_discovery_node
from app.workflow.nodes.recommendation import recommendation_node
# Initialize the state graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("planner", planner_node)
workflow.add_node("market_search", market_search_node)
workflow.add_node("company_scraper", company_scraper_node)
workflow.add_node("qualification", qualification_node)
workflow.add_node("contact_discovery", contact_discovery_node)
workflow.add_node("recommendation", recommendation_node)

def human_approval_node(state: AgentState):
    # This is a dummy node. Execution will pause BEFORE hitting this node.
    # When resumed, it will just pass the state through.
    return state

workflow.add_node("human_approval", human_approval_node)

# Define edges
workflow.add_edge(START, "planner")
workflow.add_edge("planner", "market_search")
workflow.add_edge("market_search", "company_scraper")
workflow.add_edge("company_scraper", "qualification")
workflow.add_edge("qualification", "contact_discovery")
workflow.add_edge("contact_discovery", "recommendation")
workflow.add_edge("recommendation", "human_approval")
workflow.add_edge("human_approval", END)

from psycopg_pool import ConnectionPool
from langgraph.checkpoint.postgres import PostgresSaver
from app.core.config import settings

# Configure Postgres Checkpointer using ConnectionPool
pool = ConnectionPool(
    conninfo=settings.DATABASE_URL, 
    max_size=20, 
    kwargs={"keepalives": 1, "keepalives_idle": 30, "keepalives_interval": 10, "keepalives_count": 5}
)
memory = PostgresSaver(pool)

# Compile the graph with interrupt
app_workflow = workflow.compile(
    checkpointer=memory,
    interrupt_before=["human_approval"]
)
