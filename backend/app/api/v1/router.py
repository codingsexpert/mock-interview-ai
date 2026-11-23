from fastapi import APIRouter
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.resume import router as resume_router
from app.api.v1.endpoints.voice import router as voice_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(resume_router)
api_router.include_router(voice_router)
