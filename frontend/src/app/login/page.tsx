"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AuthForm from "@/components/AuthForm";
import Modal from "@/components/Modal";
import FormInput from "@/components/FormInput";
import { getApiBase } from "@/lib/api";
import { ShieldAlert } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleLogin = async (formData: any) => {
    setIsLoading(true);
    setError("");
    try {
      const apiBase = getApiBase();
      let response = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Fallback if 404 and apiBase ends with /api
      if (response.status === 404 && apiBase.endsWith("/api")) {
        const rootBase = apiBase.replace(/\/api$/, "");
        response = await fetch(`${rootBase}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        let errorMsg = "Authentication failed";
        if (response.status === 404) {
          errorMsg = "API route not found (HTTP 404). Please ensure the backend server is running.";
        } else if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map((e: any) => e.msg || String(e)).join(" | ");
        } else if (data.message) {
          errorMsg = data.message;
        }
        throw new Error(errorMsg);
      }
      localStorage.setItem("verify_email", data.email);
      if (data.two_factor_required) {
        localStorage.setItem("two_factor_required", "true");
      } else {
        localStorage.removeItem("two_factor_required");
      }
      router.push("/verify-account");
    } catch (err: any) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async () => {
    if (!resetUsername.trim()) return;
    setResetLoading(true);
    setResetError("");
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: resetUsername.trim() }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Request failed");
      }
      setResetSent(true);
    } catch {
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotOpen(false);
    setResetUsername("");
    setResetSent(false);
    setResetError("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 relative bg-[#f9f9ff] select-none text-zinc-900">
      {/* Subtle green glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-[#1faa6e]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col gap-8 py-12">
        <div className="flex flex-col gap-2 text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image
              src="/Prescott-National-Bank-logo.png"
              alt="Prescott National Bank"
              width={128}
              height={128}
              className="h-14 md:h-16 w-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-zinc-950 tracking-tight mt-4">
            Sign in to Prescott National Bank
          </h1>
          <p className="text-sm text-zinc-500">Enter your credentials to unlock access.</p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <AuthForm type="login" onSubmit={handleLogin} isLoading={isLoading} serverError={error && !error.startsWith("BANNED:") ? error : undefined} />
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-sm font-semibold text-[#1faa6e] hover:text-[#006d43] transition-colors"
            >
              Forgot password?
            </button>
            <p className="text-sm text-zinc-500">
              New here?{" "}
              <Link href="/register" className="font-semibold text-[#1faa6e] hover:text-[#006d43] transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Modal isOpen={forgotOpen} onClose={closeForgotModal} title="Reset Password">
        <div className="flex flex-col gap-4 text-sm text-zinc-600">
          {resetSent ? (
            <div className="flex flex-col gap-3 py-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center text-xl mb-2">
                ✓
              </div>
              <p className="font-medium text-zinc-900">Check your email</p>
              <p>We've sent a temporary password to the email associated with your account.</p>
              <button 
                onClick={closeForgotModal}
                className="mt-4 w-full py-2.5 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-all"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <>
              <p>Enter your username and we'll send a temporary password to your registered email address.</p>
              {resetError && <p className="text-error font-medium text-xs">{resetError}</p>}
              <div className="mt-2">
                <FormInput
                  label="Username"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>
              <button
                onClick={handleResetRequest}
                disabled={resetLoading || !resetUsername.trim()}
                className="w-full py-2.5 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 mt-2"
              >
                {resetLoading ? "Sending..." : "Reset Password"}
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Full Ban Suspension Notice Modal */}
      {error && error.startsWith("BANNED:") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border border-red-200 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 text-zinc-900">
            <div className="flex items-start gap-4 pb-4 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                  Account Security Notice
                </span>
                <h3 className="text-lg font-bold text-zinc-950 tracking-tight">
                  Online Banking Access Suspended
                </h3>
                <p className="text-xs text-zinc-500">
                  Prescott National Bank Global Security & Compliance Administration
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-red-50/70 border border-red-200 p-4 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
                Reason for Account Suspension
              </span>
              <p className="text-xs font-medium text-red-950 leading-relaxed bg-white/80 p-3 rounded-xl border border-red-200/50">
                {error.replace("BANNED:", "").trim() || "Account access permanently restricted due to administrative compliance review."}
              </p>
            </div>

            <div className="space-y-3 text-xs text-zinc-600 leading-relaxed">
              <p>
                In accordance with Federal banking regulations and Prescott National Bank security protocols, all login access and online banking services associated with this profile have been suspended.
              </p>
              <p>
                If you believe this administrative decision was made in error or wish to request an account review, you must contact our Compliance & Legal Department.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Support & Appeals
                </span>
                <a
                  href="mailto:support@prescottnational.com?subject=Account%20Suspension%20Appeal"
                  className="font-semibold text-[#1faa6e] hover:underline"
                >
                  support@prescottnational.com
                </a>
              </div>
              <a
                href="mailto:support@prescottnational.com?subject=Account%20Suspension%20Appeal"
                className="px-4 py-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 font-semibold rounded-xl text-xs shadow-sm transition-all"
              >
                Contact Support
              </a>
            </div>

            <button 
              type="button"
              onClick={() => setError("")}
              className="w-full py-3 rounded-2xl bg-zinc-900 text-white font-semibold text-xs hover:bg-zinc-800 transition-all shadow-sm cursor-pointer"
            >
              Dismiss Notice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
