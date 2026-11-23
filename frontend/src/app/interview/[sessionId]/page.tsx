"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  AlertCircle,
  Loader2,
  History,
  Check,
  ChevronDown,
  Sparkles,
  PlusCircle,
  FileCheck2,
  Radio,
  Send,
  Keyboard,
  Play,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";

interface TurnHistoryItem {
  turn_number: number;
  question: string;
  answer?: string;
}

type ConversationState = "loading" | "ai_speaking" | "candidate_listening" | "evaluating" | "paused" | "round_complete";

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // Session metadata
  const [jobTitle, setJobTitle] = useState<string>("Target Role");
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [maxTurns, setMaxTurns] = useState<number>(10);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [displayedQuestion, setDisplayedQuestion] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Conversational state
  const [state, setState] = useState<ConversationState>("loading");
  const [handsFreeMode, setHandsFreeMode] = useState<boolean>(true);
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");
  const [showTextFallback, setShowTextFallback] = useState<boolean>(false);
  const [audioBlocked, setAudioBlocked] = useState<boolean>(false);
  const [silenceDetected, setSilenceDetected] = useState<boolean>(false);
  const [isExtending, setIsExtending] = useState<boolean>(false);

  // Metadata transcript history
  const [history, setHistory] = useState<TurnHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // References
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const streamIntervalRef = useRef<any>(null);
  const spokenTranscriptRef = useRef<string>("");

  // Keep ref synchronized for callbacks
  useEffect(() => {
    spokenTranscriptRef.current = spokenTranscript;
  }, [spokenTranscript]);

  // Submit response handler
  const handleTurnSubmit = useCallback(async (answerText?: string) => {
    const textToSubmit = (answerText !== undefined ? answerText : spokenTranscriptRef.current).trim();
    if (!textToSubmit) return;

    // Clear recognition and silence timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setSilenceDetected(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition already stopped
      }
    }

    setState("evaluating");
    setErrorMsg(null);

    const answeredTurn = currentTurn;
    const answeredQuestion = currentQuestion;

    try {
      const res = await fetch("http://localhost:8000/api/v1/interview/submit-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          candidate_transcript: textToSubmit,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.error || "Turn evaluation failed.");
      }

      setHistory((prev) => [
        ...prev,
        {
          turn_number: answeredTurn,
          question: answeredQuestion,
          answer: textToSubmit,
        },
      ]);

      setSpokenTranscript("");
      spokenTranscriptRef.current = "";

      if (data.round_completed) {
        setState("round_complete");
      } else if (data.is_completed || !data.next_question) {
        router.push(`/interview/${sessionId}/report`);
      } else {
        setCurrentTurn(data.turn_number);
        setCurrentQuestion(data.next_question);
        if (data.audio_url) {
          setAudioUrl(data.audio_url);
        } else {
          // If no audio returned, transition directly to listening
          setState("candidate_listening");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not process answer. You can retry speaking.");
      setState("candidate_listening");
    }
  }, [currentQuestion, currentTurn, sessionId, router]);

  // Initialize Speech Recognition
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg("Browser speech recognition is not supported in this browser. Please use text input.");
      setShowTextFallback(true);
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setState("candidate_listening");
        setErrorMsg(null);
        setSilenceDetected(false);
      };

      rec.onresult = (event: any) => {
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          interim += event.results[i][0].transcript + " ";
        }
        const clean = interim.trim();
        setSpokenTranscript(clean);

        // Hands-free Voice Activity Silence Detection
        const wordCount = clean.split(/\s+/).filter(Boolean).length;
        if (wordCount >= 3) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          setSilenceDetected(true);

          silenceTimerRef.current = setTimeout(() => {
            // Auto submit after 1.8 seconds of silence
            handleTurnSubmit(clean);
          }, 1800);
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          setErrorMsg(`Microphone notice: ${event.error}. You can also type manually.`);
        }
      };

      rec.onend = () => {
        // If still in listening state and in hands-free mode, restart recognition
        if (state === "candidate_listening" && handsFreeMode) {
          try {
            rec.start();
          } catch {
            // Handled
          }
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setErrorMsg("Unable to access microphone. Please check browser permissions.");
    }
  }, [handleTurnSubmit, handsFreeMode, state]);

  // Load session from backend
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/interview/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.question_text) {
            setJobTitle(data.job_title || "Target Role");
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
        setErrorMsg("Failed to connect to interview session.");
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
    }, 40);

    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [currentQuestion]);

  // Audio playback handler
  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    setState("ai_speaking");
    audioRef.current.src = audioUrl;

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setAudioBlocked(false);
        })
        .catch(() => {
          // Browser prevented autoplay without prior user interaction
          setAudioBlocked(true);
        });
    }
  }, [audioUrl]);

  // Audio onEnded event: Seamless transition to candidate listening
  const handleAudioEnded = () => {
    if (handsFreeMode) {
      startListening();
    } else {
      setState("paused");
    }
  };

  // Keyboard shortcut listener (Spacebar for Done Speaking)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && state === "candidate_listening" && spokenTranscript.trim()) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          handleTurnSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, spokenTranscript, handleTurnSubmit]);

  // Extend 10 more questions
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
      setState("ai_speaking");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not extend interview session.");
    } finally {
      setIsExtending(false);
    }
  };

  const handleEndEarly = async () => {
    setState("evaluating");
    try {
      await fetch(`http://localhost:8000/api/v1/interview/${sessionId}/complete`, {
        method: "POST",
      });
    } finally {
      router.push(`/interview/${sessionId}/report`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-4 space-y-6">
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        className="hidden"
      />

      {/* Top Session Ribbon & Progress */}
      <div className="glass-panel rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              {jobTitle}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-md">
              Question {currentTurn} of {maxTurns}
            </span>
            <div className="flex items-center gap-1 ml-1">
              {Array.from({ length: Math.min(10, maxTurns) }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-3.5 rounded-full transition-all duration-300 ${
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
        </div>

        <div className="flex items-center gap-2">
          {/* Hands-Free Voice Mode Pill */}
          <button
            type="button"
            onClick={() => setHandsFreeMode(!handsFreeMode)}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition ${
              handsFreeMode
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-slate-100 border-slate-300 text-slate-600"
            }`}
          >
            <Radio className={`w-3 h-3 ${handsFreeMode ? "animate-pulse text-emerald-600" : "text-slate-400"}`} />
            <span>{handsFreeMode ? "Hands-Free Auto Mode" : "Manual Click Mode"}</span>
          </button>

          <button
            type="button"
            onClick={handleEndEarly}
            disabled={state === "evaluating"}
            className="text-xs font-bold text-slate-500 hover:text-red-600 transition px-3 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200"
          >
            End & Scorecard
          </button>
        </div>
      </div>

      {/* Autoplay block banner */}
      {audioBlocked && (
        <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/80 text-indigo-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-indigo-600 shrink-0 animate-bounce" />
            <span className="font-semibold">Click to activate audio output and enter live voice session</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.play().then(() => setAudioBlocked(false));
              }
            }}
            className="btn-gradient-primary px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Enable Audio</span>
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Main Living Voice Room Experience */}
      <div className="glass-panel-elevated rounded-3xl p-8 md:p-12 text-center relative overflow-hidden flex flex-col items-center justify-center space-y-8 min-h-[460px]">
        {/* Living Voice Orb Container with Layered Auroras */}
        <div className="relative flex items-center justify-center my-4">
          {/* Subtle Outer Ripple Ring */}
          {(state === "ai_speaking" || state === "candidate_listening") && (
            <div
              className={`absolute w-44 h-44 rounded-full voice-ripple ${
                state === "ai_speaking"
                  ? "bg-indigo-500/20"
                  : "bg-emerald-500/20"
              }`}
            />
          )}

          {/* Dynamic Living Orb */}
          <div
            className={`w-32 h-32 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-2xl relative z-10 cursor-pointer ${
              state === "ai_speaking"
                ? "voice-orb-living shadow-indigo-500/50 scale-105"
                : state === "candidate_listening"
                ? "voice-orb-listening shadow-emerald-500/50 scale-105"
                : state === "evaluating"
                ? "voice-orb-thinking shadow-amber-500/40 animate-spin"
                : "bg-gradient-to-tr from-slate-200 to-slate-300 text-slate-500 border border-slate-300"
            }`}
            onClick={() => {
              if (state === "candidate_listening") {
                handleTurnSubmit();
              } else if (state === "paused") {
                startListening();
              }
            }}
          >
            {state === "ai_speaking" ? (
              <div className="flex items-center gap-1 text-white">
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
                <span className="equalizer-bar" />
              </div>
            ) : state === "candidate_listening" ? (
              <div className="flex flex-col items-center justify-center text-white gap-1">
                <Mic className="w-8 h-8 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-90">
                  Listening
                </span>
              </div>
            ) : state === "evaluating" ? (
              <Sparkles className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Play className="w-8 h-8 text-slate-600 fill-current ml-1" />
            )}
          </div>
        </div>

        {/* Dynamic Voice Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs">
          {state === "ai_speaking" ? (
            <span className="flex items-center gap-2 text-indigo-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
              <span>Interviewer Speaking (Voice: Falcon AI)</span>
            </span>
          ) : state === "candidate_listening" ? (
            <span className="flex items-center gap-2 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              <span>
                {silenceDetected ? "Auto-detecting pause..." : "Your Turn: Speak Freely"}
              </span>
            </span>
          ) : state === "evaluating" ? (
            <span className="flex items-center gap-2 text-amber-700">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing & Formulating Next Question...</span>
            </span>
          ) : (
            <span className="text-slate-600">Voice Session Paused</span>
          )}
        </div>

        {/* Streaming Question Subtitles */}
        <div className="max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
            Technical Inquiry
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-950 tracking-tight leading-snug">
            {displayedQuestion || "Preparing candidate question..."}
            {displayedQuestion && displayedQuestion.length < currentQuestion.length && (
              <span className="streaming-cursor ml-1" />
            )}
          </h2>
        </div>

        {/* Candidate Real-Time Spoken Response Stream */}
        {(state === "candidate_listening" || spokenTranscript) && (
          <div className="w-full max-w-xl mx-auto pt-2 animate-in fade-in duration-300">
            <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200/90 shadow-sm text-left space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Candidate Live Voice Stream</span>
                </span>
                <span className="text-slate-400 font-medium">
                  {spokenTranscript.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-normal min-h-[36px]">
                {spokenTranscript || (
                  <span className="text-slate-400 italic">
                    Start speaking your answer... pausing for 2 seconds will automatically submit.
                  </span>
                )}
              </p>

              {/* Action buttons inside live stream */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Tip: Press Spacebar or pause to submit
                </span>
                <button
                  type="button"
                  onClick={() => handleTurnSubmit()}
                  disabled={!spokenTranscript.trim() || state === "evaluating"}
                  className="btn-gradient-primary px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40 ml-auto shadow-xs"
                >
                  <span>Done Speaking</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Keyboard Fallback Accordion */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowTextFallback(!showTextFallback)}
            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition inline-flex items-center gap-1"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{showTextFallback ? "Hide Manual Text Input" : "Prefer typing? Open text input"}</span>
          </button>

          {showTextFallback && (
            <div className="mt-4 w-full max-w-xl mx-auto text-left space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in">
              <textarea
                rows={3}
                value={spokenTranscript}
                onChange={(e) => setSpokenTranscript(e.target.value)}
                placeholder="Type your technical response here..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleTurnSubmit()}
                  disabled={!spokenTranscript.trim() || state === "evaluating"}
                  className="btn-gradient-primary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40"
                >
                  <span>Submit Written Response</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 10-Question Round Completion Modal */}
      {state === "round_complete" && (
        <div className="glass-panel-elevated rounded-3xl p-8 text-center space-y-6 border-2 border-indigo-400 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-slate-950">
              Round Completed: {maxTurns} Questions Answered
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have completed this 10-question evaluation block. Continue practicing with 10 more adaptive questions, or view your calibrated evaluation scorecard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExtendRound}
              disabled={isExtending}
              className="btn-gradient-primary w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
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

      {/* Collapsible Full Transcript Timeline */}
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
                    <span className="text-slate-400 font-normal">Falcon Voice TTS</span>
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
