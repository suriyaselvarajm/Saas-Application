"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function GroupReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "Group Reports",
      groups: [
        {
          name: "General Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "All Groups",
            "Recently Created Groups",
            "Recently Modified Groups",
            "Recently Deleted Groups",
            "Top N Big Groups",
            "Managed Groups",
            "Unmanaged Groups"
          ]
        },
        {
          name: "Member-based Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Group Members",
            "Detailed Group Members",
            "Groups Without Members",
            "Users Only Members of Domain Users Group",
            "Users Not In Groups",
            "Computers Not in Groups"
          ]
        },
        {
          name: "Group Type Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Security Groups",
            "Distribution Groups",
            "Group Type and Scope"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Group Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "Group Reports", active: true }
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
