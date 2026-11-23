import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MockInterview | Executive AI Technical Assessment",
  description: "Voice-driven technical and behavioral interview platform calibrated to your background.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#fafafa] text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200/80">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <span className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center text-xs font-semibold tracking-wider">
                MI
              </span>
              <span className="font-semibold text-sm tracking-tight text-zinc-900 group-hover:text-zinc-600 transition">
                MockInterview
              </span>
            </a>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-medium text-zinc-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Falcon Voice Ready</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
          {children}
        </main>
      </body>
    </html>
  );
}
