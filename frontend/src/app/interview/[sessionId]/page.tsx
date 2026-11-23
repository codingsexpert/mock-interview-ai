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
  ChevronDown,
  Clock,
  Sparkles,
  Edit3
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
  const [isManualEditing, setIsManualEditing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize and load active session details
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
        // Handled gracefully
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
      setIsManualEditing(true);
      setErrorMsg("Voice recognition not supported in this browser. Please type below.");
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
          setIsManualEditing(true);
        }
      };

      rec.onend = () => setIsRecording(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsRecording(false);
      setIsManualEditing(true);
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
      setErrorMsg("Please speak or type your answer before submitting.");
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
    <div className="max-w-3xl mx-auto w-full py-4 space-y-8">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      {/* Top Session Status Bar */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-zinc-950 text-white text-[11px] font-semibold uppercase tracking-wider">
            Inquiry {currentTurn} of {maxTurns}
          </span>
          <span className="text-xs text-zinc-400 font-medium">Technical Deep Dive</span>
        </div>

        <button
          type="button"
          onClick={handleEndEarly}
          disabled={isSubmitting}
          className="text-xs font-semibold text-zinc-400 hover:text-zinc-950 transition uppercase tracking-wider"
        >
          End & Review
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hero Voice Visualizer Stage */}
      <div className="premium-card rounded-3xl p-10 text-center relative overflow-hidden flex flex-col items-center justify-center space-y-6">
        {/* Subtle Radial Glow */}
        <div className="absolute inset-0 bg-radial from-zinc-100/50 to-transparent pointer-events-none" />

        {/* Concentric Voice Orb */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
              isPlayingAudio
                ? "bg-zinc-950 text-white shadow-2xl scale-105"
                : isRecording
                ? "bg-emerald-600 text-white shadow-xl scale-105"
                : "bg-zinc-100 text-zinc-400 border border-zinc-200/80"
            }`}
          >
            {isPlayingAudio ? (
              <Volume2 className="w-8 h-8 animate-pulse" />
            ) : isRecording ? (
              <Mic className="w-8 h-8 animate-pulse" />
            ) : (
              <VolumeX className="w-7 h-7" />
            )}
          </div>

          {/* Animated concentric pulse ring when active */}
          {(isPlayingAudio || isRecording) && (
            <div className="absolute inset-0 rounded-full border border-zinc-950/20 animate-pulse-ring pointer-events-none" />
          )}
        </div>

        {/* Visualizer Status Label */}
        <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          {isPlayingAudio ? "Interviewer Inquiring" : isRecording ? "Listening to Response" : "Awaiting Candidate"}
        </div>

        {/* Teleprompter Question Heading */}
        <div className="max-w-xl mx-auto pt-2">
          <h2 className="text-xl md:text-2xl font-semibold text-zinc-950 tracking-tight leading-snug">
            {currentQuestion || "Formulating technical question..."}
          </h2>
        </div>
      </div>

      {/* Candidate Response Capture Card */}
      <div className="premium-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>Candidate Response</span>
            {isRecording && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 font-normal">
              {spokenTranscript.split(/\s+/).filter(Boolean).length} words
            </span>
            <button
              type="button"
              onClick={() => setIsManualEditing(!isManualEditing)}
              className="text-zinc-400 hover:text-zinc-700 transition"
              title="Toggle manual text edit"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <textarea
          rows={4}
          value={spokenTranscript}
          onChange={(e) => setSpokenTranscript(e.target.value)}
          placeholder="Click the microphone to speak your response, or type manually..."
          className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition leading-relaxed bg-zinc-50/40 resize-none"
        />

        {/* Floating Controls Dock */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleToggleMic}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 border shadow-sm ${
              isRecording
                ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isRecording ? "Stop Speaking" : "Start Speaking"}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !spokenTranscript.trim()}
            className="px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium uppercase tracking-wider transition flex items-center gap-2 shadow-md disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <span>Submit Answer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible History Drawer */}
      {history.length > 0 && (
        <div className="premium-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full p-4 flex items-center justify-between text-xs text-zinc-600 hover:bg-zinc-50 transition"
          >
            <span className="flex items-center gap-2 font-semibold">
              <History className="w-4 h-4 text-zinc-400" />
              <span>Interview Timeline ({history.length} completed turns)</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>

          {showHistory && (
            <div className="p-4 border-t border-zinc-100 space-y-3 max-h-64 overflow-y-auto text-xs">
              {history.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1.5">
                  <div className="font-semibold text-zinc-900">Q{item.turn_number}: {item.question}</div>
                  <div className="text-zinc-600 pl-2.5 border-l-2 border-zinc-300">{item.answer}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
