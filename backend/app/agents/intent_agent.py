import json
import logging
import time
import datetime
import difflib
from openai import AsyncOpenAI
from app.core.config import settings
from app.agents.state import AgentState
from app.utils.logger import AgentLogger

_PLUMBER_KW = [
    "plumber", "plumbr", "plumer", "plumbar", "plumbing", "plumbir", "plmber",
    "nal", "pipe", "paip", "water", "pani", "leakage", "leak", "nalka", "tap",
]
_ELECTRICIAN_KW = [
    "electrician", "electician", "electrition", "electrcian", "electrican",
    "electric", "electri", "bijli", "bijlee", "bijly", "fan", "switch",
    "wiring", "light", "bulb", "socket", "fuse",
]
_AC_KW = [
    "ac", "a.c", "a/c", "aircon", "aircondition", "air condition",
    "air conditioning", "thanda", "cooler", "hvac", "ai",
    "ac technician", "ac tech", "aac", "ac mechanic",
]

def _fuzzy_category(msg: str):
    """Returns (category, confidence) or (None, 0) via fuzzy word matching."""
    words = msg.lower().split()
    best_cat, best_score = None, 0.0

    for word in words:
        for kw_list, cat in [(_PLUMBER_KW, "Plumber"), (_ELECTRICIAN_KW, "Electrician"), (_AC_KW, "AC Technician")]:
            matches = difflib.get_close_matches(word, kw_list, n=1, cutoff=0.72)
            if matches:
                score = difflib.SequenceMatcher(None, word, matches[0]).ratio()
                if score > best_score:
                    best_score, best_cat = score, cat

    return best_cat

def _parse_datetime(msg: str) -> str:
    """
    Parses Urdu/Roman Urdu/English time expressions from a message.
    Returns an ISO timestamp string.
    """
    now = datetime.datetime.now()
    base = now.date()

    if any(w in msg for w in ["parson", "day after tomorrow"]):
        base = now.date() + datetime.timedelta(days=2)
    elif any(w in msg for w in ["kal", "tomorrow"]):
        base = now.date() + datetime.timedelta(days=1)
    elif any(w in msg for w in ["aaj", "today"]):
        base = now.date()

    if any(w in msg for w in ["raat", "night"]):
        hour = 21
    elif any(w in msg for w in ["sham", "evening", "shaam"]):
        hour = 18
    elif any(w in msg for w in ["dopahar", "noon", "afternoon", "zuhr"]):
        hour = 12
    elif any(w in msg for w in ["subah", "morning", "sawera"]):
        hour = 9
    elif any(w in msg for w in ["abhi", "urgent", "now", "asap", "jaldi"]):
        dt = now + datetime.timedelta(hours=1)
        return dt.strftime("%Y-%m-%dT%H:%M:%S")
    else:
        hour = 10  # default: 10 AM

    return datetime.datetime(base.year, base.month, base.day, hour, 0, 0).strftime("%Y-%m-%dT%H:%M:%S")

# Setup client only if key exists to prevent crash on boot
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your-openai-key-here" else None

if client is None:
    logging.getLogger(__name__).warning("OPENAI_API_KEY not set — IntentAgent running in keyword-fallback mode.")

async def intent_agent_node(state: AgentState) -> dict:
    """
    Intent Understanding Agent
    Extracts service category, urgency, and constraints.
    """
    logger = AgentLogger(state["correlation_id"], "IntentAgent", state["telemetry"])
    logger.reasoning("Analyzing user message for intent.", {"raw_input": state["original_message"]})
    
    msg = state["original_message"].lower()
    selected_id = None
    # Always check for simple selection keywords (reliable fallback)
    if "first" in msg or "pahla" in msg or "number 1" in msg:
        selected_id = "provider_1"
    elif "second" in msg or "doosra" in msg or "number 2" in msg:
        selected_id = "provider_2"
    elif "third" in msg or "teesra" in msg or "number 3" in msg:
        selected_id = "provider_3"

    if settings.USE_MOCK_DATA or not client:
        category = None
        action = "book"

        if any(w in msg for w in ["cancel", "no", "abort", "khata", "nhi", "nahin"]):
            action = "cancel"
        
        if any(w in msg for w in _PLUMBER_KW):
            category = "Plumber"
        elif any(w in msg for w in _ELECTRICIAN_KW):
            category = "Electrician"
        elif any(w in msg for w in _AC_KW):
            category = "AC Technician"
        else:
            category = _fuzzy_category(msg)

        if action == "cancel":
            logger.reasoning("(Mock) Detected cancellation request.")
            return {
                "intent_action": "cancel",
                "intent_service_category": category,
                "intent_datetime_target": None,
                "intent_urgency": "normal",
                "intent_constraints": [],
                "selected_provider_id": selected_id
            }

        if not category and not selected_id:
            # Scan conversation history before asking for clarification
            for prev in reversed(state.get("messages", [])):
                prev_text = prev.get("content", "").lower()
                if any(w in prev_text for w in _PLUMBER_KW):
                    category = "Plumber"
                elif any(w in prev_text for w in _ELECTRICIAN_KW):
                    category = "Electrician"
                elif any(w in prev_text for w in _AC_KW):
                    category = "AC Technician"
                else:
                    category = _fuzzy_category(prev_text)
                if category:
                    logger.reasoning(f"(Mock) Found service category '{category}' from conversation history.")
                    break

        if not category and not selected_id:
            logger.reasoning("(Mock) Could not determine service category. Requesting clarification.")
            return {
                "requires_clarification": True,
                "clarification_message": "I'm not sure what service you need. Could you specify if you need a plumber, electrician, or AC technician?"
            }

        logger.reasoning(f"(Mock) Detected {category} requirement based on keywords.")
        logger.state_transition(f"Intent extracted successfully (Mock)", {"service_category": category, "action": action})

        urgency = "high" if any(w in msg for w in ["urgent", "abhi", "jaldi", "asap", "emergency"]) else "normal"
        parsed_dt = _parse_datetime(msg)
        logger.reasoning(f"(Mock) Parsed datetime '{parsed_dt}', urgency '{urgency}'.")

        return {
            "intent_action": action,
            "intent_service_category": category,
            "intent_datetime_target": parsed_dt,
            "intent_urgency": urgency,
            "intent_constraints": [],
            "selected_provider_id": selected_id
        }

    # Real LLM Call
    prompt = f"""
    You are an Intent Parser for a Pakistani service app. 
    Return your response as a JSON object.
    Extract the following from the message:
    - action (book, cancel) - Default is 'book'. If the user wants to stop/cancel, use 'cancel'.
    - selected_provider_id (e.g. 'provider_123' if mentioned, otherwise null)
    - service_category (e.g. Plumber, Electrician, AC Technician)
    - datetime_target (ISO timestamp, if mentioned like 'kal subah')
    - urgency (high, normal)
    - constraints (list of strings)
    If you cannot figure out the service category and action is 'book', return {{"service_category": null}}.
    
    User Message: {state['original_message']}
    """
    
    try:
        start_time = time.time()
        response = await client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[{"role": "system", "content": prompt}],
            response_format={ "type": "json_object" }
        )
        duration_ms = int((time.time() - start_time) * 1000)
        logger.tool_execution("openai_chat_completion", duration_ms, "success")
        
        data = json.loads(response.choices[0].message.content)
        svc = data.get("service_category")
        action = data.get("action", "book")
        llm_selected_id = data.get("selected_provider_id")
        
        # Use LLM selection if keyword didn't find anything
        final_selected_id = selected_id if selected_id else llm_selected_id
        
        logger.reasoning(f"Extracted action '{action}', category '{svc}', selection '{final_selected_id}'.", {"parsed_data": data})
        logger.state_transition("Intent extracted successfully", {"service_category": svc, "action": action})
        
        return {
            "intent_action": action,
            "intent_service_category": svc,
            "intent_datetime_target": data.get("datetime_target"),
            "intent_urgency": data.get("urgency", "normal"),
            "intent_constraints": data.get("constraints", []),
            "selected_provider_id": final_selected_id,
            "requires_clarification": not bool(svc) if action == "book" and not final_selected_id else False,
            "clarification_message": "I'm not sure what kind of service you need. Could you please specify if you need a plumber, electrician, or AC technician?" if (not svc and action == "book" and not final_selected_id) else None
        }
    except Exception as e:
        logger._log("error", f"Intent Agent Error: {str(e)}", level=40)
        return {
            "requires_clarification": True,
            "clarification_message": "Sorry, I had trouble understanding that. Could you rephrase your request?",
        }
