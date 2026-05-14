"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-12 shadow-sm dark:shadow-2xl max-w-lg w-full text-center">
        <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit mb-4">Module Under Construction</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          This section of the Petrus Enterprise Admin Portal is currently in development.
        </p>
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
