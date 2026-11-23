from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
from app.schemas.resume import ResumeAnalysisRequest, ResumeAnalysisResponse, ResumeParsedData
from app.services.resume_parser import ResumeParserService
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/resume", tags=["Resume"])
gemini_service = GeminiService()

@router.post("/analyze-text", response_model=ResumeAnalysisResponse)
async def analyze_resume_text(payload: ResumeAnalysisRequest):
    try:
        parsed_data = gemini_service.analyze_resume_against_role(
            resume_text=payload.raw_text,
            job_title=payload.job_title,
            job_description=payload.job_description,
            experience_level=payload.experience_level
        )
        return ResumeAnalysisResponse(success=True, data=parsed_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume analysis failed: {str(e)}"
        )

@router.post("/upload-and-analyze", response_model=ResumeAnalysisResponse)
async def upload_and_analyze_resume(
    file: UploadFile = File(...),
    job_title: str = Form(...),
    job_description: Optional[str] = Form(None),
    experience_level: str = Form("mid")
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are currently supported"
        )
    try:
        content = await file.read()
        extracted_text = ResumeParserService.extract_text_from_pdf(content)
        if len(extracted_text) < 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extracted text from PDF is too short or empty"
            )

        parsed_data = gemini_service.analyze_resume_against_role(
            resume_text=extracted_text,
            job_title=job_title,
            job_description=job_description,
            experience_level=experience_level
        )
        return ResumeAnalysisResponse(success=True, data=parsed_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and analyze resume: {str(e)}"
        )
