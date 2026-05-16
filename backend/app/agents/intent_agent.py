import json
import time
import datetime
from openai import AsyncOpenAI
from app.core.config import settings
from app.agents.state import AgentState
from app.utils.logger import AgentLogger

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

async def intent_agent_node(state: AgentState) -> dict:
    """
    Intent Understanding Agent
    Extracts service category, urgency, and constraints.
    """
    logger = AgentLogger(state["correlation_id"], "IntentAgent", state["telemetry"])
    logger.reasoning("Analyzing user message for intent.", {"raw_input": state["original_message"]})
    
    if settings.USE_MOCK_DATA or not client:
        msg = state["original_message"].lower()
        category = None
        action = "book"

        if any(w in msg for w in ["cancel", "no", "abort", "khata", "nhi", "nahin"]):
            action = "cancel"
        
        if "plumber" in msg or "nal" in msg or "pipe" in msg:
            category = "Plumber"
        elif "elect" in msg or "bijli" in msg or "fan" in msg:
            category = "Electrician"
        elif "ac" in msg or "thanda" in msg or "technician" in msg:
            category = "AC Technician"

        if action == "cancel":
            logger.reasoning("(Mock) Detected cancellation request.")
            return {
                "intent_action": "cancel",
                "intent_service_category": category, # May be None
                "intent_datetime_target": None,
                "intent_urgency": "normal",
                "intent_constraints": []
            }

        if not category:
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
            "intent_constraints": []
        }

    # Real LLM Call
    prompt = f"""
    You are an Intent Parser for a Pakistani service app. 
    Extract the following from the message:
    - action (book, cancel) - Default is 'book'. If the user wants to stop/cancel, use 'cancel'.
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
        
        logger.reasoning(f"Extracted action '{action}', category '{svc}'.", {"parsed_data": data})
        logger.state_transition("Intent extracted successfully", {"service_category": svc, "action": action})
        
        return {
            "intent_action": action,
            "intent_service_category": svc,
            "intent_datetime_target": data.get("datetime_target"),
            "intent_urgency": data.get("urgency", "normal"),
            "intent_constraints": data.get("constraints", []),
            "requires_clarification": not bool(svc) if action == "book" else False,
            "clarification_message": "I'm not sure what kind of service you need. Could you please specify if you need a plumber, electrician, or AC technician?" if (not svc and action == "book") else None
        }
    except Exception as e:
        logger._log("error", f"Intent Agent Error: {str(e)}", level=40)
        return {"requires_clarification": True}
