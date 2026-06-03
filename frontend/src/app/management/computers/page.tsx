"use client";

import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";

export default function ComputerManagementPage() {
  const sections = [
    {
      title: "Computer Management",
      groups: [
        {
          name: "Computer Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Computer", "Create Bulk Computers"]
        },
        {
          name: "Computer Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Computer", "Modify Bulk Computers"]
        },
        {
          name: "Computer Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Computer Creation Templates", "Computer Modification Templates"]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Computers", "Modify Computers"]
        }
      ]
    },
    {
      title: "Bulk Computer Modification",
      groups: [
        {
          name: "General Attributes",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Modify group attributes of computers", 
            "Modify general attributes", 
            "Custom Attributes", 
            "Reset Computers",
            "Move Computers",
            "Enable/Disable Computers",
            "Delete Computers",
            "Restore Deleted Computers"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Computer Tasks..."
      primaryActionLabel="New Computer"
      tabs={[
        { name: "Computer Management", active: true },
        { name: "Bulk Computer Modification", active: false }
      ]}
    />
  );
}
