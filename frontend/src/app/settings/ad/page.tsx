"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Server, ShieldCheck, RefreshCw, Network, Loader2, HelpCircle, Plus, Edit2, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function ADSettings() {
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [adList, setAdList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  
  const initialFormState = {
    adServerIp: "",
    port: 389,
    domainName: "",
    baseDn: "",
    bindUsername: "",
    bindPassword: "",
    sslEnabled: false,
    ldapPath: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchSettings();
    try {
      const u = JSON.parse(localStorage.getItem("petrus_user") || "{}");
      setUser(u);
    } catch (e) {}
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
          const list = Array.isArray(data.adSettings) ? data.adSettings : [data.adSettings];
          setAdList(list);
          if (list.length === 0) setShowForm(true);
        } else {
          setShowForm(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch AD settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.SyntheticEvent) => {
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
          id: editingId,
          ldapPath: formData.ldapPath || `LDAP://${formData.adServerIp}`,
        }),
      });
      if (res.ok) {
        alert("Settings saved successfully");
        fetchSettings();
        setShowForm(false);
        setEditingId(null);
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

  const handleDeleteClick = (id: string) => {
    setAdToDelete(id);
    setDeleteInput("");
    setDeleteModalOpen(true);
  };

  const confirmDelete = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!adToDelete) return;

    setDeleting(true);
    if (user?.mfaEnabled) {
      if (deleteInput.length !== 6) {
        alert("Please enter a valid 6-digit MFA code.");
        setDeleting(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:3001/auth/mfa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, token: deleteInput }),
        });
        if (!res.ok) {
          alert("Invalid MFA code.");
          setDeleting(false);
          return;
        }
      } catch (err) {
        alert("MFA verification failed.");
        setDeleting(false);
        return;
      }
    } else {
      if (deleteInput !== "delete") {
        alert('Please type "delete" to confirm.');
        setDeleting(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("petrus_token");
      await fetch(`http://localhost:3001/settings/ad/${adToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSettings();
      setDeleteModalOpen(false);
      setAdToDelete(null);
    } catch (error) {
      console.error("Failed to delete", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (ad: any) => {
    setFormData(ad);
    setEditingId(ad.id);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setShowForm(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit">
              Active Directory Settings
            </h1>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Help">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-6 flex space-x-6 border-b border-slate-200 dark:border-white/10">
            <button className="pb-3 border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
              Active Directory
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Configured Domains</h2>
          {!showForm && (
            <button 
              onClick={handleAddNew}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Domain Details
            </button>
          )}
        </div>

        {adList.length > 0 && !showForm && (
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-2xl overflow-hidden mb-8">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold">
                <tr>
                  <th className="px-6 py-4">Domain Name</th>
                  <th className="px-6 py-4">AD Server IP</th>
                  <th className="px-6 py-4">Base DN</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {adList.map((ad, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{ad.domainName}</td>
                    <td className="px-6 py-4">{ad.adServerIp}:{ad.port}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{ad.baseDn}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => handleEdit(ad)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                        <Edit2 className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => handleDeleteClick(ad.id)} className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400">
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Domain Details' : 'Add Domain Details'}</h3>
                {adList.length > 0 && (
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Cancel</button>
                )}
              </div>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="ad-server-ip" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      AD Server IP / Hostname
                    </label>
                    <input
                      id="ad-server-ip"
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
                    <label htmlFor="ad-port" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Port Number
                    </label>
                    <input
                      id="ad-port"
                      type="number"
                      required
                      value={formData.port}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          port: Number.parseInt(e.target.value) || 389,
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="ad-domain" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Domain Name
                    </label>
                    <input
                      id="ad-domain"
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
                    <label htmlFor="ad-base-dn" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Base DN
                    </label>
                    <input
                      id="ad-base-dn"
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
                  <label htmlFor="ad-bind-user" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Bind Username
                  </label>
                  <input
                    id="ad-bind-user"
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
                  <label htmlFor="ad-bind-pass" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Bind Password
                  </label>
                  <input
                    id="ad-bind-pass"
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
                    <label htmlFor="ad-ssl" className="text-sm text-slate-600 dark:text-slate-300">
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
                  {(() => {
                    if (status === "success") {
                      return (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                          <Network className="h-3 w-3" /> Active
                        </span>
                      );
                    }
                    if (status === "error") {
                      return (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
                          Failed
                        </span>
                      );
                    }
                    return (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                        Not Configured
                      </span>
                    );
                  })()}
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
        )}

        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">Confirm Deletion</h2>
                <button type="button" onClick={() => setDeleteModalOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={confirmDelete} className="p-6 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete this AD integration? This action cannot be undone.
                </p>
                <div>
                  <label htmlFor="delete-confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {user?.mfaEnabled ? "Enter 6-digit MFA Code" : "Type 'delete' to confirm"}
                  </label>
                  <input
                    id="delete-confirm"
                    type="text"
                    required
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder={user?.mfaEnabled ? "000000" : "delete"}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setDeleteModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={deleting} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Delete
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
