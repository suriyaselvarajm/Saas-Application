"use client";

import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";

export default function MailboxManagementPage() {
  const sections = [
    {
      title: "Shared Mailbox Management",
      groups: [
        {
          name: "Shared Mailbox Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Shared Mailbox", "Create Bulk Shared Mailbox"]
        },
        {
          name: "Shared Mailbox Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Shared Mailbox"]
        },
        {
          name: "Shared Mailbox Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Shared Mailbox Creation Templates", "Shared Mailbox Modification Templates"]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Shared Mailbox"]
        }
      ]
    },
    {
      title: "Room Mailbox Management",
      groups: [
        {
          name: "Room Mailbox Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Room Mailbox"]
        },
        {
          name: "Room Mailbox Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Room Mailbox"]
        },
        {
          name: "Room Mailbox Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Room Mailbox Creation Templates", "Room Mailbox Modification Templates"]
        }
      ]
    },
    {
      title: "Equipment Mailbox Management",
      groups: [
        {
          name: "Equipment Mailbox Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Equipment Mailbox"]
        },
        {
          name: "Equipment Mailbox Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Equipment Mailbox"]
        },
        {
          name: "Equipment Mailbox Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Equipment Mailbox Creation Templates", "Equipment Mailbox Modification Templates"]
        }
      ]
    },
    {
      title: "Linked Mailbox Management",
      groups: [
        {
          name: "Linked Mailbox Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Linked Mailbox"]
        },
        {
          name: "Linked Mailbox Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Linked Mailbox Creation Templates"]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Mailbox Tasks..."
      primaryActionLabel="Create Mailbox"
      tabs={[
        { name: "Mailbox Management", active: true }
      ]}
    />
  );
}
