"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="animate-pulse text-indigo-400 font-semibold tracking-widest text-sm uppercase">
        Initializing Petrus Portal...
      </div>
    </div>
  );
}
