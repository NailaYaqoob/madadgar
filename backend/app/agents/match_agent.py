from app.core.config import settings

class MatchAgent:
    def __init__(self):
        self.use_mock = settings.USE_MOCK_DATA

    async def find_providers(self, intent: dict) -> list:
        """
        Finds providers based on extracted intent.
        Toggles between mock data and real Google Places API.
        """
        if self.use_mock:
            return [
                {
                    "id": "123",
                    "name": "Ali AC Services",
                    "score": 95,
                    "reason": "Closest provider with high rating."
                }
            ]
        else:
            # Here we would call Google Maps API and Database
            return []
