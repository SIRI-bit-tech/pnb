"use client";

import React, { useState } from "react";
import FormInput from "@/components/FormInput";
import Modal from "@/components/Modal";
import { getApiBase } from "@/lib/api";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Smartphone, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle, 
  Lock,
  ArrowRight
} from "lucide-react";
import { SecurityFormProps } from "./types";
import { useRouter } from "next/navigation";

export default function SecurityForm({
  currentPw,
  setCurrentPw,
  newPw,
  setNewPw,
  submitting,
  onSubmit,
  twoFactorEnabled,
  onTwoFactorUpdate,
}: SecurityFormProps) {
  const router = useRouter();
  const apiBase = getApiBase();
  const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;

  // 2FA Setup Modal State
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ secret: string; otpauth_url: string; qr_image_url: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Disable 2FA Modal State
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);

  // Delete Account State
  const [deleteModalStep, setDeleteModalStep] = useState<"none" | "otp" | "confirm">("none");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Handle open 2FA setup
  const handleOpenSetup = async () => {
    setSetupLoading(true);
    setSetupModalOpen(true);
    setVerifyCode("");
    try {
      const res = await fetch(`${apiBase}/settings/2fa/setup`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to initialize 2FA setup");
      const data = await res.json();
      setTwoFactorData(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load 2FA setup");
      setSetupModalOpen(false);
    } finally {
      setSetupLoading(false);
    }
  };

  // Handle verify & enable 2FA
  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch(`${apiBase}/settings/2fa/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractErrorMessage(data, "Verification failed"));
      }
      toast.success("Two-Factor Authentication is now active!");
      onTwoFactorUpdate(true);
      setSetupModalOpen(false);
      setVerifyCode("");
    } catch (err: any) {
      toast.error(err.message || "Failed to enable 2FA");
    } finally {
      setIsVerifying(false);
    }
  };

  function extractErrorMessage(data: any, fallback: string): string {
    if (!data) return fallback;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      if (typeof first === "string") return first;
      if (first && typeof first.msg === "string") return first.msg;
    }
    if (typeof data.message === "string") return data.message;
    return fallback;
  }

  // Handle disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode.trim()) {
      toast.error("Please enter your 6-digit code or current password.");
      return;
    }
    setIsDisabling(true);
    try {
      const res = await fetch(`${apiBase}/settings/2fa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(extractErrorMessage(data, "Failed to disable 2FA"));
      }
      toast.success("Two-Factor Authentication has been disabled.");
      onTwoFactorUpdate(false);
      setDisableModalOpen(false);
      setDisableCode("");
    } catch (err: any) {
      toast.error(err.message || "Failed to disable 2FA");
    } finally {
      setIsDisabling(false);
    }
  };

  // Copy secret to clipboard
  const handleCopySecret = () => {
    if (!twoFactorData?.secret) return;
    navigator.clipboard.writeText(twoFactorData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    toast.success("Secret key copied to clipboard");
  };

  // Delete Account: Step 1 Request OTP
  const handleStartDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${apiBase}/settings/delete-account/request-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to request deletion code");
      toast.success("Security verification code dispatched to your registered email.");
      setDeleteOtp("");
      setDeleteModalStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate account deletion");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Delete Account: Step 2 Verify OTP
  const handleVerifyDeleteOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteOtp.trim().length !== 6) {
      toast.error("Please enter the 6-digit verification code sent to your email.");
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch(`${apiBase}/settings/delete-account/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp_code: deleteOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid verification code");
      // Advance to final confirmation step
      setDeleteModalStep("confirm");
    } catch (err: any) {
      toast.error(err.message || "Code verification failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Delete Account: Step 3 Final Confirm
  const handleConfirmPermanentDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${apiBase}/settings/delete-account/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp_code: deleteOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Deletion failed");

      toast.success("Your Prescott National Bank account has been permanently closed.");
      localStorage.clear();
      setDeleteModalStep("none");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Account deletion failed");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Change Password Block */}
      <form onSubmit={onSubmit} className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
          <Lock className="w-4 h-4 text-zinc-500" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Change Password</p>
        </div>
        <FormInput 
          label="Current Password" 
          type="password" 
          value={currentPw} 
          onChange={(e) => setCurrentPw(e.target.value)} 
          placeholder="••••••••••••"
        />
        <FormInput 
          label="New Password" 
          type="password" 
          value={newPw} 
          onChange={(e) => setNewPw(e.target.value)} 
          placeholder="Minimum 8 characters"
        />
        <button 
          type="submit" 
          disabled={submitting || (!currentPw && !newPw)} 
          className="w-full py-3 rounded-2xl bg-[#1faa6e] hover:bg-[#18935f] text-white font-bold text-xs transition-colors duration-300 disabled:opacity-50 mt-1 cursor-pointer"
        >
          {submitting ? "Updating..." : "Update Password"}
        </button>
      </form>

      {/* 2. Two-Factor Authentication (2FA) Block */}
      <div className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700">Two-Factor Authentication (2FA)</p>
          </div>
          {twoFactorEnabled ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              Not Set
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Protect your commercial account with two-factor authentication. When enabled, signing in requires either a 6-digit TOTP code from your authenticator app (Google Authenticator, Authy, Microsoft Authenticator) or an email verification code.
        </p>

        <div className="pt-2">
          {twoFactorEnabled ? (
            <button
              type="button"
              onClick={() => { setDisableCode(""); setDisableModalOpen(true); }}
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Disable Two-Factor Authentication
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenSetup}
              disabled={setupLoading}
              className="w-full py-3 px-4 rounded-2xl bg-[#006d43] hover:bg-[#005232] text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              {setupLoading ? "Generating Secret..." : "Set Up Two-Factor Authentication"}
            </button>
          )}
        </div>
      </div>

      {/* 3. Danger Zone: Close / Delete Account */}
      <div className="p-5 rounded-3xl bg-red-50/40 border border-red-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-red-200/60">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">Danger Zone: Close Account</p>
          </div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
            Irreversible
          </span>
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed">
          Permanently close your Prescott National Bank commercial banking relationship and delete all profile data. To safeguard against unauthorized closures, an email security authorization code is required prior to confirmation.
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleStartDeleteAccount}
            disabled={deleteLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleteLoading ? "Sending Security Code..." : "Close & Delete Account"}
          </button>
        </div>
      </div>

      {/* MODAL: 2FA Setup Flow */}
      <Modal 
        isOpen={setupModalOpen} 
        onClose={() => setSetupModalOpen(false)} 
        title="Set Up Authenticator (2FA)"
      >
        <div className="flex flex-col gap-4 text-xs text-zinc-700">
          {setupLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-zinc-200 border-t-[#006d43] animate-spin" />
              <p className="text-zinc-400 font-semibold text-xs">Generating your unique authenticator key...</p>
            </div>
          ) : twoFactorData ? (
            <form onSubmit={handleEnable2FA} className="flex flex-col gap-3.5">
              <p className="text-zinc-500 text-[11px] leading-tight text-center">
                Scan with Google Authenticator, Microsoft Authenticator, or Authy.
              </p>

              {/* Compact QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 border border-zinc-200 rounded-2xl gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={twoFactorData.qr_image_url} 
                  alt="2FA QR Code" 
                  className="w-32 h-32 rounded-xl bg-white p-1.5 border border-zinc-200 shadow-sm"
                />
                
                {/* Compact Secret Key */}
                <div className="flex items-center justify-center gap-2 w-full max-w-[300px]">
                  <span className="font-mono text-[11px] text-zinc-600 truncate select-all">
                    {twoFactorData.secret}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-1 rounded-md bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors shrink-0 cursor-pointer"
                    title="Copy Secret Key"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Enter 6-Digit Code */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase text-center block">
                  Enter 6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  className="w-full text-center tracking-widest text-base font-mono font-bold py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSetupModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || verifyCode.length !== 6}
                  className="flex-1 py-2.5 rounded-xl bg-[#006d43] hover:bg-[#005232] text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isVerifying ? "Activating..." : "Activate 2FA"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </Modal>

      {/* MODAL: Disable 2FA */}
      <Modal isOpen={disableModalOpen} onClose={() => setDisableModalOpen(false)} title="Disable Two-Factor Authentication">
        <form onSubmit={handleDisable2FA} className="flex flex-col gap-4 text-xs text-zinc-700">
          <p className="text-zinc-500 text-xs leading-relaxed">
            Enter the 6-digit code from your authenticator app or your account password to confirm disabling Two-Factor Authentication.
          </p>

          <FormInput
            label="Verification Code or Password"
            type="password"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="6-digit code or account password"
            required
          />

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDisableModalOpen(false)}
              className="flex-1 py-2.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDisabling || !disableCode.trim()}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isDisabling ? "Disabling..." : "Disable 2FA"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Delete Account - Step 1: OTP Entry */}
      <Modal 
        isOpen={deleteModalStep === "otp"} 
        onClose={() => setDeleteModalStep("none")} 
        title="Account Closure Security Authorization"
      >
        <form onSubmit={handleVerifyDeleteOtp} className="flex flex-col gap-4 text-xs text-zinc-700">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              A high-security 6-digit verification code has been dispatched to your email address to authenticate this account closure request.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">
              Enter 6-Digit Email Authorization Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalStep("none")}
              className="flex-1 py-2.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleteLoading || deleteOtp.length !== 6}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              {deleteLoading ? "Verifying..." : "Verify Code"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Delete Account - Step 2: Irreversible Final Confirmation (BOA Style) */}
      <Modal 
        isOpen={deleteModalStep === "confirm"} 
        onClose={() => setDeleteModalStep("none")} 
        title="Permanent Account Termination"
      >
        <div className="flex flex-col gap-4 text-xs text-zinc-700">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              Final Banking Warning
            </div>
            <p className="text-[11px] text-red-700 leading-relaxed">
              Are you sure you want to permanently delete your Prescott National Bank account? All checking, savings, virtual cards, active portfolios, and historical statements will be permanently purged.
            </p>
          </div>

          <ul className="text-[11px] text-zinc-500 list-disc pl-5 space-y-1">
            <li>Any pending incoming wires will be rejected and returned.</li>
            <li>Direct deposit routing and debit card numbers will cease functioning immediately.</li>
            <li>This action is final, irreversible, and cannot be undone by bank support.</li>
          </ul>

          <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setDeleteModalStep("none")}
              disabled={deleteLoading}
              className="flex-1 py-3 text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel & Keep Account
            </button>
            <button
              type="button"
              onClick={handleConfirmPermanentDelete}
              disabled={deleteLoading}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {deleteLoading ? "Closing Account..." : "Yes, Delete My Account"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
