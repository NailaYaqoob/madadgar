from app.core.config import settings
from app.agents.state import AgentState
from app.utils.logger import AgentLogger

async def location_agent_node(state: AgentState) -> dict:
    """
    Location Extraction Agent
    Resolves raw text to geocoordinates.
    """
    logger = AgentLogger(state["correlation_id"], "LocationAgent", state["telemetry"])
    logger.reasoning("Extracting geographical entities...")
    
    if settings.USE_MOCK_DATA:
        # Mock logic (hardcoded to G-13 coordinates)
        logger.reasoning("(Mock) Resolved 'G-13' to [33.6491, 72.9818].")
        logger.state_transition("Location extracted successfully (Mock)")
        return {
            "location_raw": "G-13, Islamabad",
            "location_lat": 33.6491,
            "location_lng": 72.9818,
            "search_radius_km": 5
        }
        
    # Real logic would use Google Maps Geocoding API here
    # Edge case: If location is vague like "my house", it should flag clarification.
    if "my house" in state['original_message'].lower():
        logger.reasoning("Ambiguous location 'my house'. Requesting clarification.")
        return {
            "requires_clarification": True,
            "clarification_message": "Could you please provide your exact area or street address?"
        }
        
    return {
        "location_raw": "Unknown",
        "requires_clarification": True,
        "clarification_message": "I couldn't find your location. Could you please provide your area name in Islamabad?"
    }
