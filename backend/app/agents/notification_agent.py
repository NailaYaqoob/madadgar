import datetime
from app.agents.state import AgentState
from app.utils.logger import AgentLogger


def _reminder_time(iso_str: str) -> str:
    try:
        dt = datetime.datetime.fromisoformat(iso_str)
        reminder = dt - datetime.timedelta(hours=1)
        return reminder.strftime("%A, %B %d · %I:%M %p")
    except Exception:
        return "1 hour before your appointment"


async def notification_agent_node(state: AgentState) -> dict:
    """
    Notification Agent
    Sends mock booking confirmation via WhatsApp and email.
    """
    logger = AgentLogger(state["correlation_id"], "NotificationAgent", state["telemetry"])

    if state.get("booking_status") != "confirmed":
        return {}

    booking_id = state.get("booking_id", "N/A")
    category = state.get("intent_service_category", "service")

    logger.reasoning("Dispatching booking confirmation via mock WhatsApp and email APIs...")

    logger.tool_execution("send_whatsapp_mock", duration_ms=250, status="success", args={
        "to": state.get("user_id"),
        "message": f"Madadgar: Your {category} booking ({booking_id}) is confirmed!",
    })

    logger.tool_execution("send_email_mock", duration_ms=180, status="success", args={
        "to": state.get("user_id"),
        "subject": f"Booking Confirmation – {booking_id}",
    })

    logger.state_transition("Confirmation notifications dispatched.", {
        "booking_id": booking_id,
        "channels": ["whatsapp", "email"],
    })

    return {"notification_sent": True}


async def followup_agent_node(state: AgentState) -> dict:
    """
    Follow-Up Agent
    Schedules reminders, status updates, and completion confirmation.
    """
    logger = AgentLogger(state["correlation_id"], "FollowUpAgent", state["telemetry"])

    if state.get("booking_status") != "confirmed":
        return {}

    dt_raw = state.get("intent_datetime_target", "")
    category = state.get("intent_service_category", "service")
    booking_id = state.get("booking_id", "N/A")

    provider = next(
        (p["name"] for p in state.get("ranked_providers", [])
         if p["id"] == state.get("selected_provider_id")),
        "your provider",
    )

    reminder_time = _reminder_time(dt_raw)

    # Simulate scheduling 3 follow-up events
    logger.reasoning("Scheduling follow-up automation pipeline...")

    logger.tool_execution("schedule_reminder_mock", duration_ms=45, status="success", args={
        "trigger_at": reminder_time,
        "message": f"Reminder: {provider} arrives in 1 hour for your {category} service.",
    })

    logger.tool_execution("schedule_status_update_mock", duration_ms=38, status="success", args={
        "trigger": "on_provider_arrival",
        "message": f"Status update: {provider} has arrived at your location.",
    })

    logger.tool_execution("schedule_completion_confirmation_mock", duration_ms=42, status="success", args={
        "trigger": "on_service_complete",
        "message": f"Your {category} service is complete. Please rate {provider}.",
    })

    logger.state_transition("Follow-up automation pipeline activated.", {
        "booking_id": booking_id,
        "reminder_at": reminder_time,
        "events": ["reminder", "status_update", "completion_confirmation"],
    })

    followup_msg = (
        f"\n\nFollow-Up Automation Activated:\n"
        f"{'─' * 32}\n"
        f"Reminder     : {reminder_time}\n"
        f"              ({provider} arriving in 1 hour)\n"
        f"Status Update: When provider arrives at your location\n"
        f"Completion   : Rate your experience after service\n"
        f"{'─' * 32}\n"
        f"Booking ID {booking_id} is now being tracked."
    )

    current_response = state.get("final_response", "")
    return {"final_response": current_response + followup_msg}
