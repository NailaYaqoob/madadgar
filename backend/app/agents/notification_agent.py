from app.agents.state import AgentState
from app.utils.logger import AgentLogger

async def notification_agent_node(state: AgentState) -> dict:
    """
    Notification Agent
    Drafts and sends mock confirmation messages.
    """
    logger = AgentLogger(state["correlation_id"], "NotificationAgent", state["telemetry"])
    
    if state.get("booking_status") == "confirmed":
        logger.reasoning("Sending booking confirmation via mock WhatsApp API...")
        msg = f"Your booking for {state.get('intent_service_category')} is confirmed for {state.get('intent_datetime_target')}."
        
        logger.tool_execution("send_whatsapp_mock", duration_ms=250, status="success")
        logger.state_transition(f"Sent message -> '{msg}'")
        return {"notification_sent": True, "final_response": msg}
        
    return {}

async def followup_agent_node(state: AgentState) -> dict:
    """
    Follow-Up Agent
    Schedules a reminder 1 hour before the appointment and a post-service review prompt.
    """
    logger = AgentLogger(state["correlation_id"], "FollowUpAgent", state["telemetry"])

    if state.get("booking_status") != "confirmed":
        return {}

    dt = state.get("intent_datetime_target", "your appointment")
    category = state.get("intent_service_category", "service")
    provider = next(
        (p["name"] for p in state.get("ranked_providers", [])
         if p["id"] == state.get("selected_provider_id")),
        "your provider"
    )

    logger.reasoning(f"Scheduling reminder 1 hour before appointment at {dt}.")
    logger.tool_execution("schedule_reminder_mock", duration_ms=45, status="success")
    logger.state_transition("Follow-up reminders scheduled.", {
        "reminder_at": dt,
        "provider": provider,
    })

    reminder_msg = (
        f"\n\nReminder scheduled: You will receive a notification 1 hour before your {category} appointment with {provider}.\n"
        f"After service completion, we'll ask you to rate your experience. Thank you for using Madadgar!"
    )

    current_response = state.get("final_response", "")
    return {"final_response": current_response + reminder_msg}
