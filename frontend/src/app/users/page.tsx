"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users } from "lucide-react";

export default function UserManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-8 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit mb-4">User Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              This module is being rebuilt to support cross-tenant Active Directory and M365 provisioning logic.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-16 shadow-sm dark:shadow-2xl flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-indigo-500/10 rounded-full text-indigo-400 mb-6">
            <Users className="h-12 w-12" />
          </div>
          <p className="text-slate-400 max-w-md">
            The User Management module is currently being finalized. You will soon be able to manage AD and M365 identities here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
