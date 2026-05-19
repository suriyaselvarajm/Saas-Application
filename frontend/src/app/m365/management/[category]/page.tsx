"use client";

import { useParams } from "next/navigation";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { 
  Plus,
  Trash2,
  Edit2
} from "lucide-react";

interface ManagementItem {
  id: string;
  name: string;
  detail: string;
  status: "Active" | "Inactive" | "Synced" | "Cloud-Only";
  extra: string;
}

const mockManagementData: Record<string, { title: string; placeholder: string; items: ManagementItem[] }> = {
  users: {
    title: "User Management",
    placeholder: "Search Microsoft 365 Users...",
    items: [
      { id: "1", name: "Gowtham Selvam", detail: "gowtham@petrus.com", status: "Active", extra: "IT Administrator" },
      { id: "2", name: "Suriya Selvaraj", detail: "suriya@petrus.com", status: "Synced", extra: "Tenant Owner" },
      { id: "3", name: "John Doe", detail: "john.doe@petrus.com", status: "Cloud-Only", extra: "HR Partner" },
      { id: "4", name: "Sarah Connor", detail: "sarah@petrus.com", status: "Inactive", extra: "External Consultant" }
    ]
  },
  groups: {
    title: "Group Management",
    placeholder: "Search Microsoft 365 Groups...",
    items: [
      { id: "1", name: "All Employees", detail: "all-employees@petrus.com", status: "Synced", extra: "24 Members" },
      { id: "2", name: "IT Operations Team", detail: "it-ops@petrus.com", status: "Active", extra: "8 Members" },
      { id: "3", name: "Human Resources Dist", detail: "hr-distribution@petrus.com", status: "Cloud-Only", extra: "3 Members" }
    ]
  },
  contacts: {
    title: "Contact Management",
    placeholder: "Search Microsoft 365 Contacts...",
    items: [
      { id: "1", name: "Vendor Support Ext", detail: "support@externalservice.com", status: "Active", extra: "External Contact" },
      { id: "2", name: "Partner Executive", detail: "exec@partnercompany.com", status: "Cloud-Only", extra: "Direct Mail" }
    ]
  },
  licenses: {
    title: "License Management",
    placeholder: "Search Licenses...",
    items: [
      { id: "1", name: "Microsoft 365 E5", detail: "e5-license@petrus.com", status: "Active", extra: "14 / 20 Assigned" },
      { id: "2", name: "Office 365 Business Premium", detail: "bus-prem@petrus.com", status: "Active", extra: "45 / 50 Assigned" }
    ]
  },
  mailboxes: {
    title: "Mailbox Management",
    placeholder: "Search Mailboxes...",
    items: [
      { id: "1", name: "Info Shared Box", detail: "info@petrus.com", status: "Active", extra: "12.4 GB / 50 GB" },
      { id: "2", name: "Sales Operations Inbox", detail: "sales-ops@petrus.com", status: "Synced", extra: "4.8 GB / 50 GB" }
    ]
  },
  "shared-mailboxes": {
    title: "Shared Mailbox Management",
    placeholder: "Search Shared Mailboxes...",
    items: [
      { id: "1", name: "Marketing Hub", detail: "marketing@petrus.com", status: "Active", extra: "6 Members" },
      { id: "2", name: "Support Desk", detail: "support-shared@petrus.com", status: "Active", extra: "15 Members" }
    ]
  },
  calendars: {
    title: "Calendar Management",
    placeholder: "Search Shared Calendars...",
    items: [
      { id: "1", name: "Company Holidays", detail: "holidays@petrus.com", status: "Active", extra: "Global Access" },
      { id: "2", name: "Boardroom Booking", detail: "boardroom@petrus.com", status: "Synced", extra: "Restricted Access" }
    ]
  }
};

const managementSections: Record<string, Array<{ title: string; groups: Array<{ name: string; items: string[] }> }>> = {
  users: [
    {
      title: "User Management",
      groups: [
        { name: "User Creation", items: ["Create Microsoft 365 accounts for AD users"] },
        { name: "Guest User Creation", items: ["Bulk Guest User Creation"] },
        {
          name: "Bulk User Modification",
          items: [
            "MFA Settings", "Reset Password", "Block Users", "Unblock Users", "Set Manager",
            "Delete Users", "Hard Delete Users", "Restore Users", "Change Domain", "Change UPN",
            "Modify Naming Attributes", "Modify user's address information", "Modify user contact details", "Revoke Azure AD User Refresh Token"
          ]
        }
      ]
    }
  ],
  groups: [
    {
      title: "Group Management",
      groups: [
        {
          name: "Single Group Creation",
          items: ["Microsoft 365 Group Creation", "Distribution/Mail-enabled Security Group Creation", "Dynamic Distribution Group Creation"]
        },
        {
          name: "Group Creation Templates",
          items: ["Microsoft 365 Group Creation Template", "Distribution/Mail-enabled Security Group Creation Template", "Dynamic Distribution Group Creation Template"]
        },
        {
          name: "Bulk Group Creation",
          items: ["Create Distribution Groups", "Create Mail Enabled Security Groups", "Create Microsoft 365 Groups", "Create Dynamic Distribution Group", "Create Security Group"]
        },
        {
          name: "Modify Single Group",
          items: ["Modify Single Group"]
        },
        {
          name: "Group Member Management",
          items: ["Modify Distribution Group Members", "Modify Mail Enabled Security Group Members", "Modify Microsoft 365 Group Members", "Modify Security Group Members", "Add / Remove Group Members using CSV"]
        },
        {
          name: "Bulk Group Modification",
          items: [
            "Group Accept Mail From", "Modify Group Custom Attributes", "Modify Group Custom Attributes using CSV", "Delete Groups", "Hide / Unhide Groups",
            "Add / Remove Microsoft 365 Group Owners", "Add / Remove Distribution Group Owners", "Add / Remove Mail Enabled Security Group Owners",
            "Add / Remove Security Group Owners", "Add / Remove Dynamic Distribution Group Owner",
            "Modify SMTP Address of Groups", "Modify Send As Permission of Groups", "Modify Send As Permission of Dynamic Distribution Groups", "Modify Send On Behalf Permission of Groups"
          ]
        }
      ]
    }
  ],
  contacts: [
    {
      title: "Contact Management",
      groups: [
        { name: "Contact Creation", items: ["Bulk Contact Creation"] },
        {
          name: "Bulk Contact Modification",
          items: ["Delete Contacts", "Contact Attribute Changes", "Hide / Unhide Contacts", "Modify Contact Custom Attributes", "Modify Contact Custom Attributes using CSV", "Set Manager to Mail Contacts", "Modify SMTP Address of Contacts"]
        }
      ]
    }
  ],
  licenses: [
    {
      title: "License Management",
      groups: [
        { name: "Bulk License Modification", items: ["Assign / Remove Licenses", "Group Based License Modification"] }
      ]
    }
  ],
  mailboxes: [
    {
      title: "Mailbox Management",
      groups: [
        {
          name: "Exchange Mailbox Tasks",
          items: [
            "Mailbox Features Settings", "Mailbox Permission Changes", "Configure Mailbox Retention Policy", "Disable/Delete Remote Mailbox", "Mailbox Delegation",
            "Hide from address lists", "Unhide From Address Lists", "Set Mail Forwarding and Storage Limit", "Mailbox Audit Settings", "Mailbox Message Size Restriction",
            "Enable/Disable Litigation Hold", "Add Additional Email Addresses", "Enable / Disable Mailbox Archive", "Mailbox Auto Reply Configuration", "Modify Address Book Policy",
            "Mailbox Conversion"
          ]
        }
      ]
    }
  ],
  "shared-mailboxes": [
    {
      title: "Shared Mailbox Management",
      groups: [
        {
          name: "Shared Mailbox Tasks",
          items: [
            "Shared Mailbox delegation", "Configure Shared Mailbox Retention Policy", "Shared Mailbox Permission Changes", "Shared Mailbox Autoreply Configuration", "Shared Mailbox Forward To",
            "Shared Mailbox Conversion", "Shared Mailbox MailTip Settings"
          ]
        }
      ]
    }
  ],
  calendars: [
    {
      title: "Calendar Management",
      groups: [
        { name: "Calendar Permission Tasks", items: ["Modify Calendar Permissions", "Remove Calendar Permissions"] }
      ]
    }
  ]
};

export default function M365ManagementPage() {
  const params = useParams();
  const category = (params?.category as string) || "users";

  const data = mockManagementData[category] || mockManagementData.users;
  const sections = managementSections[category] || [];

  const subHeaderOptions = [
    { name: "User", path: "/m365/management/users" },
    { name: "Group", path: "/m365/management/groups" },
    { name: "Contact", path: "/m365/management/contacts" },
    { name: "License", path: "/m365/management/licenses" },
    { name: "Mailbox", path: "/m365/management/mailboxes" },
    { name: "Shared Mailbox", path: "/m365/management/shared-mailboxes" },
    { name: "Calendar", path: "/m365/management/calendars" }
  ];

  const tabs = subHeaderOptions.map(opt => ({
    name: opt.name,
    path: opt.path,
    active: category === opt.path.split("/").pop()
  }));

  // Render dynamic tabular view as children when no direct sections are present, or inside table
  const showTable = !sections || sections.length === 0;

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder={data.placeholder}
      primaryActionLabel={`New ${data.title.split(" ")[0]}`}
      primaryActionIcon={<Plus className="h-4 w-4" />}
      tabs={tabs}
    >
      {showTable && (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/10">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">M365 Identity / Detail</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Properties</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {item.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{item.detail}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === "Active" || item.status === "Synced"
                          ? "bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.extra}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ManagementConsoleLayout>
  );
}
