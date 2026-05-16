import math
from app.agents.state import AgentState
from app.utils.logger import AgentLogger

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))

async def ranking_agent_node(state: AgentState) -> dict:
    """
    Provider Ranking Agent
    Scores and sorts candidates: 40% proximity, 40% rating, 20% availability.
    """
    logger = AgentLogger(state["correlation_id"], "RankingAgent", state["telemetry"])
    candidates = state.get("discovered_providers", [])

    if not candidates:
        logger.reasoning("No candidates to rank.")
        return {"ranked_providers": [], "selected_provider_id": None}

    user_lat = state.get("location_lat", 0.0)
    user_lng = state.get("location_lng", 0.0)
    radius_km = state.get("search_radius_km", 5)

    logger.reasoning("Scoring candidates based on proximity (Haversine), rating, and availability...")

    for c in candidates:
        dist_km = _haversine_km(user_lat, user_lng, c["latitude"], c["longitude"])
        c["distance_km"] = round(dist_km, 2)
        proximity_score = max(0.0, 40.0 * (1 - dist_km / radius_km))
        rating_score = (c["rating"] / 5.0) * 40.0
        availability_score = 20.0 if c["is_available"] else 0.0
        c["score"] = round(proximity_score + rating_score + availability_score, 1)
        logger.reasoning(
            f"  {c['name']}: dist={dist_km:.2f}km, rating={c['rating']}, "
            f"scores=[proximity={proximity_score:.1f}, rating={rating_score:.1f}, avail={availability_score:.1f}] → total={c['score']}"
        )

    ranked = sorted(candidates, key=lambda x: x["score"], reverse=True)

    logger.state_transition("Providers ranked successfully", {
        "count": len(ranked),
        "top_score": ranked[0]["score"] if ranked else 0
    })

    return {
        "ranked_providers": ranked,
        "selected_provider_id": None # Selection moved to Orchestrator/Intent
    }
