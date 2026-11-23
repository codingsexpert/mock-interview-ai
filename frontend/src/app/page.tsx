"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Briefcase,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from "lucide-react";
import { ExperienceLevel, ResumeParsedData } from "@/types";

export default function SetupPage() {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("mid");
  const [jobDescription, setJobDescription] = useState("");
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

  const handleAnalyzeResume = async () => {
    if (!jobTitle.trim()) {
      setErrorMsg("Please specify the target job title.");
      return;
    }
    if (!selectedFile && !resumeText.trim()) {
      setErrorMsg("Please either upload a PDF resume or paste resume text.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("job_title", jobTitle);
        formData.append("experience_level", experienceLevel);
        if (jobDescription.trim()) {
          formData.append("job_description", jobDescription);
        }

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
            job_description: jobDescription || undefined,
            experience_level: experienceLevel,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.error || "Failed to analyze resume.");
      }

      setParsedData(data.data);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during resume analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartInterview = async () => {
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
          job_description: jobDescription || undefined,
          key_strengths: parsedData.key_strengths,
          suggested_topics: parsedData.suggested_topics,
          max_turns: 5,
          voice_id: "en-US-cooper",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.error || "Failed to initiate session.");
      }

      router.push(`/interview/${data.session_id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not launch interview session.");
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
          Target Role & Resume Setup
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          Upload your resume and specify the position to calibrate the AI interviewer persona.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50/60 flex items-start gap-3 text-red-900 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {!parsedData ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1.5 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-zinc-600" />
                Target Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Backend Engineer, Staff DevOps, Full Stack Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1.5 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-600" />
                  Seniority Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 bg-white"
                >
                  <option value="entry">Entry Level (0 - 2 years)</option>
                  <option value="mid">Mid Level (3 - 5 years)</option>
                  <option value="senior">Senior Level (5 - 8 years)</option>
                  <option value="lead">Staff / Lead (8+ years)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1.5">
                  Target Job Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Paste specific job requirements or tech stack keywords"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-zinc-600" />
                Resume Document (PDF)
              </label>
              <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center hover:border-zinc-400 transition bg-zinc-50/50">
                <input
                  type="file"
                  id="resume-file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="resume-file"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 border border-zinc-200">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-zinc-900">
                    {selectedFile ? selectedFile.name : "Click to upload resume PDF"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    PDF up to 10MB supported
                  </span>
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                  Or Paste Resume Plain Text
                </label>
              </div>
              <textarea
                rows={4}
                placeholder="Paste experience, skills, and past projects if you don't have a PDF file..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleAnalyzeResume}
                disabled={isAnalyzing}
                className="w-full py-3 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Resume Against Role...
                  </>
                ) : (
                  <>
                    <span>Analyze & Calibrate Interview</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  Analysis Complete
                </span>
                <h2 className="text-xl font-bold text-zinc-950 mt-2">
                  Calibration Brief: {parsedData.candidate_name}
                </h2>
                <p className="text-sm text-zinc-500">
                  Targeting {jobTitle} ({experienceLevel} tier) with ~{parsedData.total_experience_years} years estimated experience
                </p>
              </div>
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900 underline"
              >
                Re-upload / Change Role
              </button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">Detected Core Competencies</h3>
              <div className="flex flex-wrap gap-2">
                {parsedData.key_strengths.map((str, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
                    {str}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">Planned Interview Topics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parsedData.suggested_topics.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-950">{item.topic}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 uppercase font-semibold">
                        {item.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">{item.focus_area}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
              <span className="font-semibold text-zinc-900 block mb-1">Interviewer Strategy:</span>
              {parsedData.interview_strategy}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartInterview}
                disabled={isStarting}
                className="w-full py-3.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Launching Interview Session...
                  </>
                ) : (
                  <>
                    <span>Enter Live Interview Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
