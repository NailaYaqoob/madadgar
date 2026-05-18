import time
import httpx
from app.agents.state import AgentState
from app.utils.logger import AgentLogger
from app.core.config import settings

PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

# Maps service categories to Google Places keyword searches
_KEYWORD_MAP = {
    "AC Technician": "AC repair air conditioning service technician",
    "Plumber":       "plumber plumbing pipe repair",
    "Electrician":   "electrician electrical repair wiring",
}

# Fallback mock data — used when Google Places returns no results or key is absent
MOCK_PROVIDERS = {
    "AC Technician": [
        {"id": "mock_ac_1", "name": "Ali AC Services",    "service_type": "AC Technician", "latitude": 33.6491, "longitude": 72.9818, "rating": 4.8, "is_available": True},
        {"id": "mock_ac_2", "name": "Expert Coolers",      "service_type": "AC Technician", "latitude": 33.6520, "longitude": 72.9900, "rating": 4.2, "is_available": True},
        {"id": "mock_ac_3", "name": "Islamabad AC Repair", "service_type": "AC Technician", "latitude": 33.6400, "longitude": 72.9700, "rating": 3.9, "is_available": True},
    ],
    "Plumber": [
        {"id": "mock_pl_1", "name": "Bashir Plumber",      "service_type": "Plumber", "latitude": 33.6480, "longitude": 72.9800, "rating": 4.5, "is_available": True},
        {"id": "mock_pl_2", "name": "Quick Fix Plumbing",  "service_type": "Plumber", "latitude": 33.6550, "longitude": 72.9950, "rating": 4.7, "is_available": True},
    ],
    "Electrician": [
        {"id": "mock_el_1", "name": "Zubair Bijli Wala",   "service_type": "Electrician", "latitude": 33.6500, "longitude": 72.9850, "rating": 4.2, "is_available": True},
        {"id": "mock_el_2", "name": "Power Link Electrics", "service_type": "Electrician", "latitude": 33.6450, "longitude": 72.9750, "rating": 4.6, "is_available": True},
    ],
}


async def _fetch_from_google_places(
    service_category: str,
    lat: float,
    lng: float,
    radius_km: float,
    logger: AgentLogger,
) -> list:
    """Query Google Maps Places Nearby Search. Returns [] on any failure."""
    keyword = _KEYWORD_MAP.get(service_category, service_category)
    radius_m = int(radius_km * 1000)

    t0 = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(PLACES_URL, params={
                "location": f"{lat},{lng}",
                "radius": radius_m,
                "keyword": keyword,
                "key": settings.GOOGLE_MAPS_API_KEY,
            })
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        elapsed = int((time.monotonic() - t0) * 1000)
        logger.tool_execution("google_places_search", duration_ms=elapsed, status="error",
                              args={"error": str(exc)})
        logger.reasoning(f"Google Places request failed: {exc}. Will use mock fallback.")
        return []

    elapsed = int((time.monotonic() - t0) * 1000)
    status = data.get("status", "UNKNOWN")

    if status == "ZERO_RESULTS":
        logger.tool_execution("google_places_search", duration_ms=elapsed, status="success",
                              args={"results": 0})
        logger.reasoning("Google Places returned zero results. Will use mock fallback.")
        return []

    if status != "OK":
        logger.tool_execution("google_places_search", duration_ms=elapsed, status="error",
                              args={"places_status": status})
        logger.reasoning(f"Google Places API error: {status}. Will use mock fallback.")
        return []

    providers = []
    for place in data.get("results", [])[:10]:
        loc = place.get("geometry", {}).get("location", {})
        providers.append({
            "id":           place.get("place_id", f"gmaps_{len(providers)}"),
            "name":         place.get("name", "Unknown"),
            "service_type": service_category,
            "latitude":     loc.get("lat", lat),
            "longitude":    loc.get("lng", lng),
            "rating":       float(place.get("rating") or 0.0),
            "is_available": place.get("business_status", "OPERATIONAL") == "OPERATIONAL",
        })

    logger.tool_execution("google_places_search", duration_ms=elapsed, status="success",
                          args={"results": len(providers)})
    return providers


async def discovery_agent_node(state: AgentState) -> dict:
    """
    Provider Discovery Agent
    Searches Google Maps Places API when a key is present and USE_MOCK_DATA is False.
    Falls back to MOCK_PROVIDERS when the API returns nothing or is unavailable.
    """
    logger = AgentLogger(state["correlation_id"], "DiscoveryAgent", state["telemetry"])

    service_category = state.get("intent_service_category")
    radius = state.get("search_radius_km", 5)
    lat = state.get("location_lat")
    lng = state.get("location_lng")

    logger.reasoning(
        f"Searching for '{service_category}' providers within {radius}km of [{lat:.4f}, {lng:.4f}]."
    )

    discovered = []
    source = "mock"

    if not settings.USE_MOCK_DATA and settings.GOOGLE_MAPS_API_KEY:
        logger.reasoning("Querying Google Maps Places API for real providers...")
        discovered = await _fetch_from_google_places(service_category, lat, lng, radius, logger)
        if discovered:
            source = "google_maps"

    if not discovered:
        logger.tool_execution("query_provider_db", duration_ms=12, status="success",
                              args={"service_type": service_category})
        discovered = list(MOCK_PROVIDERS.get(service_category, []))
        logger.reasoning(
            f"Using {len(discovered)} mock provider(s) as fallback."
            if discovered else "No providers found for this service category."
        )

    logger.state_transition(
        f"Discovery complete ({source}).",
        {"count": len(discovered), "service": service_category, "source": source},
    )

    return {"discovered_providers": discovered}
