"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

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

export default function M365ReportsPage() {
  const params = useParams();
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const category = (params?.category as string) || "users";
  const data = m365ReportsData[category] || m365ReportsData.users;

  const subHeaderOptions = [
    { name: "User", path: "/m365/reports/users" },
    { name: "Group", path: "/m365/reports/groups" },
    { name: "Contacts", path: "/m365/reports/contacts" },
    { name: "License", path: "/m365/reports/licenses" },
    { name: "OWA", path: "/m365/reports/owa" },
    { name: "Security", path: "/m365/reports/security" }
  ];

  const sections = [
    {
      title: `Microsoft 365 ${data.title}`,
      groups: data.groups.map(g => ({
        name: g.name,
        color: "text-emerald-600 dark:text-emerald-400",
        items: g.items
      }))
    }
  ];

  const tabs = subHeaderOptions.map(opt => ({
    name: opt.name,
    path: opt.path,
    active: category === opt.path.split("/").pop()
  }));

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder={`Search Microsoft 365 ${data.title}...`}
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={tabs}
    >
      <ScheduleReportModal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        reportCategory={`Microsoft 365 - ${data.title}`}
        reportOptions={data.groups.flatMap(g => g.items)}
      />
    </ManagementConsoleLayout>
  );
}
