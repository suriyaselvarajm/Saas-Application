"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, Loader2, KeyRound } from "lucide-react";

type LoginStep = "credentials" | "mfa" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingUserId, setPendingUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Step 1: Credentials ──────────────────────────────────────────────────
  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Invalid account. Please check your credentials.");
      }

      const data = await res.json();

      // MFA challenge — move to OTP step
      if (data.mfaRequired) {
        setPendingUserId(data.userId);
        setStep("mfa");
        setLoading(false);
        return;
      }

      // No MFA — store token and proceed
      localStorage.setItem("petrus_token", data.accessToken);
      localStorage.setItem("petrus_user", JSON.stringify(data.user));

      if (data.user.mustChangePassword) {
        setStep("reset");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  // ── Step 2: MFA OTP ──────────────────────────────────────────────────────
  const handleMfaVerify = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (otp?.length !== 6) {
      setError("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUserId, token: otp }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Invalid OTP code. Please try again.");
      }

      const data = await res.json();
      localStorage.setItem("petrus_token", data.accessToken);
      localStorage.setItem("petrus_user", JSON.stringify(data.user));

      if (data.user.mustChangePassword) {
        setStep("reset");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OTP verification failed.";
      setError(msg);
      setLoading(false);
    }
  };

  // ── Step 3: Force Password Reset ─────────────────────────────────────────
  const handleResetPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      if (!res.ok) throw new Error("Failed to update password");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setError(msg);
      setLoading(false);
    }
  };

  // ── Step labels ───────────────────────────────────────────────────────────
  const stepTitle: Record<LoginStep, string> = {
    credentials: "Sign In",
    mfa: "Two-Factor Verification",
    reset: "Set New Password",
  };
  const stepSubtitle: Record<LoginStep, string> = {
    credentials: "Login with your work email to access the admin portal.",
    mfa: "Enter the 6-digit code from your authenticator app.",
    reset: "This is your first sign-in. Please set a secure password.",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight mb-2 flex items-center justify-center gap-2">
            <ShieldCheck className="h-10 w-10 text-indigo-600 dark:text-indigo-500" /> PETRUS
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Enterprise Employee Lifecycle Platform</p>
        </div>

        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Step indicator */}
          {step === "mfa" && (
            <div className="flex items-center gap-3 mb-5 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 rounded-xl">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <KeyRound className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">MFA Required</p>
                <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Signed in as {email}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stepTitle[step]}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{stepSubtitle[step]}</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Credentials Form ── */}
          {step === "credentials" && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Authenticating...</>
                ) : (
                  <>Sign In <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          )}

          {/* ── MFA OTP Form ── */}
          {step === "mfa" && (
            <form className="space-y-6" onSubmit={handleMfaVerify}>
              <div className="space-y-2">
                <label htmlFor="otp-code" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                  One-Time Passcode
                </label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-4 text-slate-900 dark:text-white text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-1 mt-1">
                  Open Google Authenticator, Authy, or any TOTP app and enter the 6-digit code.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Verifying...</>
                ) : (
                  <><KeyRound className="h-5 w-5" /> Verify & Sign In</>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                ← Back to login
              </button>
            </form>
          )}

          {/* ── Force Reset Form ── */}
          {step === "reset" && (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password & Sign In"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
