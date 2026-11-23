from typing import List, Optional
from pydantic import BaseModel, Field

class TopicFocus(BaseModel):
    topic: str = Field(..., description="Subject or technical domain to evaluate")
    focus_area: str = Field(..., description="Specific project or architectural concept")
    difficulty: str = Field(default="medium", description="Difficulty tier: easy, medium, hard")

class ResumeParsedData(BaseModel):
    candidate_name: str = Field(default="Candidate", description="Detected candidate full name")
    total_experience_years: float = Field(default=0.0, description="Estimated years of professional experience")
    key_strengths: List[str] = Field(default_factory=list, description="Primary technical and domain competencies")
    technical_gaps: List[str] = Field(default_factory=list, description="Identified areas for technical scrutiny")
    suggested_topics: List[TopicFocus] = Field(default_factory=list, description="Recommended interview topics")
    interview_strategy: str = Field(default="", description="High-level evaluation plan for the interviewer")

class ResumeAnalysisRequest(BaseModel):
    raw_text: str = Field(..., min_length=20, description="Extracted resume text")
    job_title: str = Field(..., min_length=2, description="Target job title")
    job_description: Optional[str] = Field(default=None, description="Target job description")
    experience_level: str = Field(default="mid", description="Seniority tier: entry, mid, senior, lead")

class ResumeAnalysisResponse(BaseModel):
    success: bool
    data: Optional[ResumeParsedData] = None
    error: Optional[str] = None
