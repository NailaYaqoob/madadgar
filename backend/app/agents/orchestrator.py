import asyncio
import uuid
from app.agents.state import AgentState
from app.utils.logger import AgentLogger
from app.agents.intent_agent import intent_agent_node
from app.agents.location_agent import location_agent_node
from app.agents.discovery_agent import discovery_agent_node
from app.agents.ranking_agent import ranking_agent_node
from app.agents.booking_agent import booking_agent_node
from app.agents.notification_agent import notification_agent_node, followup_agent_node

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
            
        # Initialize State — all fields declared in AgentState must be set here
        state: AgentState = {
            "user_id": user_id,
            "original_message": text,
            "correlation_id": correlation_id,
            "messages": [{"role": "user", "content": text}],
            "telemetry": [],
            "current_agent": "Supervisor",
            "next_agent": "IntentAgent",
            "requires_clarification": False,
            "clarification_message": None,
            "intent_action": None,
            "intent_service_category": None,
            "intent_datetime_target": None,
            "intent_urgency": None,
            "intent_constraints": [],
            "location_raw": None,
            "location_lat": None,
            "location_lng": None,
            "search_radius_km": 5,
            "discovered_providers": [],
            "ranked_providers": [],
            "selected_provider_id": None,
            "booking_id": None,
            "booking_status": None,
            "notification_sent": False,
            "final_response": None,
        }

        logger = AgentLogger(correlation_id, "Supervisor", state["telemetry"])
        
        logger.state_transition("Initialized new request workflow.")
        
        # 1 & 2. Intent + Location run in parallel — both only read original_message
        intent_result, location_result = await asyncio.gather(
            intent_agent_node(state),
            location_agent_node(state),
        )

        state.update(intent_result)
        if state.get("requires_clarification"):
            logger.reasoning("Halting workflow. Clarification needed on Intent.")
            return state

        # Apply location only for book flows that haven't selected a provider yet
        if state.get("intent_action") != "cancel" and not state.get("selected_provider_id"):
            state.update(location_result)
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
        elif state.get("selected_provider_id"):
            logger.reasoning(f"Provider {state.get('selected_provider_id')} already selected. Skipping discovery.")
        else:
            logger.reasoning("Skipping location and discovery nodes for cancellation workflow.")
            
        # --- SELECTION PHASE ---
        if state.get("intent_action") != "cancel" and not state.get("selected_provider_id"):
            logger.reasoning("No provider selected yet. Presenting options to user.")
            ranked = state.get("ranked_providers", [])
            
            options_text = "I found these top-rated professionals for you:\n\n"
            for i, p in enumerate(ranked[:3]):
                options_text += f"{i+1}. {p['name']} - Rating: {p['rating']} ({p['distance_km']} km away)\n"
            
            options_text += "\nWhich one would you like to book? (e.g., 'Book the first one')"
            
            return {
                **state,
                "requires_clarification": True,
                "clarification_message": options_text
            }
        
        # 5. Booking (Handles both book and cancel actions)
        state.update(await booking_agent_node(state))
        
        # 6. Notification
        state.update(await notification_agent_node(state))
        
        # 7. Follow-up (Async trigger simulation)
        state.update(await followup_agent_node(state))
        
        logger.state_transition("Workflow complete.")
        return state
