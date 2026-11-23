import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MockInterview | Executive Technical Assessment",
  description: "AI-powered voice interview platform calibrated to candidate resumes and target technical roles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#fafafa] text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white">
        {/* Sleek Top Navigation */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/80">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-semibold text-xs tracking-wider shadow-sm group-hover:scale-105 transition-transform">
                MI
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-zinc-900 leading-none">
                  MockInterview
                </span>
                <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase mt-0.5">
                  Assessment Engine
                </span>
              </div>
            </a>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-zinc-700 tracking-wide">Falcon Voice Ready</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Application Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
          {children}
        </main>
      </body>
    </html>
  );
}
