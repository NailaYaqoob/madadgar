from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.chat import router as chat_router
from app.api.providers import router as providers_router
from app.api.middleware import CorrelationIdMiddleware
from app.utils.logger import setup_json_logging

# Initialize global json logging
setup_json_logging()

app = FastAPI(title=settings.PROJECT_NAME)

# Add Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Correlation-ID"],
)
app.add_middleware(CorrelationIdMiddleware)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Madadgar API", 
        "mock_data_enabled": settings.USE_MOCK_DATA
    }

@app.get("/download-zip")
def download_zip():
    import os
    file_path = "/app/antigravity_orchestration_and_logs.zip"
    if os.path.exists(file_path):
        return FileResponse(
            file_path,
            media_type="application/zip",
            filename="antigravity_orchestration_and_logs.zip"
        )
    return {"error": f"File not found at {file_path}"}

app.include_router(chat_router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(providers_router, prefix="/api/v1/providers", tags=["Providers"])
