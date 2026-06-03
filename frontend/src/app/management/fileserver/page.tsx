"use client";

import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";

export default function FileServerManagementPage() {
  const sections = [
    {
      title: "File Server Management",
      groups: [
        {
          name: "Permission Management",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Modify Folder Permissions", 
            "Remove Folder Permissions", 
            "Modify Share Permissions", 
            "Remove Share Permissions"
          ]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify bulk NTFS permission"]
        },
        {
          name: "Configuration",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Manage File Systems"]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search File Server Tasks..."
      primaryActionLabel="File Server Task"
      tabs={[
        { name: "File Server Management", active: true }
      ]}
    />
  );
}
