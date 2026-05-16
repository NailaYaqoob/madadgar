from fastapi import APIRouter, Depends
from typing import List
from app.models.schemas import ProviderResponse
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[ProviderResponse])
async def get_providers(lat: float = None, lng: float = None, service_type: str = None):
    # Mock data return for now
    mock_data = [
        ProviderResponse(
            id="123",
            name="Ali AC Services",
            service_type="AC Technician",
            latitude=33.6491,
            longitude=72.9818,
            rating=4.8,
            is_available=True
        )
    ]
    return mock_data
