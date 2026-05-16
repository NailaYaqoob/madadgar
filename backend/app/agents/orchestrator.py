from app.agents.state import AgentState
from app.utils.logger import AgentLogger
from app.agents.intent_agent import intent_agent_node
from app.agents.location_agent import location_agent_node
from app.agents.discovery_agent import discovery_agent_node
from app.agents.ranking_agent import ranking_agent_node
from app.agents.booking_agent import booking_agent_node
from app.agents.notification_agent import notification_agent_node, followup_agent_node
import uuid

class Orchestrator:
    """
    Antigravity Orchestrator (Supervisor)
    Manages the global AgentState and routes it through the sub-agent nodes.
    """
    def __init__(self):
        pass

    async def process_request(self, user_id: str, text: str, correlation_id: str = None) -> dict:
        if not correlation_id:
            correlation_id = str(uuid.uuid4())
            
        # Initialize State
        state: AgentState = {
            "user_id": user_id,
            "original_message": text,
            "correlation_id": correlation_id,
            "messages": [{"role": "user", "content": text}],
            "telemetry": [],
            "requires_clarification": False,
            "clarification_message": None,
            "search_radius_km": 5,
        }

        logger = AgentLogger(correlation_id, "Supervisor", state["telemetry"])
        
        logger.state_transition("Initialized new request workflow.")
        
        # 1. Intent Extraction
        state.update(await intent_agent_node(state))
        if state.get("requires_clarification"):
            logger.reasoning("Halting workflow. Clarification needed on Intent.")
            return state
            
        # 2. Location Extraction
        state.update(await location_agent_node(state))
        if state.get("requires_clarification"):
            logger.reasoning("Halting workflow. Clarification needed on Location.")
            return state
            
        # 3. Discovery
        state.update(await discovery_agent_node(state))
        if not state.get("discovered_providers"):
            logger.reasoning("Halting workflow. No providers found.")
            return state
            
        # 4. Ranking
        state.update(await ranking_agent_node(state))
        
        # 5. Booking
        state.update(await booking_agent_node(state))
        
        # 6. Notification
        state.update(await notification_agent_node(state))
        
        # 7. Follow-up (Async trigger simulation)
        state.update(await followup_agent_node(state))
        
        logger.state_transition("Workflow complete.")
        return state
