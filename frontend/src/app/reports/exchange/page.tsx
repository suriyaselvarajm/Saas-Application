"use client";

import { useState } from "react";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { ScheduleReportModal } from "@/components/modals/ScheduleReportModal";
import { Download } from "lucide-react";

export default function ExchangeReportsPage() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const sections = [
    {
      title: "Exchange Reports",
      groups: [
        {
          name: "General Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Users without Mailbox",
            "Mailbox Enabled Users",
            "Mail Enabled Users",
            "Mail Enabled Groups",
            "Users with Email Proxy Enabled",
            "Groups with Email Proxy Enabled"
          ]
        },
        {
          name: "Delivery Recipient Settings",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Default Sending Message Size",
            "Restricted Sending Message Size",
            "Default Recipient Size",
            "Restricted Recipient Size",
            "Default Receiving Message Size",
            "Restricted Receiving Message Size",
            "Default Storage Limit",
            "MailBox Size Limits",
            "Users Hidden from Exchange Address Lists",
            "Accept Messages from Everyone",
            "Accept Messages Restricted",
            "Users based on ForwardTo"
          ]
        },
        {
          name: "Distribution Lists",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Distribution List Members",
            "Non-Distribution List Members",
            "Dynamic Distribution Groups"
          ]
        },
        {
          name: "Feature Based Reports",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "OMA Enabled",
            "OWA Enabled",
            "POP3 Enabled",
            "IMAP4 Enabled",
            "ActiveSync Enabled",
            "OMA Disabled",
            "OWA Disabled",
            "POP3 Disabled",
            "IMAP4 Disabled",
            "ActiveSync Disabled"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Exchange Reports..."
      primaryActionLabel="Schedule Reports"
      primaryActionIcon={<Download className="h-4 w-4" />}
      onPrimaryActionClick={() => setIsScheduleOpen(true)}
      tabs={[
        { name: "Exchange Reports", active: true }
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
