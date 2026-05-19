"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Building2,
  ChevronDown,
  RefreshCw,
  ChevronRight,
  Download
} from "lucide-react";

export default function Dashboard() {
  const [domain, setDomain] = useState("admanagerplus.com");
  const [activeTab, setActiveTab] = useState<"graphical" | "summary" | "config">("graphical");
  const [isSaved, setIsSaved] = useState(false);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Sub Header */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-6 py-3 shadow-sm">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab("graphical")}
              className={`flex items-center space-x-2 text-sm font-semibold pb-1 -mb-1.5 transition-all ${
                activeTab === "graphical" 
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Graphical View</span>
            </button>
            <button 
              onClick={() => setActiveTab("summary")}
              className={`text-sm font-semibold pb-1 transition-all ${
                activeTab === "summary" 
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Summary View
            </button>
            <button 
              onClick={() => setActiveTab("config")}
              className={`text-sm font-semibold pb-1 transition-all ${
                activeTab === "config" 
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Dashboard Config
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 transition-colors">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Domain:</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{domain}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <RefreshCw className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Graphical View Content */}
        {activeTab === "graphical" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Reports */}
                <ReportCard 
                  title="User Reports" 
                  data={[
                    { label: "Number of users", value: 16, total: 20, color: "bg-cyan-400" },
                    { label: "Inactive users in 30 days", value: 0, total: 20, color: "bg-emerald-400" },
                    { label: "Disabled Users", value: 12, total: 20, color: "bg-rose-400" },
                    { label: "Locked-out Users", value: 0, total: 20, color: "bg-blue-400" },
                    { label: "Password Expired Users", value: 0, total: 20, color: "bg-indigo-400" },
                  ]}
                />

                {/* System Reports */}
                <ReportCard 
                  title="System Reports" 
                  data={[
                    { label: "Number of computers", value: 2, total: 5, color: "bg-cyan-400" },
                    { label: "Inactive computers in 30 days", value: 0, total: 5, color: "bg-emerald-400" },
                    { label: "Disabled Computers", value: 0, total: 5, color: "bg-rose-400" },
                    { label: "Number of workstation", value: 2, total: 5, color: "bg-blue-400" },
                    { label: "Number of domain controllers", value: 0, total: 5, color: "bg-indigo-400" },
                  ]}
                />

                {/* Logged On User Report */}
                <ReportCard 
                  title="Logged On User Report" 
                  horizontal
                  data={[
                    { label: "Users Never Logged On", value: 0, color: "bg-cyan-400" },
                    { label: "Recently logged on users in 30 days", value: 0, color: "bg-emerald-400" },
                    { label: "Recently bad logged on users in 30 days", value: 1, color: "bg-rose-400" },
                    { label: "Soon to password expire users in 7 days", value: 0, color: "bg-blue-400" },
                    { label: "Soon to account expired users in 30 days", value: 0, color: "bg-indigo-400" },
                  ]}
                />

                {/* Group and OU reports */}
                <ReportCard 
                  title="Group and OU reports" 
                  horizontal
                  data={[
                    { label: "Number of groups", value: 22, color: "bg-cyan-400" },
                    { label: "Number of security groups", value: 20, color: "bg-emerald-400" },
                    { label: "Number of distribution groups", value: 2, color: "bg-rose-400" },
                    { label: "Number of groups without members", value: 0, color: "bg-blue-400" },
                    { label: "Number of OUs", value: 1, color: "bg-indigo-400" },
                  ]}
                />
              </div>
            </div>

            {/* Right Sidebar Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Risk Score */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">Risk Score</h3>
                <div className="relative flex flex-col items-center">
                  <div className="w-40 h-20 overflow-hidden relative">
                    <div className="w-40 h-40 border-[16px] border-slate-100 dark:border-slate-800 rounded-full"></div>
                    <div 
                      className="absolute top-0 left-0 w-40 h-40 border-[16px] border-emerald-400 rounded-full clip-half"
                      style={{ transform: 'rotate(-45deg)' }} 
                    ></div>
                  </div>
                  <div className="absolute top-10 flex flex-col items-center">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">32<span className="text-lg text-slate-400">/100</span></span>
                    <span className="text-xs font-semibold text-emerald-500 uppercase mt-1">Low Risk</span>
                  </div>
                  <button className="mt-8 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Analyze Now</button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">AD Management</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between group cursor-pointer">
                      <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-indigo-500">Account Provisioning</span>
                      <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-indigo-500" />
                    </li>
                    <li className="flex items-center justify-between group cursor-pointer">
                      <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-indigo-500">Account Deprovisioning</span>
                      <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-indigo-500" />
                    </li>
                  </ul>
                  <button className="mt-4 text-[10px] font-bold text-slate-400 uppercase float-right">More</button>
                </div>
                <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">AD Reports</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between group cursor-pointer">
                      <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-indigo-500">All Users Report</span>
                      <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-indigo-500" />
                    </li>
                    <li className="flex items-center justify-between group cursor-pointer">
                      <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-indigo-500">Inactive Users Report</span>
                      <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-indigo-500" />
                    </li>
                  </ul>
                  <button className="mt-4 text-[10px] font-bold text-slate-400 uppercase float-right">More</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary View Content */}
        {activeTab === "summary" && (
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6 animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Active Directory Directory Summary</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Platform-wide overview of provisioned objects and compliance states</p>
              </div>
              <button className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-white/5 px-4 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all self-start sm:self-auto">
                <Download className="h-3.5 w-3.5" />
                <span>Export Summary</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-4">Category</th>
                    <th className="pb-3">Metric Parameter</th>
                    <th className="pb-3 text-right pr-6">Value</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-4 font-bold text-indigo-600 dark:text-indigo-400">User Management</td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">Total Provisioned Users</td>
                    <td className="py-4 text-right font-extrabold text-slate-900 dark:text-white pr-6">16</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">Optimal</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-4 font-bold text-indigo-600 dark:text-indigo-400">User Management</td>
                    <td className="py-4 text-rose-600 dark:text-rose-400 font-semibold">Disabled User Accounts</td>
                    <td className="py-4 text-right font-extrabold text-rose-600 dark:text-rose-400 pr-6">12</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">Attention Required</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-4 font-bold text-indigo-600 dark:text-indigo-400">User Management</td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">Inactive Users (30 Days)</td>
                    <td className="py-4 text-right font-extrabold text-slate-900 dark:text-white pr-6">0</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">Optimal</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-4 font-bold text-purple-600 dark:text-purple-400">Computers & Systems</td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">Total Workstations & Servers</td>
                    <td className="py-4 text-right font-extrabold text-slate-900 dark:text-white pr-6">2</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">Active</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-4 font-bold text-purple-600 dark:text-purple-400">Computers & Systems</td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">Domain Controllers Online</td>
                    <td className="py-4 text-right font-extrabold text-slate-900 dark:text-white pr-6">0</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-4 font-bold text-emerald-600 dark:text-emerald-400">Groups & OUs</td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">Total Security Groups</td>
                    <td className="py-4 text-right font-extrabold text-slate-900 dark:text-white pr-6">20</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">Synced</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pl-4 font-bold text-emerald-600 dark:text-emerald-400">Groups & OUs</td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">Organizational Units</td>
                    <td className="py-4 text-right font-extrabold text-slate-900 dark:text-white pr-6">1</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">Optimal</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dashboard Config Content */}
        {activeTab === "config" && (
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6 max-w-3xl animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60"></div>
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Dashboard Configurations</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Customize metrics thresholds, visibility states, and risk calculation weights</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setIsSaved(true);
              setTimeout(() => setIsSaved(false), 2000);
            }} className="space-y-6">
              
              {/* Threshold Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="inactivity-threshold" className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Inactivity Period Threshold</label>
                  <select id="inactivity-threshold" className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-all">
                    <option value="30">30 Days (Recommended)</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="expiry-threshold" className="text-xs font-bold text-slate-700 dark:text-slate-300">Password Expiry Alert Period</label>
                  <select id="expiry-threshold" className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-all">
                    <option value="7">7 Days ahead</option>
                    <option value="14">14 Days ahead</option>
                    <option value="30">30 Days ahead</option>
                  </select>
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Visible Widgets</h4>
                
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Graphical Active Directory Status Charts</span>
                    <input type="checkbox" defaultChecked className="accent-indigo-600 h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Domain Risk Score Gauge & Health Report</span>
                    <input type="checkbox" defaultChecked className="accent-indigo-600 h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-200/50 dark:border-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Directory Actions Side-Panel</span>
                    <input type="checkbox" defaultChecked className="accent-indigo-600 h-4 w-4" />
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                {isSaved ? (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 animate-bounce">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Configurations Saved Successfully!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Settings will be stored locally in context.</span>
                )}
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ReportCard({ title, data, horizontal = false }: Readonly<{ title: string, data: any[], horizontal?: boolean }>) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
        <RefreshCw className="h-3 w-3 text-slate-300 hover:text-indigo-500 cursor-pointer" />
      </div>
      
      {horizontal ? (
        <div className="space-y-4">
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{item.label}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`${item.color} h-full transition-all duration-500`}
                    style={{ width: `${(item.value / maxVal) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-end space-x-4 h-32 px-4">
            {data.map((item) => (
              <div key={item.label} className="flex-1 flex flex-col items-center group">
                <div 
                  className={`${item.color} w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110`}
                  style={{ height: `${(item.value / (item.total || maxVal)) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                ></div>
              </div>
            ))}
          </div>
          <div className="space-y-2 mt-4">
            {data.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`}></div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{item.label}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
