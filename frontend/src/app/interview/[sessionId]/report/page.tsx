"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown
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
      <div className="max-w-md mx-auto py-20 flex flex-col items-center justify-center gap-2.5 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
        <span className="text-xs font-medium">Calibrating Performance Scorecard...</span>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs space-y-2">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Could not load report</span>
          </div>
          <p>{errorMsg}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-950 text-white"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  const getVerdictStyle = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes("strong hire")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (v.includes("hire")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (v.includes("leaning")) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-zinc-100 text-zinc-800 border-zinc-200";
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-4 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Assessment Complete
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-950 mt-0.5">
            Performance Scorecard
          </h1>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition shadow-sm"
        >
          <RotateCcw className="w-3 h-3" />
          <span>New Session</span>
        </button>
      </div>

      {/* Hero Score & Executive Summary */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 border border-zinc-100 min-w-[130px] text-center">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Overall Score
          </span>
          <div className="text-4xl font-extrabold text-zinc-950 mt-1">
            {Math.round(report.overall_score)}
            <span className="text-xs text-zinc-400 font-normal">/100</span>
          </div>
          <span
            className={`mt-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getVerdictStyle(
              report.hiring_verdict
            )}`}
          >
            {report.hiring_verdict}
          </span>
        </div>

        <div className="flex-1 space-y-1.5">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Executive Summary
          </span>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {report.executive_summary}
          </p>
        </div>
      </div>

      {/* 4 Rubric Metric Bars */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-3">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
          Competency Calibration
        </span>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {[
            { label: "Technical Depth", val: report.category_scores.technical_depth },
            { label: "Communication", val: report.category_scores.communication_clarity },
            { label: "Problem Solving", val: report.category_scores.problem_solving },
            { label: "Role Alignment", val: report.category_scores.experience_alignment },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-zinc-50/60 border border-zinc-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-700">
                <span>{item.label}</span>
                <span className="font-semibold text-zinc-950">{Math.round(item.val)}%</span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-zinc-950 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, item.val))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Growth Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-2.5">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            Observed Strengths
          </span>
          <ul className="space-y-1.5">
            {report.strengths.map((str, i) => (
              <li key={i} className="text-xs text-zinc-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-2.5">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
            Growth Areas
          </span>
          <ul className="space-y-1.5">
            {report.areas_for_improvement.map((area, i) => (
              <li key={i} className="text-xs text-zinc-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Accordion Question Breakdown */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-sm space-y-3">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
          Dialogue Breakdown ({report.question_breakdown.length})
        </span>

        <div className="space-y-2 pt-1">
          {report.question_breakdown.map((item) => {
            const isExpanded = expandedTurn === item.turn_number;
            return (
              <div
                key={item.turn_number}
                className="border border-zinc-100 rounded-xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setExpandedTurn(isExpanded ? null : item.turn_number)}
                  className="w-full p-3.5 flex items-center justify-between text-left text-xs bg-zinc-50/50 hover:bg-zinc-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Q{item.turn_number}</span>
                    <span className="font-medium text-zinc-900 line-clamp-1">{item.question}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-zinc-100 space-y-2.5 text-xs bg-white">
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
                        Your Answer
                      </span>
                      <p className="text-zinc-600 leading-relaxed">{item.candidate_answer}</p>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
                        Critique
                      </span>
                      <p className="text-zinc-700 leading-relaxed">{item.critique}</p>
                    </div>

                    {item.model_answer_points.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                          Key Concepts Expected
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.model_answer_points.map((pt, pIdx) => (
                            <span
                              key={pIdx}
                              className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[11px]"
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
