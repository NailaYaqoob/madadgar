import re
import httpx
from app.agents.state import AgentState
from app.utils.logger import AgentLogger

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "Madadgar-Hackathon-App/1.0"}

VAGUE_TERMS = ["my house", "my home", "ghar", "yahan", "here", "apna ghar"]

# Pre-seeded coords — avoids a Nominatim round-trip for common areas
_LOCAL_COORDS: dict[str, tuple[float, float]] = {
    # Islamabad sectors
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
    "islamabad": (33.6844, 73.0479),
    # Karachi
    "karachi": (24.8607, 67.0011),
    "clifton": (24.8138, 67.0336),
    "defence": (24.8079, 67.0647),
    "dha karachi": (24.7925, 67.0681),
    "gulshan": (24.9295, 67.1099),
    "gulshan-e-iqbal": (24.9295, 67.1099),
    "nazimabad": (24.9122, 67.0472),
    "north nazimabad": (24.9309, 67.0389),
    "korangi": (24.8299, 67.1274),
    "malir": (24.8918, 67.2082),
    "landhi": (24.8512, 67.1849),
    "gulistan-e-johar": (24.9252, 67.1366),
    "federal b area": (24.9058, 67.0713),
    "fb area": (24.9058, 67.0713),
    "pechs": (24.8615, 67.0427),
    "tariq road": (24.8647, 67.0502),
    "saddar karachi": (24.8553, 67.0138),
    # Lahore
    "lahore": (31.5204, 74.3587),
    "johar town": (31.4697, 74.2728),
    "dha lahore": (31.4812, 74.3878),
    "gulberg lahore": (31.5122, 74.3425),
    "model town": (31.4812, 74.3202),
    "wapda town": (31.4301, 74.2651),
    "allama iqbal town": (31.5009, 74.2728),
    "township": (31.5059, 74.2728),
    "bahria town lahore": (31.3722, 74.1780),
    "bahria town karachi": (24.8607, 67.0011),
    # Other major cities
    "peshawar": (34.0151, 71.5249),
    "quetta": (30.1798, 66.9750),
    "multan": (30.1575, 71.5249),
    "faisalabad": (31.4504, 73.1350),
    "hyderabad": (25.3960, 68.3578),
    "sialkot": (32.4945, 74.5229),
    "gujranwala": (32.1877, 74.1945),
    "abbottabad": (34.1463, 73.2117),
    "murree": (33.9065, 73.3940),
    "sargodha": (32.0836, 72.6711),
}

# Matches Islamabad sectors, DHA, Bahria, major Pakistani cities and neighbourhoods
_AREA_RE = re.compile(
    r'\b('
    r'[A-I]-\d{1,2}(?:/\d)?'               # G-13, F-7/2  (with hyphen)
    r'|[A-I]\d{1,2}(?:/\d)?'               # G13, F7      (no hyphen)
    r'|DHA\s+Phase\s+\d'                    # DHA Phase 2
    r'|DHA\s+(?:Karachi|Lahore|Islamabad)'  # DHA Karachi / DHA Lahore
    r'|DHA'                                 # DHA alone
    r'|Blue\s+Area|Bahria\s+Town(?:\s+(?:Karachi|Lahore|Islamabad))?'
    r'|PWD|Bani\s+Gala'
    r'|Gulberg|Rawalpindi|Saddar|Peshawar\s+Road'
    r'|Clifton|Defence|Gulshan(?:-e-Iqbal)?'
    r'|Nazimabad|North\s+Nazimabad'
    r'|Gulistan-e-Johar|Gulistan.e.Jauhar'
    r'|Korangi|Landhi|Malir'
    r'|FB\s+Area|Federal\s+B\s+Area'
    r'|PECHS|Tariq\s+Road'
    r'|Johar\s+Town|Model\s+Town|Wapda\s+Town'
    r'|Allama\s+Iqbal\s+Town|Township'
    r'|Karachi|Lahore|Islamabad|Peshawar|Quetta'
    r'|Multan|Faisalabad|Hyderabad|Sialkot|Gujranwala'
    r'|Abbottabad|Murree|Sargodha'
    r')\b',
    re.IGNORECASE,
)


def _normalise_area(area: str) -> str:
    """Convert G13 → G-13 so the local dict lookup always hits."""
    import re as _re
    return _re.sub(r'^([A-I])(\d)', r'\1-\2', area, flags=_re.IGNORECASE)


def _extract_area(message: str) -> str:
    match = _AREA_RE.search(message)
    return match.group(0) if match else ""


async def _geocode(query: str, logger: AgentLogger) -> tuple[float, float, str] | None:
    """Call Nominatim. Returns (lat, lng, display_name) or None on failure."""
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=4.0) as client:
            resp = await client.get(NOMINATIM_URL, params={
                "q": query,
                "format": "json",
                "limit": 1,
                "countrycodes": "pk",
            })
            resp.raise_for_status()
            results = resp.json()

        if not results:
            return None

        lat = float(results[0]["lat"])
        lng = float(results[0]["lon"])
        display = results[0].get("display_name", query)
        return lat, lng, display

    except Exception as exc:
        logger._log("error", f"Nominatim failed for '{query}': {exc}", level=40)
        return None


async def location_agent_node(state: AgentState) -> dict:
    """
    Location Extraction Agent
    Recognises Pakistani cities, Islamabad sectors, and common neighbourhoods.
    Falls back to Nominatim geocoding for anything else.
    """
    logger = AgentLogger(state["correlation_id"], "LocationAgent", state["telemetry"])
    logger.reasoning("Extracting geographical entities from message...")

    msg = state["original_message"].lower()

    if any(term in msg for term in VAGUE_TERMS):
        logger.reasoning("Ambiguous location detected. Requesting clarification.")
        return {
            "requires_clarification": True,
            "clarification_message": "Could you please share your area or city? (e.g. Karachi – Clifton, Lahore – DHA, Islamabad – G-13)",
        }

    area = _extract_area(state["original_message"])

    if not area:
        for prev in reversed(state.get("messages", [])):
            if prev.get("role") == "user":
                area = _extract_area(prev.get("content", ""))
                if area:
                    logger.reasoning(f"Found location '{area}' from conversation history.")
                    break

    if not area:
        logger.reasoning("No recognisable area found. Requesting clarification.")
        return {
            "requires_clarification": True,
            "clarification_message": (
                "I couldn't detect your location. Please mention your city or area "
                "(e.g. Karachi – Clifton, Lahore – DHA Phase 5, Islamabad – G-13)."
            ),
        }

    area = _normalise_area(area)
    local_key = area.lower().strip()

    # Fast path — known coordinates
    if local_key in _LOCAL_COORDS:
        lat, lng = _LOCAL_COORDS[local_key]
        logger.reasoning(f"Resolved '{area}' from local cache → [{lat:.4f}, {lng:.4f}]")
        logger.state_transition("Location resolved (local cache)", {"lat": lat, "lng": lng})
        return {
            "location_raw": area,
            "location_lat": lat,
            "location_lng": lng,
            "search_radius_km": 5,
        }

    # Nominatim — search just Pakistan, no city hardcoded
    query = f"{area}, Pakistan"
    logger.reasoning(f"Geocoding via Nominatim: '{query}'")
    result = await _geocode(query, logger)

    if result:
        lat, lng, display = result
        logger.reasoning(f"Resolved '{area}' → [{lat:.4f}, {lng:.4f}]")
        logger.state_transition("Location extracted via Nominatim", {"lat": lat, "lng": lng})
        return {
            "location_raw": display,
            "location_lat": lat,
            "location_lng": lng,
            "search_radius_km": 5,
        }

    logger.reasoning("Geocoding failed — using G-13 as fallback.")
    return _fallback(logger, area)


def _fallback(logger, area: str) -> dict:
    logger.state_transition("Using default G-13 coordinates as fallback.")
    return {
        "location_raw": f"{area} (approximate)",
        "location_lat": 33.6491,
        "location_lng": 72.9818,
        "search_radius_km": 5,
    }
