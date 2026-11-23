import sys
import os
import re

# Add backend directory to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.services.resume_parser import ResumeParserService
from app.services.gemini_service import GeminiService
from app.schemas.resume import ResumeParsedData

client = TestClient(app)

def test_no_emojis_in_backend_code():
    emoji_pattern = re.compile(
        r"[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\ud83c-\ud83e][\ud000-\udfff]",
        flags=re.UNICODE,
    )
    for root, _, files in os.walk(os.path.join(backend_dir, "app")):
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    assert not emoji_pattern.search(content), f"Found emoji in {file_path}"

def test_health_check_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "mock-interview-backend"

def test_resume_parser_clean_text():
    raw = "John Doe \r\n\r\n Software Engineer   \n\n\n\nExperience:\n- Built REST APIs"
    cleaned = ResumeParserService.clean_text(raw)
    assert "\r" not in cleaned
    assert "Software Engineer" in cleaned
    assert "\n\n\n" not in cleaned

def test_gemini_service_fallback_analysis():
    service = GeminiService(api_key=None)
    sample_resume = """
    Alex Rivera
    Senior Backend Engineer with 5 years experience in Python, PostgreSQL, and FastAPI.
    Built microservices handling 10k requests per second.
    """
    result = service.analyze_resume_against_role(
        resume_text=sample_resume,
        job_title="Lead Backend Engineer",
        experience_level="senior"
    )
    assert isinstance(result, ResumeParsedData)
    assert len(result.key_strengths) > 0
    assert len(result.suggested_topics) > 0
    assert result.candidate_name != ""

def test_api_resume_analyze_text():
    payload = {
        "raw_text": "Jane Smith. Full Stack Developer with React, Node.js, and TypeScript experience over 4 years.",
        "job_title": "Full Stack Engineer",
        "experience_level": "mid"
    }
    response = client.post("/api/v1/resume/analyze-text", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert "data" in res_data
    assert len(res_data["data"]["key_strengths"]) > 0

if __name__ == "__main__":
    print("Running backend service tests...")
    test_no_emojis_in_backend_code()
    print("Zero emoji check passed.")
    test_health_check_endpoint()
    print("Health check endpoint test passed.")
    test_resume_parser_clean_text()
    print("Resume parser text cleaning passed.")
    test_gemini_service_fallback_analysis()
    print("Gemini service analysis passed.")
    test_api_resume_analyze_text()
    print("Resume analyze API endpoint passed.")
    print("All backend tests succeeded!")
