"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  ShieldAlert, 
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

const stats = [
  { name: 'Active Employees', value: '1,284', change: '+12%', changeType: 'increase', icon: Users },
  { name: 'Onboarding', value: '24', change: '+4', changeType: 'increase', icon: UserCheck },
  { name: 'Offboarding', value: '12', change: '-2', changeType: 'decrease', icon: UserMinus },
  { name: 'Security Alerts', value: '3', change: '0', changeType: 'neutral', icon: ShieldAlert },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">Enterprise Overview</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Real-time analytics across all your integrated identity systems.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.changeType === 'increase' ? 'text-emerald-400' : 
                  stat.changeType === 'decrease' ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {stat.changeType === 'increase' ? <ArrowUpRight className="h-3 w-3" /> : 
                   stat.changeType === 'decrease' ? <ArrowDownRight className="h-3 w-3" /> : null}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Integration Health */}
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> System Health
            </h3>
            <div className="space-y-6">
              {[
                { name: 'Microsoft Graph API', status: 'Healthy', uptime: '99.9%' },
                { name: 'Azure AD Sync', status: 'Healthy', uptime: '100%' },
                { name: 'On-premise AD (LDAP)', status: 'Healthy', uptime: '99.7%' },
                { name: 'SMTP Gateway', status: 'Healthy', uptime: '99.9%' },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{service.name}</span>
                    <span className="text-xs text-slate-500">Uptime: {service.uptime}</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Recent Activity
            </h3>
            <div className="space-y-6">
              {[
                { user: 'Admin', action: 'Modified M365 Settings', time: '2 mins ago' },
                { user: 'System', action: 'Bulk Sync Completed', time: '15 mins ago' },
                { user: 'IT_Lead', action: 'New Tenant Created: Acme', time: '1 hour ago' },
                { user: 'Auditor', action: 'Exported Security Report', time: '3 hours ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-900 dark:text-white font-medium">{activity.action}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-500">{activity.user} • {activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
