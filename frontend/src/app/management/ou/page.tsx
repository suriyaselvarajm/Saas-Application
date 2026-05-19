"use client";

import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";

export default function OUManagementPage() {
  const sections = [
    {
      title: "OU Management",
      groups: [
        {
          name: "OU Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single OU", "Create Bulk OUs"]
        },
        {
          name: "OU Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single OU", "Modify Bulk OUs"]
        },
        {
          name: "OU Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["OU Creation Templates", "OU Modification Templates"]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Bulk OUs", "Modify Bulk OUs"]
        },
        {
          name: "Bulk OU Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Delete OU", "Move OU"]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search OU Tasks..."
      primaryActionLabel="Create OU"
      tabs={[
        { name: "OU Management", active: true }
      ]}
    />
  );
}
