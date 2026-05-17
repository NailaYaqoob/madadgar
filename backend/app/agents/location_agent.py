import re
import httpx
from app.agents.state import AgentState
from app.utils.logger import AgentLogger

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "Madadgar-Hackathon-App/1.0"}

VAGUE_TERMS = ["my house", "my home", "ghar", "yahan", "here", "apna ghar"]

# Pre-seeded coords for common Islamabad/Rawalpindi areas — avoids a Nominatim round-trip
_LOCAL_COORDS: dict[str, tuple[float, float]] = {
    "g-6": (33.7185, 73.0551), "g-7": (33.7100, 73.0450), "g-8": (33.7000, 73.0350),
    "g-9": (33.6900, 73.0250), "g-10": (33.6800, 73.0150), "g-11": (33.6700, 72.9950),
    "g-12": (33.6600, 72.9850), "g-13": (33.6491, 72.9818), "g-14": (33.6380, 72.9680),
    "g-15": (33.6270, 72.9540),
    "f-6": (33.7200, 73.0550), "f-7": (33.7294, 73.0472), "f-8": (33.7200, 73.0600),
    "f-10": (33.6941, 73.0150), "f-11": (33.6941, 72.9850),
    "i-8": (33.6693, 73.0858), "i-9": (33.6750, 73.0750), "i-10": (33.6640, 73.0640),
    "blue area": (33.7291, 73.0878),
    "dha phase 2": (33.5651, 73.1018), "dha phase 1": (33.5800, 73.0900),
    "bahria town": (33.5388, 73.1908),
    "gulberg": (33.6800, 73.0466),
    "pwd": (33.6368, 73.0728),
    "bani gala": (33.6593, 73.1419),
    "saddar": (33.5986, 73.0485),
    "rawalpindi": (33.5973, 73.0479),
    "peshawar road": (33.6200, 73.0100),
}

# Regex to pull Islamabad sector / known area names from free text
_AREA_RE = re.compile(
    r'\b([A-I]-\d{1,2}(?:/\d)?'          # e.g. G-13, F-7/2
    r'|DHA\s+Phase\s+\d'                  # DHA Phase 2
    r'|Blue\s+Area|Bahria\s+Town'
    r'|PWD|Bani\s+Gala|Gulberg|Rawalpindi'
    r'|Saddar|Peshawar\s+Road)\b',
    re.IGNORECASE,
)

def _extract_area(message: str) -> str:
    match = _AREA_RE.search(message)
    return match.group(0) if match else ""


async def location_agent_node(state: AgentState) -> dict:
    """
    Location Extraction Agent
    Uses OpenStreetMap Nominatim for free geocoding — no API key required.
    """
    logger = AgentLogger(state["correlation_id"], "LocationAgent", state["telemetry"])
    logger.reasoning("Extracting geographical entities from message...")

    msg = state["original_message"].lower()

    if any(term in msg for term in VAGUE_TERMS):
        logger.reasoning("Ambiguous location detected. Requesting clarification.")
        return {
            "requires_clarification": True,
            "clarification_message": "Could you please provide your exact area or sector (e.g. G-13, F-7, Blue Area)?",
        }

    area = _extract_area(state["original_message"])

    if not area:
        logger.reasoning("No recognisable area found in message. Requesting clarification.")
        return {
            "requires_clarification": True,
            "clarification_message": "I couldn't detect your location. Please mention your area in Islamabad (e.g. G-13, F-7, DHA Phase 2).",
        }

    # Fast path: check local dict before making a network call
    local_key = area.lower().strip()
    if local_key in _LOCAL_COORDS:
        lat, lng = _LOCAL_COORDS[local_key]
        logger.reasoning(f"Resolved '{area}' from local cache → [{lat:.4f}, {lng:.4f}]")
        logger.state_transition("Location resolved (local cache)", {"lat": lat, "lng": lng})
        return {"location_raw": f"{area}, Islamabad", "location_lat": lat, "location_lng": lng, "search_radius_km": 5}

    query = f"{area}, Islamabad, Pakistan"
    logger.reasoning(f"Geocoding via Nominatim: '{query}'")

    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=3.0) as client:
            resp = await client.get(NOMINATIM_URL, params={
                "q": query,
                "format": "json",
                "limit": 1,
                "countrycodes": "pk",
            })
            resp.raise_for_status()
            results = resp.json()

        if not results:
            logger.reasoning(f"Nominatim found no results for '{query}'. Falling back to G-13 defaults.")
            return _fallback(logger, area)

        lat = float(results[0]["lat"])
        lng = float(results[0]["lon"])
        display = results[0].get("display_name", query)

        logger.reasoning(f"Resolved '{area}' → [{lat:.4f}, {lng:.4f}]")
        logger.state_transition("Location extracted via Nominatim", {"lat": lat, "lng": lng, "display": display})

        return {
            "location_raw": display,
            "location_lat": lat,
            "location_lng": lng,
            "search_radius_km": 5,
        }

    except Exception as e:
        logger._log("error", f"Nominatim geocoding failed: {e}", level=40)
        logger.reasoning("Geocoding error — using default G-13 coordinates.")
        return _fallback(logger, area)


def _fallback(logger, area: str) -> dict:
    logger.state_transition("Using default G-13 coordinates as fallback.")
    return {
        "location_raw": f"{area}, Islamabad (approximate)",
        "location_lat": 33.6491,
        "location_lng": 72.9818,
        "search_radius_km": 5,
    }
