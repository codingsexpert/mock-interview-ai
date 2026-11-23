import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mock Interview AI | Voice-First Technical Evaluation",
  description: "Enterprise mock interview simulator tailored to your resume and target role.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-white">
      <body className="min-h-full flex flex-col bg-white text-zinc-900 antialiased selection:bg-zinc-200">
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight text-zinc-900">
              <span className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-sm font-bold">
                MI
              </span>
              <span>MockInterview.ai</span>
            </a>
            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Voice Engine Ready
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
