from fastapi import APIRouter, HTTPException, status
from app.schemas.voice import (
    GenerateSpeechRequest,
    GenerateSpeechResponse,
    ListVoicesResponse
)
from app.services.murf_service import MurfService

router = APIRouter(prefix="/voice", tags=["Voice"])
murf_service = MurfService()

@router.get("/voices", response_model=ListVoicesResponse)
async def get_available_voices():
    try:
        voices = await murf_service.list_voices()
        return ListVoicesResponse(success=True, voices=voices)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch voices: {str(e)}"
        )

@router.post("/generate-speech", response_model=GenerateSpeechResponse)
async def generate_speech(payload: GenerateSpeechRequest):
    result = await murf_service.generate_speech(
        text=payload.text,
        voice_id=payload.voice_id,
        style=payload.style,
        model_version=payload.model_version
    )
    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=result.error or "Voice generation failed"
        )
    return result
