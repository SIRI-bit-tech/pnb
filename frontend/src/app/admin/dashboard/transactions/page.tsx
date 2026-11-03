"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Sparkles, Plane } from "lucide-react";
import GenerateTransactionsModal from "@/components/admin/GenerateTransactionsModal";
import GenerateAirlineBookingModal from "@/components/admin/GenerateAirlineBookingModal";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [reviewingTx, setReviewingTx] = useState<any>(null);
  const [actionType, setActionType] = useState<"CONFIRM" | "REJECT">("CONFIRM");
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isAirlineModalOpen, setIsAirlineModalOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      setLoading(false);
      window.location.href = "/admin/login";
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/transactions?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTransactions(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (tx: any, action: "CONFIRM" | "REJECT") => {
    setReviewingTx(tx);
    setActionType(action);
  };

  const submitAction = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      const endpoint = actionType === "CONFIRM" ? "confirm" : "reject";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/transfers/${reviewingTx.id}/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setReviewingTx(null);
        fetchTransactions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#1faa6e] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Generator CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-950">Transactions</h1>
          <p className="text-xs text-zinc-500">Monitor all system transfers, deposits, and ledger settlements.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAirlineModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-2xl shadow-sm transition-all cursor-pointer"
          >
            <Plane className="w-4 h-4" />
            <span>Generate Airline Booking</span>
          </button>
          <button
            onClick={() => setIsGenModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1faa6e] hover:bg-[#18935f] text-white text-xs font-semibold rounded-2xl shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Transaction History</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID / Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900 truncate w-32" title={tx.id}>{tx.id}</div>
                    <div className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{tx.type}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">${parseFloat(tx.amount).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      tx.status?.toUpperCase() === "PENDING" || tx.status?.toUpperCase() === "PROCESSING" ? "bg-amber-100 text-amber-800" :
                      tx.status?.toUpperCase() === "COMPLETED" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {(tx.status?.toUpperCase() === "PENDING" || tx.status?.toUpperCase() === "PROCESSING") && (tx.type?.toUpperCase() === "ACH" || tx.type?.toUpperCase() === "WIRE") && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleActionClick(tx, "CONFIRM")}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Confirm"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleActionClick(tx, "REJECT")}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reviewingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              {actionType === "CONFIRM" ? "Confirm Transfer" : "Reject Transfer"}
            </h3>
            <p className="text-zinc-600 mb-6 text-sm">
              Are you sure you want to {actionType.toLowerCase()} this {reviewingTx.type} transfer of <span className="font-bold">${parseFloat(reviewingTx.amount).toFixed(2)}</span>?
            </p>
            <div className="flex gap-4">
              <button onClick={() => setReviewingTx(null)} className="flex-1 py-2 rounded-xl border border-zinc-200 font-medium text-zinc-600">Cancel</button>
              <button 
                onClick={submitAction} 
                className={`flex-1 py-2 rounded-xl text-white font-medium ${actionType === "CONFIRM" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {actionType === "CONFIRM" ? "Confirm" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <GenerateTransactionsModal
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        onSuccess={() => {
          setIsGenModalOpen(false);
          fetchTransactions();
        }}
      />

      <GenerateAirlineBookingModal
        isOpen={isAirlineModalOpen}
        onClose={() => setIsAirlineModalOpen(false)}
        onSuccess={() => {
          setIsAirlineModalOpen(false);
          fetchTransactions();
        }}
      />
    </div>
  );
}
