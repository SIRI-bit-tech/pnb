"use client";

import React, { useState, useEffect } from "react";
import { Landmark, ShieldCheck, DollarSign, History, ArrowDownToLine } from "lucide-react";
import PageShell from "@/components/dashboard/PageShell";
import SectionHeader from "@/components/dashboard/SectionHeader";
import IRSRefundDirectDepositCard from "./IRSRefundDirectDepositCard";
import TaxDocumentsCard from "./TaxDocumentsCard";
import PayIRSModal from "./PayIRSModal";
import W9CertificationModal from "./W9CertificationModal";
import NotifyIRSRefundModal from "./NotifyIRSRefundModal";
import { TaxOverview, TaxDocument, TaxPaymentPayload, W9Payload } from "./types";
import { toast } from "sonner";
import { getApiBase } from "@/lib/api";

export default function UserTaxPage() {
  const [overview, setOverview] = useState<TaxOverview | null>(null);
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingBalance, setCheckingBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [currency, setCurrency] = useState("USD");

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isW9ModalOpen, setIsW9ModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiBase = getApiBase();
  const symbol = currency === "GBP" ? "£" : "$";

  const fetchTaxData = async () => {
    const token = localStorage.getItem("session_token");
    if (!token) return;
    try {
      const [ovRes, docRes, accRes] = await Promise.all([
        fetch(`${apiBase}/tax/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/tax/documents`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/auth/me/account`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (docRes.ok) setDocuments(await docRes.json());
      if (accRes.ok) {
        const acc = await accRes.json();
        setCheckingBalance(Number(acc.checking_balance || 0));
        setSavingsBalance(Number(acc.savings_balance || 0));
        setCurrency(acc.currency || "USD");
      }
    } catch {
      toast.error("Failed to load tax & IRS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, []);

  const handlePayIRS = async (payload: TaxPaymentPayload) => {
    setSubmitting(true);
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/tax/pay-irs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Federal tax payment submitted to IRS successfully");
        setIsPayModalOpen(false);
        await fetchTaxData();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Payment failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleW9Submit = async (payload: W9Payload) => {
    setSubmitting(true);
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/tax/w9`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("W-9 tax certification verified");
        setIsW9ModalOpen(false);
        await fetchTaxData();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "W-9 certification failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifyRefund = async (refundAmount: number, taxYear: string) => {
    setSubmitting(true);
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/tax/refunds/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ refund_amount: refundAmount, tax_year: taxYear }),
      });
      if (res.ok) {
        toast.success("Active IRS Refund Tracker enabled for your account");
        setIsNotifyModalOpen(false);
        await fetchTaxData();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Failed to submit expected refund");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell maxWidth="lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <SectionHeader
          title="IRS Tax & Refund Hub"
          subtitle="Electronic federal tax payments, direct deposit tax refund tracking, and official 1099 statements."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNotifyModalOpen(true)}
            className="py-3 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-600" /> Notify Incoming Refund
          </button>
          <button
            onClick={() => setIsPayModalOpen(true)}
            className="py-3 px-5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" /> Pay IRS Directly
          </button>
        </div>
      </div>

      {loading || !overview ? (
        <div className="h-64 rounded-3xl bg-zinc-100 animate-pulse mb-8" />
      ) : (
        <div className="flex flex-col gap-6">
          <IRSRefundDirectDepositCard overview={overview} />

          {/* W-9 Certification Banner */}
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-zinc-900 block">W-9 Taxpayer Certification</span>
                <span className="text-[10px] text-zinc-500">
                  {overview.w9
                    ? `Verified SSN •••• ${overview.w9.ssn_last4} (${overview.w9.tax_classification})`
                    : "Form W-9 certification required for annual interest reporting."}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsW9ModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold text-xs cursor-pointer"
            >
              {overview.w9 ? "Update W-9" : "Certify W-9"}
            </button>
          </div>

          <TaxDocumentsCard documents={documents} symbol={symbol} />

          {/* Recent IRS Payments Ledger */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-4">
            <h4 className="font-heading font-bold text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <History className="w-4 h-4 text-primary" /> Federal Tax Payment Receipts
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-50 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">DATE</th>
                    <th className="p-3">CONFIRMATION #</th>
                    <th className="p-3">CATEGORY</th>
                    <th className="p-3">AMOUNT</th>
                    <th className="p-3 rounded-r-xl text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                  {overview.recent_payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-400">
                        No federal tax payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    overview.recent_payments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/50">
                        <td className="p-3 font-mono text-[11px]">
                          {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{p.irs_confirmation_number}</td>
                        <td className="p-3 font-semibold uppercase">{p.payment_type.replace("_", " ")}</td>
                        <td className="p-3 font-mono font-bold text-zinc-900">{symbol}{p.amount.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isPayModalOpen && (
        <PayIRSModal
          checkingBalance={checkingBalance}
          savingsBalance={savingsBalance}
          symbol={symbol}
          onClose={() => setIsPayModalOpen(false)}
          onSubmit={handlePayIRS}
          submitting={submitting}
        />
      )}

      {isW9ModalOpen && (
        <W9CertificationModal
          onClose={() => setIsW9ModalOpen(false)}
          onSubmit={handleW9Submit}
          submitting={submitting}
        />
      )}

      {isNotifyModalOpen && (
        <NotifyIRSRefundModal
          onClose={() => setIsNotifyModalOpen(false)}
          onSubmit={handleNotifyRefund}
          submitting={submitting}
        />
      )}
    </PageShell>
  );
}
