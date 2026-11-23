import json
import logging
from typing import Optional
from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.resume import ResumeParsedData

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model or settings.GEMINI_MODEL
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize GenAI client: {e}")

    def analyze_resume_against_role(
        self,
        resume_text: str,
        job_title: str,
        job_description: Optional[str] = None,
        experience_level: str = "mid"
    ) -> ResumeParsedData:
        prompt = f"""
You are an expert technical interviewer and hiring manager.
Analyze the candidate resume against the target job role.

TARGET ROLE: {job_title}
SENIORITY LEVEL: {experience_level}
TARGET JOB DESCRIPTION:
{job_description or 'Standard industry requirements for ' + job_title}

CANDIDATE RESUME:
{resume_text}

Return strict JSON only (no markdown code fences, no emojis, no commentary):
{{
  "candidate_name": "string",
  "total_experience_years": 0.0,
  "key_strengths": ["string"],
  "technical_gaps": ["string"],
  "suggested_topics": [
    {{
      "topic": "string",
      "focus_area": "string",
      "difficulty": "easy | medium | hard"
    }}
  ],
  "interview_strategy": "string"
}}
"""
        if not self.client:
            return self._generate_fallback_analysis(resume_text, job_title)

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )
            raw_content = response.text.strip()
            data_dict = json.loads(raw_content)
            return ResumeParsedData(**data_dict)
        except Exception as e:
            logger.error(f"Gemini API analysis failed: {e}")
            return self._generate_fallback_analysis(resume_text, job_title)

    def _generate_fallback_analysis(self, resume_text: str, job_title: str) -> ResumeParsedData:
        lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
        candidate_name = lines[0] if lines else "Candidate"
        return ResumeParsedData(
            candidate_name=candidate_name[:50],
            total_experience_years=3.0,
            key_strengths=[
                f"Practical software engineering background aligned with {job_title}",
                "Familiarity with system architecture, REST APIs, and database design"
            ],
            technical_gaps=[
                "High-concurrency performance profiling and distributed transactions",
                "Advanced edge-case recovery in production environments"
            ],
            suggested_topics=[
                {"topic": "System Design", "focus_area": "Data modeling and scalability", "difficulty": "medium"},
                {"topic": "Practical Experience", "focus_area": "Past projects and production challenges", "difficulty": "medium"},
                {"topic": "Problem Solving", "focus_area": "Debugging and reliability engineering", "difficulty": "hard"}
            ],
            interview_strategy=f"Probe hands-on decisions in past projects and assess alignment with {job_title} standards."
        )
