"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import { Search, ChevronDown, Plus, Settings } from "lucide-react";

interface Group {
  name: string;
  color?: string;
  items: string[];
}

interface Section {
  title: string;
  groups: Group[];
}

interface Tab {
  name: string;
  active: boolean;
}

interface ManagementConsoleLayoutProps {
  sections: Section[];
  searchPlaceholder: string;
  primaryActionLabel?: string;
  primaryActionIcon?: React.ReactNode;
  tabs?: Tab[];
  onItemClick?: (item: string) => void;
  onPrimaryActionClick?: () => void;
  children?: React.ReactNode;
}

export default function ManagementConsoleLayout({
  sections,
  searchPlaceholder,
  primaryActionLabel = "Create",
  primaryActionIcon,
  tabs = [],
  onItemClick,
  onPrimaryActionClick,
  children
}: ManagementConsoleLayoutProps) {
  const [domain, setDomain] = useState("admanagerplus.com");

  useEffect(() => {
    const userStr = localStorage.getItem("petrus_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.tenantName) {
          setDomain(user.tenantName.toLowerCase() + ".com");
        } else if (user.email) {
          const emailDomain = user.email.split("@")[1];
          if (emailDomain) setDomain(emailDomain);
        }
      } catch (e) {
        console.error("Error parsing user for domain display", e);
      }
    }
  }, []);

  const handleItemClick = (item: string) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      alert(`${item} functionality is coming soon.`);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative space-y-10 pb-20 overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse duration-[8000ms]"></div>
        <div className="absolute bottom-1/3 left-1/10 w-[250px] h-[250px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[80px] pointer-events-none -z-10"></div>

        {/* Top Header / Action Bar */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-xl shadow-slate-100/50 dark:shadow-none p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <div className="flex items-center space-x-3 bg-slate-100/80 dark:bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-200/30 dark:border-white/5 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all w-72 group/search">
                <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder={searchPlaceholder}
                  className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-500 w-full"
                />
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>
              <button className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200/30 dark:border-white/5 px-4 py-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{domain}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
              {tabs.length > 0 && (
                <>
                  <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>
                  <nav className="flex space-x-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.name}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                          tab.active
                            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3 self-end md:self-auto">
              <button 
                onClick={onPrimaryActionClick}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                {primaryActionIcon || <Plus className="h-4 w-4" />} {primaryActionLabel}
              </button>
              <button className="p-2.5 bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200/30 dark:border-white/5 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.title} className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="h-6 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/50"></div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {section.title}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {section.groups.map((group) => (
                  <div key={group.name} className="relative group overflow-hidden bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 rounded-2xl p-5 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1">
                    {/* Decorative glowing gradient top-border */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                    
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-4">
                      <span>{group.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    </h3>
                    
                    <ul className="space-y-3">
                      {group.items.map((item) => (
                        <li key={item}>
                          <button 
                            onClick={() => handleItemClick(item)}
                            className="w-full text-left text-[12.5px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 flex items-center group/item"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mr-2.5 group-hover/item:w-3 group-hover/item:bg-indigo-500 transition-all duration-200"></span>
                            <span className="group-hover/item:translate-x-1 transition-transform duration-200">{item}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {children}
      </div>
    </DashboardLayout>
  );
}
