import logging
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

class InterviewerService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model or settings.GEMINI_MODEL
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize GenAI client: {e}")

    def generate_opening_question(
        self,
        job_title: str,
        experience_level: str,
        key_strengths: List[str],
        suggested_topics: List[Dict[str, Any]]
    ) -> str:
        prompt = f"""
You are an experienced, professional hiring manager conducting a technical and behavioral interview.
Role: {job_title} ({experience_level} level)
Key Strengths from Resume: {', '.join(key_strengths) if key_strengths else 'General background'}
Recommended Interview Topics: {suggested_topics}

INSTRUCTIONS:
1. Greet the candidate professionally in ONE concise sentence, then immediately ask a foundational opening question related to their core engineering background and past projects.
2. The question must be direct, specific, and invite concrete technical details.
3. Maximum 2 sentences total.
4. Strictly no emojis, no pleasantry filler.
"""
        if not self.client:
            return f"Welcome to the interview for the {job_title} role. To begin, could you walk me through the architecture of the most technically challenging project you led recently, specifically focusing on your core design decisions?"

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.3)
            )
            return response.text.strip().replace('"', '')
        except Exception as e:
            logger.error(f"Failed to generate opening question via Gemini: {e}")
            return f"Welcome to the interview for the {job_title} position. Let's start with your recent experience: could you describe an architectural problem you solved recently and the trade-offs you evaluated?"

    def generate_next_turn(
        self,
        job_title: str,
        experience_level: str,
        history: List[Dict[str, Any]],
        suggested_topics: List[Dict[str, Any]]
    ) -> str:
        conversation_context = []
        for turn in history:
            q = turn.get("interviewer_question", "")
            a = turn.get("candidate_transcript", "")
            conversation_context.append(f"Interviewer: {q}\nCandidate: {a}")
        history_text = "\n\n".join(conversation_context)

        prompt = f"""
You are an experienced, sharp hiring manager interviewing a candidate for a {job_title} ({experience_level} level) position.

CONVERSATION HISTORY SO FAR:
{history_text}

TARGET TOPICS TO COVER:
{suggested_topics}

INSTRUCTIONS FOR NEXT QUESTION:
1. Evaluate the candidate's last answer. If the answer was vague, buzzword-heavy, or lacked depth, probe directly into the concrete specifics, numbers, or edge cases.
2. If the last answer was thorough, smoothly transition into the next relevant technical area from the target topics.
3. Do not validate every answer with robotic praise like 'Great answer!' or 'That is awesome!'. Transition directly into the question.
4. Keep the question crisp and focused (1 to 2 sentences maximum).
5. Output ONLY the question text. Strictly no emojis.
"""
        if not self.client:
            last_answer = (history[-1].get("candidate_transcript") or "") if history else ""
            if len(last_answer.split()) < 15:
                return "Could you elaborate on the specific technical implementation details and trade-offs you encountered there?"
            return f"Understood. Moving forward to another critical aspect of {job_title}: how do you approach reliability, automated testing, and handling failure modes in distributed environments?"

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.35)
            )
            return response.text.strip().replace('"', '')
        except Exception as e:
            logger.error(f"Failed to generate next turn question: {e}")
            return "How would you handle sudden scalability bottlenecks or database contention in that scenario?"
