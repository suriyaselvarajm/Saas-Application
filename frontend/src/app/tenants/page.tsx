"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Search, Building2, Globe, Users, X, Loader2, Edit2, Trash2, Key } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  tenantCode: string;
  companyName: string;
  domainName: string;
  status: string;
  subscriptionType?: string;
  users?: { id: string; systemRole: string; email: string }[];
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit/Reset State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    tenantCode: "",
    companyName: "",
    domainName: "",
    adminEmail: "",
    initialPassword: "",
  });
 
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/tenants", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (error) {
      console.error("Failed to fetch tenants", error);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    void fetchTenants();
  }, []);
 
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", tenantCode: "", companyName: "", domainName: "", adminEmail: "", initialPassword: "" });
    setIsModalOpen(true);
  };
 
  const handleOpenEditModal = (tenant: Tenant) => {
    const adminUser = tenant.users?.find(
      (u) => u.systemRole === "TENANT_ADMIN",
    );
    setEditingId(tenant.id);
    setFormData({
      name: tenant.name,
      tenantCode: tenant.tenantCode,
      companyName: tenant.companyName,
      domainName: tenant.domainName,
      adminEmail: adminUser?.email || "",
      initialPassword: "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch(`http://localhost:3001/tenants/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchTenants();
      } else {
        alert("Failed to delete tenant");
      }
    } catch (error) {
      console.error("Error deleting tenant", error);
    }
  };

  const handleResetPasswordAdmin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/auth/reset-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId: resetUserId, newPassword: resetPassword }),
      });
      if (res.ok) {
        setIsResetModalOpen(false);
        setResetPassword("");
        alert("Password reset successfully. The user will be forced to change it on their next login.");
      } else {
        alert("Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const url = editingId 
      ? `http://localhost:3001/tenants/${editingId}`
      : "http://localhost:3001/tenants";
      
    const method = editingId ? "PATCH" : "POST";

    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: "", tenantCode: "", companyName: "", domainName: "", adminEmail: "", initialPassword: "" });
        setEditingId(null);
        fetchTenants();
      } else {
        alert(`Failed to ${editingId ? "update" : "add"} tenant`);
      }
    } catch (error) {
      console.error(`Error ${editingId ? "updating" : "creating"} tenant`, error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAdminPasswordClick = (tenant: any) => {
    const adminUser = tenant.users?.find((u: any) => u.systemRole === "TENANT_ADMIN");
    if (adminUser) {
      setResetUserId(adminUser.id);
      setIsResetModalOpen(true);
    } else {
      alert("No tenant admin found for this organization.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">Tenant Management</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Manage all customer tenants and their isolation settings.</p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" /> Add Tenant
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Tenants</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenants.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Domains</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenants.filter(t => t.status === "ACTIVE").length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="Search tenants..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Tenant Name</th>
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {(() => {
                if (loading) {
                  return (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading tenants...
                      </td>
                    </tr>
                  );
                }
                if (tenants.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        No tenants found. Click &quot;Add Tenant&quot; to create one.
                      </td>
                    </tr>
                  );
                }
                return tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{tenant.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-500">{tenant.domainName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 px-2 py-1 rounded">
                        {tenant.tenantCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{tenant.subscriptionType}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        tenant.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400"
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {tenant.tenantCode !== "MASTER" && (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleResetAdminPasswordClick(tenant)}
                            className="text-slate-500 hover:text-amber-400 transition-colors"
                            title="Reset Admin Password"
                          >
                            <Key className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(tenant)}
                            className="text-slate-500 hover:text-indigo-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Tenant Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">
                  {editingId ? "Edit Tenant" : "Add New Tenant"}
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label htmlFor="tenant-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tenant Name</label>
                  <input 
                    id="tenant-name"
                    type="text" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="tenant-company" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                  <input 
                    id="tenant-company"
                    type="text" required
                    value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="tenant-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tenant Code (Unique)</label>
                  <input 
                    id="tenant-code"
                    type="text" required
                    disabled={!!editingId} // Usually can't change code after creation
                    value={formData.tenantCode} onChange={e => setFormData({...formData, tenantCode: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="tenant-domain" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Domain Name</label>
                  <input 
                    id="tenant-domain"
                    type="text" required
                    value={formData.domainName} onChange={e => setFormData({...formData, domainName: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="tenant-admin-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Admin Email</label>
                  <input 
                    id="tenant-admin-email"
                    type="email" required
                    value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none"
                    placeholder="e.g. admin@customer.com"
                  />
                </div>
                {!editingId && (
                  <div>
                    <label htmlFor="tenant-init-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Password</label>
                    <input 
                      id="tenant-init-password"
                      type="text" required
                      value={formData.initialPassword} onChange={e => setFormData({...formData, initialPassword: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none"
                      placeholder="Enter temporary password"
                    />
                  </div>
                )}
                <div className="pt-4 flex gap-3 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting && "Saving..."}
                    {!submitting && editingId && "Save Changes"}
                    {!submitting && !editingId && "Create Tenant"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">Reset Admin Password</h2>
                <button onClick={() => setIsResetModalOpen(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleResetPasswordAdmin} className="p-6 space-y-4">
                <div>
                  <label htmlFor="reset-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <input 
                    id="reset-password"
                    type="text" required
                    value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 outline-none"
                    placeholder="Enter new temporary password"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsResetModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? "Resetting..." : "Reset Password"}
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
