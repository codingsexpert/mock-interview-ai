import io
import re
from pypdf import PdfReader

class ResumeParserService:
    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        text = re.sub(r"\r\n|\r", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @classmethod
    def extract_text_from_pdf(cls, file_bytes: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            extracted_pages = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_pages.append(page_text)
            full_text = "\n\n".join(extracted_pages)
            return cls.clean_text(full_text)
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")
