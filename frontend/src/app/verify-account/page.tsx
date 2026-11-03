"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormInput from "@/components/FormInput";
import { getApiBase } from "@/lib/api";
import Image from "next/image";
import { Smartphone, Mail, ShieldCheck } from "lucide-react";

export default function VerifyAccount() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(true);
  const [is2FA, setIs2FA] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"totp" | "email">("totp");
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const [isUnderReview, setIsUnderReview] = useState(false);

  const handleSendCode = async (targetEmail: string) => {
    setIsLoading(true);
    setError("");
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, channel: "email" }),
      });
      const data = await response.json();
      if (!response.ok) {
        let errorMsg = "Failed to send code";
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map((e: any) => e.msg || String(e)).join(" | ");
        } else if (data.detail && typeof data.detail === "object") {
          errorMsg = data.detail.msg || JSON.stringify(data.detail);
        } else if (data.message) {
          errorMsg = data.message;
        }
        throw new Error(errorMsg);
      }
      setSent(true);
      setEmailCodeSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("verify_email");
    const twoFactorFlag = localStorage.getItem("two_factor_required") === "true";
    setIs2FA(twoFactorFlag);

    if (!saved && !isUnderReview) {
      router.push("/register");
    } else if (saved) {
      setEmail(saved);
    }
  }, [router, isUnderReview]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const apiBase = getApiBase();
      const methodToUse = is2FA ? twoFactorMethod : "email";
      const response = await fetch(`${apiBase}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          otp_code: code.trim(), 
          channel: "email",
          method: methodToUse 
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        let errorMsg = "Verification failed";
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map((e: any) => e.msg || String(e)).join(" | ");
        } else if (data.detail && typeof data.detail === "object") {
          errorMsg = data.detail.msg || JSON.stringify(data.detail);
        } else if (data.message) {
          errorMsg = data.message;
        }
        throw new Error(errorMsg);
      }

      if (data.is_approved === false || data.status === "under_review") {
        localStorage.removeItem("verify_email");
        localStorage.removeItem("two_factor_required");
        setIsUnderReview(true);
        return;
      }

      if (data.access_token) {
        localStorage.setItem("session_token", data.access_token);
        localStorage.removeItem("verify_email");
        localStorage.removeItem("two_factor_required");
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToEmailMethod = () => {
    setTwoFactorMethod("email");
    setCode("");
    setError("");
    if (!emailCodeSent) {
      handleSendCode(email);
    }
  };

  const switchToTotpMethod = () => {
    setTwoFactorMethod("totp");
    setCode("");
    setError("");
  };

  if (isUnderReview) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 relative bg-[#f9f9ff] select-none text-zinc-900">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-[#1faa6e]/5 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[460px] flex flex-col gap-6 py-12">
          <div className="flex flex-col gap-2 text-center">
            <div className="inline-flex items-center justify-center">
              <Image
                src="/Prescott-National-Bank-logo.png"
                alt="Prescott National Bank"
                width={128}
                height={128}
                className="h-14 md:h-16 w-auto object-contain"
                priority
              />
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm text-center flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <svg className="w-7 h-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-100/70 text-amber-800 border border-amber-200">
              Application Under Review
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-heading font-bold text-zinc-950">
                Your Account Is Under Review
              </h1>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                Thank you for verifying your email address. In accordance with banking compliance standards, all new accounts undergo administrative verification.
              </p>
            </div>

            <div className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Estimated Review Time:</span>
                <span className="font-semibold text-zinc-900 font-mono">24 – 72 Hours</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Applicant Email:</span>
                <span className="font-semibold text-zinc-900 truncate max-w-[190px]">{email}</span>
              </div>
              <div className="text-[11px] text-zinc-400 border-t border-zinc-200/60 pt-2.5 leading-normal">
                An official approval email will be sent to your inbox once your account is ready for sign-in.
              </div>
            </div>

            <div className="w-full pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-[#1faa6e] hover:bg-[#18935f] text-white font-semibold py-3.5 rounded-2xl transition-colors duration-300 text-xs cursor-pointer shadow-sm"
              >
                Go to Sign In
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full text-xs text-zinc-500 hover:text-zinc-800 py-2 transition-colors cursor-pointer"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 relative bg-[#f9f9ff] select-none text-zinc-900">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-[#1faa6e]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col gap-8 py-12">
        <div className="flex flex-col gap-2 text-center">
          <div className="inline-flex items-center justify-center">
            <Image
              src="/Prescott-National-Bank-logo.png"
              alt="Prescott National Bank"
              width={128}
              height={128}
              className="h-14 md:h-16 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-heading font-bold text-zinc-950 tracking-tight mt-4">
            {is2FA ? "Two-Factor Authentication" : "Verify your account"}
          </h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            {is2FA ? (
              twoFactorMethod === "totp"
                ? "Enter the 6-digit security code generated by your Authenticator app."
                : `Enter the 6-digit security code sent to your registered email: ${email}`
            ) : (
              !sent
                ? "Initializing secure verification link..."
                : `We sent a 6-digit OTP code to your registered email: ${email}`
            )}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold">{error}</div>}

          {/* 2FA Option Selector */}
          {is2FA && (
            <div className="flex bg-zinc-100 p-1 rounded-xl mb-6 border border-zinc-200">
              <button
                type="button"
                onClick={switchToTotpMethod}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  twoFactorMethod === "totp"
                    ? "bg-white text-[#006d43] shadow-sm border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Authenticator App
              </button>
              <button
                type="button"
                onClick={switchToEmailMethod}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  twoFactorMethod === "email"
                    ? "bg-white text-[#006d43] shadow-sm border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email Code
              </button>
            </div>
          )}

          {!sent && isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-100 border-t-[#1faa6e] animate-spin" />
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Sending Code...</p>
            </div>
          ) : (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <FormInput 
                label={
                  is2FA && twoFactorMethod === "totp"
                    ? "6-Digit Authenticator App Code"
                    : "Enter 6-Digit Email Code"
                } 
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} 
                maxLength={6} 
                placeholder="••••••"
                required 
              />

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full mt-2 bg-[#1faa6e] hover:bg-[#18935f] text-white font-semibold py-3.5 rounded-2xl transition-colors duration-300 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </button>

              {/* Seamless Alternative Switchers */}
              {is2FA ? (
                <div className="pt-2 text-center text-xs">
                  {twoFactorMethod === "totp" ? (
                    <button
                      type="button"
                      onClick={switchToEmailMethod}
                      className="text-zinc-500 hover:text-zinc-800 transition-colors"
                    >
                      Can't access your authenticator? <strong className="text-[#006d43] hover:underline">Get code via email instead</strong>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendCode(email)}
                        disabled={isLoading}
                        className="text-xs text-[#1faa6e] hover:text-[#18935f] hover:underline font-medium cursor-pointer"
                      >
                        Resend email verification code
                      </button>
                      <button
                        type="button"
                        onClick={switchToTotpMethod}
                        className="text-zinc-500 hover:text-zinc-800 transition-colors"
                      >
                        Have your authenticator app ready? <strong className="text-[#006d43] hover:underline">Use Authenticator App</strong>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendCode(email)}
                  disabled={isLoading}
                  className="w-full text-xs text-[#1faa6e] hover:text-[#18935f] hover:underline mt-2 text-center disabled:opacity-50 cursor-pointer"
                >
                  Resend verification code
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
