"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, Zap, Star } from "lucide-react";

interface SearchOverlayProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [activeTab, setActiveTab] = useState("Management");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const tabs = ["All", "Management", "Reports", "Microsoft 365", "Others", "Help"];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={overlayRef}
        className="w-full max-w-4xl bg-white dark:bg-slate-950 rounded-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
      >
        {/* Tabs Bar */}
        <div className="bg-slate-800 dark:bg-black px-4 pt-4 flex items-center space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                relative px-6 py-2.5 text-[13px] font-bold rounded-t-lg transition-all
                ${activeTab === tab 
                  ? "bg-emerald-500 text-white" 
                  : "bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700"}
              `}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-emerald-500"></div>
              )}
            </button>
          ))}
          <div className="flex-1"></div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white mb-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="flex border-b border-slate-200 dark:border-white/10">
          <div className="flex-1 flex items-center px-6 py-4 space-x-4">
            <input 
              autoFocus
              type="text" 
              placeholder="Search Across Petrus IAM Platform" 
              className="w-full bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
            />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Shortcut - Ctrl+Space</span>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 flex items-center justify-center transition-colors">
            <Search className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 grid grid-cols-3 gap-12 min-h-[400px]">
          {/* Recent Searches */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
              <Clock className="h-4 w-4 text-slate-400" /> Recent Searches
            </h3>
            <ul className="space-y-3">
              {["Modify Groups", "Modify User Attributes", "Exchange Features", "Move Users"].map((item) => (
                <li key={item}>
                  <button className="text-[13px] text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Frequent Searches */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
              <Zap className="h-4 w-4 text-amber-500" /> Frequent Searches
            </h3>
            <ul className="space-y-3">
              {["Auto reply", "Modify User Attributes", "Unlock Accounts", "Bulk Import Users"].map((item) => (
                <li key={item}>
                  <button className="text-[13px] text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* What's New */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
              <Star className="h-4 w-4 text-emerald-500" /> What's New in Petrus?
            </h3>
            <ul className="space-y-3">
              {["Create Single Linked Mailbox", "Modify Single Computer", "Azure AD Integration", "Bulk Group Restoration"].map((item) => (
                <li key={item}>
                  <button className="text-[13px] text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5 flex justify-end">
          <span className="text-[11px] text-slate-400 font-medium italic">Press Esc to Close</span>
        </div>
      </div>
    </div>
  );
}
