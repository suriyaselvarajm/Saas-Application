"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MapPin, Plus, Globe, X, Loader2, Edit2, Trash2 } from "lucide-react";

const COUNTRIES_LIST = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Singapore",
  "Germany",
  "France",
  "Japan",
  "United Arab Emirates",
  "Netherlands",
  "Switzerland",
  "South Africa",
  "Brazil"
];

export default function OfficeSettings() {
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    isDefault: false
  });

  const fetchOffices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/settings/offices", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOffices(data);
      }
    } catch (error) {
      console.error("Failed to fetch offices", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", address: "", city: "", state: "", zipCode: "", country: "India", isDefault: false });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (office: any) => {
    setEditingId(office.id);
    setFormData({
      name: office.name,
      address: office.address || "",
      city: office.city || "",
      state: office.state || "",
      zipCode: office.zipCode || "",
      country: office.country || "India",
      isDefault: office.isDefault || false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this office?")) return;
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch(`http://localhost:3001/settings/offices/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchOffices();
    } catch (error) {
      console.error("Error deleting office", error);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const url = editingId ? `http://localhost:3001/settings/offices/${editingId}` : "http://localhost:3001/settings/offices";
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
        fetchOffices();
      }
    } catch (error) {
      console.error("Error saving office", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">Office Locations</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Manage your global office presence and regional headquarters.</p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" /> Add Office
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offices.map((office) => (
              <div key={office.id} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
                {office.isDefault && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                    Default
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEditModal(office)} className="text-slate-500 hover:text-indigo-500 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(office.id)} className="text-slate-500 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{office.name}</h3>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-6">
                  <p>{office.address}</p>
                  <p>{office.city}, {office.state} {office.zipCode}</p>
                  <p className="flex items-center gap-1 mt-2 text-slate-500 italic">
                    <Globe className="h-3 w-3" /> {office.country}
                  </p>
                </div>
                <button 
                  onClick={() => handleOpenEditModal(office)}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Edit Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? "Edit Office" : "Add Office"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="office-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Office Name</label>
                  <input 
                    id="office-name"
                    type="text" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="office-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                  <input 
                    id="office-address"
                    type="text"
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="office-city" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                    <input 
                      id="office-city"
                      type="text"
                      value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="office-state" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State</label>
                    <input 
                      id="office-state"
                      type="text"
                      value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="office-zip" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zip/Pin Code</label>
                    <input 
                      id="office-zip"
                      type="text"
                      value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="relative">
                    <label htmlFor="office-country" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                    <input 
                      id="office-country"
                      type="text"
                      placeholder="Type or select country..."
                      value={formData.country} 
                      onFocus={() => setShowCountrySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 250)}
                      onChange={e => {
                        setFormData({...formData, country: e.target.value});
                        setShowCountrySuggestions(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {showCountrySuggestions && (
                      <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 py-1.5 scrollbar-thin">
                        {COUNTRIES_LIST.filter(c =>
                          c.toLowerCase().includes((formData.country || "").toLowerCase())
                        ).length > 0 ? (
                          COUNTRIES_LIST.filter(c =>
                            c.toLowerCase().includes((formData.country || "").toLowerCase())
                          ).map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, country: c }));
                                setShowCountrySuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition-colors block"
                            >
                              {c}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-500 italic">
                            No matching countries
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="office-default" className="text-sm text-slate-700 dark:text-slate-300">Set as Default Office</label>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? "Saving..." : "Save Office"}
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
