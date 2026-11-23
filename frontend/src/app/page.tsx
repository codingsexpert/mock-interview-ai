"use client";

import React, { useState } from "react";
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
  SlidersHorizontal,
  X
} from "lucide-react";
import { ExperienceLevel, ResumeParsedData } from "@/types";

export default function SetupPage() {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("mid");
  const [inputMode, setInputMode] = useState<"file" | "text">("file");
  const [resumeText, setResumeText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
        throw new Error(data.detail || data.error || "Resume analysis failed.");
      }

      setParsedData(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze resume.");
    } finally {
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
          max_turns: 5,
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
      {/* Editorial Header */}
      <div className="text-center mb-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/60 text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-1 shadow-sm">
          <span>AI Interview Simulation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-950">
          Technical Assessment Studio
        </h1>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Calibrate realistic hiring inquiries tailored specifically to your resume.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-xl border border-red-200 bg-red-50/80 text-red-900 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="flex-1 font-medium">{errorMsg}</span>
        </div>
      )}

      {!parsedData ? (
        <div className="premium-card rounded-3xl p-8 space-y-6">
          {/* Target Role Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                <span>Target Job Title</span>
              </label>
              <span className="text-[11px] text-zinc-400">Required</span>
            </div>
            <input
              type="text"
              placeholder="e.g. Senior Backend Engineer, Staff DevOps, Full Stack Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition bg-zinc-50/40"
            />
          </div>

          {/* Interactive Seniority Grid */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>Seniority Calibration</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { id: "entry", title: "Entry", desc: "0 - 2 Years" },
                { id: "mid", title: "Mid", desc: "3 - 5 Years" },
                { id: "senior", title: "Senior", desc: "5 - 8 Years" },
                { id: "lead", title: "Lead / Staff", desc: "8+ Years" },
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setExperienceLevel(tier.id as ExperienceLevel)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    experienceLevel === tier.id
                      ? "bg-zinc-950 text-white border-zinc-950 shadow-md"
                      : "bg-white text-zinc-800 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-xs font-semibold">{tier.title}</span>
                  <span
                    className={`text-[10px] mt-1 ${
                      experienceLevel === tier.id ? "text-zinc-400" : "text-zinc-400"
                    }`}
                  >
                    {tier.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resume Upload Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span>Resume Background</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    inputMode === "file"
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  PDF Document
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("text")}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    inputMode === "text"
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Raw Text
                </button>
              </div>
            </div>

            {inputMode === "file" ? (
              <div className="relative border border-dashed border-zinc-200 rounded-2xl p-6 text-center hover:border-zinc-400 transition bg-zinc-50/30 group">
                <input
                  type="file"
                  id="resume-dropzone"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-zinc-950 line-clamp-1">{selectedFile.name}</div>
                        <div className="text-[10px] text-zinc-400">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-zinc-400 hover:text-zinc-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="resume-dropzone"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2 py-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-200 text-zinc-600 shadow-sm group-hover:scale-105 transition-transform">
                      <Upload className="w-4 h-4 text-zinc-700" />
                    </div>
                    <div className="text-xs font-medium text-zinc-900 mt-1">
                      Drop resume PDF here, or <span className="underline underline-offset-2">browse</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">PDF documents up to 10MB</div>
                  </label>
                )}
              </div>
            ) : (
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your past technical experience, systems built, and core competencies..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition bg-zinc-50/30"
              />
            )}
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calibrating Technical Rubric...</span>
                </>
              ) : (
                <>
                  <span>Calibrate Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Executive Calibration Briefing Card */
        <div className="premium-card rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Assessment Calibrated</span>
              </div>
              <h2 className="text-lg font-semibold text-zinc-950 mt-2">
                {parsedData.candidate_name}
              </h2>
              <p className="text-xs text-zinc-500">
                Targeting {jobTitle} ({experienceLevel} tier) • ~{parsedData.total_experience_years} years estimated experience
              </p>
            </div>
            <button
              type="button"
              onClick={() => setParsedData(null)}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-950 transition"
            >
              Modify
            </button>
          </div>

          {/* Key Competencies Identified */}
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2.5">
              Assessed Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {parsedData.key_strengths.map((str, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 border border-zinc-200/80 text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  {str}
                </span>
              ))}
            </div>
          </div>

          {/* Targeted Focus Topics */}
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2.5">
              Inquiry Focus Areas
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {parsedData.suggested_topics.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs flex items-center justify-between"
                >
                  <span className="font-semibold text-zinc-900">{item.topic}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 font-bold uppercase tracking-wider">
                    {item.difficulty}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Launch Assessment CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isStarting}
              className="w-full py-4 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition flex items-center justify-center gap-2.5 shadow-lg disabled:opacity-50"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Falcon Voice Engine...</span>
                </>
              ) : (
                <>
                  <span>Launch Voice Interview</span>
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
