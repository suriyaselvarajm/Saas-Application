"use client";

import Sidebar from "./Sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  User, 
  HelpCircle, 
  LogOut, 
  ChevronDown, 
  Bell, 
  Search,
  Globe,
  Settings as SettingsIcon
} from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

interface UserData {
  name: string;
  email: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const isManagement = pathname?.startsWith('/management');
  const isDashboard = pathname === '/dashboard';

  useEffect(() => {
    const userStr = localStorage.getItem("petrus_user");
    if (userStr) {
      try {
        setUserData(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("petrus_token");
    localStorage.removeItem("petrus_user");
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#020617] font-inter">
      {/* Sidebar - Only show on Management pages */}
      {isManagement && (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <main className={`${isManagement ? "lg:pl-72" : ""} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
        {/* Top Header / Tabs */}
        <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 z-20">
          <div className="flex items-center justify-between px-8 h-16">
            <nav className="flex space-x-1 h-full overflow-x-auto no-scrollbar">
              <Link 
                href="/dashboard" 
                className={`px-4 h-full flex items-center text-xs font-medium transition-colors whitespace-nowrap border-b-2 ${
                  isDashboard 
                  ? "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent"
                }`}
              >
                Home
              </Link>
              <Link 
                href="/management/users" 
                className={`px-4 h-full flex items-center text-xs font-medium transition-colors whitespace-nowrap border-b-2 ${
                  isManagement 
                  ? "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent"
                }`}
              >
                Management
              </Link>
              <button className="px-4 h-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap">Reports</button>
              <button className="px-4 h-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap">Microsoft 365</button>
              <button className="px-4 h-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap">Governance</button>
              <button className="px-4 h-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap">Delegation</button>
              <button className="px-4 h-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap">Workflow</button>
              <button className="px-4 h-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap">Automation</button>
              <button className="px-4 h-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap">Admin</button>
              <button className="px-4 h-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap">Backup</button>
              <button className="px-4 h-full text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-colors whitespace-nowrap">Support</button>
            </nav>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 border-r border-slate-200 dark:border-white/10 pr-4">
                <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <Search className="h-4 w-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                </button>
                <ThemeToggle />
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-500 overflow-hidden border border-slate-300 dark:border-white/10">
                    <User className="h-5 w-5" />
                  </div>
                  <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {isProfileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsProfileOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="p-6 text-center border-b border-slate-100 dark:border-white/5">
                        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3 border border-slate-200 dark:border-white/10">
                          <User className="h-10 w-10" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{userData?.name || "adminuser"}</h4>
                        <p className="text-[10px] text-indigo-500 font-semibold mt-1">Active Sessions: 1</p>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <User className="h-4 w-4" />
                          <span>My Account</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <HelpCircle className="h-4 w-4" />
                          <span>Help</span>
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-white/5 my-2"></div>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="font-semibold">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
