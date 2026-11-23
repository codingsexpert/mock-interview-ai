import sys
import os
import re

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.services.interviewer_service import InterviewerService
from app.services.evaluator_service import EvaluatorService
from app.schemas.interview import InterviewReport

client = TestClient(app)

def test_no_emojis_in_interview_files():
    emoji_pattern = re.compile(
        r"[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\ud83c-\ud83e][\ud000-\udfff]",
        flags=re.UNICODE,
    )
    targets = [
        os.path.join(backend_dir, "app", "schemas", "interview.py"),
        os.path.join(backend_dir, "app", "services", "interviewer_service.py"),
        os.path.join(backend_dir, "app", "services", "evaluator_service.py"),
        os.path.join(backend_dir, "app", "api", "v1", "endpoints", "interview.py"),
    ]
    for path in targets:
        assert os.path.exists(path), f"File not found: {path}"
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            assert not emoji_pattern.search(content), f"Found emoji in {path}"

def test_interviewer_service_logic():
    service = InterviewerService(api_key=None)
    q1 = service.generate_opening_question(
        job_title="Senior Python Engineer",
        experience_level="senior",
        key_strengths=["FastAPI", "PostgreSQL", "System Architecture"],
        suggested_topics=[{"topic": "Concurrency", "focus_area": "AsyncIO", "difficulty": "hard"}]
    )
    assert len(q1) > 20
    assert "Senior Python Engineer" in q1 or "interview" in q1.lower()

    history = [
        {
            "interviewer_question": q1,
            "candidate_transcript": "I built a high-throughput payment ingestion pipeline using FastAPI, Celery, and PostgreSQL."
        }
    ]
    q2 = service.generate_next_turn(
        job_title="Senior Python Engineer",
        experience_level="senior",
        history=history,
        suggested_topics=[]
    )
    assert len(q2) > 15

def test_evaluator_service_logic():
    service = EvaluatorService(api_key=None)
    turns = [
        {
            "turn_number": 1,
            "interviewer_question": "Describe your architectural approach to database connection pooling.",
            "candidate_transcript": "We utilized PgBouncer in transaction pooling mode to handle spikes up to 5000 concurrent client connections."
        }
    ]
    report = service.evaluate_interview(
        session_id="test-session-123",
        job_title="Lead Database Architect",
        experience_level="lead",
        turns=turns
    )
    assert isinstance(report, InterviewReport)
    assert report.overall_score >= 0 and report.overall_score <= 100
    assert report.hiring_verdict in ["Strong Hire", "Hire", "Leaning Hire", "No Hire", "Strong No Hire"]
    assert len(report.strengths) > 0
    assert len(report.question_breakdown) == 1

def test_rest_interview_lifecycle():
    # 1. Start interview
    start_payload = {
        "job_title": "Full Stack Developer",
        "experience_level": "mid",
        "key_strengths": ["React", "Node.js", "PostgreSQL"],
        "suggested_topics": [{"topic": "State Management", "focus_area": "Zustand", "difficulty": "medium"}],
        "max_turns": 2
    }
    start_res = client.post("/api/v1/interview/start", json=start_payload)
    assert start_res.status_code == 200
    start_data = start_res.json()
    assert start_data["success"] is True
    session_id = start_data["session_id"]
    assert start_data["turn_number"] == 1
    assert len(start_data["question_text"]) > 10

    # 2. Submit Turn 1 answer
    turn1_payload = {
        "session_id": session_id,
        "candidate_transcript": "In our React app we used Zustand with optimistic updates and normalized caching."
    }
    turn1_res = client.post("/api/v1/interview/submit-turn", json=turn1_payload)
    assert turn1_res.status_code == 200
    turn1_data = turn1_res.json()
    assert turn1_data["success"] is True
    assert turn1_data["turn_number"] == 2
    assert turn1_data["is_completed"] is False

    # 3. Submit Turn 2 answer (max_turns = 2)
    turn2_payload = {
        "session_id": session_id,
        "candidate_transcript": "We handled SSR cache invalidation via Webhooks triggering Next.js revalidatePath."
    }
    turn2_res = client.post("/api/v1/interview/submit-turn", json=turn2_payload)
    assert turn2_res.status_code == 200
    turn2_data = turn2_res.json()
    assert turn2_data["is_completed"] is True

    # 4. Get Final Report
    report_res = client.get(f"/api/v1/interview/{session_id}/report")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["success"] is True
    assert report_data["report"]["overall_score"] > 0
    assert len(report_data["report"]["question_breakdown"]) == 2

def test_websocket_interview_flow():
    # Setup session
    start_payload = {
        "job_title": "Backend Engineer",
        "experience_level": "mid",
        "max_turns": 2
    }
    start_res = client.post("/api/v1/interview/start", json=start_payload)
    session_id = start_res.json()["session_id"]

    # Connect WebSocket
    with client.websocket_connect(f"/api/v1/interview/ws/{session_id}") as websocket:
        # Send first answer
        websocket.send_json({
            "action": "submit_answer",
            "transcript": "I designed microservices using gRPC for inter-service communication."
        })
        next_turn_msg = websocket.receive_json()
        assert next_turn_msg["type"] == "next_turn"
        assert next_turn_msg["turn_number"] == 2

        # Send second answer (reaches max_turns)
        websocket.send_json({
            "action": "submit_answer",
            "transcript": "For resilience we implemented circuit breakers with exponential backoff."
        })
        completed_msg = websocket.receive_json()
        assert completed_msg["type"] == "interview_completed"
        assert "report" in completed_msg
        assert completed_msg["report"]["overall_score"] > 0

if __name__ == "__main__":
    print("Running interview service tests...")
    test_no_emojis_in_interview_files()
    print("Zero emoji check passed.")
    test_interviewer_service_logic()
    print("Interviewer service logic passed.")
    test_evaluator_service_logic()
    print("Evaluator service logic passed.")
    test_rest_interview_lifecycle()
    print("REST interview lifecycle passed.")
    test_websocket_interview_flow()
    print("WebSocket interview flow passed.")
    print("All interview engine tests succeeded!")
