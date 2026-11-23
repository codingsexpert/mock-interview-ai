import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto py-24 text-center space-y-4">
      <span className="text-4xl font-extrabold text-zinc-950">404</span>
      <h2 className="text-base font-semibold text-zinc-900">Page not found</h2>
      <p className="text-xs text-zinc-500">
        The requested interview session or resource does not exist.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
