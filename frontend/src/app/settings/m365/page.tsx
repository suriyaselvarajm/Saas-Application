"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Cloud, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function M365Settings() {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleTest = async () => {
    setTesting(true);
    // Simulate API call
    setTimeout(() => {
      setTesting(false);
      setStatus("success");
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">Microsoft 365 Integration</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Configure your Azure AD / Entra ID connection for seamless identity sync.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-2xl">
              <form className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Azure Tenant ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 8f45..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Microsoft Domain</label>
                    <input 
                      type="text" 
                      placeholder="e.g. company.onmicrosoft.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Client ID (App ID)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Client Secret</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Redirect URL</label>
                  <input 
                    type="text" 
                    defaultValue="https://petrus.yourdomain.com/auth/callback"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Save Configuration
                  </button>
                  <button 
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                    Test Connection
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Status & Help */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                Connection Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/5">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Graph API</span>
                  {status === "success" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-400/10 px-2 py-1 rounded-full">
                      Not Configured
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/5">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Sync Status</span>
                  <span className="text-xs font-medium text-slate-500 px-2 py-1">Idle</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6">
              <h3 className="text-indigo-700 dark:text-indigo-300 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Required Permissions
              </h3>
              <ul className="text-sm text-indigo-600/80 dark:text-indigo-200/70 space-y-2 list-disc pl-4">
                <li>User.Read.All</li>
                <li>Group.ReadWrite.All</li>
                <li>Directory.ReadWrite.All</li>
                <li>Domain.Read.All</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
