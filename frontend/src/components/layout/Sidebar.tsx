"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  LayoutDashboard,
  Settings,
  Users,
  Building2,
  ShieldCheck,
  Mail,
  History,
  LogOut,
  Monitor,
  Contact,
  HardDrive,
  FileUp,
  ArrowRightLeft,
  BarChart,
  FileText,
  Key,
  Globe,
  Calendar,
} from "lucide-react";

type Role = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'HR_ADMIN' | 'IT_ADMIN' | 'EMPLOYEE';

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'IT_ADMIN', 'EMPLOYEE'] as Role[],
  },
  {
    name: "Tenant Management",
    href: "/tenants",
    icon: Building2,
    allowedRoles: ['SUPER_ADMIN'] as Role[],
  },
  {
    name: "Management",
    href: "/management",
    icon: Users,
    allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'IT_ADMIN'] as Role[],
    children: [
      { name: "User Management",     href: "/management/users",      icon: Users },
      { name: "Computer Management", href: "/management/computers",   icon: Monitor },
      { name: "Group Management",    href: "/management/groups",      icon: Users },
      { name: "Contact Management",  href: "/management/contacts",    icon: Contact },
      { name: "Mailbox Management",  href: "/management/mailboxes",   icon: Mail },
      { name: "OU Management",       href: "/management/ou",          icon: Building2 },
      { name: "File Server",         href: "/management/fileserver",  icon: HardDrive },
      { name: "GPO Management",      href: "/management/gpo",         icon: ShieldCheck },
      { name: "CSV Import",          href: "/management/csv",         icon: FileUp },
      { name: "Migration",           href: "/management/migration",   icon: ArrowRightLeft },
      { name: "Advanced",            href: "/management/advanced",    icon: Settings },
    ],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart,
    allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'IT_ADMIN'] as Role[],
    children: [
      { name: "User Reports",              href: "/reports/users",      icon: Users },
      { name: "Password Reports",          href: "/reports/passwords",  icon: Key },
      { name: "Group Reports",             href: "/reports/groups",     icon: Users },
      { name: "Computer Reports",          href: "/reports/computers",  icon: Monitor },
      { name: "Exchange Reports",          href: "/reports/exchange",   icon: Mail },
      { name: "Contact & OU Reports",      href: "/reports/contacts",   icon: Contact },
      { name: "GPO Reports",               href: "/reports/gpo",        icon: ShieldCheck },
      { name: "NTFS & Security Reports",   href: "/reports/ntfs",       icon: ShieldCheck },
      { name: "Other Reports",             href: "/reports/other",      icon: FileText },
      { name: "Compliance Reports",        href: "/reports/compliance", icon: ShieldCheck },
      { name: "Google Workspace Reports",  href: "/reports/google",     icon: Globe },
      { name: "Custom Reports",            href: "/reports/custom",     icon: Settings },
    ],
  },
  {
    name: "Audit Logs",
    href: "/audit",
    icon: History,
    allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] as Role[],
  },
];

interface User {
  id: string;
  name: string;
  email: string;
  systemRole: Role;
  tenantName?: string;
  isSuperAdmin?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const userStr = localStorage.getItem("petrus_user");
      if (!userStr || userStr === "undefined") {
        router.push("/login");
        return;
      }
      const parsedUser = JSON.parse(userStr) as User;
      setUser(parsedUser);
    } catch (e) {
      console.error("Error reading user session", e);
      localStorage.removeItem("petrus_token");
      localStorage.removeItem("petrus_user");
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("petrus_token");
    localStorage.removeItem("petrus_user");
    router.push("/login");
  };

  const isM365 = pathname?.startsWith('/m365');
  const isM365Reports = pathname?.startsWith('/m365/reports') || pathname === '/m365';
  const isM365Management = pathname?.startsWith('/m365/management');
  const isDelegation = pathname?.startsWith('/delegation');

  const renderSidebarContent = () => {
    if (isM365) {
      const groups = isM365Reports ? [
        {
          header: "Azure Active Directory",
          items: [
            { name: "User Reports", href: "/m365/reports/users", icon: Users },
            { name: "Group Reports", href: "/m365/reports/groups", icon: Users },
            { name: "Contact Reports", href: "/m365/reports/contacts", icon: Contact },
            { name: "License Reports", href: "/m365/reports/licenses", icon: FileText }
          ]
        },
        {
          header: "Exchange Online",
          items: [
            { name: "OWA Reports", href: "/m365/reports/owa", icon: Globe }
          ]
        },
        {
          header: "Other Services",
          items: [
            { name: "Security Reports", href: "/m365/reports/security", icon: ShieldCheck }
          ]
        }
      ] : [
        {
          header: "Azure Active Directory",
          items: [
            { name: "User Management", href: "/m365/management/users", icon: Users },
            { name: "Group Management", href: "/m365/management/groups", icon: Users },
            { name: "Contact Management", href: "/m365/management/contacts", icon: Contact },
            { name: "License Management", href: "/m365/management/licenses", icon: FileText }
          ]
        },
        {
          header: "Exchange Online",
          items: [
            { name: "Mailbox Management", href: "/m365/management/mailboxes", icon: Mail },
            { name: "Shared Mailbox Management", href: "/m365/management/shared-mailboxes", icon: Mail },
            { name: "Calendar Management", href: "/m365/management/calendars", icon: Calendar }
          ]
        }
      ];

      return groups.map((g) => (
        <div key={g.header} className="space-y-1 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-3 py-1">
            {g.header}
          </span>
          {g.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name} className="list-none">
                <Link
                  href={item.href}
                  className={`group flex gap-x-3 rounded-md px-3 py-2 text-sm font-medium leading-6 transition-all ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </div>
      ));
    }

    if (isDelegation) {
      const groups = [
        {
          header: "Help Desk Delegation",
          items: [
            { name: "Help Desk Technicians", href: "/delegation/technicians", icon: Users },
            { name: "Help Desk Roles", href: "/delegation/roles", icon: ShieldCheck }
          ]
        },
        {
          header: "Help Desk Audit Reports",
          items: [
            { name: "Audit Report", href: "/delegation/audit", icon: FileText },
            { name: "Admin Audit Report", href: "/delegation/admin-audit", icon: ShieldCheck }
          ]
        },
        {
          header: "Configuration",
          items: [
            { name: "Logon Settings", href: "/delegation/logon-settings", icon: Settings }
          ]
        },
        {
          header: "Help Desk Reports",
          items: [
            { name: "Technicians Report", href: "/delegation/technicians-report", icon: FileText },
            { name: "Technician Logon Report", href: "/delegation/technicians-logon", icon: History }
          ]
        }
      ];

      return groups.map((g) => (
        <div key={g.header} className="space-y-1 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-3 py-1">
            {g.header}
          </span>
          {g.items.map((item) => {
            const isActive = pathname === item.href || (item.href === "/delegation/technicians" && (pathname === "/delegation" || pathname === "/delegation/"));
            return (
              <li key={item.name} className="list-none">
                <Link
                  href={item.href}
                  className={`group flex gap-x-3 rounded-md px-3 py-2 text-sm font-medium leading-6 transition-all ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </div>
      ));
    }

    // Standard AD rendering
    const activeTopLevel = navigation.find(
      (item) => pathname?.startsWith(item.href) && item.children
    );
    const itemsToRender = activeTopLevel?.children || [];

    return itemsToRender.map((item) => {
      const isActive = pathname === item.href;
      return (
        <li key={item.name}>
          <Link
            href={item.href}
            className={`group flex gap-x-3 rounded-md px-3 py-2 text-sm font-medium leading-6 transition-all ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {item.name}
          </Link>
        </li>
      );
    });
  };

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-50 dark:bg-slate-950 px-6 pb-4 ring-1 ring-slate-200 dark:ring-white/10">
      <div className="flex h-16 shrink-0 items-center justify-between">
        <span className="text-2xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight">PETRUS</span>
        <ThemeToggle />
      </div>

      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-1">

          {isM365 && (
            <div className="flex border-b border-slate-200 dark:border-white/10 pb-4 mb-4 gap-2">
              <Link
                href="/m365/reports/users"
                className={`flex-1 flex flex-col items-center py-2 px-1 text-center rounded-xl transition-all border ${
                  isM365Reports
                    ? "bg-indigo-50 dark:bg-indigo-400/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <BarChart className="h-4 w-4 mb-1" />
                <span className="text-[10px] font-bold tracking-wide">Reports</span>
              </Link>
              <Link
                href="/m365/management/users"
                className={`flex-1 flex flex-col items-center py-2 px-1 text-center rounded-xl transition-all border ${
                  isM365Management
                    ? "bg-indigo-50 dark:bg-indigo-400/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <Users className="h-4 w-4 mb-1" />
                <span className="text-[10px] font-bold tracking-wide">Management</span>
              </Link>
            </div>
          )}

          {renderSidebarContent()}

          {/* Push logout to bottom */}
          <li className="mt-auto pt-6">
            {mounted && user && (
              <div className="mb-4 p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-1 shadow-sm">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 px-2 py-1 rounded">
                    {user.systemRole?.replace("_", " ") || "ADMIN"}
                  </span>
                  {user.tenantName && user.systemRole !== "SUPER_ADMIN" && (
                    <span className="text-[10px] text-slate-500 truncate max-w-[100px]" title={user.tenantName}>
                      {user.tenantName}
                    </span>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="group flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <LogOut className="h-6 w-6 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white" aria-hidden="true" />
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
