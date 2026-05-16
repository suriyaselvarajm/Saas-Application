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
  Key,
  Globe,
  MapPin,
  Briefcase,
  LogOut,
  Monitor,
  Contact,
  HardDrive,
  FileUp,
  ArrowRightLeft,
  Server
} from "lucide-react";

type Role = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'HR_ADMIN' | 'IT_ADMIN' | 'EMPLOYEE';

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'IT_ADMIN', 'EMPLOYEE'] as Role[] },
  { name: "Tenant Management", href: "/tenants", icon: Building2, allowedRoles: ['SUPER_ADMIN'] as Role[] },
  { 
    name: "Management", 
    href: "/management", 
    icon: LayoutDashboard, 
    allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'HR_ADMIN', 'IT_ADMIN'] as Role[],
    children: [
      { name: "User Management", href: "/management/users", icon: Users },
      { name: "Computer Management", href: "/management/computers", icon: Monitor },
      { name: "Group Management", href: "/management/groups", icon: Users },
      { name: "Contact Management", href: "/management/contacts", icon: Contact },
      { name: "Mailbox Management", href: "/management/mailboxes", icon: Mail },
      { name: "OU Management", href: "/management/ou", icon: Building2 },
      { name: "File Server Management", href: "/management/fileserver", icon: HardDrive },
      { name: "GPO Management", href: "/management/gpo", icon: ShieldCheck },
      { name: "CSV Import", href: "/management/csv", icon: FileUp },
      { name: "Migration", href: "/management/migration", icon: ArrowRightLeft },
      { name: "Advanced Management", href: "/management/advanced", icon: Settings },
    ]
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: Settings,
    allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] as Role[],
    children: [
      { name: "General Settings", href: "/settings/general", icon: Globe },
      { name: "M365 Integration", href: "/settings/m365", icon: Mail },
      { name: "Active Directory", href: "/settings/ad", icon: Key },
      { name: "Offices", href: "/settings/offices", icon: MapPin },
      { name: "Departments", href: "/settings/departments", icon: Briefcase },
      { name: "Auth & Security", href: "/settings/auth", icon: ShieldCheck },
      { name: "SMTP Settings", href: "/settings/smtp", icon: Mail },
    ]
  },
  { name: "Audit Logs", href: "/audit", icon: History, allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] as Role[] },
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
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("petrus_user");
      if (!userStr || userStr === "undefined") {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userStr) as User;
      setUser(parsedUser);
      setRole(
        parsedUser.systemRole ||
          (parsedUser.isSuperAdmin ? "SUPER_ADMIN" : "TENANT_ADMIN"),
      );
      setMounted(true);
    } catch (e) {
      console.error("Error reading user session", e);
      // Clear potentially corrupted data
      localStorage.removeItem("petrus_token");
      localStorage.removeItem("petrus_user");
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("petrus_token");
    localStorage.removeItem("petrus_user");
    router.push("/login");
  };

  if (!mounted) {
    return (
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-50 dark:bg-slate-950 px-6 pb-4 ring-1 ring-slate-200 dark:ring-white/10">
        <div className="flex h-16 shrink-0 items-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight">PETRUS</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-50 dark:bg-slate-950 px-6 pb-4 ring-1 ring-slate-200 dark:ring-white/10">
      <div className="flex h-16 shrink-0 items-center justify-between">
        <span className="text-2xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight">PETRUS</span>
        <ThemeToggle />
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation
                .filter(item => !role || item.allowedRoles.includes(role))
                .map((item) => {
                  const isInManagement = pathname?.startsWith('/management');
                  
                  // In Management section: Only show the "Management" item's children
                  // EXCEPT for Tenant Management which should be visible to Super Admins
                  if (isInManagement && item.name !== "Management" && item.name !== "Tenant Management") return null;
                  
                  // In other sections: Hide Management if it's not active
                  if (!isInManagement && item.name === "Management") return null;

                  return (
                    <li key={item.name}>
                      {!item.children ? (
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-all
                            ${pathname === item.href 
                              ? "bg-indigo-600 text-white shadow-sm" 
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900"}
                          `}
                        >
                          <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                          {item.name}
                        </Link>
                      ) : (
                        <>
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-6 mb-2 px-2">
                            {item.name}
                          </div>
                          <ul role="list" className="space-y-1">
                            {item.children.map((child) => (
                              <li key={child.name}>
                                <Link
                                  href={child.href}
                                  className={`
                                    group flex gap-x-3 rounded-md p-2 pl-4 text-sm font-semibold leading-6 transition-all border-l-2
                                    ${pathname === child.href 
                                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-900/50 border-indigo-600 dark:border-indigo-400" 
                                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900 border-transparent"}
                                  `}
                                >
                                  <child.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </li>
                  );
                })}
            </ul>
          </li>
          <li className="mt-auto">
            {user && (
              <div className="mb-4 p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-1 shadow-sm">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-400/10 px-2 py-1 rounded">
                    {user.systemRole?.replace('_', ' ') || "ADMIN"}
                  </span>
                  {user.tenantName && user.systemRole !== 'SUPER_ADMIN' && (
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
