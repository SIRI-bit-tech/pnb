"use client";

import React, { useState, useEffect } from "react";
import PageShell from "@/components/dashboard/PageShell";
import SectionHeader from "@/components/dashboard/SectionHeader";
import FormInput from "@/components/FormInput";
import { getApiBase } from "@/lib/api";
import PaymentInstructions from "./PaymentInstructions";
import DepositHistory from "./DepositHistory";
import type { Deposit } from "@/types";

export default function DepositsPage() {
  const [activeTab, setActiveTab] = useState<"check" | "cashapp" | "paypal">("check");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<any>(null);

  // Form State
  const [amount, setAmount] = useState("");
  const [refId, setRefId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("session_token");
    const apiBase = getApiBase();
      try {
        const [configRes, historyRes] = await Promise.all([
          fetch(`${apiBase}/deposits/config`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiBase}/deposits/history`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (configRes.ok) setConfig(await configRes.json());
        if (historyRes.ok) {
          const data = await historyRes.json();
          const mapped = (data.deposits || []).map((dep: any) => ({
            id: dep.id,
            method: dep.type || "check",
            amount: typeof dep.amount === "number" ? dep.amount : parseFloat(dep.amount || "0"),
            status: dep.status === "confirmed" ? "approved" : dep.status,
            referenceId: dep.reference_id || dep.image_front_url || "",
          }));
          setDeposits(mapped);
        }
      } catch {
        setError("Failed to fetch details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    setError("");

    const token = localStorage.getItem("session_token");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    try {
      let res;
      if (activeTab === "check") {
        setError("Mobile check deposit processing is coming soon.");
        setSubmitting(false);
        return;
      } else {
        res = await fetch(`${apiBase}/deposits/${activeTab}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: parseFloat(amount), reference_id: refId }),
        });
      }

      if (res && res.ok) {
        setAmount("");
        setRefId("");
        // Reload history
        const historyRes = await fetch(`${apiBase}/deposits/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (historyRes.ok) {
          const data = await historyRes.json();
          const mapped = (data.deposits || []).map((dep: any) => ({
            id: dep.id,
            method: dep.type || "check",
            amount: typeof dep.amount === "number" ? dep.amount : parseFloat(dep.amount || "0"),
            status: dep.status === "confirmed" ? "approved" : dep.status,
            referenceId: dep.reference_id || dep.image_front_url || "",
          }));
          setDeposits(mapped);
        }
      } else {
        const data = await res?.json();
        setError(data?.detail || "Deposit submission failed");
      }
    } catch {
      setError("Network connection issue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell maxWidth="lg">
      <SectionHeader
        title="Deposits"
        subtitle="Add funds to your account via mobile check check-in or social payment tags."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Deposit Card Column */}
        <div className="flex flex-col gap-6 p-6 rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/60">
            {["check", "cashapp", "paypal"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as any);
                  setError("");
                }}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-primary shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleDepositSubmit} className="flex flex-col gap-4">
            {error && <p className="text-xs text-error font-medium">{error}</p>}

            {/* Display payment details/QR code if CashApp or PayPal is active */}
            {activeTab !== "check" && (
              <PaymentInstructions method={activeTab} config={config} />
            )}

            <FormInput
              label="Amount ($)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />

            {activeTab !== "check" ? (
              <FormInput
                label="Reference ID"
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                placeholder="Transaction code"
                required
              />
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Check Images
                </label>
                <input
                  type="file"
                  disabled
                  className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all disabled:opacity-30 mt-2 cursor-pointer"
            >
              {submitting
                ? "Submitting..."
                : activeTab === "check"
                ? "Submit Deposit"
                : "I have made payment"}
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="p-6 rounded-3xl border border-zinc-200 bg-white shadow-sm h-full">
          <DepositHistory loading={loading} deposits={deposits} />
        </div>
      </div>
    </PageShell>
  );
}
