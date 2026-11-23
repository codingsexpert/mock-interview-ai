"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  ArrowRight,
  Loader2,
  Check,
  ChevronRight,
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  Brain,
  Volume2,
  X,
  Play
} from "lucide-react";
import { ExperienceLevel, ResumeParsedData } from "@/types";

export default function SetupPage() {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("mid");
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [resumeText, setResumeText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Calibration Loading Pipeline States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [parsedData, setParsedData] = useState<ResumeParsedData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMsg("Only PDF resume files are supported.");
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const runPipelineAnimation = () => {
    setPipelineStep(1);
    setProgressPercent(15);

    const t1 = setTimeout(() => {
      setPipelineStep(2);
      setProgressPercent(45);
    }, 700);

    const t2 = setTimeout(() => {
      setPipelineStep(3);
      setProgressPercent(75);
    }, 1500);

    const t3 = setTimeout(() => {
      setPipelineStep(4);
      setProgressPercent(95);
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handleAnalyze = async () => {
    if (!jobTitle.trim()) {
      setErrorMsg("Target job title is required.");
      return;
    }
    if (inputMode === "file" && !selectedFile) {
      setErrorMsg("Please upload your resume PDF.");
      return;
    }
    if (inputMode === "text" && !resumeText.trim()) {
      setErrorMsg("Please provide your resume text.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    const stopAnim = runPipelineAnimation();

    try {
      let res;
      if (inputMode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("job_title", jobTitle);
        formData.append("experience_level", experienceLevel);

        res = await fetch("http://localhost:8000/api/v1/resume/upload-and-analyze", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("http://localhost:8000/api/v1/resume/analyze-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raw_text: resumeText,
            job_title: jobTitle,
            experience_level: experienceLevel,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.error || "Analysis failed.");
      }

      setProgressPercent(100);
      setTimeout(() => {
        setParsedData(data.data);
        setIsAnalyzing(false);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze resume.");
      setIsAnalyzing(false);
    }
  };

  const handleLaunch = async () => {
    if (!parsedData) return;
    setIsStarting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("http://localhost:8000/api/v1/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          experience_level: experienceLevel,
          key_strengths: parsedData.key_strengths,
          suggested_topics: parsedData.suggested_topics,
          max_turns: 10,
          voice_id: "en-US-cooper",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.error || "Failed to start interview.");
      }

      router.push(`/interview/${data.session_id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not launch interview session.");
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Radiant Animated Hero Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-200/60 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
          <span className="text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent uppercase tracking-wider">
            Voice-First Assessment Studio
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
          Prepare for Your Next Technical Role
        </h1>
        <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Upload your resume to calibrate a live 10-question AI voice interview tailored to your actual engineering experience.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50/90 text-red-900 text-xs flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="flex-1 font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Dynamic State 1: Input Setup Form */}
      {!parsedData && !isAnalyzing && (
        <div className="glass-panel-elevated rounded-3xl p-8 space-y-6">
          {/* Target Role Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Target Job Role</span>
              </label>
              <span className="text-[11px] font-semibold text-indigo-600">Primary Calibration</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Senior Backend Engineer, Full Stack Architect, Staff DevOps"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition bg-slate-50/50 shadow-xs"
            />
          </div>

          {/* Seniority Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              <span>Target Seniority Level</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { id: "entry", title: "Entry", exp: "0 - 2 Yrs", color: "from-blue-500 to-indigo-500" },
                { id: "mid", title: "Mid", exp: "3 - 5 Yrs", color: "from-indigo-500 to-violet-500" },
                { id: "senior", title: "Senior", exp: "5 - 8 Yrs", color: "from-violet-500 to-purple-600" },
                { id: "lead", title: "Lead / Staff", exp: "8+ Yrs", color: "from-purple-600 to-cyan-500" },
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setExperienceLevel(tier.id as ExperienceLevel)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    experienceLevel === tier.id
                      ? "bg-slate-950 text-white border-slate-950 shadow-md scale-102 ring-2 ring-indigo-500/40"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-bold">{tier.title}</span>
                  <span className={`text-[10px] mt-1 font-medium ${experienceLevel === tier.id ? "text-indigo-300" : "text-slate-400"}`}>
                    {tier.exp}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resume Upload Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                <span>Candidate Resume</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`px-3 py-1 rounded-lg transition font-semibold ${
                    inputMode === "file"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  PDF Document
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("text")}
                  className={`px-3 py-1 rounded-lg transition font-semibold ${
                    inputMode === "text"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Raw Text
                </button>
              </div>
            </div>

            {inputMode === "file" ? (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-7 text-center transition-all bg-gradient-to-b from-white to-slate-50/50 group">
                <input
                  type="file"
                  id="resume-drop"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">{selectedFile.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB PDF Ready</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="resume-drop"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2 py-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-50 via-purple-50 to-cyan-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-108 transition-transform">
                      <Upload className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      Drag & drop your resume PDF, or <span className="text-indigo-600 underline underline-offset-2">browse</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">PDF documents up to 10MB</div>
                  </label>
                )}
              </div>
            ) : (
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your past technical experience, systems built, and core competencies..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition bg-slate-50/50 resize-none"
              />
            )}
          </div>

          {/* Animated Multi-Gradient Submit Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAnalyze}
              className="btn-gradient-primary w-full py-4 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-lg"
            >
              <span>Calibrate Assessment Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic State 2: Interactive Real-time Extraction Animation */}
      {isAnalyzing && (
        <div className="glass-panel-elevated rounded-3xl p-8 space-y-6 text-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25 animate-pulse">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-950">Calibrating Technical Rubric</h3>
            <p className="text-xs text-slate-500">Processing resume semantics against {jobTitle} benchmark...</p>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Calibration Progress</span>
              <span className="text-indigo-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Multi-Step Pipeline Visualizer */}
          <div className="space-y-3 pt-2 text-left">
            {[
              { step: 1, label: "Extracting resume text & document structure...", icon: FileText },
              { step: 2, label: "Synthesizing candidate skills & architecture background...", icon: Cpu },
              { step: 3, label: `Aligning profile with ${jobTitle} (${experienceLevel}) expectations...`, icon: Briefcase },
              { step: 4, label: "Initializing 10-Question assessment engine & Murf voice synthesizer...", icon: Volume2 },
            ].map((st) => (
              <div
                key={st.step}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                  pipelineStep > st.step
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : pipelineStep === st.step
                    ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs"
                    : "bg-slate-50/50 border-slate-200/60 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <st.icon className={`w-4 h-4 ${pipelineStep >= st.step ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className="text-xs font-semibold">{st.label}</span>
                </div>
                {pipelineStep > st.step ? (
                  <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                ) : pipelineStep === st.step ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic State 3: Assessment Readiness Card */}
      {parsedData && !isAnalyzing && (
        <div className="glass-panel-elevated rounded-3xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 uppercase tracking-wider shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>10-Question Technical Round Ready</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-950 mt-2">
                {parsedData.candidate_name}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Targeting <span className="font-bold text-slate-800">{jobTitle}</span> ({experienceLevel} level) • ~{parsedData.total_experience_years} Years Experience
              </p>
            </div>
            <button
              type="button"
              onClick={() => setParsedData(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-900 transition"
            >
              Modify
            </button>
          </div>

          {/* Detected Competencies */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5">
              Assessed Engineering Competencies
            </span>
            <div className="flex flex-wrap gap-2">
              {parsedData.key_strengths.map((str, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-900 shadow-xs"
                >
                  {str}
                </span>
              ))}
            </div>
          </div>

          {/* 10-Question Round Curriculum Focus */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5">
              Round Focus Curriculum
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {parsedData.suggested_topics.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs flex items-center justify-between shadow-xs"
                >
                  <span className="font-bold text-slate-900">{item.topic}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider">
                    {item.difficulty}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Start Mock Interview Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isStarting}
              className="btn-gradient-primary w-full py-4 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Live Murf Voice Engine...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Mock Interview (10 Questions)</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
