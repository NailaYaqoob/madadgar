import googlemaps
from app.core.config import settings
from app.agents.state import AgentState
from app.utils.logger import AgentLogger

_gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY) if settings.GOOGLE_MAPS_API_KEY and settings.GOOGLE_MAPS_API_KEY not in ("your-google-maps-key-here", "PASTE_YOUR_KEY_HERE") else None

# Maps our internal categories to Google Places search keywords
CATEGORY_KEYWORDS = {
    "AC Technician": "AC repair air conditioner technician",
    "Plumber":        "plumber plumbing service",
    "Electrician":    "electrician electrical repair",
}

MOCK_PROVIDERS = {
    "AC Technician": [
        {"id": "provider_1", "name": "Ali AC Services",      "service_type": "AC Technician", "latitude": 33.6491, "longitude": 72.9818, "rating": 4.8, "is_available": True},
        {"id": "provider_2", "name": "Expert Coolers",        "service_type": "AC Technician", "latitude": 33.6520, "longitude": 72.9900, "rating": 4.2, "is_available": True},
        {"id": "provider_3", "name": "Islamabad AC Repair",   "service_type": "AC Technician", "latitude": 33.6400, "longitude": 72.9700, "rating": 3.9, "is_available": True},
    ],
    "Plumber": [
        {"id": "provider_1", "name": "Bashir Plumber",        "service_type": "Plumber", "latitude": 33.6480, "longitude": 72.9800, "rating": 4.5, "is_available": True},
        {"id": "provider_2", "name": "Quick Fix Plumbing",    "service_type": "Plumber", "latitude": 33.6550, "longitude": 72.9950, "rating": 4.7, "is_available": True},
    ],
    "Electrician": [
        {"id": "provider_1", "name": "Zubair Bijli Wala",     "service_type": "Electrician", "latitude": 33.6500, "longitude": 72.9850, "rating": 4.2, "is_available": True},
        {"id": "provider_2", "name": "Power Link Electrics",  "service_type": "Electrician", "latitude": 33.6450, "longitude": 72.9750, "rating": 4.6, "is_available": True},
    ],
}

async def discovery_agent_node(state: AgentState) -> dict:
    """
    Provider Discovery Agent
    Uses Google Places Nearby Search when a real API key is set,
    falls back to mock dataset when USE_MOCK_DATA=true.
    """
    logger = AgentLogger(state["correlation_id"], "DiscoveryAgent", state["telemetry"])

    service_category = state.get("intent_service_category")
    radius = state.get("search_radius_km", 5)
    lat = state.get("location_lat")
    lng = state.get("location_lng")

    logger.reasoning(f"Searching for '{service_category}' within {radius}km of [{lat}, {lng}].")

    if settings.USE_MOCK_DATA or not _gmaps:
        return _mock_discovery(state, logger, service_category)

    return await _real_discovery(state, logger, service_category, lat, lng, radius)


def _mock_discovery(state, logger, service_category):
    logger.tool_execution("query_mock_providers", duration_ms=5, status="success", args={"service_type": service_category})
    discovered = MOCK_PROVIDERS.get(service_category, [])

    if not discovered:
        logger.reasoning("No mock providers for this category.")

    logger.state_transition(f"Found {len(discovered)} mock candidates.", {"count": len(discovered)})
    return {"discovered_providers": discovered}


async def _real_discovery(state, logger, service_category, lat, lng, radius_km):
    keyword = CATEGORY_KEYWORDS.get(service_category, service_category)
    radius_m = radius_km * 1000  # Places API uses metres

    logger.tool_execution(
        "google_places_nearby_search",
        duration_ms=0,  # will be set after call
        status="pending",
        args={"keyword": keyword, "radius_m": radius_m, "location": f"{lat},{lng}"},
    )

    try:
        import time
        t0 = time.time()
        results = _gmaps.places_nearby(
            location=(lat, lng),
            radius=radius_m,
            keyword=keyword,
        )
        duration_ms = int((time.time() - t0) * 1000)

        places = results.get("results", [])
        logger.reasoning(f"Google Places returned {len(places)} results in {duration_ms}ms.")

        discovered = []
        for i, place in enumerate(places[:5]):  # cap at 5 providers
            loc = place["geometry"]["location"]
            discovered.append({
                "id":           place["place_id"],
                "name":         place["name"],
                "service_type": service_category,
                "latitude":     loc["lat"],
                "longitude":    loc["lng"],
                "rating":       place.get("rating", 3.0),
                "is_available": True,  # Places API has no real-time availability
                "address":      place.get("vicinity", ""),
                "total_ratings": place.get("user_ratings_total", 0),
            })

        logger.tool_execution("google_places_nearby_search", duration_ms=duration_ms, status="success",
                              args={"found": len(discovered)})
        logger.state_transition(f"Found {len(discovered)} real candidates via Google Places.", {"count": len(discovered)})

        if not discovered:
            logger.reasoning("No providers found via Places API. Falling back to mock data.")
            return _mock_discovery(state, logger, service_category)

        return {"discovered_providers": discovered}

    except Exception as e:
        logger._log("error", f"Places API failed: {str(e)}", level=40)
        logger.reasoning("Places API error. Falling back to mock data.")
        return _mock_discovery(state, logger, service_category)
