import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MockInterview AI | Voice Technical Assessment Platform",
  description: "Live voice-first mock interviews with dynamic streaming questions, resume calibration, and rubric scorecards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-ambient-glow text-zinc-950 font-sans selection:bg-indigo-600 selection:text-white">
        {/* Dynamic Glassmorphism Header */}
        <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                MI
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight bg-gradient-to-r from-zinc-950 via-indigo-950 to-zinc-900 bg-clip-text text-transparent">
                    MockInterview
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                    AI Studio
                  </span>
                </div>
              </div>
            </a>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 shadow-xs text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-slate-700 tracking-wide">
                  Murf Falcon-2.1 Audio Ready
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col justify-center">
          {children}
        </main>
      </body>
    </html>
  );
}
