"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowRight,
  Square,
  AlertCircle,
  Loader2,
  History,
  Check,
  ChevronDown
} from "lucide-react";

interface TurnHistoryItem {
  turn_number: number;
  question: string;
  answer?: string;
}

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [maxTurns] = useState<number>(5);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [history, setHistory] = useState<TurnHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize and load session question
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/interview/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.question_text) {
            setCurrentQuestion(data.question_text);
            setCurrentTurn(data.current_turn || 1);
            if (data.audio_url) {
              setAudioUrl(data.audio_url);
            }
            if (data.history && data.history.length > 0) {
              setHistory(data.history);
            }
          }
        }
      } catch {
        // Fallback handled gracefully
      }
    }
    fetchSession();
  }, [sessionId]);

  // Audio playback handler
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => setIsPlayingAudio(false));
      setIsPlayingAudio(true);
    }
  }, [audioUrl]);

  // Web Speech API
  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg("Voice input not supported in this browser. Please type below.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setErrorMsg(null);
      };

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        setSpokenTranscript(transcript.trim());
      };

      rec.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error !== "no-speech") {
          setErrorMsg(`Mic note: ${event.error}. You can also type manually.`);
        }
      };

      rec.onend = () => setIsRecording(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsRecording(false);
      setErrorMsg("Unable to access microphone.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleMic = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handleSubmit = async () => {
    if (!spokenTranscript.trim()) {
      setErrorMsg("Please speak or enter your answer.");
      return;
    }

    stopRecording();
    setIsSubmitting(true);
    setErrorMsg(null);

    const answeredTurn = currentTurn;
    const answeredQuestion = currentQuestion;
    const submittedAnswer = spokenTranscript;

    try {
      const res = await fetch("http://localhost:8000/api/v1/interview/submit-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          candidate_transcript: submittedAnswer,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.error || "Turn submission failed.");
      }

      setHistory((prev) => [
        ...prev,
        {
          turn_number: answeredTurn,
          question: answeredQuestion,
          answer: submittedAnswer,
        },
      ]);

      setSpokenTranscript("");

      if (data.is_completed || !data.next_question) {
        router.push(`/interview/${sessionId}/report`);
      } else {
        setCurrentTurn(data.turn_number);
        setCurrentQuestion(data.next_question);
        if (data.audio_url) setAudioUrl(data.audio_url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndEarly = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`http://localhost:8000/api/v1/interview/${sessionId}/complete`, {
        method: "POST",
      });
    } finally {
      router.push(`/interview/${sessionId}/report`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-4 space-y-6">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      {/* Top Session Progress Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
            Phase {currentTurn} of {maxTurns}
          </span>
          <span className="text-zinc-200">•</span>
          <span className="text-xs text-zinc-500 font-medium">Technical Calibration</span>
        </div>

        <button
          type="button"
          onClick={handleEndEarly}
          disabled={isSubmitting}
          className="text-xs text-zinc-400 hover:text-zinc-950 transition"
        >
          End & Review
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Focus Audio & Teleprompter Card */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-sm text-center space-y-6">
        {/* Sleek Waveform / Voice Status */}
        <div className="flex items-center justify-center gap-2">
          {isPlayingAudio ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-950">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>Interviewer Speaking</span>
            </span>
          ) : isRecording ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Listening...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <VolumeX className="w-3.5 h-3.5" />
              <span>Ready for Answer</span>
            </span>
          )}
        </div>

        {/* Minimalist Sound Wave Indicator */}
        <div className="h-10 flex items-center justify-center gap-1">
          {[14, 26, 38, 18, 44, 28, 12, 36, 20, 48, 30, 16].map((h, i) => (
            <span
              key={i}
              style={{
                height: isPlayingAudio || isRecording ? `${h}px` : "4px",
                transition: "height 0.12s ease",
              }}
              className={`w-1 rounded-full ${
                isPlayingAudio ? "bg-zinc-950" : isRecording ? "bg-emerald-500" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>

        {/* Question Heading */}
        <h2 className="text-lg md:text-xl font-medium text-zinc-950 tracking-tight leading-relaxed max-w-xl mx-auto">
          {currentQuestion || "Preparing interview question..."}
        </h2>
      </div>

      {/* Real-time Subtitle / Spoken Transcript Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
          <span>Candidate Response</span>
          <span>{spokenTranscript.split(/\s+/).filter(Boolean).length} words</span>
        </div>

        <textarea
          rows={3}
          value={spokenTranscript}
          onChange={(e) => setSpokenTranscript(e.target.value)}
          placeholder="Speak into your microphone or type your response here..."
          className="w-full text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed bg-transparent"
        />

        {/* Floating Minimal Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={handleToggleMic}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
              isRecording
                ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isRecording ? "Stop" : "Mic"}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !spokenTranscript.trim()}
            className="px-4 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <span>Submit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible History Drawer */}
      {history.length > 0 && (
        <div className="border border-zinc-200/70 rounded-xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-zinc-500 hover:bg-zinc-50 transition"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <History className="w-3.5 h-3.5" />
              <span>Transcript Timeline ({history.length})</span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>

          {showHistory && (
            <div className="p-4 border-t border-zinc-100 space-y-3 max-h-60 overflow-y-auto text-xs">
              {history.map((item, idx) => (
                <div key={idx} className="space-y-1 pb-2 border-b border-zinc-50 last:border-none">
                  <div className="font-semibold text-zinc-800">Q{item.turn_number}: {item.question}</div>
                  <div className="text-zinc-600 pl-2 border-l border-zinc-200">{item.answer}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
