# System Architecture

## Overview
Mock Interview AI is a voice-first interview simulation platform combining Google Gemini, Murf.ai, and Supabase to deliver realistic, candidate-tailored mock interviews.

## Directory Responsibilities

- `backend/app/api/`: REST and WebSocket route controllers.
- `backend/app/core/`: Configuration, security, and environment settings.
- `backend/app/schemas/`: Pydantic models for request/response serialization.
- `backend/app/services/`: External integrations (Gemini, Murf.ai, STT, Resume Parsing).
- `frontend/`: Next.js client application (App Router, Tailwind CSS, Lucide icons).
- `supabase/migrations/`: Database schema, indexes, and storage security policies.
- `docs/`: Technical specifications and architectural diagrams.
