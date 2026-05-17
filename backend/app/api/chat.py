from fastapi import APIRouter, Request
from app.models.schemas import ChatRequest
from app.agents.orchestrator import Orchestrator

router = APIRouter()
orchestrator = Orchestrator()

@router.post("/request")
async def process_chat_request(http_request: Request, request: ChatRequest):
    correlation_id = getattr(http_request.state, "correlation_id", None)
    
    # Run the Antigravity graph
    final_state = await orchestrator.process_request(request.user_id, request.message, correlation_id, request.history)
    
    status = "completed"
    if final_state.get("requires_clarification"):
        status = "requires_clarification"
    elif final_state.get("booking_status") == "failed":
        status = "failed"
        
    clarification_msg = final_state.get("clarification_message")
    booking_id = final_state.get("booking_id", "None")
    final_response = final_state.get("final_response")
    
    final_message = clarification_msg if clarification_msg else (final_response if final_response else f"Request processed. Booking ID: {booking_id}")
        
    return {
        "status": status,
        "message": final_message,
        "booking": booking_id,
        "trace_id": correlation_id,
        "trace": final_state.get("telemetry", [])
    }
