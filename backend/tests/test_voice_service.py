import sys
import os
import re
import asyncio

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.services.murf_service import MurfService
from app.services.stt_service import SpeechToTextService

client = TestClient(app)

def test_no_emojis_in_voice_files():
    emoji_pattern = re.compile(
        r"[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\ud83c-\ud83e][\ud000-\udfff]",
        flags=re.UNICODE,
    )
    targets = [
        os.path.join(backend_dir, "app", "schemas", "voice.py"),
        os.path.join(backend_dir, "app", "services", "murf_service.py"),
        os.path.join(backend_dir, "app", "services", "stt_service.py"),
        os.path.join(backend_dir, "app", "api", "v1", "endpoints", "voice.py"),
    ]
    for path in targets:
        assert os.path.exists(path), f"File not found: {path}"
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            assert not emoji_pattern.search(content), f"Found emoji in {path}"

def test_murf_service_fallback_mode():
    service = MurfService(api_key="")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    res = loop.run_until_complete(service.generate_speech("Test question"))
    assert res.success is True
    assert res.audio_url is not None
    assert res.audio_length_seconds > 0

def test_stt_service():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    res = loop.run_until_complete(SpeechToTextService.transcribe_audio_chunk(b"fake_audio_bytes"))
    assert res.success is True
    assert res.transcript != ""

def test_api_voice_endpoints():
    # Test GET /voices
    response = client.get("/api/v1/voice/voices")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["voices"]) > 0

    # Test POST /generate-speech
    payload = {
        "text": "Welcome to your mock interview session.",
        "voice_id": "en-US-cooper",
        "style": "Conversational",
        "model_version": "GEN2"
    }
    gen_response = client.post("/api/v1/voice/generate-speech", json=payload)
    assert gen_response.status_code == 200
    gen_data = gen_response.json()
    assert gen_data["success"] is True
    assert gen_data["audio_url"] is not None
    assert gen_data["audio_url"].startswith("http")

if __name__ == "__main__":
    print("Running voice service tests...")
    test_no_emojis_in_voice_files()
    print("Zero emoji check passed.")
    test_murf_service_fallback_mode()
    print("Murf service fallback test passed.")
    test_stt_service()
    print("STT service test passed.")
    test_api_voice_endpoints()
    print("Live API voice endpoints test passed!")
    print("All voice service tests succeeded!")
