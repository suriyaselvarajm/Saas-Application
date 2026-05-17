"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Search, 
  ChevronDown, 
  Settings,
  Download
} from "lucide-react";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";

interface M365ReportGroup {
  name: string;
  items: string[];
}

interface M365CategoryData {
  title: string;
  groups: M365ReportGroup[];
}

const m365ReportsData: Record<string, M365CategoryData> = {
  users: {
    title: "User Reports",
    groups: [
      {
        name: "General User Reports",
        items: [
          "Microsoft 365 Users",
          "Cloud Users",
          "Synced Users",
          "Deleted Users",
          "All Managers",
          "Users With Managers",
          "Users Without Managers",
          "User with Empty Attributes",
          "Users with Same Attribute Values",
          "Recently Created Users",
          "Recently Modified Users",
          "Recently Deleted Users",
          "User Created Objects",
          "Users with DirSync Provisioning Error",
          "Exchange Online Users",
          "Guest Users",
          "Users with Photo",
          "Users without Photo"
        ]
      },
      {
        name: "Password Status",
        items: [
          "Never Expiring Passwords",
          "Password Expired Users",
          "Soon To Expire Passwords",
          "Password Changed Users",
          "Password Unchanged Users",
          "MFA Status",
          "Recently Password Reset Users",
          "Recently Password Changed Users",
          "Forced Password Change",
          "MFA Enabled Users",
          "MFA Disabled Users",
          "MFA Registration Details"
        ]
      },
      {
        name: "User Logon Reports",
        items: [
          "Users Inactive for 30 Days",
          "Users Inactive for 90 Days",
          "Last Logon Details"
        ]
      },
      {
        name: "Account Status Reports",
        items: [
          "Blocked Users",
          "Sign-in Enabled Users",
          "Sign-in Disabled Users"
        ]
      },
      {
        name: "CSV Reports",
        items: [
          "Bulk Users Import Status",
          "Custom Attribute Filter"
        ]
      }
    ]
  },
  groups: {
    title: "Group Reports",
    groups: [
      {
        name: "Group Type Reports",
        items: [
          "All Groups",
          "Security Groups",
          "Distribution Groups",
          "Mail-enabled Security Groups",
          "Microsoft 365 Groups",
          "Dynamic Distribution Groups font-medium",
          "Synced Groups",
          "Cloud Groups"
        ]
      },
      {
        name: "Group Member Reports",
        items: [
          "Group Members",
          "Empty Groups",
          "Nested Groups",
          "Microsoft 365 Groups without Owners",
          "Microsoft 365 Groups without Members",
          "Distribution Groups without Owners"
        ]
      },
      {
        name: "Group Usage & Audit",
        items: [
          "Group Creation History",
          "Group Deletion History",
          "Group Ownership Changes",
          "Group Membership Changes"
        ]
      }
    ]
  },
  contacts: {
    title: "Contact Reports",
    groups: [
      {
        name: "All Contacts",
        items: [
          "All Contacts",
          "Mail Contacts",
          "Mail Users"
        ]
      },
      {
        name: "Contact Properties",
        items: [
          "Contacts with Manager",
          "Contacts without Manager",
          "Contacts with Custom Attributes",
          "Hidden Contacts",
          "Visible Contacts"
        ]
      },
      {
        name: "Contact Audits",
        items: [
          "Recently Created Contacts",
          "Recently Deleted Contacts"
        ]
      }
    ]
  },
  licenses: {
    title: "License Reports",
    groups: [
      {
        name: "Subscription Reports",
        items: [
          "All Subscriptions",
          "Expiring Subscriptions",
          "Expired Subscriptions"
        ]
      },
      {
        name: "User License Reports",
        items: [
          "Licensed Users",
          "Unlicensed Users",
          "Users with Specific Licenses",
          "License Usage Details"
        ]
      }
    ]
  },
  mailboxes: {
    title: "Mailbox Reports",
    groups: [
      {
        name: "General Mailbox Reports",
        items: [
          "All Mailboxes",
          "User Mailboxes",
          "Room Mailboxes",
          "Equipment Mailboxes",
          "Shared Mailboxes",
          "Archived Mailboxes"
        ]
      },
      {
        name: "Mailbox Size & Usage",
        items: [
          "Mailbox Sizes",
          "Mailbox Size and Usage",
          "Mailbox Quota Limits",
          "Mailbox Sizes over 80% Quota",
          "Mailboxes exceeding Send Quota",
          "Large Mailboxes",
          "Empty Mailboxes"
        ]
      },
      {
        name: "Shared Mailbox Reports",
        items: [
          "Shared Mailbox"
        ]
      },
      {
        name: "Account Status Reports",
        items: [
          "Recently Created Mailboxes",
          "Soft Deleted Mailboxes",
          "Mailboxes with Delegates",
          "Mailboxes without Delegates",
          "Enabled Exchange Users",
          "Disabled Exchange Users",
          "Send As Permission",
          "Send on Behalf Permission",
          "Users with Send As Permission",
          "Users with Send On Behalf Permission"
        ]
      }
    ]
  },
  owa: {
    title: "OWA Reports",
    groups: [
      {
        name: "General OWA Reports",
        items: [
          "OWA Enabled Users",
          "OWA Disabled Users",
          "Active OWA Sessions",
          "Device Access Policies"
        ]
      }
    ]
  },
  security: {
    title: "Security Reports",
    groups: [
      {
        name: "Mailbox Security Reports",
        items: [
          "User Mailbox Security",
          "Shared Mailbox Security",
          "Mailbox Retention Policy",
          "Mailbox Auditing"
        ]
      },
      {
        name: "Users Security Reports",
        items: [
          "Admin Roles",
          "Exchange Admin Roles",
          "User Password Settings",
          "Last Password Change",
          "Recently Added Member to Role",
          "Recently Removed Member from Role",
          "Updated Company Contact Information"
        ]
      },
      {
        name: "Admin Activities Reports",
        items: [
          "Exchange Admin Activity",
          "Azure Admin Activity",
          "InPlace Hold & eDiscovery Activity",
          "Litigation Hold Activity",
          "Mailbox Quota Changes",
          "Mailbox Size Changes",
          "Mailbox Permission Changes",
          "Mailbox Delegate Changes",
          "Mailbox Created",
          "Mailbox Deleted"
        ]
      },
      {
        name: "User Activities Reports",
        items: [
          "Non-Owner Mailbox Access",
          "Send As Activities by Non-Owners",
          "Mailbox Login Activities",
          "Exchange User Activities"
        ]
      }
    ]
  }
};

// Styling Standards for complete visual consistency across dashboards
const HEADING_STYLE = "text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-3.5";
const ITEM_BUTTON_STYLE = "text-[13px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-normal transition-colors text-left flex items-start w-full leading-tight py-0.5";
const BULLET_STYLE = "w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mr-2.5 mt-1.5 shrink-0";

export default function M365ReportsPage() {
  const params = useParams();
  const [domain, setDomain] = useState("admanagerplus.com");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const category = (params?.category as string) || "users";
  const data = m365ReportsData[category] || m365ReportsData.users;

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

  const subHeaderOptions = [
    { name: "User", path: "/m365/reports/users" },
    { name: "Group", path: "/m365/reports/groups" },
    { name: "Contacts", path: "/m365/reports/contacts" },
    { name: "License", path: "/m365/reports/licenses" },
    { name: "OWA", path: "/m365/reports/owa" },
    { name: "Security", path: "/m365/reports/security" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        
        {/* Horizontal Subheader Menu Bar exactly like the screenshot */}
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 -mx-8 px-8 py-2.5 flex items-center justify-between z-10 transition-colors">
          <div className="flex items-center space-x-6">
            {subHeaderOptions.map((opt) => {
              const isActive = category === opt.path.split("/").pop();
              return (
                <Link
                  key={opt.name}
                  href={opt.path}
                  className={`text-xs font-semibold flex items-center gap-1 py-1 px-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-white/5"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {opt.name}
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Top Header / Action Bar */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center space-x-6 flex-1">
              <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-transparent focus-within:border-indigo-500/50 transition-all w-64 group/search">
                <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder={`Search Microsoft 365 ${data.title}...`}
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
                <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-0.5">
                  Microsoft 365 {data.title}
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsScheduleOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Download className="h-3.5 w-3.5" /> Schedule Reports
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="space-y-12 pt-4">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2 flex items-center gap-3">
              {data.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
              {data.groups.map((group) => (
                <div key={group.name} className="space-y-4">
                  <h3 className={HEADING_STYLE}>
                    {group.name}
                  </h3>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <button key={item} className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ScheduleReportModal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        reportCategory={`Microsoft 365 - ${data.title}`}
        reportOptions={data.groups.flatMap(g => g.items)}
      />
    </DashboardLayout>
  );
}
