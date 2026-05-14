"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const domain = searchParams.get("state"); // We passed domain in state
    const err = searchParams.get("error");
    const errDesc = searchParams.get("error_description");

    if (err) {
      setStatus("error");
      setErrorMsg(errDesc || "Microsoft Authentication Failed");
      return;
    }

    if (!code || !domain) {
      setStatus("error");
      setErrorMsg("Invalid callback parameters received from Microsoft.");
      return;
    }

    const exchangeToken = async () => {
      try {
        const res = await fetch("http://localhost:3001/auth/m365/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, domain }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to authenticate with backend.");
        }

        const data = await res.json();
        
        // In a real app, store token in secure HttpOnly cookie or memory
        localStorage.setItem("petrus_token", data.accessToken);
        localStorage.setItem("petrus_user", JSON.stringify(data.user));

        setStatus("success");
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);

      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    };

    exchangeToken();
  }, [searchParams, router]);

  return (
    <div className="w-full max-w-md space-y-8 z-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white font-outfit tracking-tight mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="h-10 w-10 text-indigo-500" /> PETRUS
        </h1>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col items-center text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Authenticating</h2>
            <p className="text-slate-400">Verifying credentials with Microsoft...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Login Successful</h2>
            <p className="text-slate-400">Redirecting to your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-red-400 text-sm mb-8">{errorMsg}</p>
            <button 
              onClick={() => router.push("/login")}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      
      <Suspense fallback={<Loader2 className="h-10 w-10 text-indigo-500 animate-spin z-10" />}>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
