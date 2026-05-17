"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function M365Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/m365/reports/users");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
}
