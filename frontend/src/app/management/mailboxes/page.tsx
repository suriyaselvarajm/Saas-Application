"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Search, 
  ChevronDown, 
  Plus, 
  Settings
} from "lucide-react";

export default function MailboxManagementPage() {
  const [domain, setDomain] = useState("admanagerplus.com");

  useEffect(() => {
    const userStr = localStorage.getItem("petrus_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.tenantName) {
          setDomain(user.tenantName.toLowerCase() + ".com");
        } else if (user.email) {
          const emailDomain = user.email.split('@')[1];
          if (emailDomain) setDomain(emailDomain);
        }
      } catch (e) {
        console.error("Error parsing user for domain display", e);
      }
    }
  }, []);

  const sections = [
    {
      title: "Shared Mailbox Management",
      groups: [
        {
          name: "Shared Mailbox Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Shared Mailbox", "Create Bulk Shared Mailbox"]
        },
        {
          name: "Shared Mailbox Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Shared Mailbox"]
        },
        {
          name: "Shared Mailbox Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Shared Mailbox Creation Templates", "Shared Mailbox Modification Templates"]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Shared Mailbox"]
        }
      ]
    },
    {
      title: "Room Mailbox Management",
      groups: [
        {
          name: "Room Mailbox Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Room Mailbox"]
        },
        {
          name: "Room Mailbox Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Room Mailbox"]
        },
        {
          name: "Room Mailbox Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Room Mailbox Creation Templates", "Room Mailbox Modification Templates"]
        }
      ]
    },
    {
      title: "Equipment Mailbox Management",
      groups: [
        {
          name: "Equipment Mailbox Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Equipment Mailbox"]
        },
        {
          name: "Equipment Mailbox Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Equipment Mailbox"]
        },
        {
          name: "Equipment Mailbox Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Equipment Mailbox Creation Templates", "Equipment Mailbox Modification Templates"]
        }
      ]
    },
    {
      title: "Linked Mailbox Management",
      groups: [
        {
          name: "Linked Mailbox Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Linked Mailbox"]
        },
        {
          name: "Linked Mailbox Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Linked Mailbox Creation Templates"]
        }
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20">
        {/* Top Header / Action Bar */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center space-x-6 flex-1">
              <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-transparent focus-within:border-indigo-500/50 transition-all w-64 group/search">
                <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search Mailbox Tasks..." 
                  className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-500 w-full"
                />
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
              <button className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all group">
                <span>{domain}</span>
                <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
              <nav className="flex space-x-4">
                <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-0.5">Mailbox Management</button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20">
                <Plus className="h-3.5 w-3.5" /> Create Mailbox
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.title} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-3">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                {section.groups.map((group) => (
                  <div key={group.name} className="space-y-4">
                    <h3 className={`text-[13px] font-bold ${group.color} flex items-center justify-between group cursor-default`}>
                      {group.name}
                    </h3>
                    <ul className="space-y-2.5">
                      {group.items.map((item) => (
                        <li key={item}>
                          <button className="text-[13px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center group/item text-left w-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mr-2 group-hover/item:bg-indigo-500 transition-colors"></span>
                            {item}
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
      </div>
    </DashboardLayout>
  );
}
