"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, DollarSign, Lock, Unlock, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { getApiBase } from "@/lib/api";
import { toast } from "sonner";

const DEFAULT_PND_REASON = "We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity.";

const HOLD_REASON_PRESETS = [
  {
    label: "Unknown Device / Location",
    text: "We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity."
  },
  {
    label: "Unusual Activity Flagged",
    text: "Unusual transaction activity was flagged by automated fraud monitoring. Outgoing transfers and card payments are paused to protect your funds."
  },
  {
    label: "Suspected Unauthorized Access",
    text: "Potential unauthorized access was detected on your account. Outgoing debits and wire transfers have been paused to safeguard your balance."
  },
  {
    label: "ID Verification Required",
    text: "Identity verification is required following high-volume activity. Outgoing transfers are paused until your identification documents are re-confirmed."
  },
];

export default function AdminAccountsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [updatingAccount, setUpdatingAccount] = useState<any>(null);
  const [freezingAccount, setFreezingAccount] = useState<any>(null);
  const [freezeReason, setFreezeReason] = useState<string>(DEFAULT_PND_REASON);
  const [freezeLoading, setFreezeLoading] = useState<boolean>(false);
  
  const [balanceForm, setBalanceForm] = useState({ checking: "", savings: "", credit: "" });
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [togglingSpendingUserId, setTogglingSpendingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      setLoading(false);
      window.location.href = "/admin/login";
      return;
    }
    try {
      // First get all users (which includes their account)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/users?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalanceClick = (u: any) => {
    if (!u.account) return;
    setUpdatingAccount(u);
    setBalanceForm({
      checking: u.account.checking_balance.toString(),
      savings: u.account.savings_balance.toString(),
      credit: u.account.credit_balance.toString(),
    });
  };

  const handleFreezeClick = (u: any) => {
    if (!u.account) return;
    setFreezingAccount(u);
  };

  const submitBalanceUpdate = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/accounts/${updatingAccount.id}/balance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          checking_amount: parseFloat(balanceForm.checking),
          savings_amount: parseFloat(balanceForm.savings),
          credit_amount: parseFloat(balanceForm.credit)
        })
      });
      if (res.ok) {
        setUpdatingAccount(null);
        fetchAccounts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitFreeze = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token || !freezingAccount) return;
    setFreezeLoading(true);
    try {
      const isCurrentlyFrozen = freezingAccount.account?.is_frozen === true;
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/accounts/${freezingAccount.id}/freeze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          is_frozen: !isCurrentlyFrozen,
          freeze_reason: !isCurrentlyFrozen ? freezeReason : null
        })
      });
      if (res.ok) {
        toast.success(
          !isCurrentlyFrozen 
            ? "Account hold placed successfully."
            : "Account hold removed successfully."
        );
        setFreezingAccount(null);
        fetchAccounts();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update account restriction status");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update restriction status");
    } finally {
      setFreezeLoading(false);
    }
  };

  const toggleRow = (id: string, hasAccount: boolean) => {
    if (!hasAccount) return;
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const handleToggleSpendingSummary = async (u: any) => {
    const token = localStorage.getItem("admin_session_token");
    if (!token || !u.account) return;

    const currentVal = u.account.show_spending_summary !== false;
    const nextVal = !currentVal;
    setTogglingSpendingUserId(u.id);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/accounts/${u.id}/spending-summary`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ show_spending_summary: nextVal }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === u.id
              ? {
                  ...item,
                  account: {
                    ...item.account,
                    show_spending_summary: nextVal,
                  },
                }
              : item
          )
        );
        toast.success(
          nextVal
            ? "Last Two Months Spending enabled (shows actual amount)."
            : "Last Two Months Spending turned off (shows $0.00)."
        );
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to update spending display setting");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update spending display setting");
    } finally {
      setTogglingSpendingUserId(null);
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
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Total Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {users.map((u) => {
                const hasAccount = !!u.account;
                return (
                  <React.Fragment key={u.id}>
                    <tr 
                      className={`hover:bg-zinc-50/50 ${hasAccount ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`} 
                      onClick={() => toggleRow(u.id, hasAccount)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900">{u.full_name}</div>
                        <div className="text-zinc-500 text-xs">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {hasAccount ? (
                          u.account.is_frozen ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Frozen
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                            No Account
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-zinc-900">
                          ${hasAccount ? Number(u.account.balance).toFixed(2) : "0.00"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {hasAccount ? (
                          expandedRowId === u.id ? <ChevronUp className="w-5 h-5 inline-block text-zinc-400" /> : <ChevronDown className="w-5 h-5 inline-block text-zinc-400" />
                        ) : (
                          <span className="text-xs text-zinc-400">N/A</span>
                        )}
                      </td>
                    </tr>
                    
                    {expandedRowId === u.id && hasAccount && (
                      <tr className="bg-zinc-50 border-t border-zinc-200">
                        <td colSpan={4} className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Account Info */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-zinc-900">Account Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-zinc-500 block mb-1">Checking Acct</span>
                                <span className="font-medium">{u.account.checkingAccountNumber || u.account.accountNumber}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block mb-1">Savings Acct</span>
                                <span className="font-medium">{u.account.savingsAccountNumber || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block mb-1">Routing Number</span>
                                <span className="font-medium">{u.account.routingNumber}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block mb-1">Total In / Out</span>
                                <span className="font-medium"><span className="text-green-600">+$0.00</span> / <span className="text-red-600">-$0.00</span></span>
                              </div>
                            </div>
                          </div>

                          {/* Balances & Actions */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-zinc-900">Balances & Actions</h4>
                            <div className="flex items-center gap-4 text-sm mb-4">
                              <div className="bg-white px-4 py-2 border border-zinc-200 rounded-xl flex-1">
                                <span className="text-zinc-500 text-xs block">Checking</span>
                                <span className="font-bold text-zinc-900">${Number(u.account.checking_balance).toFixed(2)}</span>
                              </div>
                              <div className="bg-white px-4 py-2 border border-zinc-200 rounded-xl flex-1">
                                <span className="text-zinc-500 text-xs block">Savings</span>
                                <span className="font-bold text-zinc-900">${Number(u.account.savings_balance).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleUpdateBalanceClick(u)}
                                className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors"
                              >
                                <DollarSign className="w-4 h-4 mr-2" /> Top Up / Deduct
                              </button>
                              <button 
                                onClick={() => handleFreezeClick(u)}
                                className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                                  u.account.is_frozen 
                                    ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                }`}
                              >
                                {u.account.is_frozen ? <><Unlock className="w-4 h-4 mr-2" /> Unfreeze</> : <><Lock className="w-4 h-4 mr-2" /> Freeze</>}
                              </button>
                            </div>

                            {/* Last Two Months Spending Toggle */}
                            <div className="flex items-center justify-between gap-4 bg-white px-4 py-3 border border-zinc-200 rounded-xl">
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-zinc-900 block">
                                  Last Two Months Spending
                                </span>
                                <span className="text-[11px] text-zinc-500 block">
                                  {u.account.show_spending_summary !== false
                                    ? "On — displays calculated spending amount"
                                    : "Off — displays $0.00 on Transaction History"}
                                </span>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={u.account.show_spending_summary !== false}
                                aria-label="Toggle Last Two Months Spending"
                                disabled={togglingSpendingUserId === u.id}
                                onClick={() => handleToggleSpendingSummary(u)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent focus:outline-none disabled:opacity-50 ${
                                  u.account.show_spending_summary !== false
                                    ? "bg-purple-600"
                                    : "bg-zinc-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none ${
                                    u.account.show_spending_summary !== false
                                      ? "translate-x-5"
                                      : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Up / Deduct Modal */}
      {updatingAccount && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Update Balance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Checking Balance</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={balanceForm.checking} 
                  onChange={(e) => setBalanceForm({...balanceForm, checking: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Savings Balance</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={balanceForm.savings} 
                  onChange={(e) => setBalanceForm({...balanceForm, savings: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={() => setUpdatingAccount(null)} className="flex-1 py-2 rounded-xl border border-zinc-200 font-medium text-zinc-600">Cancel</button>
                <button onClick={submitBalanceUpdate} className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Freeze / Post-No-Debit (PND) Modal */}
      {freezingAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 border border-zinc-200 shadow-2xl flex flex-col gap-5 text-zinc-900">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                freezingAccount.account?.is_frozen ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}>
                {freezingAccount.account?.is_frozen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  {freezingAccount.account?.is_frozen ? "Remove Security Hold" : "Place Security Hold on Account"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {freezingAccount.full_name} ({freezingAccount.email})
                </p>
              </div>
            </div>

            {freezingAccount.account?.is_frozen ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold">Restore Full Account Access</p>
                <p className="leading-relaxed">
                  Removing this hold will immediately restore the customer's ability to initiate wire transfers, ACH debits, P2P transfers, virtual card spending, and withdrawals.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Account Hold Policy</p>
                  <p className="leading-relaxed">
                    While on hold, this account can <strong>still receive incoming deposits</strong>, but <strong>all outgoing transactions are paused</strong> (Transfers, Bill Payments, Card Debits, Cash Withdrawals).
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                      Reason Displayed to Customer
                    </label>
                    <button
                      type="button"
                      onClick={() => setFreezeReason(DEFAULT_PND_REASON)}
                      className="text-[10px] font-semibold text-[#1faa6e] hover:underline"
                    >
                      Reset to Default
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {HOLD_REASON_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFreezeReason(preset.text)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                          freezeReason === preset.text
                            ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                            : "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                    rows={4}
                    className="w-full p-3.5 border border-zinc-200 rounded-2xl text-xs text-zinc-900 bg-zinc-50 focus:bg-white focus:outline-none focus:border-[#1faa6e] transition-all leading-relaxed"
                    placeholder="Enter reason for account hold..."
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setFreezingAccount(null)} 
                disabled={freezeLoading}
                className="flex-1 py-3 rounded-2xl border border-zinc-200 font-semibold text-xs text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={submitFreeze} 
                disabled={freezeLoading}
                className={`flex-1 py-3 rounded-2xl text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  freezingAccount.account?.is_frozen
                    ? "bg-[#1faa6e] hover:bg-[#18935f]"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {freezeLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : freezingAccount.account?.is_frozen ? (
                  "Remove Hold"
                ) : (
                  "Place Account Hold"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
