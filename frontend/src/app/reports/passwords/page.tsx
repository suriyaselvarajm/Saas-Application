"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function PasswordReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "Password Reports",
      groups: [
        {
          name: "General Password Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Recent Logon Failures",
            "Users with Cannot Change Password",
            "Users with Password Never Expires",
            "Users with Change Password at Next Logon"
          ]
        },
        {
          name: "Password Status Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Password Expired Users",
            "Soon-to-expire User Passwords",
            "Password Changed Users",
            "Password Unchanged Users"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Password Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "Password Reports", active: true }
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
