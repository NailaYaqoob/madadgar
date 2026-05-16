import googlemaps
from app.core.config import settings
from app.agents.state import AgentState
from app.utils.logger import AgentLogger

# Initialise client only when a real key is present
_gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY) if settings.GOOGLE_MAPS_API_KEY and settings.GOOGLE_MAPS_API_KEY not in ("your-google-maps-key-here", "PASTE_YOUR_KEY_HERE") else None

VAGUE_TERMS = ["my house", "my home", "ghar", "yahan", "here"]

async def location_agent_node(state: AgentState) -> dict:
    """
    Location Extraction Agent
    Resolves raw text location to geocoordinates via Google Geocoding API.
    """
    logger = AgentLogger(state["correlation_id"], "LocationAgent", state["telemetry"])
    logger.reasoning("Extracting geographical entities...")

    if settings.USE_MOCK_DATA or not _gmaps:
        logger.reasoning("(Mock) Resolved 'G-13' to [33.6491, 72.9818].")
        logger.state_transition("Location extracted successfully (Mock)")
        return {
            "location_raw": "G-13, Islamabad",
            "location_lat": 33.6491,
            "location_lng": 72.9818,
            "search_radius_km": 5,
        }

    msg = state["original_message"].lower()

    # Edge case: vague location
    if any(term in msg for term in VAGUE_TERMS):
        logger.reasoning("Ambiguous location detected. Requesting clarification.")
        return {
            "requires_clarification": True,
            "clarification_message": "Could you please provide your exact area or street address in Islamabad?",
        }

    # Extract location string from message — look for common Islamabad sectors/areas
    # In production this would use NER; for the hackathon we search for known patterns
    location_query = _extract_location_text(state["original_message"])

    if not location_query:
        logger.reasoning("Could not detect a location in the message. Requesting clarification.")
        return {
            "requires_clarification": True,
            "clarification_message": "I couldn't detect your location. Please mention your area (e.g. G-13, F-7, Blue Area).",
        }

    logger.reasoning(f"Geocoding location: '{location_query}'...")

    try:
        results = _gmaps.geocode(f"{location_query}, Islamabad, Pakistan")

        if not results:
            logger.reasoning(f"Geocoding returned no results for '{location_query}'.")
            return {
                "requires_clarification": True,
                "clarification_message": f"I couldn't find '{location_query}' on the map. Try a more specific address.",
            }

        loc = results[0]["geometry"]["location"]
        formatted = results[0].get("formatted_address", location_query)

        logger.reasoning(f"Geocoded '{location_query}' → [{loc['lat']}, {loc['lng']}] ({formatted})")
        logger.state_transition("Location extracted successfully", {"lat": loc["lat"], "lng": loc["lng"]})

        return {
            "location_raw": formatted,
            "location_lat": loc["lat"],
            "location_lng": loc["lng"],
            "search_radius_km": 5,
        }

    except Exception as e:
        logger._log("error", f"Geocoding failed: {str(e)}", level=40)
        return {
            "requires_clarification": True,
            "clarification_message": "There was a problem finding your location. Please try again with a clearer address.",
        }


def _extract_location_text(message: str) -> str:
    """
    Simple heuristic: look for known Islamabad sectors and area names in the message.
    Returns the first match, or empty string if none found.
    """
    import re
    # Match patterns like G-13, F-7, I-8, DHA Phase 2, Blue Area, etc.
    sector = re.search(r'\b([A-I]-\d{1,2}(?:/\d)?|DHA\s+Phase\s+\d|Blue\s+Area|Bahria\s+Town|PWD|Bani\s+Gala)\b', message, re.IGNORECASE)
    if sector:
        return sector.group(0)
    return ""
