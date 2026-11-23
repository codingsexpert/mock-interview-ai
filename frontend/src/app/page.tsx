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
  AlertCircle
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
        setErrorMsg("Only PDF files are supported.");
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
      setErrorMsg("Please paste your resume text.");
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
        throw new Error(data.detail || data.error || "Analysis failed.");
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
        throw new Error(data.detail || data.error || "Failed to start session.");
      }

      router.push(`/interview/${data.session_id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not launch interview.");
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      {/* Sleek Minimal Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Technical Assessment Setup
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Calibrate the AI hiring manager with your role and resume.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg border border-red-200 bg-red-50 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!parsedData ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-5">
          {/* Target Role Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider mb-1.5">
              Target Role
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Backend Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition bg-zinc-50/30"
            />
          </div>

          {/* Seniority Segmented Control */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 uppercase tracking-wider mb-1.5">
              Seniority
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-zinc-100 border border-zinc-200/60 text-xs font-medium">
              {(["entry", "mid", "senior", "lead"] as ExperienceLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperienceLevel(level)}
                  className={`py-1.5 rounded-md capitalize transition ${
                    experienceLevel === level
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Resume Upload Toggle & Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-700 uppercase tracking-wider">
                Resume
              </label>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`transition ${inputMode === "file" ? "font-semibold text-zinc-950" : "text-zinc-400 hover:text-zinc-600"}`}
                >
                  PDF Upload
                </button>
                <span className="text-zinc-300">|</span>
                <button
                  type="button"
                  onClick={() => setInputMode("text")}
                  className={`transition ${inputMode === "text" ? "font-semibold text-zinc-950" : "text-zinc-400 hover:text-zinc-600"}`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {inputMode === "file" ? (
              <div className="relative border border-dashed border-zinc-300 rounded-xl p-6 text-center hover:border-zinc-400 transition bg-zinc-50/40 group">
                <input
                  type="file"
                  id="resume-drop"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="resume-drop"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-zinc-200 text-zinc-600 group-hover:scale-105 transition">
                    {selectedFile ? <Check className="w-4 h-4 text-emerald-600" /> : <Upload className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-medium text-zinc-900 mt-1">
                    {selectedFile ? selectedFile.name : "Choose or drag resume PDF"}
                  </span>
                  <span className="text-[11px] text-zinc-400">PDF up to 10MB</span>
                </label>
              </div>
            ) : (
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste work experience, skills, and projects..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition bg-zinc-50/30"
              />
            )}
          </div>

          {/* Action CTA */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wide transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Calibrating Interview...</span>
              </>
            ) : (
              <>
                <span>Calibrate Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      ) : (
        /* Minimalist Calibration Brief Card */
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Calibrated
              </span>
              <h2 className="text-base font-semibold text-zinc-950 mt-1.5">
                {parsedData.candidate_name}
              </h2>
              <p className="text-xs text-zinc-500">
                {jobTitle} • {experienceLevel} • ~{parsedData.total_experience_years} yrs exp
              </p>
            </div>
            <button
              type="button"
              onClick={() => setParsedData(null)}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition"
            >
              Edit
            </button>
          </div>

          {/* Core Competencies */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              Assessed Skills
            </span>
            <div className="flex flex-wrap gap-1.5">
              {parsedData.key_strengths.map((str, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-100 border border-zinc-200/60 text-zinc-800"
                >
                  {str}
                </span>
              ))}
            </div>
          </div>

          {/* Planned Topics */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              Focus Areas
            </span>
            <div className="space-y-1.5">
              {parsedData.suggested_topics.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-xs"
                >
                  <span className="font-medium text-zinc-900">{item.topic}</span>
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase">
                    {item.difficulty}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Enter Interview Room CTA */}
          <button
            type="button"
            onClick={handleLaunch}
            disabled={isStarting}
            className="w-full py-3 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wide transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Launching Voice Session...</span>
              </>
            ) : (
              <>
                <span>Begin Voice Interview</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
