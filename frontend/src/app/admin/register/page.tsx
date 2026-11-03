"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormInput from "@/components/FormInput";
import { getApiBase } from "@/lib/api";

export default function AdminRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const apiBase = getApiBase();
      let response = await fetch(`${apiBase}/admin/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          admin_code: adminCode,
        }),
      });

      // Fallback if 404 and apiBase ends with /api
      if (response.status === 404 && apiBase.endsWith("/api")) {
        const rootBase = apiBase.replace(/\/api$/, "");
        response = await fetch(`${rootBase}/admin/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            admin_code: adminCode,
          }),
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
          errorMsg = data.detail.map((e: any) => e.msg || String(e)).join(" | ");
        } else if (data.message) {
          errorMsg = data.message;
        }
        throw new Error(errorMsg);
      }
      
      // Successfully registered, go to admin login
      router.push("/admin/login");
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 relative bg-[#f9f9ff] select-none text-zinc-900">
      {/* Subtle green glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-[#1faa6e]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex flex-col gap-8 py-12">
        <div className="flex flex-col gap-2 text-center">
          <Link href="/" className="font-heading font-semibold text-[#006d43] text-xl tracking-wide flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              CW
            </div>
            <span>Prescott National Bank Admin</span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-zinc-950 tracking-tight mt-4">
            Initialize Administrator
          </h1>
          <p className="text-sm text-zinc-500">Securely register the system administrator account.</p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleRegister} className="flex flex-col gap-5 w-full">
            {error && (
              <div className="rounded-2xl border border-error bg-error/10 p-4 text-xs text-error font-medium">
                {error}
              </div>
            )}

            <FormInput 
              label="Admin Email Address" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            
            <FormInput 
              label="Secure Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            
            <FormInput 
              label="Admin Authorization Code" 
              type="password" 
              value={adminCode} 
              onChange={(e) => setAdminCode(e.target.value)} 
              required 
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center h-12 rounded-2xl bg-[#1faa6e] text-white font-semibold text-sm transition-all hover:bg-[#18935e] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-[0_4px_12px_rgba(31,170,110,0.3)]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Initialize System Admin"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-4">
          Already initialized? <Link href="/admin/login" className="text-[#1faa6e] font-medium hover:underline">Log in securely.</Link>
        </p>
      </div>
    </div>
  );
}
