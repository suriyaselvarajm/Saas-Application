"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function GPOReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "GPO Reports",
      groups: [
        {
          name: "General Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "All GPOs and Linked AD Objects",
            "Recently Created GPOs",
            "Recently Modified GPOs",
            "Frequently Modified Computer Settings GPOs",
            "Frequently Modified User Settings GPOs",
            "Frequently Modified GPOs"
          ]
        },
        {
          name: "GPO Scope Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Domain Linked GPOs",
            "OU Linked GPOs",
            "Site Linked GPOs",
            "GPO Inheritance Blocked Containers",
            "Linked GPOs Report",
            "GPOs With Script",
            "Compare GPO Versions",
            "Direct and Inherited GPO Links",
            "GPOs Linked To Empty OUs",
            "Enforced GPOs"
          ]
        },
        {
          name: "GPO Status Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Disabled GPOs",
            "Computer Settings Disabled GPOs",
            "User Settings Disabled GPOs",
            "Unlinked GPOs",
            "GPOs With Inactive Policy Settings",
            "GPO Delegation Report"
          ]
        },
        {
          name: "GPO Settings Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "GPO Settings",
            "GPOs With Specific Settings",
            "Empty GPOs Report",
            "Resultant Set of Policy",
            "GPO Modeling",
            "Comparison of GPOs"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search GPO Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "GPO Reports", active: true }
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
