# Mock Interview AI Platform

An enterprise-ready AI mock interview platform that simulates realistic technical and behavioral interviews tailored to candidate resumes and target job roles.

## System Architecture

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI (Python), WebSockets, Pydantic v2
- **Database & Storage**: Supabase (PostgreSQL, Storage, Auth)
- **Voice Pipeline**: Murf.ai (TTS) & Speech-to-Text Engine
- **Intelligence**: Google Gemini API (Resume Analysis, Dynamic Questioning, Evaluation)

## Project Structure

```text
.
├── backend/            # FastAPI application, services, and WebSocket handlers
├── frontend/           # Next.js client, interview room UI, and audio capture
├── supabase/           # Database migrations, schema definitions, and seed data
└── docs/               # System architecture and API documentation
```

## Development Roadmap

- [ ] Phase 1: Database Schema & Supabase Configuration
- [ ] Phase 2: FastAPI Backend Setup & Google Gemini Integration
- [ ] Phase 3: Resume Ingestion & Role Analysis Service
- [ ] Phase 4: Murf.ai Voice Synthesis & STT Audio Pipeline
- [ ] Phase 5: Next.js Clean Light-Theme UI & Audio Recording
- [ ] Phase 6: Real-Time Interview Room (WebSocket)
- [ ] Phase 7: Scorecard Generation & Comprehensive Feedback
- [ ] Phase 8: End-to-End Testing & Deployment
