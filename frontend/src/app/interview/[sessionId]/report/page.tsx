"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  Layers,
  HelpCircle,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react";
import { InterviewReport } from "@/types";

export default function ScorecardReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/interview/${sessionId}/report`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.detail || data.error || "Failed to load scorecard report.");
        }
        setReport(data.report);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to retrieve evaluation report.");
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center gap-3 text-zinc-600">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
        <span className="text-sm font-medium">Calibrating Interview Scorecard & Feedback...</span>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-900 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>Could not load evaluation report</span>
          </div>
          <p className="text-sm">{errorMsg || "Report data is unavailable."}</p>
          <button
            onClick={() => router.push("/")}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition"
          >
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  const getVerdictStyle = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes("strong hire")) return "bg-emerald-100 text-emerald-900 border-emerald-300";
    if (v.includes("hire")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (v.includes("leaning")) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-zinc-100 text-zinc-800 border-zinc-200";
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Interview Calibration Completed
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 mt-1">
            Performance Scorecard
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Session ID: {sessionId}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-sm transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Mock Interview</span>
        </button>
      </div>

      {/* Primary Score & Recommendation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Overall Score
          </span>
          <div className="text-5xl font-extrabold text-zinc-950 mt-2">
            {Math.round(report.overall_score)}
            <span className="text-xl text-zinc-400 font-normal">/100</span>
          </div>
          <span
            className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getVerdictStyle(
              report.hiring_verdict
            )}`}
          >
            {report.hiring_verdict}
          </span>
        </div>

        {/* Executive Summary */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-zinc-600" />
              Executive Evaluation Summary
            </span>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {report.executive_summary}
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Calibrated against target role criteria</span>
            <span>Based on {report.question_breakdown.length} interview turns</span>
          </div>
        </div>
      </div>

      {/* Category Metrics Breakdown */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-zinc-600" />
          Core Rubric Competency Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {[
            {
              label: "Technical Depth & System Architecture",
              val: report.category_scores.technical_depth,
            },
            {
              label: "Communication Clarity & Structure",
              val: report.category_scores.communication_clarity,
            },
            {
              label: "Problem Solving & Analytical Thinking",
              val: report.category_scores.problem_solving,
            },
            {
              label: "Past Experience & Role Alignment",
              val: report.category_scores.experience_alignment,
            },
          ].map((cat, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-800">
                <span>{cat.label}</span>
                <span className="font-bold text-zinc-950">{Math.round(cat.val)}%</span>
              </div>
              <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-zinc-900 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, cat.val))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Key Strengths Identified
          </h2>
          <ul className="space-y-2 pt-1">
            {report.strengths.map((str, i) => (
              <li
                key={i}
                className="text-xs text-zinc-700 p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100 flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Areas for Growth & Refinement
          </h2>
          <ul className="space-y-2 pt-1">
            {report.areas_for_improvement.map((area, i) => (
              <li
                key={i}
                className="text-xs text-zinc-700 p-2.5 rounded-lg bg-amber-50/40 border border-amber-100 flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1 shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Turn-by-Turn Question Breakdown */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-zinc-600" />
          Turn-by-Turn Detailed Analysis
        </h2>

        <div className="space-y-6">
          {report.question_breakdown.map((item, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-zinc-200 bg-zinc-50/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>Question {item.turn_number}</span>
              </div>
              <p className="text-sm font-semibold text-zinc-950">{item.question}</p>

              <div className="p-3.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-700 space-y-1">
                <span className="font-semibold text-zinc-900 block">Candidate Response Summary:</span>
                <p className="text-zinc-600">{item.candidate_answer}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-100/70 border border-zinc-200 text-xs text-zinc-800 space-y-1">
                <span className="font-semibold text-zinc-900 block">Interviewer Calibration Critique:</span>
                <p className="text-zinc-700">{item.critique}</p>
              </div>

              {item.model_answer_points.length > 0 && (
                <div className="pt-1">
                  <span className="text-xs font-semibold text-zinc-700 block mb-1.5">
                    Recommended Model Answer Key Points:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.model_answer_points.map((pt, pIdx) => (
                      <span
                        key={pIdx}
                        className="text-xs px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-zinc-700"
                      >
                        {pt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
