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
  Download,
  Sparkles,
  TrendingUp,
  Target
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
      <div className="max-w-md mx-auto py-24 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25 animate-spin">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-950">Generating Comprehensive Scorecard</h3>
          <p className="text-xs text-slate-500 font-medium">Calibrating rubric scores and actionable suggestions...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="glass-panel-elevated rounded-2xl p-6 text-red-900 text-xs space-y-3">
          <div className="font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Could not load evaluation scorecard</span>
          </div>
          <p className="text-slate-600">{errorMsg}</p>
          <button
            onClick={() => router.push("/")}
            className="btn-gradient-primary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  const getVerdictStyle = (verdict: string) => {
    const v = verdict.toLowerCase();
    if (v.includes("strong hire")) return "from-emerald-500 to-teal-600 text-white shadow-emerald-500/25";
    if (v.includes("hire")) return "from-indigo-600 to-violet-600 text-white shadow-indigo-500/25";
    if (v.includes("leaning")) return "from-amber-500 to-orange-500 text-white shadow-amber-500/25";
    return "from-slate-700 to-slate-900 text-white";
  };

  return (
    <div className="max-w-3xl mx-auto w-full py-4 space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
            <Award className="w-3 h-3 text-emerald-600" />
            <span>Assessment Complete</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-950 mt-1">
            Performance & Calibration Scorecard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Report</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn-gradient-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Hero Score Banner */}
      <div className="glass-panel-elevated rounded-3xl p-8 flex flex-col md:flex-row md:items-center gap-8 relative overflow-hidden">
        {/* Score Radial Visualizer */}
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-tr from-slate-50 to-indigo-50/40 border border-slate-200 min-w-[160px] text-center shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Overall Score
          </span>
          <div className="text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mt-1 tracking-tight">
            {Math.round(report.overall_score)}
            <span className="text-sm text-slate-400 font-normal ml-0.5">/100</span>
          </div>
          <div
            className={`mt-3 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r shadow-md ${getVerdictStyle(
              report.hiring_verdict
            )}`}
          >
            {report.hiring_verdict}
          </div>
        </div>

        {/* Executive Feedback Summary */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Executive Assessment Summary</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {report.executive_summary}
          </p>
          <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-400 font-medium">
            <span>Calibrated against industry expectations</span>
            <span>•</span>
            <span>{report.question_breakdown.length} questions evaluated</span>
          </div>
        </div>
      </div>

      {/* 4 Rubric Metric Progress Meters */}
      <div className="glass-panel-elevated rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Competency Calibration Rubric</span>
          </span>
          <span className="text-[11px] font-bold text-indigo-600">Weighted Evaluation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {[
            { label: "Technical Depth & Architecture", val: report.category_scores.technical_depth, color: "from-indigo-600 to-violet-600" },
            { label: "Communication Clarity & Structure", val: report.category_scores.communication_clarity, color: "from-violet-600 to-purple-600" },
            { label: "Problem Solving & Analytical Thinking", val: report.category_scores.problem_solving, color: "from-cyan-600 to-blue-600" },
            { label: "Past Experience & Role Alignment", val: report.category_scores.experience_alignment, color: "from-emerald-600 to-teal-600" },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>{item.label}</span>
                <span className="font-extrabold text-slate-950">{Math.round(item.val)}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                  style={{ width: `${Math.min(100, Math.max(0, item.val))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Actionable Growth Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-panel-elevated rounded-3xl p-6 space-y-3.5 border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Observed Technical Strengths</span>
          </div>
          <ul className="space-y-2 pt-1">
            {report.strengths.map((str, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel-elevated rounded-3xl p-6 space-y-3.5 border-t-4 border-t-amber-500">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Targeted Improvement Suggestions</span>
          </div>
          <ul className="space-y-2 pt-1">
            {report.areas_for_improvement.map((area, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Turn-by-Turn Question Breakdown */}
      <div className="glass-panel-elevated rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>Turn-by-Turn In-Depth Critique ({report.question_breakdown.length} Questions)</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-400">Click turn to expand critique</span>
        </div>

        <div className="space-y-3 pt-1">
          {report.question_breakdown.map((item) => {
            const isExpanded = expandedTurn === item.turn_number;
            return (
              <div
                key={item.turn_number}
                className="border border-slate-200/90 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedTurn(isExpanded ? null : item.turn_number)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs bg-slate-50/70 hover:bg-slate-100/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase">
                      Q{item.turn_number}
                    </span>
                    <span className="font-bold text-slate-950 line-clamp-1">{item.question}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 space-y-4 text-xs bg-white">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                        Candidate Answer
                      </span>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        {item.candidate_answer}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block mb-1">
                        Calibration Analysis
                      </span>
                      <p className="text-slate-800 leading-relaxed bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100">
                        {item.critique}
                      </p>
                    </div>

                    {item.model_answer_points.length > 0 && (
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                          Key Technical Concepts Expected
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.model_answer_points.map((pt, pIdx) => (
                            <span
                              key={pIdx}
                              className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold"
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
