"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function OtherReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "Other Reports",
      groups: [
        {
          name: "Policy Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Password Policy",
            "Account Lockout Policy"
          ]
        },
        {
          name: "Printer Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Printer Reports"
          ]
        },
        {
          name: "Replication Report",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "DC Replication Status",
            "Lingering Objects"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Other Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "Other Reports", active: true }
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
