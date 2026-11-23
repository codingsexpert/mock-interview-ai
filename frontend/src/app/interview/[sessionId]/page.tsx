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
  Sparkles,
  RefreshCw,
  PlusCircle,
  FileCheck2,
  Radio,
  Send
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
  const [maxTurns, setMaxTurns] = useState<number>(10);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [displayedQuestion, setDisplayedQuestion] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [roundCompleted, setRoundCompleted] = useState<boolean>(false);
  const [isExtending, setIsExtending] = useState<boolean>(false);

  const [history, setHistory] = useState<TurnHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamIntervalRef = useRef<any>(null);

  // Load session status
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/interview/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.question_text) {
            setCurrentQuestion(data.question_text);
            setCurrentTurn(data.current_turn || 1);
            if (data.max_turns) setMaxTurns(data.max_turns);
            if (data.audio_url) setAudioUrl(data.audio_url);
            if (data.history && data.history.length > 0) {
              setHistory(data.history);
            }
          }
        }
      } catch {
        // Handled silently
      }
    }
    fetchSession();
  }, [sessionId]);

  // Word-by-word streaming effect on question update
  useEffect(() => {
    if (!currentQuestion) return;

    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

    const words = currentQuestion.split(" ");
    let index = 0;
    setDisplayedQuestion("");

    streamIntervalRef.current = setInterval(() => {
      index++;
      if (index <= words.length) {
        setDisplayedQuestion(words.slice(0, index).join(" "));
      } else {
        clearInterval(streamIntervalRef.current);
      }
    }, 45);

    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [currentQuestion]);

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
      setErrorMsg("Browser voice recognition not supported. You can type your answer below.");
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
          setErrorMsg(`Microphone: ${event.error}. You can also type manually.`);
        }
      };

      rec.onend = () => setIsRecording(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsRecording(false);
      setErrorMsg("Could not access microphone.");
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
      setErrorMsg("Please speak or type your response before proceeding.");
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

      // Check if 10-question round completed
      if (data.round_completed) {
        setRoundCompleted(true);
      } else if (data.is_completed || !data.next_question) {
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

  const handleExtendRound = async () => {
    setIsExtending(true);
    setErrorMsg(null);

    try {
      const res = await fetch("http://localhost:8000/api/v1/interview/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          additional_turns: 10,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.error || "Failed to extend round.");
      }

      setMaxTurns(data.new_max_turns);
      setCurrentTurn(history.length + 1);
      setCurrentQuestion(data.next_question);
      if (data.audio_url) setAudioUrl(data.audio_url);
      setRoundCompleted(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not extend interview session.");
    } finally {
      setIsExtending(false);
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
    <div className="max-w-3xl mx-auto w-full py-4 space-y-6">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      {/* Top Status & Turn Segments */}
      <div className="glass-panel rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              Question {currentTurn} of {maxTurns}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: Math.min(10, maxTurns) }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-4 rounded-full transition-all duration-300 ${
                  i + 1 < currentTurn
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500"
                    : i + 1 === currentTurn
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 animate-pulse"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleEndEarly}
          disabled={isSubmitting}
          className="text-xs font-bold text-slate-500 hover:text-red-600 transition px-3 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200"
        >
          End & Get Scorecard
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Dynamic Voice Teleprompter Card */}
      <div className="glass-panel-elevated rounded-3xl p-8 text-center relative overflow-hidden flex flex-col items-center justify-center space-y-6">
        {/* Animated Multi-Gradient Glow Ring */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${
              isPlayingAudio
                ? "bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-indigo-500/40 scale-108 animate-pulse-ring-glow"
                : isRecording
                ? "bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-emerald-500/40 scale-108"
                : "bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-400 border border-slate-300"
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
        </div>

        {/* Dynamic Voice Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700">
          {isPlayingAudio ? (
            <span className="flex items-center gap-1.5 text-indigo-700">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span>Interviewer Speaking (Falcon Voice)</span>
            </span>
          ) : isRecording ? (
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>Listening to Candidate...</span>
            </span>
          ) : (
            <span>Ready for Response</span>
          )}
        </div>

        {/* Real-time Streaming Question Heading */}
        <div className="max-w-xl mx-auto pt-1">
          <h2 className="text-xl md:text-2xl font-bold text-slate-950 tracking-tight leading-snug">
            {displayedQuestion || "Formulating technical question..."}
            {displayedQuestion && displayedQuestion.length < currentQuestion.length && (
              <span className="streaming-cursor ml-1" />
            )}
          </h2>
        </div>
      </div>

      {/* Candidate Spoken Transcript & Controls */}
      <div className="glass-panel-elevated rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>Your Live Response</span>
            {isRecording && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold lowercase">
            {spokenTranscript.split(/\s+/).filter(Boolean).length} words spoken
          </span>
        </div>

        <textarea
          rows={4}
          value={spokenTranscript}
          onChange={(e) => setSpokenTranscript(e.target.value)}
          placeholder="Speak naturally into your microphone, or type your technical response here..."
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition leading-relaxed bg-white/70 resize-none shadow-xs"
        />

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleToggleMic}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm ${
              isRecording
                ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100 scale-102"
                : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
            }`}
          >
            {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{isRecording ? "Stop Recording" : "Start Speaking"}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !spokenTranscript.trim()}
            className="btn-gradient-primary px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-40 shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Response...</span>
              </>
            ) : (
              <>
                <span>Submit Answer</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 10-Question Round Completion Modal */}
      {roundCompleted && (
        <div className="glass-panel-elevated rounded-3xl p-8 text-center space-y-6 border-2 border-indigo-400 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-slate-950">
              Round Completed: {maxTurns} Questions Answered!
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have completed this 10-question evaluation block. You can either continue practicing with 10 more questions, or finish now to review your calibrated scorecard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExtendRound}
              disabled={isExtending}
              className="btn-gradient-primary w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {isExtending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading 10 Questions...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Continue (+10 More Questions)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleEndEarly}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Complete & View Scorecard</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Turn History Timeline */}
      {history.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-white/80 transition"
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Full Metadata Transcript Timeline ({history.length} turns recorded)</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>

          {showHistory && (
            <div className="p-4 border-t border-slate-100 space-y-3.5 max-h-72 overflow-y-auto text-xs">
              {history.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-600">
                    <span>Turn {item.turn_number}</span>
                    <span className="text-slate-400 font-normal">Logged with Falcon TTS</span>
                  </div>
                  <div className="font-bold text-slate-900">{item.question}</div>
                  <div className="text-slate-600 pl-3 border-l-2 border-indigo-500 bg-slate-50 p-2.5 rounded-md">
                    <span className="font-semibold text-slate-700 block mb-0.5">Candidate Response:</span>
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
