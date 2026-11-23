"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Square,
  AlertCircle,
  Loader2,
  History,
  CheckCircle,
  CornerDownLeft,
  Award
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize and load report or first question
  useEffect(() => {
    async function fetchSessionInfo() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/interview/${sessionId}/report`);
        if (res.ok) {
          const data = await res.json();
          if (data.report && data.report.question_breakdown.length > 0) {
            const firstQ = data.report.question_breakdown[0].question;
            setCurrentQuestion(firstQ);
          }
        }
      } catch {
        // Handled silently
      }
    }
    fetchSessionInfo();
  }, [sessionId]);

  // Audio playback handler
  useEffect(() => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {
          setIsPlayingAudio(false);
        });
        setIsPlayingAudio(true);
      }
    }
  }, [audioUrl]);

  // Setup Web Speech API for candidate speech transcription
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg("Web Speech API is not supported in this browser. You can type your answer below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + " ";
        }
        setSpokenTranscript(currentText.trim());
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error !== "no-speech") {
          setErrorMsg(`Microphone input notice: ${event.error}. You can also type manually.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setIsRecording(false);
      setErrorMsg("Could not access microphone. Please verify browser permissions.");
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!spokenTranscript.trim()) {
      setErrorMsg("Please provide your answer by speaking or typing before submitting.");
      return;
    }

    stopSpeechRecognition();
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
        throw new Error(data.detail || data.error || "Failed to submit turn.");
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
        // Complete interview and navigate to scorecard
        router.push(`/interview/${sessionId}/report`);
      } else {
        setCurrentTurn(data.turn_number);
        setCurrentQuestion(data.next_question);
        if (data.audio_url) {
          setAudioUrl(data.audio_url);
        }
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
      router.push(`/interview/${sessionId}/report`);
    } catch {
      router.push(`/interview/${sessionId}/report`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-900 text-white">
            Question {currentTurn} of {maxTurns}
          </span>
          <span className="text-xs text-zinc-500">Live Interview Session</span>
        </div>
        <button
          type="button"
          onClick={handleEndEarly}
          disabled={isSubmitting}
          className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition"
        >
          End Interview & View Report
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Question & Waveform Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm text-center space-y-6">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase text-zinc-500">
          {isPlayingAudio ? (
            <span className="inline-flex items-center gap-1.5 text-zinc-950 font-medium">
              <Volume2 className="w-4 h-4 text-zinc-900 animate-pulse" />
              Interviewer Speaking
            </span>
          ) : isRecording ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <Mic className="w-4 h-4 text-emerald-600 animate-pulse" />
              Listening to Candidate...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-zinc-500">
              <VolumeX className="w-4 h-4" />
              Awaiting Candidate Answer
            </span>
          )}
        </div>

        {/* Minimalist Audio Waveform Simulation */}
        <div className="h-14 flex items-center justify-center gap-1.5">
          {[12, 28, 48, 20, 56, 32, 16, 44, 24, 60, 36, 18, 40, 22].map((height, i) => (
            <span
              key={i}
              style={{
                height: isPlayingAudio || isRecording ? `${height}px` : "6px",
                transition: "height 0.15s ease",
              }}
              className={`w-1 rounded-full ${
                isPlayingAudio
                  ? "bg-zinc-900"
                  : isRecording
                  ? "bg-emerald-600"
                  : "bg-zinc-200"
              }`}
            />
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-zinc-950 tracking-tight leading-snug">
            {currentQuestion || "Preparing initial interview question..."}
          </h2>
        </div>
      </div>

      {/* Response Capture Area */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
            <span>Your Spoken or Typed Answer</span>
            {isRecording && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </label>
          <span className="text-xs text-zinc-400">
            {spokenTranscript.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        <textarea
          rows={5}
          value={spokenTranscript}
          onChange={(e) => setSpokenTranscript(e.target.value)}
          placeholder="Click Start Speaking to talk into your microphone, or type your answer here..."
          className="w-full px-4 py-3 rounded-xl border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition leading-relaxed"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleToggleRecording}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition flex items-center gap-2 ${
              isRecording
                ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                : "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-current text-red-600" />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-zinc-700" />
                <span>Start Speaking (Microphone)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || !spokenTranscript.trim()}
            className="px-6 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Response...</span>
              </>
            ) : (
              <>
                <span>Submit Answer</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Turn History Drawer */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
            <History className="w-4 h-4 text-zinc-500" />
            <span>Interview Timeline ({history.length} completed turns)</span>
          </div>

          <div className="space-y-4">
            {history.map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-zinc-50/70 border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
                  <span>Turn {item.turn_number}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-zinc-900">{item.question}</p>
                <div className="text-xs text-zinc-600 bg-white p-3 rounded-md border border-zinc-200">
                  <span className="font-semibold text-zinc-700 block mb-0.5">Your Response:</span>
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
