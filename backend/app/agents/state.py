from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    """
    Global state object passed between all Antigravity nodes/agents.
    """
    # Core inputs
    user_id: str
    original_message: str
    correlation_id: str
    
    # Execution history
    messages: List[Dict[str, str]] # Chat history (role, content)
    telemetry: List[dict] # Structured log objects
    
    # State tracking
    current_agent: str
    next_agent: str
    requires_clarification: bool
    clarification_message: Optional[str]
    
    # Extracted data
    intent_action: Optional[str] # e.g. "book", "cancel"
    intent_service_category: Optional[str]
    intent_datetime_target: Optional[str]
    intent_urgency: Optional[str]
    intent_constraints: List[str]
    
    location_raw: Optional[str]
    location_lat: Optional[float]
    location_lng: Optional[float]
    
    search_radius_km: int
    
    # Provider data
    discovered_providers: List[dict]
    ranked_providers: List[dict]
    selected_provider_id: Optional[str]
    
    # Transactional data
    booking_id: Optional[str]
    booking_status: Optional[str]
    notification_sent: bool
    final_response: Optional[str]
