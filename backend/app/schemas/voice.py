from typing import List, Optional, Any
from pydantic import BaseModel, Field

class GenerateSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Text to synthesize into speech")
    voice_id: str = Field(default="en-US-cooper", description="Murf voice ID")
    style: str = Field(default="Conversational", description="Speaking style")
    model_version: str = Field(default="GEN2", description="Murf model version: GEN2")

class WordDuration(BaseModel):
    word: str
    start_ms: Optional[int] = None
    end_ms: Optional[int] = None

class GenerateSpeechResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    audio_length_seconds: Optional[float] = None
    word_durations: Optional[List[Any]] = None
    error: Optional[str] = None

class VoiceItem(BaseModel):
    voice_id: str
    name: str
    accent: str
    gender: Optional[str] = None

class ListVoicesResponse(BaseModel):
    success: bool
    voices: List[VoiceItem] = []
    error: Optional[str] = None

class TranscribeAudioResponse(BaseModel):
    success: bool
    transcript: str
    confidence: Optional[float] = None
    error: Optional[str] = None
