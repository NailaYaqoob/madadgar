import uuid
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logger import AgentLogger

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id
        
        logger = AgentLogger(correlation_id, "FastAPI_Middleware")
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time_ms = int((time.time() - start_time) * 1000)
        
        logger._log(
            "api_request",
            "Request completed",
            metadata={
                "method": request.method,
                "url": str(request.url),
                "status_code": response.status_code
            },
            execution_duration_ms=process_time_ms
        )
        
        response.headers["X-Correlation-ID"] = correlation_id
        return response
