"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AuthForm from "@/components/AuthForm";
import { getApiBase } from "@/lib/api";

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (formData: any) => {
    setIsLoading(true);
    setError("");
    try {
      const apiBase = getApiBase();
      let response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Fallback if 404 and apiBase ends with /api
      if (response.status === 404 && apiBase.endsWith("/api")) {
        const rootBase = apiBase.replace(/\/api$/, "");
        response = await fetch(`${rootBase}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        let errorMsg = "Registration failed";
        if (response.status === 404) {
          errorMsg = "API route not found (HTTP 404). Please ensure the backend server is running.";
        } else if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail
            .map((e: any) => {
              const field = e.loc ? e.loc.slice(1).join(" → ") : "";
              return field ? `${field}: ${e.msg}` : e.msg;
            })
            .join(" | ");
        } else if (data.message) {
          errorMsg = data.message;
        }
        throw new Error(errorMsg);
      }

      // Save email for verification redirect
      localStorage.setItem("verify_email", formData.email);
      router.push("/verify-account");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 relative bg-[#f9f9ff] select-none text-zinc-900">
      {/* Subtle green mesh glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-[#1faa6e]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[460px] flex flex-col gap-8 py-12">
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
            Create your account
          </h1>
          <p className="text-sm text-zinc-500">
            Institutional-grade security. Instant deployment.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <AuthForm type="register" onSubmit={handleRegister} isLoading={isLoading} serverError={error} />
        </div>

        <p className="text-center text-xs text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1faa6e] font-semibold hover:text-[#18935f] transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
