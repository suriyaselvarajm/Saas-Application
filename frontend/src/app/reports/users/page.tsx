"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function UserReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "User Reports",
      groups: [
        {
          name: "General Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "All Users",
            "Users With Empty Attributes",
            "Users With Duplicate Attributes",
            "Users Without Managers",
            "Manager Based Users",
            "All Managers",
            "Users In More Than One Group",
            "Recently Deleted users",
            "Recently Created Users",
            "Recently Modified Users",
            "Photo Based Reports",
            "Lync/Skype Disabled Users",
            "Lync/Skype Enabled Users",
            "Dial-in Allow Access",
            "Dial-in Deny Access",
            "Users With Logon Script",
            "Users Without Logon Script"
          ]
        },
        {
          name: "Account Status Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Disabled Users",
            "Locked out Users",
            "Account Expired Users",
            "Recently Account Expired Users",
            "Soon-To-Expire User Accounts",
            "Account Never Expires Users",
            "Smart Card Enabled Users"
          ]
        },
        {
          name: "Logon Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Inactive Users",
            "Real Last Logon",
            "Recently Logged On Users",
            "Logon Hour Based Report",
            "Users Never Logged On",
            "Enabled Users"
          ]
        },
        {
          name: "Nested Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Users In Groups",
            "Groups for Users"
          ]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Report from CSV"
          ]
        },
        {
          name: "Terminal Service Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Users' Terminal Service Properties",
            "Users With Terminal Service Access"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search User Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "User Reports", active: true }
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
