"use client";

import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";

export default function CSVImportPage() {
  const sections = [
    {
      title: "CSV Import",
      groups: [
        {
          name: "Create Objects",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Create Users", 
            "Create Contacts", 
            "Create Computers", 
            "Create Groups",
            "Create OUs",
            "Create Shared Mailbox"
          ]
        },
        {
          name: "Modify Objects",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Modify User Attributes", 
            "Modify Users Using Template", 
            "Modify Contacts", 
            "Modify Computers",
            "Modify Groups",
            "Modify OUs"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search CSV Tasks..."
      primaryActionLabel="Import CSV"
      tabs={[
        { name: "CSV Import", active: true }
      ]}
    />
  );
}
