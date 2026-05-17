"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Search, 
  ChevronDown, 
  Plus,
  Trash2,
  Edit2,
  Clock
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

// Standardized native Petrus styling standards (semibold emerald headings, thin slate items)
const HEADING_STYLE = "text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-3.5";
const ITEM_BUTTON_STYLE = "text-[13px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-normal transition-colors text-left flex items-start w-full leading-tight py-0.5";
const BULLET_STYLE = "w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mr-2.5 mt-1.5 shrink-0";

export default function M365ManagementPage() {
  const params = useParams();
  const [domain, setDomain] = useState("admanagerplus.com");

  const category = (params?.category as string) || "users";
  const data = mockManagementData[category] || mockManagementData.users;

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
    { name: "User", path: "/m365/management/users" },
    { name: "Group", path: "/m365/management/groups" },
    { name: "Contact", path: "/m365/management/contacts" },
    { name: "License", path: "/m365/management/licenses" },
    { name: "Mailbox", path: "/m365/management/mailboxes" },
    { name: "Shared Mailbox", path: "/m365/management/shared-mailboxes" },
    { name: "Calendar", path: "/m365/management/calendars" }
  ];

  // Standardized helper function to render management content (eliminates nested ternaries)
  const renderContent = () => {
    switch (category) {
      case "users":
        return (
          // Standardized Action Grid Layout for User Management
          <div className="space-y-10 pt-4 animate-fadeIn">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">
                User Management
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* User Creation Section */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className={HEADING_STYLE}>
                      User Creation
                    </h3>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Create Microsoft 365 accounts for AD users</span>
                    </button>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className={HEADING_STYLE}>
                      Guest User Creation
                    </h3>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Bulk Guest User Creation</span>
                    </button>
                  </div>
                </div>

                {/* Bulk User Modification Section */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className={HEADING_STYLE}>
                    Bulk User Modification
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                    <div className="space-y-3.5">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>MFA Settings</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Reset Password</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Block Users</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Unblock Users</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Set Manager</span>
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Delete Users</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Hard Delete Users</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Restore Users</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Change Domain</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Change UPN</span>
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Naming Attributes</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify user's address information</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify user contact details</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Revoke Azure AD User Refresh Token</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      case "groups":
        return (
          // Standardized Action Grid Layout for Group Management (4 Column Layout matching reference image)
          <div className="space-y-10 pt-4 animate-fadeIn">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">
                Group Management
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                
                {/* Column 1 */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className={HEADING_STYLE}>
                      Single Group Creation
                    </h3>
                    <div className="space-y-3">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Microsoft 365 Group Creation</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Distribution/Mail-enabled Security Group Creation</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Dynamic Distribution Group Creation</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className={HEADING_STYLE}>
                      Bulk Group Modification
                    </h3>
                    <div className="space-y-3">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Group Accept Mail From</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Group Custom Attributes</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Group Custom Attributes using CSV</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Delete Groups</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Hide / Unhide Groups</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className={HEADING_STYLE}>
                      Group Creation Templates
                    </h3>
                    <div className="space-y-3">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Microsoft 365 Group Creation Template</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Distribution/Mail-enabled Security Group Creation Template</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Dynamic Distribution Group Creation Template</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    {/* Hidden spacer header for structural vertical alignment with column 1 */}
                    <h3 className="text-[13px] font-bold text-transparent select-none uppercase tracking-wider block mb-3.5">
                      Bulk Group Modification
                    </h3>
                    <div className="space-y-3">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Add / Remove Microsoft 365 Group Owners</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Add / Remove Distribution Group Owners</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Add / Remove Mail Enabled Security Group Owners</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Add / Remove Security Group Owners</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Add / Remove Dynamic Distribution Group Owner</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className={HEADING_STYLE}>
                      Bulk Group Creation
                    </h3>
                    <div className="space-y-3">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Create Distribution Groups</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Create Mail Enabled Security Groups</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Create Microsoft 365 Groups</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Create Dynamic Distribution Group</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Create Security Group</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    {/* Hidden spacer header for structural vertical alignment with column 1 */}
                    <h3 className="text-[13px] font-bold text-transparent select-none uppercase tracking-wider block mb-3.5">
                      Bulk Group Modification
                    </h3>
                    <div className="space-y-3">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify SMTP Address of Groups</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Send As Permission of Groups</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Send As Permission of Dynamic Distribution Groups</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Send On Behalf Permission of Groups</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 4 */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className={HEADING_STYLE}>
                      Modify Single Group
                    </h3>
                    <div className="space-y-3">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Single Group</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className={HEADING_STYLE}>
                      Group Member Management
                    </h3>
                    <div className="space-y-3">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Distribution Group Members</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Mail Enabled Security Group Members</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Microsoft 365 Group Members</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Security Group Members</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Add / Remove Group Members using CSV</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      case "contacts":
        return (
          // Standardized Action Grid Layout for Contact Management (3 Column Layout matching reference image)
          <div className="space-y-10 pt-4 animate-fadeIn">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">
                Contact Management
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Column 1: Contact Creation */}
                <div className="space-y-4">
                  <h3 className={HEADING_STYLE}>
                    Contact Creation
                  </h3>
                  <div className="space-y-3">
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Bulk Contact Creation</span>
                    </button>
                  </div>
                </div>

                {/* Column 2 & 3: Bulk Contact Modification */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className={HEADING_STYLE}>
                    Bulk Contact Modification
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div className="space-y-3.5">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Delete Contacts</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Contact Attribute Changes</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Hide / Unhide Contacts</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Contact Custom Attributes</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify Contact Custom Attributes using CSV</span>
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Set Manager to Mail Contacts</span>
                      </button>
                      <button className={ITEM_BUTTON_STYLE}>
                        <span className={BULLET_STYLE}></span>
                        <span>Modify SMTP Address of Contacts</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      case "licenses":
        return (
          <div className="space-y-10 pt-4 animate-fadeIn">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">
                License Management
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Column 1: Bulk License Modification */}
                <div className="space-y-4">
                  <h3 className={HEADING_STYLE}>
                    Bulk License Modification
                  </h3>
                  <div className="space-y-3">
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Assign / Remove Licenses</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Group Based License Modification</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      case "mailboxes":
        return (
          <div className="space-y-10 pt-4 animate-fadeIn">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">
                Mailbox Management
              </h2>
              
              <div className="space-y-4">
                <h3 className={HEADING_STYLE}>
                  Exchange Mailbox Tasks
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  
                  {/* Column 1 */}
                  <div className="space-y-3">
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Mailbox Features Settings</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Mailbox Permission Changes</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Configure Mailbox Retention Policy</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Disable/Delete Remote Mailbox</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Mailbox Delegation</span>
                    </button>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-3">
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Hide from address lists</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Unhide From Address Lists</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Set Mail Forwarding and Storage Limit</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Mailbox Audit Settings</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Mailbox Message Size Restriction</span>
                    </button>
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-3">
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Enable/Disable Litigation Hold</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Add Additional Email Addresses</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Enable / Disable Mailbox Archive</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Mailbox Auto Reply Configuration</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Modify Address Book Policy</span>
                    </button>
                  </div>

                  {/* Column 4 */}
                  <div className="space-y-3">
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Mailbox Conversion</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      case "shared-mailboxes":
        return (
          <div className="space-y-10 pt-4 animate-fadeIn">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">
                Shared Mailbox Management
              </h2>
              
              <div className="space-y-4">
                <h3 className={HEADING_STYLE}>
                  Shared Mailbox Tasks
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  
                  {/* Column 1 */}
                  <div className="space-y-3">
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Shared Mailbox delegation</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Configure Shared Mailbox Retention Policy</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Shared Mailbox Permission Changes</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Shared Mailbox Autoreply Configuration</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Shared Mailbox Forward To</span>
                    </button>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-3">
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Shared Mailbox Conversion</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Shared Mailbox MailTip Settings</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      case "calendars":
        return (
          <div className="space-y-10 pt-4 animate-fadeIn">
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-2">
                Calendar Management
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* Column 1: Calendar Permission Tasks */}
                <div className="space-y-4">
                  <h3 className={HEADING_STYLE}>
                    Calendar Permission Tasks
                  </h3>
                  <div className="space-y-3">
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Modify Calendar Permissions</span>
                    </button>
                    <button className={ITEM_BUTTON_STYLE}>
                      <span className={BULLET_STYLE}></span>
                      <span>Remove Calendar Permissions</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      default:
        return (
          // Standard Data Table Layout for other management categories
          <>
            {/* Top Action Bar */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center space-x-6 flex-1">
                  <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-transparent focus-within:border-indigo-500/50 transition-all w-64 group/search">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder={data.placeholder}
                      className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-500 w-full"
                    />
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
                  <button className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all group">
                    <span>{domain}</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </button>
                  <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
                  <nav className="flex space-x-4">
                    <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-0.5 animate-fadeIn">
                      Microsoft 365 {data.title}
                    </button>
                  </nav>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20">
                    <Plus className="h-3.5 w-3.5" /> New {data.title.split(" ")[0]}
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
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
          </>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        
        {/* Horizontal Subheader Menu Bar exactly matching the screenshot */}
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
          
          <button className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 transition-all shadow-sm">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>View Delayed Tasks</span>
          </button>
        </div>

        {/* Render primary category dynamic component block cleanly without nested ternaries */}
        {renderContent()}

      </div>
    </DashboardLayout>
  );
}
