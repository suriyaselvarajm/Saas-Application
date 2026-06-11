"use client";

import { useState, useEffect } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { 
  Download, 
  ArrowLeft, 
  Search, 
  Loader2, 
  CheckCircle2, 
  X, 
  Lock, 
  Unlock, 
  Terminal, 
  Play, 
  FileText, 
  RefreshCw, 
  Upload,
  UserCheck,
  UserX
} from "lucide-react";

interface UserReportRow {
  name: string;
  loginName: string;
  email: string;
  status: 'Enabled' | 'Disabled' | 'Locked Out';
  lastLogon: string;
  manager: string;
  department: string;
  title: string;
  groups: string[];
  logonScript: string;
  terminalServicesEnabled: boolean;
  smartcardLogonRequired: boolean;
  dialinAccess: 'Allow' | 'Deny';
  skypeEnabled: boolean;
  passwordNeverExpires: boolean;
  accountExpired: boolean;
  expiresInDays: number;
  createdAt: string;
  updatedAt: string;
}

export default function UserReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<UserReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  
  // CSV Import state
  const [isCsvImportSelected, setIsCsvImportSelected] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Live action logs
  const [actionLogs, setActionLogs] = useState<string[]>([]);
  const [isActionConsoleOpen, setIsActionConsoleOpen] = useState(false);
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  const sections = [
    {
      title: "User Reports",
      groups: [
        {
          name: "General Reports",
          color: "text-indigo-600 dark:text-indigo-400",
          items: [
            "All Users",
            "Users With Empty Attributes",
            "Users With Duplicate Attributes",
            "Users Without Managers",
            "Manager Based Users",
            "All Managers",
            "Users In More Than One Group",
            "Recently Deleted users",
            "Recently Created Users",
            "Recently Modified Users",
            "Photo Based Reports",
            "Lync/Skype Disabled Users",
            "Lync/Skype Enabled Users",
            "Dial-in Allow Access",
            "Dial-in Deny Access",
            "Users With Logon Script",
            "Users Without Logon Script"
          ]
        },
        {
          name: "Account Status Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Disabled Users",
            "Locked out Users",
            "Account Expired Users",
            "Recently Account Expired Users",
            "Soon-To-Expire User Accounts",
            "Account Never Expires Users",
            "Smart Card Enabled Users"
          ]
        },
        {
          name: "Logon Reports",
          color: "text-purple-600 dark:text-purple-400",
          items: [
            "Inactive Users",
            "Real Last Logon",
            "Recently Logged On Users",
            "Logon Hour Based Report",
            "Users Never Logged On",
            "Enabled Users"
          ]
        },
        {
          name: "Nested Reports",
          color: "text-pink-600 dark:text-pink-400",
          items: [
            "Users In Groups",
            "Groups for Users"
          ]
        },
        {
          name: "CSV Import",
          color: "text-amber-600 dark:text-amber-400",
          items: [
            "Report from CSV"
          ]
        },
        {
          name: "Terminal Service Reports",
          color: "text-sky-600 dark:text-sky-400",
          items: [
            "Users' Terminal Service Properties",
            "Users With Terminal Service Access"
          ]
        }
      ]
    }
  ];

  // Fetch report data from backend
  const fetchReport = async (reportName: string, csvList?: string[]) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/users/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType: reportName,
          csvUsers: csvList
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        console.error("Failed to fetch report from server");
      }
    } catch (e) {
      console.error("Error fetching report details", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportClick = (item: string) => {
    setReportSearchQuery("");
    if (item === "Report from CSV") {
      setIsCsvImportSelected(true);
      setSelectedReport("Report from CSV");
      setReportData([]);
    } else {
      setIsCsvImportSelected(false);
      setSelectedReport(item);
      fetchReport(item);
    }
  };

  // Drag and Drop files or select
  const handleCsvFileLoad = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      setIsImporting(true);
      const rows = text.split("\n").map(r => r.trim()).filter(Boolean);
      // Remove header if present
      const headers = ["email", "name", "loginname", "username", "samaccountname"];
      let usersList: string[] = [];
      
      const firstRow = rows[0].toLowerCase();
      const hasHeader = headers.some(h => firstRow.includes(h));
      const startingIndex = hasHeader ? 1 : 0;
      
      for (let i = startingIndex; i < rows.length; i++) {
        const columns = rows[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (columns[0]) {
          usersList.push(columns[0]); // First column assumed as email/username
        }
      }

      await fetchReport("csv-import", usersList);
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const downloadCsvTemplate = () => {
    const headers = "email,name,loginName\n";
    const data = "alexander.wright@corp.com,Alexander Wright,awright\nsophia.martinez@corp.com,Sophia Martinez,smartinez\nbenjamin.cole@corp.com,Benjamin Cole,bcole\n";
    const blob = new Blob([headers + data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "User_Report_CSV_Template.csv");
    a.click();
  };

  const exportReportToCsv = () => {
    const headers = "Name,Login Name,Email,Status,Last Logon,Title,Department,Manager,Logon Script\n";
    const rows = filteredData.map(u => 
      `"${u.name}","${u.loginName}","${u.email}","${u.status}","${u.lastLogon}","${u.title}","${u.department}","${u.manager}","${u.logonScript}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `${selectedReport?.replace(/[\s/]+/g, "_")}_Report.csv`);
    a.click();
  };

  // Perform AD action from reports row
  const executeUserAction = async (email: string, actionType: 'unlock' | 'enable' | 'disable') => {
    setIsActionProcessing(true);
    setActionLogs([
      `[System] Initializing target reporting action: '${actionType}' for ${email}`,
      `[AD] Binding connection with Petrus Active Directory Domain Service...`
    ]);
    setIsActionConsoleOpen(true);

    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/users/reports/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email, action: actionType })
      });

      if (res.ok) {
        const result = await res.json();
        // Append response logs
        setActionLogs(prev => [...prev, ...result.logs]);
        
        // Dynamically update state row status
        setReportData(prev => prev.map(u => {
          if (u.email === email) {
            return {
              ...u,
              status: actionType === 'unlock' ? 'Enabled' : actionType === 'enable' ? 'Enabled' : 'Disabled'
            };
          }
          return u;
        }));
      } else {
        setActionLogs(prev => [...prev, `[System] [ERROR] Failed to execute action on AD backend.`]);
      }
    } catch (e: any) {
      setActionLogs(prev => [...prev, `[System] [ERROR] Connection error: ${e.message}`]);
    } finally {
      setIsActionProcessing(false);
    }
  };

  // Filter report data based on local query
  const filteredData = reportData.filter(u => {
    const q = reportSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.loginName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.title.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.manager.toLowerCase().includes(q)
    );
  });

  return (
    <ManagementConsoleLayout
      sections={selectedReport ? [] : sections}
      searchPlaceholder="Search User Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      onItemClick={handleReportClick}
      tabs={[
        { name: "User Reports", active: true }
      ]}
    >
      {/* ── REPORT VIEW INTERFACE ─────────────────────────────────────────── */}
      {selectedReport && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/30 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/50 dark:border-white/5 text-slate-500"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  {selectedReport}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                    {filteredData.length} records
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Active Directory consolidated report details</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => {
                  if (isCsvImportSelected) {
                    setCsvFile(null);
                    setReportData([]);
                  } else {
                    fetchReport(selectedReport);
                  }
                }} 
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
              
              {reportData.length > 0 && (
                <button 
                  type="button" 
                  onClick={exportReportToCsv}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-750 hover:to-teal-750 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              )}
            </div>
          </div>

          {/* CSV File Upload Workspace */}
          {isCsvImportSelected && !csvFile && (
            <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl p-8 max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <FileText className="h-10 w-10 text-indigo-500 mx-auto" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Query Users Status from CSV</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Upload a list of emails, usernames, or account names to check their status in AD.</p>
              </div>

              <div 
                className="border-2 border-dashed border-slate-250 dark:border-white/10 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/20 hover:border-indigo-500/50 hover:bg-indigo-50/5 dark:hover:bg-indigo-950/5 transition-all cursor-pointer relative group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleCsvFileLoad(e.dataTransfer.files[0]);
                }}
              >
                <input 
                  type="file" 
                  accept=".csv" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleCsvFileLoad(e.target.files[0]);
                  }}
                />
                <Upload className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-colors mx-auto mb-3" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block">Drag & Drop or click to browse CSV</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Supports columns: email, name, loginName</span>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs">
                <span className="text-slate-400">Need a format template?</span>
                <button 
                  onClick={downloadCsvTemplate}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Download Template
                </button>
              </div>
            </div>
          )}

          {/* Results Grid Table */}
          {(!isCsvImportSelected || csvFile) && (
            <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl shadow-slate-100/5 dark:shadow-none">
              
              {/* Search filter inside report */}
              <div className="p-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/10 flex items-center gap-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter users by name, email, login, title, department..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-500 w-full"
                />
                {reportSearchQuery && (
                  <button onClick={() => setReportSearchQuery("")} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X className="h-3.5 w-3.5" /></button>
                )}
              </div>

              {isLoading || isImporting ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-xs text-slate-400 font-semibold">Running AD Query & Report compilation...</span>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="py-20 text-center text-xs font-semibold text-slate-400 space-y-1">
                  <span>No records found matching current query or filters.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/30 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200/50 dark:border-white/5 text-[11px] font-bold uppercase tracking-wider">
                        <th className="px-6 py-3.5">Name</th>
                        <th className="px-6 py-3.5">Logon Name</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Last Logon</th>
                        <th className="px-6 py-3.5">Job Details</th>
                        <th className="px-6 py-3.5">Manager</th>
                        <th className="px-6 py-3.5">Logon Script</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-white/5 text-xs font-semibold">
                      {filteredData.map((u) => {
                        const init = u.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
                        return (
                          <tr key={u.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                                  {init}
                                </div>
                                <div>
                                  <div className="text-slate-900 dark:text-white font-extrabold">{u.name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono">{u.loginName}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                u.status === "Enabled" 
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30"
                                  : u.status === "Disabled"
                                  ? "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/30"
                                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/30"
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{u.lastLogon}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                              <div>{u.title || "—"}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{u.department || "—"}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.manager || "—"}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{u.logonScript || "—"}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                {u.status === "Locked Out" && (
                                  <button 
                                    onClick={() => executeUserAction(u.email, 'unlock')}
                                    className="p-1.5 rounded-lg border border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1 font-bold text-[10px]"
                                    title="Unlock User"
                                  >
                                    <Unlock className="h-3 w-3" /> Unlock
                                  </button>
                                )}
                                {u.status === "Enabled" && (
                                  <button 
                                    onClick={() => executeUserAction(u.email, 'disable')}
                                    className="p-1.5 rounded-lg border border-slate-200/80 bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100 hover:text-rose-500 transition-colors flex items-center gap-1 font-bold text-[10px]"
                                    title="Disable User"
                                  >
                                    <UserX className="h-3 w-3" /> Disable
                                  </button>
                                )}
                                {u.status === "Disabled" && (
                                  <button 
                                    onClick={() => executeUserAction(u.email, 'enable')}
                                    className="p-1.5 rounded-lg border border-indigo-200/50 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1 font-bold text-[10px]"
                                    title="Enable User"
                                  >
                                    <UserCheck className="h-3 w-3" /> Enable
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Real-time Sandbox Action Logs terminal */}
          {isActionConsoleOpen && (
            <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" /> 
                  <span>Active Directory Sandbox Execution Log Terminal</span>
                </div>
                <button onClick={() => setIsActionConsoleOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 font-mono text-[11px] space-y-1 max-h-52 overflow-y-auto">
                {actionLogs.map((log, i) => (
                  <div key={i} className={
                    log.includes("[ERROR]") || log.includes("[FAILED]") ? "text-red-400" :
                    log.includes("[✓]") || log.includes("[Database]") || log.includes("successfully") ? "text-emerald-400" :
                    log.includes("[SIMULATION]") ? "text-amber-400" : "text-slate-350"
                  }>
                    {log}
                  </div>
                ))}
                {isActionProcessing && (
                  <div className="text-indigo-400 animate-pulse flex items-center gap-1.5 mt-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>● Contacting LDAP endpoint & executing transactions in Sandbox...</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      <ScheduleReportModal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        reportCategory={sections[0].title}
        reportOptions={sections[0].groups.flatMap(g => g.items)}
      />
    </ManagementConsoleLayout>
  );
}
