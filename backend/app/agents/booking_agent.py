from app.agents.state import AgentState
from app.utils.logger import AgentLogger

async def booking_agent_node(state: AgentState) -> dict:
    """
    Booking Agent
    Simulates the transaction and reserves the slot.
    """
    logger = AgentLogger(state["correlation_id"], "BookingAgent", state["telemetry"])
    provider_id = state.get("selected_provider_id")
    action = state.get("intent_action", "book")

    if action == "cancel":
        logger.reasoning("Processing cancellation request...")
        # Simulating DB update to cancel booking
        logger.tool_execution("mutate_db_cancel_booking", duration_ms=80, status="success")
        logger.booking_lifecycle("Booking cancelled successfully.", {"status": "cancelled"})
        return {
            "booking_status": "cancelled",
            "final_response": "Your service request has been cancelled as requested. Hope to help you again soon!"
        }
    
    if not provider_id:
        logger._log("error", "No provider selected for booking.", level=40)
        return {"booking_status": "failed"}
        
    logger.reasoning(f"Initiating transaction for provider {provider_id} at {state.get('intent_datetime_target')}...")
    
    # Edge case: Race condition / provider becomes unavailable.
    # We would check DB here. Mocking success.
    logger.tool_execution("mutate_db_create_booking", duration_ms=120, status="success")
    
    logger.booking_lifecycle("Slot reserved successfully.", {
        "booking_id": "booking_999xyz",
        "provider_id": provider_id
    })
    
    return {
        "booking_id": "booking_999xyz",
        "booking_status": "confirmed"
    }
