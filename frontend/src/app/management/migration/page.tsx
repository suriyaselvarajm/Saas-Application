"use client";

import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";

export default function MigrationPage() {
  const sections = [
    {
      title: "Migration",
      groups: [
        {
          name: "Migration",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "User Migration", 
            "Group Migration", 
            "Contact Migration", 
            "Computer Migration",
            "GPO Migration"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Migration Tasks..."
      primaryActionLabel="Migration Task"
      tabs={[
        { name: "Migration", active: true }
      ]}
    />
  );
}
