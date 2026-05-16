from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatRequest(BaseModel):
    user_id: str
    message: str

class IntentOutput(BaseModel):
    service_category: Optional[str] = None
    location: Optional[str] = None
    datetime_target: Optional[datetime] = None

class ProviderResponse(BaseModel):
    id: str
    name: str
    service_type: str
    latitude: float
    longitude: float
    rating: float
    is_available: bool
