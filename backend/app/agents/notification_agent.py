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
    Operates async after service.
    """
    logger = AgentLogger(state["correlation_id"], "FollowUpAgent", state["telemetry"])
    logger.reasoning("Scheduled async reminder for post-service review.")
    return {}
