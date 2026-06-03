"use client";

import { useState, FormEvent } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Plus, X, FileText, CheckCircle2 } from "lucide-react";

export default function CustomReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isNewCustomOpen, setIsNewCustomOpen] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [newReportCategory, setNewReportCategory] = useState("User Reports");
  const [isSuccess, setIsSuccess] = useState(false);

  const [sections, setSections] = useState([
    {
      title: "Custom Reports",
      groups: [
        {
          name: "User Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "dsadasda",
            "Tester",
            "PP1",
            "Admin",
            "Gowtham Test"
          ]
        },
        {
          name: "Custom",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Test"
          ]
        },
        {
          name: "Custom Category",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Custom Report 01"
          ]
        }
      ]
    }
  ]);

  const handleCreateCustomReport = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newReportName.trim()) return;

    setSections(prev => {
      const updated = structuredClone(prev);
      const group = updated[0].groups.find((g: any) => g.name === newReportCategory);
      if (group) {
        group.items.push(newReportName.trim());
      } else {
        updated[0].groups.push({
          name: newReportCategory,
          color: "text-emerald-600 dark:text-emerald-400",
          items: [newReportName.trim()]
        });
      }
      return updated;
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsNewCustomOpen(false);
      setNewReportName("");
    }, 1500);
  };

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Custom Reports..."
      primaryActionLabel="New Custom Report"
      primaryActionIcon={<Plus className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsNewCustomOpen(true)}
      tabs={[
        { name: "Custom Reports", active: true }
      ]}
    >
      {/* Schedule Reports Modal */}
      <ScheduleReportModal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        reportCategory="Custom Reports"
        reportOptions={sections[0].groups.flatMap(g => g.items)}
      />

      {/* New Custom Report Modal */}
      {isNewCustomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-400/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">New Custom Report</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Define a new dynamic audit report</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewCustomOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-400/10 rounded-full text-emerald-600 dark:text-emerald-400 animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h4 className="text-base font-bold text-slate-950 dark:text-white">Report Created!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  "{newReportName}" has been successfully added to {newReportCategory}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateCustomReport} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="report-name" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Report Name
                  </label>
                  <input 
                    id="report-name"
                    type="text"
                    required
                    value={newReportName}
                    onChange={(e) => setNewReportName(e.target.value)}
                    placeholder="e.g. Inactive Domain Admins"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-lg outline-none focus:border-indigo-500 text-slate-950 dark:text-white transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="category-group" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category Group
                  </label>
                  <select
                    id="category-group"
                    value={newReportCategory}
                    onChange={(e) => setNewReportCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-lg outline-none focus:border-indigo-500 text-slate-950 dark:text-white transition-all"
                  >
                    <option value="User Reports">User Reports</option>
                    <option value="Custom">Custom</option>
                    <option value="Custom Category">Custom Category</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewCustomOpen(false)}
                    className="text-xs px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Create Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </ManagementConsoleLayout>
  );
}
