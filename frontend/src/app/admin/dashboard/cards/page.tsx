"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Check, X, ShieldAlert, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getApiBase } from "@/lib/api";

export default function AdminCardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const apiBase = getApiBase();

  const fetchCards = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/admin/cards?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCards(data || []);
      }
    } catch {
      toast.error("Failed to fetch card requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleReview = async (cardId: string, action: "approve" | "reject") => {
    setActionLoading(cardId);
    const token = localStorage.getItem("admin_session_token");
    try {
      const res = await fetch(`${apiBase}/admin/cards/${cardId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(`Card request ${action}d successfully`);
        await fetchCards();
      } else {
        const err = await res.json();
        toast.error(err.detail || `Failed to ${action} card`);
      }
    } catch {
      toast.error(`Network error attempting to ${action} card`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> Virtual Card Requests
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review user virtual card requests. Approving sets a 1-hour delay timer before card delivery. Rejecting refunds funds back to the user's chosen account.
          </p>
        </div>
        <button
          onClick={fetchCards}
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
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Card Last 4</th>
                <th className="px-6 py-4">Initial Funding</th>
                <th className="px-6 py-4">Source Account</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Requested At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400 animate-pulse">
                    Loading card requests...
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">
                    No virtual card requests found.
                  </td>
                </tr>
              ) : (
                cards.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900">{c.cardholder_name}</span>
                        <span className="text-[10px] text-zinc-400">{c.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">•••• {c.last4}</td>
                    <td className="px-6 py-4 font-mono font-bold text-zinc-900">
                      ${c.funding_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 capitalize font-semibold text-zinc-600">
                      {c.source_account}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${
                        c.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : c.status === "processing"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : c.status === "pending"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono text-[10px]">
                      {c.created_at ? new Date(c.created_at).toLocaleString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={actionLoading === c.id}
                            onClick={() => handleReview(c.id, "approve")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            disabled={actionLoading === c.id}
                            onClick={() => handleReview(c.id, "reject")}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">Finalized</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
