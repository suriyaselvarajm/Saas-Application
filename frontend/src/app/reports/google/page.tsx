"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function GoogleWorkspaceReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "Google Workspace Reports",
      groups: [
        {
          name: "Google Workspace User reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Google Workspace Users",
            "Active Users",
            "Suspended Users"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Google Workspace Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "Google Workspace Reports", active: true }
      ]}
    >
      <ScheduleReportModal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        reportCategory="Google Workspace"
        reportOptions={sections[0].groups[0].items}
      />
    </ManagementConsoleLayout>
  );
}
