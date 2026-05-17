from app.agents.state import AgentState
from app.utils.logger import AgentLogger

MOCK_PROVIDERS = {
    "AC Technician": [
        {"id": "provider_1", "name": "Ali AC Services",     "service_type": "AC Technician", "latitude": 33.6491, "longitude": 72.9818, "rating": 4.8, "is_available": True},
        {"id": "provider_2", "name": "Expert Coolers",       "service_type": "AC Technician", "latitude": 33.6520, "longitude": 72.9900, "rating": 4.2, "is_available": True},
        {"id": "provider_3", "name": "Islamabad AC Repair",  "service_type": "AC Technician", "latitude": 33.6400, "longitude": 72.9700, "rating": 3.9, "is_available": True},
    ],
    "Plumber": [
        {"id": "provider_1", "name": "Bashir Plumber",       "service_type": "Plumber", "latitude": 33.6480, "longitude": 72.9800, "rating": 4.5, "is_available": True},
        {"id": "provider_2", "name": "Quick Fix Plumbing",   "service_type": "Plumber", "latitude": 33.6550, "longitude": 72.9950, "rating": 4.7, "is_available": True},
    ],
    "Electrician": [
        {"id": "provider_1", "name": "Zubair Bijli Wala",    "service_type": "Electrician", "latitude": 33.6500, "longitude": 72.9850, "rating": 4.2, "is_available": True},
        {"id": "provider_2", "name": "Power Link Electrics", "service_type": "Electrician", "latitude": 33.6450, "longitude": 72.9750, "rating": 4.6, "is_available": True},
    ],
}


async def discovery_agent_node(state: AgentState) -> dict:
    """
    Provider Discovery Agent
    Returns mock providers — distances are calculated for real in RankingAgent
    using the actual geocoded user coordinates from LocationAgent.
    """
    logger = AgentLogger(state["correlation_id"], "DiscoveryAgent", state["telemetry"])

    service_category = state.get("intent_service_category")
    radius = state.get("search_radius_km", 5)
    lat = state.get("location_lat")
    lng = state.get("location_lng")

    logger.reasoning(f"Searching for '{service_category}' providers within {radius}km of [{lat:.4f}, {lng:.4f}].")
    logger.tool_execution("query_provider_db", duration_ms=12, status="success", args={"service_type": service_category})

    discovered = MOCK_PROVIDERS.get(service_category, [])

    if not discovered:
        logger.reasoning("No providers found for this service category.")
    else:
        logger.reasoning(f"Retrieved {len(discovered)} candidate(s) for ranking.")

    logger.state_transition(f"Discovery complete.", {"count": len(discovered), "service": service_category})

    return {"discovered_providers": list(discovered)}  # copy to avoid mutating the constant
