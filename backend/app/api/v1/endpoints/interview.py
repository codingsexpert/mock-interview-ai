import uuid
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status
from app.schemas.interview import (
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    ExtendInterviewRequest,
    ExtendInterviewResponse,
    InterviewReportResponse
)
from app.services.interviewer_service import InterviewerService
from app.services.evaluator_service import EvaluatorService
from app.services.murf_service import MurfService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interview", tags=["Interview"])
interviewer_service = InterviewerService()
evaluator_service = EvaluatorService()
murf_service = MurfService()

# In-memory session store (acts as runtime cache; can mirror to Supabase)
active_sessions: Dict[str, Dict[str, Any]] = {}

@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(payload: StartInterviewRequest):
    try:
        session_id = str(uuid.uuid4())
        opening_q = interviewer_service.generate_opening_question(
            job_title=payload.job_title,
            experience_level=payload.experience_level,
            key_strengths=payload.key_strengths,
            suggested_topics=payload.suggested_topics
        )

        # Generate audio using Murf.ai
        voice_res = await murf_service.generate_speech(
            text=opening_q,
            voice_id=payload.voice_id
        )

        active_sessions[session_id] = {
            "session_id": session_id,
            "job_title": payload.job_title,
            "experience_level": payload.experience_level,
            "suggested_topics": payload.suggested_topics,
            "max_turns": payload.max_turns,
            "voice_id": payload.voice_id,
            "current_turn": 1,
            "turns": [
                {
                    "turn_number": 1,
                    "interviewer_question": opening_q,
                    "interviewer_audio_url": voice_res.audio_url,
                    "candidate_transcript": None
                }
            ],
            "is_completed": False,
            "report": None
        }

        return StartInterviewResponse(
            success=True,
            session_id=session_id,
            turn_number=1,
            question_text=opening_q,
            audio_url=voice_res.audio_url
        )
    except Exception as e:
        logger.error(f"Failed to start interview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not initiate interview session: {str(e)}"
        )

@router.post("/submit-turn", response_model=SubmitAnswerResponse)
async def submit_turn(payload: SubmitAnswerRequest):
    session = active_sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")

    if session["is_completed"]:
        return SubmitAnswerResponse(
            success=True,
            session_id=payload.session_id,
            turn_number=session["current_turn"],
            is_completed=True,
            next_question=None,
            audio_url=None
        )

    # Record candidate answer for current turn
    current_turn_idx = session["current_turn"] - 1
    session["turns"][current_turn_idx]["candidate_transcript"] = payload.candidate_transcript

    # Check if max turns reached for this round
    if session["current_turn"] >= session["max_turns"]:
        session["is_completed"] = True
        return SubmitAnswerResponse(
            success=True,
            session_id=payload.session_id,
            turn_number=session["current_turn"],
            is_completed=True,
            round_completed=True,
            next_question=None,
            audio_url=None
        )

    # Generate next question
    next_turn_number = session["current_turn"] + 1
    next_q = interviewer_service.generate_next_turn(
        job_title=session["job_title"],
        experience_level=session["experience_level"],
        history=session["turns"],
        suggested_topics=session["suggested_topics"]
    )

    voice_res = await murf_service.generate_speech(
        text=next_q,
        voice_id=session.get("voice_id", "en-US-cooper")
    )

    session["current_turn"] = next_turn_number
    session["turns"].append({
        "turn_number": next_turn_number,
        "interviewer_question": next_q,
        "interviewer_audio_url": voice_res.audio_url,
        "candidate_transcript": None
    })

    return SubmitAnswerResponse(
        success=True,
        session_id=payload.session_id,
        turn_number=next_turn_number,
        is_completed=False,
        round_completed=False,
        next_question=next_q,
        audio_url=voice_res.audio_url
    )

@router.post("/extend", response_model=ExtendInterviewResponse)
async def extend_interview_session(payload: ExtendInterviewRequest):
    session = active_sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session["max_turns"] += payload.additional_turns
    session["is_completed"] = False

    next_turn_number = len(session["turns"]) + 1
    session["current_turn"] = next_turn_number

    next_q = interviewer_service.generate_next_turn(
        job_title=session["job_title"],
        experience_level=session["experience_level"],
        history=session["turns"],
        suggested_topics=session["suggested_topics"]
    )

    voice_res = await murf_service.generate_speech(
        text=next_q,
        voice_id=session.get("voice_id", "en-US-cooper")
    )

    session["turns"].append({
        "turn_number": next_turn_number,
        "interviewer_question": next_q,
        "interviewer_audio_url": voice_res.audio_url,
        "candidate_transcript": None
    })

    return ExtendInterviewResponse(
        success=True,
        session_id=payload.session_id,
        new_max_turns=session["max_turns"],
        next_question=next_q,
        audio_url=voice_res.audio_url
    )

@router.get("/{session_id}")
async def get_session_status(session_id: str):
    session = active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")
    
    current_turn_idx = session["current_turn"] - 1
    current_turn_data = session["turns"][current_turn_idx] if current_turn_idx < len(session["turns"]) else session["turns"][-1]
    
    completed_history = [
        {
            "turn_number": t["turn_number"],
            "question": t["interviewer_question"],
            "answer": t.get("candidate_transcript")
        }
        for t in session["turns"]
        if t.get("candidate_transcript") is not None
    ]

    return {
        "success": True,
        "session_id": session_id,
        "job_title": session["job_title"],
        "experience_level": session["experience_level"],
        "current_turn": session["current_turn"],
        "max_turns": session["max_turns"],
        "question_text": current_turn_data.get("interviewer_question"),
        "audio_url": current_turn_data.get("interviewer_audio_url"),
        "is_completed": session["is_completed"],
        "history": completed_history
    }

@router.post("/{session_id}/complete", response_model=InterviewReportResponse)
async def complete_interview(session_id: str):
    session = active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    try:
        report = evaluator_service.evaluate_interview(
            session_id=session_id,
            job_title=session["job_title"],
            experience_level=session["experience_level"],
            turns=session["turns"]
        )
        session["is_completed"] = True
        session["report"] = report
        return InterviewReportResponse(success=True, report=report)
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate scorecard report: {str(e)}"
        )

@router.get("/{session_id}/report", response_model=InterviewReportResponse)
async def get_interview_report(session_id: str):
    session = active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if not session.get("report"):
        # Generate if not yet compiled
        report = evaluator_service.evaluate_interview(
            session_id=session_id,
            job_title=session["job_title"],
            experience_level=session["experience_level"],
            turns=session["turns"]
        )
        session["report"] = report

    return InterviewReportResponse(success=True, report=session["report"])

@router.websocket("/ws/{session_id}")
async def interview_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = active_sessions.get(session_id)
    if not session:
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "submit_answer":
                transcript = data.get("transcript", "")
                current_turn_idx = session["current_turn"] - 1
                session["turns"][current_turn_idx]["candidate_transcript"] = transcript

                if session["current_turn"] >= session["max_turns"]:
                    session["is_completed"] = True
                    report = evaluator_service.evaluate_interview(
                        session_id=session_id,
                        job_title=session["job_title"],
                        experience_level=session["experience_level"],
                        turns=session["turns"]
                    )
                    session["report"] = report
                    await websocket.send_json({
                        "type": "interview_completed",
                        "report": report.model_dump()
                    })
                    break

                # Next turn
                next_turn_number = session["current_turn"] + 1
                next_q = interviewer_service.generate_next_turn(
                    job_title=session["job_title"],
                    experience_level=session["experience_level"],
                    history=session["turns"],
                    suggested_topics=session["suggested_topics"]
                )
                voice_res = await murf_service.generate_speech(
                    text=next_q,
                    voice_id=session.get("voice_id", "en-US-cooper")
                )

                session["current_turn"] = next_turn_number
                session["turns"].append({
                    "turn_number": next_turn_number,
                    "interviewer_question": next_q,
                    "interviewer_audio_url": voice_res.audio_url,
                    "candidate_transcript": None
                })

                await websocket.send_json({
                    "type": "next_turn",
                    "turn_number": next_turn_number,
                    "question_text": next_q,
                    "audio_url": voice_res.audio_url
                })

            elif action == "end_early":
                session["is_completed"] = True
                report = evaluator_service.evaluate_interview(
                    session_id=session_id,
                    job_title=session["job_title"],
                    experience_level=session["experience_level"],
                    turns=session["turns"]
                )
                session["report"] = report
                await websocket.send_json({
                    "type": "interview_completed",
                    "report": report.model_dump()
                })
                break
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket session error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
