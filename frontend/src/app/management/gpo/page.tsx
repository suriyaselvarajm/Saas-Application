"use client";

import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";

export default function GPOManagementPage() {
  const sections = [
    {
      title: "GPO Management",
      groups: [
        {
          name: "GPO Management",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Manage GPOs", 
            "Manage GPO Links", 
            "Force GPO Update", 
            "Manage GPO Link Order",
            "Copy GPO(s)",
            "Merge GPOs"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search GPO Tasks..."
      primaryActionLabel="GPO Task"
      tabs={[
        { name: "GPO Management", active: true }
      ]}
    />
  );
}
