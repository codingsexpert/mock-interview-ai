import logging
from typing import List, Optional, Dict, Any
import httpx
from app.core.config import settings
from app.schemas.voice import GenerateSpeechResponse, VoiceItem

logger = logging.getLogger(__name__)

class MurfService:
    BASE_URL = "https://api.murf.ai/v1"

    def __init__(self, api_key: Optional[str] = None, default_voice_id: Optional[str] = None):
        self.api_key = api_key or settings.MURF_API_KEY
        self.default_voice_id = default_voice_id or settings.MURF_VOICE_ID or "en-US-cooper"

    def _headers(self) -> Dict[str, str]:
        return {
            "api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def list_voices(self, model: str = "GEN2") -> List[VoiceItem]:
        if not self.api_key:
            return [
                VoiceItem(voice_id="en-US-cooper", name="Cooper", accent="US & Canada", gender="Male"),
                VoiceItem(voice_id="en-US-alina", name="Alina", accent="US & Canada", gender="Female")
            ]
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{self.BASE_URL}/speech/voices",
                    params={"model": model},
                    headers=self._headers()
                )
                if response.status_code != 200:
                    logger.error(f"Murf list voices error ({response.status_code}): {response.text}")
                    return []
                data = response.json()
                voices_list = data if isinstance(data, list) else data.get("voices", [])
                return [
                    VoiceItem(
                        voice_id=v.get("voiceId", ""),
                        name=v.get("displayName", ""),
                        accent=v.get("accent", ""),
                        gender=v.get("gender")
                    )
                    for v in voices_list if v.get("voiceId")
                ]
        except Exception as e:
            logger.error(f"Failed to fetch voices from Murf API: {e}")
            return []

    async def generate_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        style: str = "Conversational",
        model_version: str = "GEN2"
    ) -> GenerateSpeechResponse:
        target_voice = voice_id or self.default_voice_id
        if not self.api_key:
            return GenerateSpeechResponse(
                success=True,
                audio_url="https://mock-storage.local/audio/sample_question.mp3",
                audio_length_seconds=3.5,
                word_durations=[]
            )

        payload = {
            "voiceId": target_voice,
            "text": text,
            "style": style,
            "modelVersion": model_version
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/speech/generate",
                    json=payload,
                    headers=self._headers()
                )
                resp_json = response.json()
                if response.status_code != 200:
                    error_msg = resp_json.get("error_message", response.text)
                    logger.error(f"Murf TTS failed ({response.status_code}): {error_msg}")
                    return GenerateSpeechResponse(success=False, error=error_msg)

                audio_file = resp_json.get("audioFile")
                length_seconds = resp_json.get("audioLengthInSeconds", 0.0)
                durations = resp_json.get("wordDurations", [])

                return GenerateSpeechResponse(
                    success=True,
                    audio_url=audio_file,
                    audio_length_seconds=length_seconds,
                    word_durations=durations
                )
        except Exception as e:
            logger.error(f"Murf speech generation request error: {e}")
            return GenerateSpeechResponse(success=False, error=str(e))
