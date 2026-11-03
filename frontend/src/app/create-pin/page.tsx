"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormInput from "@/components/FormInput";
import Image from "next/image";
import { getApiBase } from "@/lib/api";

export default function CreatePin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("verify_email");
    if (!saved) {
      // If user is already authenticated via session_token, stay on create-pin
      const token = localStorage.getItem("session_token");
      if (!token) {
        router.push("/register");
      }
    } else {
      setEmail(saved);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/auth/create-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to set PIN");

      // Save session credentials
      localStorage.setItem("session_token", data.access_token);
      localStorage.removeItem("verify_email"); // Clear temporary verify email
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to set PIN. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 relative bg-[#f9f9ff] select-none text-zinc-900">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-[#1faa6e]/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] flex flex-col gap-8 py-12">
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
            Create Transaction PIN
          </h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Set a 4-digit code. You will need this to authorize P2P and wire transfers on your account.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormInput
              label="4-Digit PIN"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              required
            />
            <FormInput
              label="Confirm PIN"
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              required
            />
            <button
              type="submit"
              disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
              className="w-full mt-2 bg-[#1faa6e] hover:bg-[#18935f] text-white font-semibold py-3.5 rounded-2xl transition-colors duration-300 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Setting PIN..." : "Confirm & Complete"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
