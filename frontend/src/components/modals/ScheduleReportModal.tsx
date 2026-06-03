"use client";

import { useState } from "react";
import { X, Calendar, Mail, FileSpreadsheet, CheckCircle2 } from "lucide-react";

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportCategory: string;
  reportOptions: string[];
}

export function ScheduleReportModal({
  isOpen,
  onClose,
  reportCategory,
  reportOptions,
}: ScheduleReportModalProps) {
  const [scheduleName, setScheduleName] = useState("");
  const [selectedReport, setSelectedReport] = useState(reportOptions[0] || "");
  const [frequency, setFrequency] = useState("weekly");
  const [format, setFormat] = useState("pdf");
  const [emails, setEmails] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      // Reset state
      setScheduleName("");
      setEmails("");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transition-all transform scale-100 p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-400/10 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Schedule Report</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Category: {reportCategory}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-400/10 rounded-full text-emerald-600 dark:text-emerald-400 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-base font-bold text-slate-950 dark:text-white">Schedule Configured!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              "{scheduleName || `Weekly ${selectedReport}`}" has been scheduled successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Schedule Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Schedule Name
              </label>
              <input 
                type="text"
                required
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="e.g. Weekly Active Users Report"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-indigo-500 text-slate-950 dark:text-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Selected Report */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Report Type
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-indigo-500 text-slate-950 dark:text-white transition-all"
              >
                {reportOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Row: Frequency & Format */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-indigo-500 text-slate-950 dark:text-white transition-all"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-indigo-500 text-slate-950 dark:text-white transition-all"
                >
                  <option value="pdf">PDF (Read Only)</option>
                  <option value="csv">CSV (Comma Separated)</option>
                  <option value="xlsx">Excel (XLSX)</option>
                </select>
              </div>
            </div>

            {/* Email Recipients */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Recipients
              </label>
              <input 
                type="text"
                required
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="admin@domain.com, security@domain.com"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-indigo-500 text-slate-950 dark:text-white transition-all placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Separate multiple emails with commas</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="text-xs px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20"
              >
                Schedule Task
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
