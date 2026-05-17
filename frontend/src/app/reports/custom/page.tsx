"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Search, 
  ChevronDown, 
  Settings,
  Download,
  Plus,
  X,
  CheckCircle2,
  FileText
} from "lucide-react";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";

export default function CustomReportsPage() {
  const [domain, setDomain] = useState("admanagerplus.com");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isNewCustomOpen, setIsNewCustomOpen] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [newReportCategory, setNewReportCategory] = useState("User Reports");
  const [isSuccess, setIsSuccess] = useState(false);

  // Initial Custom Reports Data
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

  useEffect(() => {
    const userStr = localStorage.getItem("petrus_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.tenantName) {
          setDomain(user.tenantName.toLowerCase() + ".com");
        } else if (user.email) {
          const emailDomain = user.email.split('@')[1];
          if (emailDomain) setDomain(emailDomain);
        }
      } catch (e) {
        console.error("Error parsing user for domain display", e);
      }
    }
  }, []);

  const handleCreateCustomReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportName.trim()) return;

    // Update section groups state dynamically
    setSections(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
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
    <DashboardLayout>
      <div className="space-y-8 pb-20">
        {/* Top Header / Action Bar */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center space-x-6 flex-1">
              <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-transparent focus-within:border-indigo-500/50 transition-all w-64 group/search">
                <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search Custom Reports..." 
                  className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-500 w-full"
                />
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
              <button className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all group">
                <span>{domain}</span>
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
              <nav className="flex space-x-4">
                <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-0.5">Custom Reports</button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsScheduleOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> Schedule Reports
              </button>
              <button 
                onClick={() => setIsNewCustomOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Plus className="h-3.5 w-3.5" /> New Custom Report
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.title} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-3">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                {section.groups.map((group) => (
                  <div key={group.name} className="space-y-4">
                    <h3 className={`text-[13px] font-bold ${group.color} flex items-center justify-between group cursor-default`}>
                      {group.name}
                    </h3>
                    <ul className="space-y-2.5">
                      {group.items.map((item) => (
                        <li key={item}>
                          <button className="text-[13px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center group/item text-left w-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mr-2 group-hover/item:bg-indigo-500 transition-colors"></span>
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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
          <div className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
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
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Report Name
                  </label>
                  <input 
                    type="text"
                    required
                    value={newReportName}
                    onChange={(e) => setNewReportName(e.target.value)}
                    placeholder="e.g. Inactive Domain Admins"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-indigo-500 text-slate-950 dark:text-white transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category Group
                  </label>
                  <select
                    value={newReportCategory}
                    onChange={(e) => setNewReportCategory(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-indigo-500 text-slate-950 dark:text-white transition-all"
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
    </DashboardLayout>
  );
}
