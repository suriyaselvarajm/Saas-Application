"use client";

import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";

export default function ContactManagementPage() {
  const sections = [
    {
      title: "Contact Management",
      groups: [
        {
          name: "Contact Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Contact", "Create Bulk Contacts"]
        },
        {
          name: "Contact Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Contact", "Modify Bulk Contacts"]
        },
        {
          name: "Contact Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Contact Creation Templates", "Contact Modification Templates"]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Contacts", "Modify Contacts"]
        }
      ]
    },
    {
      title: "Bulk Contact Modification",
      groups: [
        {
          name: "Bulk Contact Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Address/Organization Attributes", 
            "Contact Attributes", 
            "Naming Attributes", 
            "Delete Contacts", 
            "Move Contacts",
            "Modify group attributes of contacts",
            "Restore Deleted Contacts"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Contact Tasks..."
      primaryActionLabel="New Contact"
      tabs={[
        { name: "Contact Management", active: true },
        { name: "Bulk Contact Modification", active: false }
      ]}
    />
  );
}
