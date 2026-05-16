"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Briefcase, Plus, CheckCircle2, X, Loader2, Edit2, Trash2 } from "lucide-react";

export default function DepartmentSettings() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    status: "Active"
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/settings/departments", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Failed to fetch departments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", status: "Active" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: any) => {
    setEditingId(dept.id);
    setFormData({
      name: dept.name,
      status: dept.status || "Active"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch(`http://localhost:3001/settings/departments/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchDepartments();
    } catch (error) {
      console.error("Error deleting department", error);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const url = editingId ? `http://localhost:3001/settings/departments/${editingId}` : "http://localhost:3001/settings/departments";
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
        fetchDepartments();
      }
    } catch (error) {
      console.error("Error saving department", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">Departments</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Organize your workforce into functional units and teams.</p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" /> Add Department
          </button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4 font-semibold">Department Name</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Employee Count</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {(() => {
                if (loading) {
                  return (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                      </td>
                    </tr>
                  );
                }
                if (departments.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                        No departments found.
                      </td>
                    </tr>
                  );
                }
                return departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full w-fit">
                        <CheckCircle2 className="h-3 w-3" /> {dept.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">0 Members</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenEditModal(dept)} className="text-slate-500 hover:text-indigo-500 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(dept.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? "Edit Department" : "Add Department"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="dept-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                  <input 
                    id="dept-name"
                    type="text" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="dept-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select 
                    id="dept-status"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? "Saving..." : "Save Department"}
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
