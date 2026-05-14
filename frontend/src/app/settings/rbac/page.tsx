"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldCheck, Plus, MoreVertical, Lock } from "lucide-react";

const roles = [
  { id: 1, name: "Super Admin", users: 2, permissions: ["All Access"] },
  { id: 2, name: "Tenant Admin", users: 5, permissions: ["Tenant Mgmt", "Settings Access", "User Mgmt"] },
  { id: 3, name: "HR Admin", users: 12, permissions: ["Onboarding", "Offboarding", "User Mgmt"] },
  { id: 4, name: "IT Admin", users: 8, permissions: ["License Mgmt", "Integrations", "Audit Logs"] },
  { id: 5, name: "Auditor", users: 3, permissions: ["Read Only Audit Logs"] },
];

export default function RbacSettings() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-outfit">Role-Based Access Control</h1>
            <p className="mt-2 text-slate-400">Define custom roles and assign granular permissions to your team.</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
            <Plus className="h-5 w-5" /> Create Custom Role
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {roles.map((role) => (
            <div key={role.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl group transition-all hover:border-indigo-500/30">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{role.name}</h3>
                    <p className="text-sm text-slate-500">{role.users} Users assigned</p>
                  </div>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="h-3 w-3" /> Permissions Matrix
                </h4>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm, index) => (
                    <span key={index} className="text-[11px] font-medium bg-slate-950 text-slate-300 border border-white/5 px-2.5 py-1 rounded-md">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <button className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Manage Permissions
                </button>
                <button className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                  View Users
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
