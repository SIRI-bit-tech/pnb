"use client";

import React, { useState, useEffect } from "react";
import { Landmark, ShieldCheck, DollarSign, RefreshCw, Plus } from "lucide-react";
import IssueIRSRefundModal from "./IssueIRSRefundModal";
import { AdminTaxPayment, AdminTaxCompliance } from "./types";
import { toast } from "sonner";

export default function AdminTaxPage() {
  const [payments, setPayments] = useState<AdminTaxPayment[]>([]);
  const [compliance, setCompliance] = useState<AdminTaxCompliance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const fetchAdminTaxData = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      const [pmtRes, compRes] = await Promise.all([
        fetch(`${apiBase}/admin/tax/payments?page_size=100`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/admin/tax/compliance`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pmtRes.ok) setPayments(await pmtRes.json());
      if (compRes.ok) setCompliance(await compRes.json());
    } catch {
      toast.error("Failed to load admin tax compliance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminTaxData();
  }, []);

  const handleIssueRefund = async (payload: { user_email: string; refund_amount: number; status: string; tax_year: string }) => {
    setSubmitting(true);
    const token = localStorage.getItem("admin_session_token");
    try {
      const res = await fetch(`${apiBase}/admin/tax/refunds/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`IRS Refund updated to '${payload.status}' successfully`);
        setIsIssueModalOpen(false);
        await fetchAdminTaxData();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update IRS refund");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" /> IRS Compliance & Federal Payments Ledger
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Monitor electronic federal tax payments, IRS confirmation numbers, W-9 certifications, and issue IRS Tax Refund deposits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Issue IRS Refund
          </button>
          <button
            onClick={fetchAdminTaxData}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Compliance Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Total Federal Tax Paid
          </span>
          <span className="font-mono text-2xl font-extrabold text-zinc-900">
            ${compliance ? compliance.total_federal_tax_paid.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Processed via Direct EFTPS Wire</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            W-9 Certification Rate
          </span>
          <span className="font-mono text-2xl font-extrabold text-emerald-600">
            {compliance ? compliance.w9_compliance_rate : 0}%
          </span>
          <span className="text-[10px] text-zinc-400">
            {compliance?.verified_w9_count || 0} of {compliance?.total_users || 0} Accounts Certified
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            IRS Backup Withholding
          </span>
          <span className="font-mono text-2xl font-extrabold text-zinc-900">
            {compliance?.backup_withholding_rate || "24.0%"}
          </span>
          <span className="text-[10px] text-zinc-400">Standard Statutory Rate</span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-100 font-bold text-xs text-zinc-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Federal Tax Payment Receipts & IRS Confirmation Ledger
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-100 font-bold text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">User / Applicant</th>
                <th className="px-6 py-4">IRS Confirmation #</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Tax Year</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400 animate-pulse">
                    Loading federal tax payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">
                    No federal tax payments recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900">{p.applicant_name}</span>
                        <span className="text-[10px] text-zinc-400">{p.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                      {p.irs_confirmation_number}
                    </td>
                    <td className="px-6 py-4 uppercase font-semibold text-zinc-800">
                      {p.payment_type.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 font-mono">{p.tax_year}</td>
                    <td className="px-6 py-4 font-mono font-bold text-zinc-900">
                      ${p.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isIssueModalOpen && (
        <IssueIRSRefundModal
          onClose={() => setIsIssueModalOpen(false)}
          onSubmit={handleIssueRefund}
          submitting={submitting}
        />
      )}
    </div>
  );
}
