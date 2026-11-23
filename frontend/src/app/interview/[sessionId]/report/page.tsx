"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  BarChart3,
  Award,
  FileText,
  HelpCircle,
  AlertCircle,
  Download
} from "lucide-react";
import { InterviewReport } from "@/types";

export default function ScorecardReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedTurn, setExpandedTurn] = useState<number | null>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/interview/${sessionId}/report`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.detail || data.error || "Failed to load scorecard.");
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
      <div className="max-w-md mx-auto py-24 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
        <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
          Calibrating Rubric Scorecard...
        </span>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="p-5 rounded-2xl border border-red-200 bg-red-50 text-red-900 text-xs space-y-3">
          <div className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Could not load report</span>
          </div>
          <p>{errorMsg}</p>
          <button
            onClick={() => router.push("/")}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-zinc-950 text-white"
          >
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  const getVerdictStyle = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes("strong hire")) return "bg-emerald-50 text-emerald-800 border-emerald-300";
    if (v.includes("hire")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (v.includes("leaning")) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-zinc-100 text-zinc-800 border-zinc-200";
  };

  return (
    <div className="max-w-3xl mx-auto w-full py-4 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Assessment Completed
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 mt-0.5">
            Executive Scorecard
          </h1>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Hero Score & Executive Summary */}
      <div className="premium-card rounded-3xl p-8 flex flex-col md:flex-row md:items-center gap-8">
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-50 border border-zinc-100 min-w-[150px] text-center shadow-inner">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Overall Score
          </span>
          <div className="text-5xl font-black text-zinc-950 mt-2 tracking-tight">
            {Math.round(report.overall_score)}
            <span className="text-sm text-zinc-400 font-normal ml-1">/100</span>
          </div>
          <span
            className={`mt-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${getVerdictStyle(
              report.hiring_verdict
            )}`}
          >
            {report.hiring_verdict}
          </span>
        </div>

        <div className="flex-1 space-y-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span>Executive Evaluation Summary</span>
          </span>
          <p className="text-xs text-zinc-700 leading-relaxed font-normal">
            {report.executive_summary}
          </p>
          <div className="pt-2 flex items-center gap-4 text-[10px] text-zinc-400 font-medium">
            <span>Calibrated against industry expectations</span>
            <span>•</span>
            <span>{report.question_breakdown.length} questions evaluated</span>
          </div>
        </div>
      </div>

      {/* 4 Rubric Metric Bars */}
      <div className="premium-card rounded-3xl p-6 space-y-4">
        <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-zinc-500" />
          <span>Competency Calibration</span>
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {[
            { label: "Technical Depth & System Architecture", val: report.category_scores.technical_depth },
            { label: "Communication Clarity & Structure", val: report.category_scores.communication_clarity },
            { label: "Problem Solving & Analytical Thinking", val: report.category_scores.problem_solving },
            { label: "Past Experience & Role Alignment", val: report.category_scores.experience_alignment },
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-800">
                <span>{item.label}</span>
                <span className="font-bold text-zinc-950">{Math.round(item.val)}%</span>
              </div>
              <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-zinc-950 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, item.val))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Growth Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="premium-card rounded-3xl p-6 space-y-3">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Observed Strengths</span>
          </span>
          <ul className="space-y-2 pt-1">
            {report.strengths.map((str, i) => (
              <li key={i} className="text-xs text-zinc-700 flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="premium-card rounded-3xl p-6 space-y-3">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Growth Areas</span>
          </span>
          <ul className="space-y-2 pt-1">
            {report.areas_for_improvement.map((area, i) => (
              <li key={i} className="text-xs text-zinc-700 flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Accordion Question Breakdown */}
      <div className="premium-card rounded-3xl p-6 space-y-4">
        <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-zinc-500" />
          <span>Turn-by-Turn Calibration Critique ({report.question_breakdown.length})</span>
        </span>

        <div className="space-y-3 pt-1">
          {report.question_breakdown.map((item) => {
            const isExpanded = expandedTurn === item.turn_number;
            return (
              <div
                key={item.turn_number}
                className="border border-zinc-200/80 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedTurn(isExpanded ? null : item.turn_number)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs bg-zinc-50/60 hover:bg-zinc-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Turn {item.turn_number}
                    </span>
                    <span className="font-semibold text-zinc-950 line-clamp-1">{item.question}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="p-5 border-t border-zinc-100 space-y-3.5 text-xs bg-white">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        Candidate Answer
                      </span>
                      <p className="text-zinc-600 leading-relaxed bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        {item.candidate_answer}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        Calibration Analysis
                      </span>
                      <p className="text-zinc-800 leading-relaxed bg-zinc-100/50 p-3 rounded-xl border border-zinc-200/60">
                        {item.critique}
                      </p>
                    </div>

                    {item.model_answer_points.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
                          Model Answer Expected Points
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.model_answer_points.map((pt, pIdx) => (
                            <span
                              key={pIdx}
                              className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200/80 text-zinc-800 text-[11px] font-medium"
                            >
                              {pt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
