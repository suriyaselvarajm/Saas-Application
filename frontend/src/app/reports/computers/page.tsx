"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function ComputerReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "Computer Reports",
      groups: [
        {
          name: "General Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "All Computers",
            "OS Based Report",
            "Workstation Computers",
            "Domain Controllers",
            "Recently Created Computers",
            "Computers Trusted for Delegation",
            "Recently Modified Computers",
            "Recently Deleted Computers",
            "Managed Computers",
            "Unmanaged Computers",
            "Computers with Duplicate Attributes"
          ]
        },
        {
          name: "Account Status Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Inactive Computers",
            "Active Computers",
            "Disabled Computers",
            "Enabled Computers"
          ]
        },
        {
          name: "Bitlocker Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Bitlocker Recovery Keys",
            "Bitlocker Enabled Computers",
            "Bitlocker Disabled Computers"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Computer Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "Computer Reports", active: true }
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
