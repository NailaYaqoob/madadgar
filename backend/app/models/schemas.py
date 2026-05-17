from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class ChatRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    message: str = Field(min_length=1, max_length=1000)
    history: List[Dict[str, str]] = Field(default_factory=list, max_length=50)

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
