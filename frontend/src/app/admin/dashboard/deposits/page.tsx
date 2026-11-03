"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [reviewingDeposit, setReviewingDeposit] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState<"CONFIRMED" | "FAILED">("CONFIRMED");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      setLoading(false);
      window.location.href = "/admin/login";
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/deposits?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (d: any, status: "CONFIRMED" | "FAILED") => {
    setReviewingDeposit(d);
    setReviewStatus(status);
    setAdminNotes("");
  };

  const submitReview = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/deposits/${reviewingDeposit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus === "CONFIRMED" ? "confirmed" : "rejected",
          admin_notes: adminNotes
        })
      });
      if (res.ok) {
        setReviewingDeposit(null);
        fetchDeposits();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Method / Proof</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {deposits.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{d.type}</div>
                    {d.proof_image_url && (
                      <a href={d.proof_image_url} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline">
                        View Image
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{d.user_id}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">${d.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      d.status?.toLowerCase() === "pending" ? "bg-amber-100 text-amber-800" :
                      (d.status?.toLowerCase() === "confirmed" || d.status?.toLowerCase() === "approved") ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {d.status?.toLowerCase() === "confirmed" ? "approved" : d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {d.status?.toLowerCase() === "pending" && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleReviewClick(d, "CONFIRMED")}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleReviewClick(d, "FAILED")}
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

      {reviewingDeposit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              {reviewStatus === "CONFIRMED" ? "Approve Deposit" : "Reject Deposit"}
            </h3>
            <p className="text-zinc-600 mb-4 text-sm">
              Amount: <span className="font-bold">${reviewingDeposit.amount}</span> via {reviewingDeposit.type}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Admin Notes (Optional)</label>
                <textarea 
                  value={adminNotes} 
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Notes for the user"
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setReviewingDeposit(null)} className="flex-1 py-2 rounded-xl border border-zinc-200 font-medium text-zinc-600">Cancel</button>
                <button 
                  onClick={submitReview} 
                  className={`flex-1 py-2 rounded-xl text-white font-medium ${reviewStatus === "CONFIRMED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {reviewStatus === "CONFIRMED" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
