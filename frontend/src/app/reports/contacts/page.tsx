"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function ContactOUReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "Contact & OU Reports",
      groups: [
        {
          name: "Contact Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "All Contacts",
            "Mail Enabled Contacts",
            "Recently Created Contacts",
            "Recently Modified Contacts",
            "Recently Deleted Contacts"
          ]
        },
        {
          name: "OU General Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "All OUs",
            "Empty OUs",
            "Users-Only OUs",
            "Computers-Only OUs",
            "Recently Created OUs",
            "Recently Modified OUs",
            "GPO Linked OUs",
            "GPO Inheritance Blocked OUs"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Contact & OU Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "Contact & OU Reports", active: true }
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
