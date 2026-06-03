"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function ComplianceReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "Compliance Reports",
      groups: [
        {
          name: "SOX",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "All Users",
            "All Groups",
            "All Computers",
            "All Contacts",
            "All OUs",
            "All GPOs and Linked AD Objects",
            "Microsoft 365 Users"
          ]
        },
        {
          name: "HIPAA",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Recently Logged On Users",
            "Recent Logon Failures",
            "Real Last Logon",
            "Users With Terminal Server Access",
            "Recently Created Users",
            "Recently Modified Users"
          ]
        },
        {
          name: "PCI",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Recently Logged On Users",
            "Recent Logon Failures",
            "Real Last Logon",
            "Locked-out Users",
            "Users In Groups",
            "Shares in the Servers",
            "Permissions for Folders"
          ]
        },
        {
          name: "FISMA",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Recent Logon Failures",
            "Real Last Logon",
            "Users with Password Never Expires",
            "Password Changed Users",
            "Recently Created Users",
            "Recently Modified Users"
          ]
        },
        {
          name: "GLBA",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Recently Logged On Users",
            "Recent Logon Failures",
            "Real Last Logon",
            "Users with Password Never Expires",
            "Password Changed Users",
            "Security Groups"
          ]
        },
        {
          name: "GDPR",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Shares in the Servers",
            "Permissions for Folders",
            "Folders Accessible by Accounts",
            "Server Permissions",
            "Subnet Permissions",
            "Servers Accessible by Accounts",
            "Subnets Accessible by Accounts"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Compliance Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "Compliance Reports", active: true }
      ]}
    >
      <ScheduleReportModal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        reportCategory={sections[0].title}
        reportOptions={sections[0].groups.flatMap(g => g.items)}
      />
    </ManagementConsoleLayout>
  );
}
