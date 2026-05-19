"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function NTFSSecurityReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "NTFS & Security Reports",
      groups: [
        {
          name: "NTFS Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Shares in the Servers",
            "Permissions for Folders",
            "Folders Accessible by Accounts",
            "Non-Inheritable Folders"
          ]
        },
        {
          name: "Security Permission Entitlements",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "AD Objects Accessible by Accounts",
            "Servers Accessible by Accounts",
            "Subnets Accessible by Accounts",
            "Search Permissions"
          ]
        },
        {
          name: "Security Permissions",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Server Permissions",
            "Subnet Permissions",
            "Object Permissions",
            "Non-Inheritable Objects"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search NTFS & Security Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "NTFS & Security Reports", active: true }
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
