# AI Mock Interview Platform

An enterprise-ready, conversational AI mock interview platform that simulates realistic technical and hiring manager interviews tailored directly to candidate resumes and target job roles.

Built with a ChatGPT-style hands-free voice conversational loop, real-time speech synthesis (Murf.ai), browser speech recognition (Web Speech API), Google Gemini intelligence, and comprehensive rubric-based candidate evaluations.

---

## Key Features

- **Automated Resume Ingestion & Parsing**: Extracts raw text from candidate PDF or pasted resumes using PyPDF and normalizes experience, detected skills, and seniority.
- **Role Calibration Pipeline**: Analyzes candidate background against the specified job title to formulate target engineering competencies and a 10-question inquiry curriculum.
- **ChatGPT Voice Mode (Hands-Free Loop)**:
  - **Zero Click Flow**: The AI speaks the technical inquiry using Murf.ai TTS. When the audio finishes, the microphone activates automatically.
  - **Voice Activity & Silence Detection**: Speech is transcribed live in real time. Detecting 1.8 seconds of natural pause automatically submits the candidate answer and triggers the next inquiry.
  - **Living Fluid Voice Orb**: Central dynamic morphing orb featuring multi-gradient auroras, acoustic reactive ripples, and soundwave equalizer bars reflecting interview states (AI Speaking, Candidate Listening, AI Evaluating).
- **10-Question Flexible Rounds**: Candidates complete an initial 10-question evaluation block, with the option to continue for additional rounds (+10 questions) or conclude anytime.
- **Comprehensive Rubric Evaluation**: Generates a standardized assessment scorecard across 4 weighted competency categories:
  - Technical Depth & Architecture (35%)
  - Communication Clarity & Structure (25%)
  - Problem Solving & Analytical Thinking (25%)
  - Past Experience & Role Alignment (15%)
- **Turn-by-Turn Critique & Model Answers**: Detailed analysis of each turn, contrasting candidate responses with expected technical concepts.
- **Export & Sharing**: One-click Markdown scorecard download, clipboard summary copy, and formatted PDF print layout.

---

## System Architecture

```text
                               +----------------------------------+
                               |     Next.js 14 Web Frontend      |
                               |  - Living Fluid Voice Orb        |
                               |  - Web Speech API (STT)          |
                               |  - Multi-Gradient Glass UI       |
                               +----------------+-----------------+
                                                |
                                        REST / WebSocket
                                                |
                                                v
                               +----------------------------------+
                               |        FastAPI Core Backend      |
                               |  - Turn & Round Orchestrator     |
                               |  - In-Memory / Supabase Store    |
                               +--------+----------------+--------+
                                        |                |
                     +------------------+                +------------------+
                     v                                                      v
      +------------------------------+                       +------------------------------+
      |      Google Gemini API       |                       |       Murf.ai TTS API        |
      | - Resume Analysis            |                       | - Falcon / Cooper Voice      |
      | - Adaptive Interviewer       |                       | - High-Fidelity Audio Gen    |
      | - Evaluation & Scorecard     |                       | - S3 Audio CDN Deliveries    |
      +------------------------------+                       +------------------------------+
```

---

## Directory Layout

```text
.
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/       # Health, Resume, Voice, and Interview routes
│   │   ├── core/                   # App config, security, and Supabase client
│   │   ├── schemas/                # Pydantic v2 schemas for requests & responses
│   │   ├── services/               # Gemini, Murf.ai, Resume Parser, Evaluator
│   │   └── main.py                 # FastAPI application factory
│   ├── tests/                      # Automated unit test suite
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── interview/[sessionId]/
│   │   │   │   ├── page.tsx        # ChatGPT-style hands-free voice room
│   │   │   │   └── report/page.tsx # Evaluation scorecard & export
│   │   │   ├── globals.css         # Orb keyframes, ripples, and gradients
│   │   │   ├── layout.tsx          # Root layout and ambient glow
│   │   │   └── page.tsx            # Setup form, calibration, and greenroom
│   │   └── types/                  # TypeScript interface definitions
│   ├── package.json
│   └── tailwind.config.ts
├── supabase/
│   └── migrations/                 # PostgreSQL schema, RLS, and storage buckets
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Google Gemini API Key
- Murf.ai API Key
- Supabase Project (Optional for cloud persistence)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY, MURF_API_KEY, and SUPABASE credentials

# Run FastAPI server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be available at: `http://localhost:8000`  
Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## Running the Automated Test Suite

Run the full backend and schema test suite:

```bash
# Run interview engine tests
PYTHONPATH=backend python3 backend/tests/test_interview_service.py

# Run resume parser tests
PYTHONPATH=backend python3 backend/tests/test_resume_service.py

# Run SQL schema syntax validation
PYTHONPATH=backend python3 backend/tests/test_sql_schema.py
```

Run zero emoji compliance check:

```bash
python3 -c '
import os, sys, re
emoji_regex = re.compile("[\U00010000-\U0010ffff]", flags=re.UNICODE)
count = 0
for root, dirs, files in os.walk("."):
    if any(x in root for x in [".git", "node_modules", ".next", "venv", ".gemini", "__pycache__"]):
        continue
    for f in files:
        if f.endswith((".ts", ".tsx", ".py", ".sql", ".css", ".md")):
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8", errors="ignore") as fp:
                for idx, line in enumerate(fp, 1):
                    emojis = emoji_regex.findall(line)
                    if emojis:
                        print(f"{p}:{idx} found {emojis}")
                        count += len(emojis)
print(f"Total emojis found: {count}")
assert count == 0, "Emoji violation detected"
'
```

---

## API Endpoints Reference

### Resume Analysis
- `POST /api/v1/resume/analyze`: Parses PDF or raw text, identifies years of experience, primary skills, and suggested questions.

### Voice Synthesis
- `POST /api/v1/voice/synthesize`: Synthesizes arbitrary text using Murf.ai GEN2 engine.
- `GET /api/v1/voice/voices`: Lists recommended realistic interviewer voices.

### Interview Session
- `POST /api/v1/interview/start`: Initializes session, generates customized opening question, and produces Murf.ai audio.
- `POST /api/v1/interview/submit-turn`: Evaluates candidate response and generates adaptive follow-up inquiry with audio.
- `POST /api/v1/interview/extend`: Extends session by an additional 10 questions.
- `GET /api/v1/interview/{session_id}`: Retrieves current session state, active question, and turn history.
- `POST /api/v1/interview/{session_id}/complete`: Compiles session evaluation report and final scorecard.
- `GET /api/v1/interview/{session_id}/report`: Retrieves complete scorecard report.
- `WS /api/v1/interview/ws/{session_id}`: WebSocket connection for low-latency bidirectional turn streaming.

---

## License

MIT License. Designed and engineered for realistic, hands-free technical interview preparation.
