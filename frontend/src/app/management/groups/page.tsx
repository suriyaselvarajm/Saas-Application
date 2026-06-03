"use client";

import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";

export default function GroupManagementPage() {
  const sections = [
    {
      title: "Group Management",
      groups: [
        {
          name: "Group Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Group", "Create Bulk Groups"]
        },
        {
          name: "Group Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Group", "Modify Bulk Groups", "Modify Dynamic Group"]
        },
        {
          name: "Group Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Group Creation Templates", "Group Modification Templates"]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Groups", "Modify Groups"]
        }
      ]
    },
    {
      title: "Bulk Group Modification",
      groups: [
        {
          name: "Bulk Group Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Organization Attributes", 
            "Exchange Attributes", 
            "Move Groups", 
            "Delete Groups", 
            "Restore Deleted Groups"
          ]
        }
      ]
    },
    {
      title: "Dynamic Distribution Group Management",
      groups: [
        {
          name: "Dynamic Distribution Group Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Dynamic Distribution Group"]
        },
        {
          name: "Dynamic Distribution Group Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify single Dynamic Distribution Group"]
        },
        {
          name: "Dynamic Distribution Group Template",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Dynamic Distribution Group Creation Templates"]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Group Tasks..."
      primaryActionLabel="Create Group"
      tabs={[
        { name: "Group Management", active: true },
        { name: "Bulk Group Modification", active: false }
      ]}
    />
  );
}
