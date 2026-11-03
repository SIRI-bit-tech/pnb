"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Check, X, RefreshCw } from "lucide-react";
import RejectLoanModal from "./RejectLoanModal";
import { AdminLoanRequest } from "./types";
import { toast } from "sonner";

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<AdminLoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminLoanRequest | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const fetchLoans = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/admin/loans?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setLoans(await res.json());
      }
    } catch {
      toast.error("Failed to load loan applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleApprove = async (loanId: string) => {
    setActionLoading(loanId);
    const token = localStorage.getItem("admin_session_token");
    try {
      const res = await fetch(`${apiBase}/admin/loans/${loanId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        toast.success("Loan approved and funds credited to user account");
        await fetchLoans();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to approve loan");
      }
    } catch {
      toast.error("Network error approving loan");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    const token = localStorage.getItem("admin_session_token");
    try {
      const res = await fetch(`${apiBase}/admin/loans/${rejectTarget.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reject", rejection_reason: reason }),
      });
      if (res.ok) {
        toast.success("Loan application declined and notice email sent");
        setRejectTarget(null);
        await fetchLoans();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to decline loan");
      }
    } catch {
      toast.error("Network error declining loan");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" /> Personal Loan Applications
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review user personal loan requests. Approving instantly credits funds to the user's chosen account. Declining prompts for a rejection reason sent via email.
          </p>
        </div>
        <button
          onClick={fetchLoans}
          className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-100 font-bold text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Employment Status</th>
                <th className="px-6 py-4">Loan Amount</th>
                <th className="px-6 py-4">Term</th>
                <th className="px-6 py-4">Target Account</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400 animate-pulse">
                    Loading loan applications...
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">
                    No loan applications found.
                  </td>
                </tr>
              ) : (
                loans.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900">{l.applicant_name}</span>
                        <span className="text-[10px] text-zinc-400">{l.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-700">{l.employment_status}</td>
                    <td className="px-6 py-4 font-mono font-bold text-zinc-900">
                      ${l.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-mono">{l.term_months} Months</td>
                    <td className="px-6 py-4 uppercase font-bold text-primary">{l.destination_account}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${
                          l.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : l.status === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {l.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={actionLoading === l.id}
                            onClick={() => handleApprove(l.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            disabled={actionLoading === l.id}
                            onClick={() => setRejectTarget(l)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">
                          {l.status === "approved" ? "Approved & Funded" : "Declined"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectTarget && (
        <RejectLoanModal
          applicantName={rejectTarget.applicant_name}
          amount={rejectTarget.amount}
          onClose={() => setRejectTarget(null)}
          onSubmit={handleConfirmReject}
          submitting={actionLoading === rejectTarget.id}
        />
      )}
    </div>
  );
}
