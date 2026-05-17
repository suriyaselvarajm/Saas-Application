"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ShieldCheck, ShieldOff, KeyRound, QrCode, CheckCircle2,
  AlertCircle, Loader2, Copy, Eye, EyeOff,
} from "lucide-react";

type SetupStep = "idle" | "qr" | "verify" | "done";

export default function MfaSettingsPage() {
  const [step, setStep] = useState<SetupStep>("idle");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [disableOtp, setDisableOtp] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(() => {
    if (typeof globalThis.window === "undefined") return false;
    const user = JSON.parse(localStorage.getItem("petrus_user") || "{}");
    return user?.mfaEnabled ?? false;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  const userId = () => {
    const user = JSON.parse(localStorage.getItem("petrus_user") || "{}");
    return user?.id ?? "";
  };

  const token = () => localStorage.getItem("petrus_token") ?? "";

  // ── Start Setup ────────────────────────────────────────────────────────────
  const handleStartSetup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/mfa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ userId: userId() }),
      });
      if (!res.ok) throw new Error("Failed to start MFA setup");
      const data = await res.json();
      setQrCodeUrl(data.qrCodeDataUrl);
      setSecretKey(data.secret);
      setStep("qr");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify & Enable ────────────────────────────────────────────────────────
  const handleEnable = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (otpToken.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/mfa/enable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ userId: userId(), token: otpToken }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Verification failed");
      }
      // Update cached user
      const user = JSON.parse(localStorage.getItem("petrus_user") || "{}");
      user.mfaEnabled = true;
      localStorage.setItem("petrus_user", JSON.stringify(user));
      setMfaEnabled(true);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Disable MFA ────────────────────────────────────────────────────────────
  const handleDisable = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (disableOtp.length !== 6) {
      setError("Enter the 6-digit code to confirm disabling MFA.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/mfa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ userId: userId(), token: disableOtp }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to disable MFA");
      }
      const user = JSON.parse(localStorage.getItem("petrus_user") || "{}");
      user.mfaEnabled = false;
      localStorage.setItem("petrus_user", JSON.stringify(user));
      setMfaEnabled(false);
      setDisableOtp("");
      setStep("idle");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to disable MFA");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    void navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">
            Two-Factor Authentication
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Add an extra layer of security to your account using a TOTP authenticator app.
          </p>
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
          mfaEnabled
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30"
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30"
        }`}>
          {mfaEnabled ? (
            <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <ShieldOff className="h-8 w-8 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <div>
            <p className={`font-semibold ${mfaEnabled ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
              {mfaEnabled ? "MFA is Active" : "MFA is Not Enabled"}
            </p>
            <p className={`text-sm mt-0.5 ${mfaEnabled ? "text-emerald-600/80 dark:text-emerald-400/70" : "text-amber-600/80 dark:text-amber-400/70"}`}>
              {mfaEnabled
                ? "Your account is protected with two-factor authentication."
                : "Enable MFA to protect your account with a one-time passcode on every login."}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── MFA Not Enabled: Setup flow ── */}
        {!mfaEnabled && (
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-2xl space-y-6">

            {step === "idle" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Set Up Authenticator App</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Works with Google Authenticator, Authy, Microsoft Authenticator, and any TOTP-compatible app.
                  </p>
                </div>
                <button
                  onClick={handleStartSetup}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Start Setup
                </button>
              </div>
            )}

            {step === "qr" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Scan QR Code</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Open your authenticator app and scan this QR code, then enter the 6-digit code below to confirm.
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                </div>

                {/* Manual entry */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Or enter code manually
                  </p>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3">
                    <code className={`flex-1 font-mono text-sm text-slate-900 dark:text-white tracking-widest ${showSecret ? "" : "blur-sm select-none"}`}>
                      {secretKey}
                    </code>
                    <button onClick={() => setShowSecret(s => !s)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={copySecret} className="text-slate-400 hover:text-indigo-500 transition-colors">
                      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Verify */}
                <form onSubmit={handleEnable} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="mfa-verify-token" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Verification Code
                    </label>
                    <input
                      id="mfa-verify-token"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otpToken.length !== 6}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Enable MFA</>}
                  </button>
                </form>
              </div>
            )}

            {step === "done" && (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">MFA Enabled!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Your account is now protected with two-factor authentication.
                    You&apos;ll be asked for your code on every login.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MFA Enabled: Disable flow ── */}
        {mfaEnabled && (
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Disable Two-Factor Authentication</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                To disable MFA, enter your current authenticator code to confirm.
              </p>
            </div>

            <form onSubmit={handleDisable} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="mfa-disable-token" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Current Authenticator Code
                </label>
                <input
                  id="mfa-disable-token"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={disableOtp}
                  onChange={(e) => setDisableOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 transition-all outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || disableOtp.length !== 6}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldOff className="h-5 w-5" /> Disable MFA</>}
              </button>
            </form>
          </div>
        )}

        {/* Supported Apps */}
        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Supported Authenticator Apps</h4>
          <div className="grid grid-cols-3 gap-3">
            {["Google Authenticator", "Microsoft Authenticator", "Authy"].map((app) => (
              <div key={app} className="text-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{app}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
