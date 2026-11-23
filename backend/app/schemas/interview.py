from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TurnRecord(BaseModel):
    turn_number: int
    interviewer_question: str
    interviewer_audio_url: Optional[str] = None
    candidate_transcript: Optional[str] = None
    turn_score: Optional[float] = None
    feedback_notes: Optional[str] = None

class StartInterviewRequest(BaseModel):
    job_title: str = Field(..., min_length=2, description="Target job title")
    experience_level: str = Field(default="mid", description="entry, mid, senior, lead")
    job_description: Optional[str] = Field(default=None, description="Optional job description")
    key_strengths: List[str] = Field(default_factory=list, description="Candidate strengths from resume")
    suggested_topics: List[Dict[str, Any]] = Field(default_factory=list, description="Topics from resume analysis")
    max_turns: int = Field(default=5, ge=1, le=10, description="Total turns before automatic completion")
    voice_id: str = Field(default="en-US-cooper", description="Voice for interviewer")

class StartInterviewResponse(BaseModel):
    success: bool
    session_id: str
    turn_number: int
    question_text: str
    audio_url: Optional[str] = None
    error: Optional[str] = None

class SubmitAnswerRequest(BaseModel):
    session_id: str
    candidate_transcript: str = Field(..., min_length=1, description="Candidate's spoken or typed answer")

class SubmitAnswerResponse(BaseModel):
    success: bool
    session_id: str
    turn_number: int
    is_completed: bool
    next_question: Optional[str] = None
    audio_url: Optional[str] = None
    error: Optional[str] = None

class CategoryScores(BaseModel):
    technical_depth: float = Field(..., ge=0, le=100)
    communication_clarity: float = Field(..., ge=0, le=100)
    problem_solving: float = Field(..., ge=0, le=100)
    experience_alignment: float = Field(..., ge=0, le=100)

class QuestionBreakdownItem(BaseModel):
    turn_number: int
    question: str
    candidate_answer: str
    critique: str
    model_answer_points: List[str] = Field(default_factory=list)

class InterviewReport(BaseModel):
    session_id: str
    overall_score: float = Field(..., ge=0, le=100)
    hiring_verdict: str = Field(..., description="Strong Hire | Hire | Leaning Hire | No Hire | Strong No Hire")
    executive_summary: str
    category_scores: CategoryScores
    strengths: List[str]
    areas_for_improvement: List[str]
    question_breakdown: List[QuestionBreakdownItem]

class InterviewReportResponse(BaseModel):
    success: bool
    report: Optional[InterviewReport] = None
    error: Optional[str] = None
