import uuid
import datetime
from app.agents.state import AgentState
from app.utils.logger import AgentLogger


def _format_dt(iso_str: str) -> str:
    try:
        dt = datetime.datetime.fromisoformat(iso_str)
        return dt.strftime("%A, %B %d · %I:%M %p")
    except Exception:
        return iso_str


async def booking_agent_node(state: AgentState) -> dict:
    """
    Booking Agent
    Simulates provider assignment, slot reservation, DB write, and receipt generation.
    """
    logger = AgentLogger(state["correlation_id"], "BookingAgent", state["telemetry"])
    provider_id = state.get("selected_provider_id")
    action = state.get("intent_action", "book")

    if action == "cancel":
        logger.reasoning("Processing cancellation request...")
        logger.tool_execution("mutate_db_cancel_booking", duration_ms=80, status="success")
        logger.state_transition("Booking cancelled successfully.", {"status": "cancelled"})
        return {
            "booking_status": "cancelled",
            "final_response": (
                "Your service request has been cancelled successfully.\n\n"
                "Status update: Provider has been notified of the cancellation.\n"
                "Hope to help you again soon!"
            ),
        }

    if not provider_id:
        logger._log("error", "No provider selected for booking.", level=40)
        return {"booking_status": "failed"}

    # Resolve provider details from ranked list
    provider = next(
        (p for p in state.get("ranked_providers", []) if p["id"] == provider_id),
        {"name": provider_id, "rating": "N/A", "distance_km": "N/A"},
    )

    booking_id = f"BK-{uuid.uuid4().hex[:8].upper()}"
    dt_raw = state.get("intent_datetime_target", "")
    dt_display = _format_dt(dt_raw) if dt_raw else "As soon as possible"
    category = state.get("intent_service_category", "Service")
    location = state.get("location_raw", "Islamabad")

    logger.reasoning(f"Assigning provider '{provider['name']}' for {category} at {dt_display}.")

    # Simulate DB write — booking record creation
    logger.tool_execution("mutate_db_create_booking", duration_ms=120, status="success", args={
        "booking_id": booking_id,
        "provider_id": provider_id,
        "service": category,
        "scheduled_at": dt_raw,
        "location": location,
    })

    # Simulate provider assignment notification
    logger.tool_execution("notify_provider_mock", duration_ms=90, status="success", args={
        "provider": provider["name"],
        "message": f"New booking {booking_id} assigned to you for {dt_display}.",
    })

    logger.booking_lifecycle("Slot reserved and provider assigned.", {
        "booking_id": booking_id,
        "provider": provider["name"],
        "scheduled_at": dt_display,
    })

    # Generate booking receipt
    receipt = (
        f"Booking Confirmed!\n"
        f"{'─' * 32}\n"
        f"Booking ID   : {booking_id}\n"
        f"Service      : {category}\n"
        f"Provider     : {provider['name']}\n"
        f"Rating       : {provider.get('rating', 'N/A')} stars\n"
        f"Scheduled    : {dt_display}\n"
        f"Location     : {location}\n"
        f"{'─' * 32}\n"
        f"Status       : CONFIRMED\n"
        f"Provider has been notified and will arrive on time."
    )

    return {
        "booking_id": booking_id,
        "booking_status": "confirmed",
        "final_response": receipt,
    }
