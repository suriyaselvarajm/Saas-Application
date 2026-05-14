"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Server, ShieldCheck, RefreshCw, Network, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ADSettings() {
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    adServerIp: "",
    port: 389,
    domainName: "",
    baseDn: "",
    bindUsername: "",
    bindPassword: "",
    sslEnabled: false,
    ldapPath: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.adSettings) {
          setFormData({
            adServerIp: data.adSettings.adServerIp || "",
            port: data.adSettings.port || 389,
            domainName: data.adSettings.domainName || "",
            baseDn: data.adSettings.baseDn || "",
            bindUsername: data.adSettings.bindUsername || "",
            bindPassword: data.adSettings.bindPassword || "",
            sslEnabled: data.adSettings.sslEnabled || false,
            ldapPath: data.adSettings.ldapPath || "",
          });
          setStatus("success");
        }
      }
    } catch (error) {
      console.error("Failed to fetch AD settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/settings/ad", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          ldapPath: formData.ldapPath || `LDAP://${formData.adServerIp}`,
        }),
      });
      if (res.ok) {
        alert("Settings saved successfully");
      } else {
        try {
          const errorData = await res.json();
          const message = Array.isArray(errorData.message)
            ? errorData.message[0]
            : errorData.message || "Failed to save settings";
          alert(message);
        } catch {
          alert("Failed to save settings");
        }
      }
    } catch (error) {
      console.error("Error saving AD settings", error);
      alert("Error saving AD settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/settings/ad/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setStatus("success");
          setErrorMessage("");
        } else {
          setStatus("error");
          setErrorMessage(result.message);
        }
      } else {
        setStatus("error");
        try {
          const errorData = await res.json();
          setErrorMessage(
            Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message || "Server responded with an error.",
          );
        } catch {
          setErrorMessage("Server responded with an error.");
        }
      }
    } catch (error) {
      console.error("Test failed", error);
      setStatus("error");
      setErrorMessage("Network error or server is down.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">
            Active Directory Integration
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage on-premise AD synchronization via LDAP.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-2xl">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      AD Server IP / Hostname
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.adServerIp}
                      onChange={(e) =>
                        setFormData({ ...formData, adServerIp: e.target.value })
                      }
                      placeholder="e.g. 10.0.0.5"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Port Number
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.port}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          port: parseInt(e.target.value) || 389,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Domain Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.domainName}
                      onChange={(e) =>
                        setFormData({ ...formData, domainName: e.target.value })
                      }
                      placeholder="e.g. ad.company.com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Base DN
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.baseDn}
                      onChange={(e) =>
                        setFormData({ ...formData, baseDn: e.target.value })
                      }
                      placeholder="e.g. DC=company,DC=com"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Bind Username
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bindUsername}
                    onChange={(e) =>
                      setFormData({ ...formData, bindUsername: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Bind Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.bindPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, bindPassword: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.sslEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, sslEnabled: e.target.checked })
                      }
                      className="w-4 h-4 rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-300">
                      Enable LDAPS (SSL)
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Config
                  </button>
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    {testing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Server className="h-4 w-4" />
                    )}
                    Test Connection
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-2xl">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                LDAP Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/5">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Connection
                  </span>
                  {status === "success" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      <Network className="h-3 w-3" /> Active
                    </span>
                  ) : status === "error" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
                      Failed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                      Not Configured
                    </span>
                  )}
                </div>
                {status === "error" && errorMessage && (
                  <p className="text-[10px] text-red-400/80 leading-relaxed px-1">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6 text-indigo-600/80 dark:text-indigo-200/70 text-sm">
              <h3 className="text-indigo-700 dark:text-indigo-300 font-semibold mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Security Tip
              </h3>
              Always use a dedicated Service Account with &apos;Read-only&apos;
              permissions for basic sync, or &apos;Account Operator&apos; for
              provisioning.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
