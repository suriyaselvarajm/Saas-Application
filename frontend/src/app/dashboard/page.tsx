"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Building2,
  ChevronDown,
  RefreshCw,
  ChevronRight
} from "lucide-react";

export default function Dashboard() {
  const [domain, setDomain] = useState("admanagerplus.com");

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
            <button className="flex items-center space-x-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-1 -mb-1.5">
              <Building2 className="h-4 w-4" />
              <span>Graphical View</span>
            </button>
            <button className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white pb-1">Summary View</button>
            <button className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white pb-1">Dashboard Config</button>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                    style={{ transform: 'rotate(-45deg)' }} // Simplified rotation for 32/100
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
