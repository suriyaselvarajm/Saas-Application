"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-12 shadow-sm dark:shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 relative">
          <FileQuestion className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 dark:text-white font-outfit mb-2 tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 font-outfit mb-4">Page Not Found</h2>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          The page you are looking for does not exist, has been removed, or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => globalThis.history?.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
          <Link 
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

