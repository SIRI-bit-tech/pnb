"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Zap, Building2, CheckCircle2, ArrowRight } from "lucide-react";
import { getApiBase } from "@/lib/api";
import { toast } from "sonner";

interface GenerateTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialUserId?: string;
  usersList?: any[];
}

export default function GenerateTransactionsModal({
  isOpen,
  onClose,
  onSuccess,
  initialUserId,
  usersList
}: GenerateTransactionsModalProps) {
  const [users, setUsers] = useState<any[]>(usersList || []);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || "");
  const [startingBalance, setStartingBalance] = useState<string>("2500");
  const [closingBalance, setClosingBalance] = useState<string>("50000");
  const getFormattedDate = (date: Date) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const todayStr = getFormattedDate(new Date());
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const defaultStartStr = getFormattedDate(sixtyDaysAgo);

  const [startDate, setStartDate] = useState<string>(defaultStartStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [splitRatio, setSplitRatio] = useState<number>(0.5); // 50% checking, 50% savings
  const [transactionCount, setTransactionCount] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [resultSummary, setResultSummary] = useState<any | null>(null);

  const applyPreset = (preset: "30d" | "90d" | "1y" | "2018" | "2001") => {
    const now = new Date();
    setEndDate(getFormattedDate(now));
    if (preset === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(getFormattedDate(d));
    } else if (preset === "90d") {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      setStartDate(getFormattedDate(d));
    } else if (preset === "1y") {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      setStartDate(getFormattedDate(d));
    } else if (preset === "2018") {
      setStartDate("2018-01-15");
    } else if (preset === "2001") {
      setStartDate("2001-05-10");
    }
  };

  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
    }
  }, [initialUserId]);

  useEffect(() => {
    if (isOpen && (!users || users.length === 0)) {
      const fetchUsers = async () => {
        const token = localStorage.getItem("admin_session_token");
        if (!token) return;
        try {
          const apiBase = getApiBase();
          const res = await fetch(`${apiBase}/admin/users?page_size=100`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUsers(data);
            if (!selectedUserId && data.length > 0) {
              setSelectedUserId(data[0].id);
            }
          }
        } catch (e) {
          console.error("Failed to load users for generator modal", e);
        }
      };
      fetchUsers();
    }
  }, [isOpen, users, selectedUserId]);

  if (!isOpen) return null;

  const parsedClosing = parseFloat(closingBalance) || 0;
  const checkingShare = parsedClosing * splitRatio;
  const savingsShare = parsedClosing * (1 - splitRatio);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a target user.");
      return;
    }

    const startVal = parseFloat(startingBalance);
    const closeVal = parseFloat(closingBalance);

    if (isNaN(startVal) || startVal < 0) {
      toast.error("Please enter a valid starting balance.");
      return;
    }
    if (isNaN(closeVal) || closeVal < 0) {
      toast.error("Please enter a valid closing balance.");
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      toast.error("Start Date must be before or equal to End Date.");
      return;
    }

    setLoading(true);
    setResultSummary(null);

    try {
      const token = localStorage.getItem("admin_session_token");
      const apiBase = getApiBase();
      
      const res = await fetch(`${apiBase}/admin/accounts/generate-transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          starting_balance: startVal,
          closing_balance: closeVal,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          split_ratio: splitRatio,
          transaction_count: transactionCount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate transactions");
      }

      setResultSummary(data);
      toast.success(`Generated ${data.transaction_count} transactions! Account topped up to $${closeVal.toLocaleString()}`);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while generating transactions.");
    } finally {
      setLoading(false);
    }
  };

  const selectedUserObj = users.find(u => u.id === selectedUserId);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 text-zinc-900 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#1faa6e]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-950">Generate Transaction History</h2>
              <p className="text-xs text-zinc-500">
                Simulate authentic warehouse logistics development, architecture & engineering ledger history with closing balance top-up.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View or Form */}
        {resultSummary ? (
          <div className="flex flex-col gap-6 py-4 animate-in fade-in duration-300">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-[#1faa6e] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-950">Transactions Successfully Generated!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Generated {resultSummary.transaction_count} mathematically reconciled warehouse development & engineering transactions for <strong>{resultSummary.user_full_name}</strong> ({resultSummary.user_email}).
                </p>
              </div>
            </div>

            {/* Reconciliation Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Start Balance</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">${resultSummary.starting_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Closing Balance</span>
                <span className="text-sm font-bold text-emerald-700 font-mono">${resultSummary.closing_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Checking (50%)</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">${resultSummary.checking_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Savings (50%)</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">${resultSummary.savings_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-2 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span>Total Credits Generated:</span>
                <span className="font-semibold text-emerald-600 font-mono">+${resultSummary.total_credits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Debits Generated:</span>
                <span className="font-semibold text-rose-600 font-mono">-${resultSummary.total_debits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold text-zinc-900">
                <span>Net Reconciled Balance Delta:</span>
                <span className="font-mono">${resultSummary.net_reconciled_delta.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResultSummary(null)}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors"
              >
                Generate Another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#1faa6e] hover:bg-[#18935f] text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* User Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Target User Account
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#1faa6e] focus:bg-white transition-all cursor-pointer"
              >
                <option value="" disabled>-- Select a user --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) — Username: @{u.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Starting & Closing Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Starting Balance ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-xs text-zinc-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                    required
                    placeholder="1000.00"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-8 pr-4 py-3 text-xs font-mono font-semibold text-zinc-900 focus:outline-none focus:border-[#1faa6e] focus:bg-white transition-all"
                  />
                </div>
                <span className="text-[10px] text-zinc-400">Initial balance at the beginning of the period</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Closing Balance ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-xs text-zinc-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                    required
                    placeholder="35000.00"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-8 pr-4 py-3 text-xs font-mono font-semibold text-emerald-800 focus:outline-none focus:border-[#1faa6e] focus:bg-white transition-all"
                  />
                </div>
                <span className="text-[10px] text-zinc-400">Final top-up total balance</span>
              </div>
            </div>

            {/* Historical Date Range Selection */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Historical Transaction Date Range
                </label>
                {/* Quick Presets */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-400 mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset("30d")}
                    className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
                  >
                    30D
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("90d")}
                    className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
                  >
                    90D
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("1y")}
                    className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors"
                  >
                    1 Year
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("2018")}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                  >
                    2018
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("2001")}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                  >
                    2001
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-zinc-500">
                    Start Date (First Transaction)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#1faa6e] focus:bg-white transition-all cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-400">Can be set to any year in the past (e.g. 2001, 2018)</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-zinc-500">
                    End Date (Last Transaction)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#1faa6e] focus:bg-white transition-all cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-400">Date the customer last transacted</span>
                </div>
              </div>
            </div>

            {/* Total Transaction Count */}
            <div className="grid grid-cols-1 gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Total Transactions (1 – 1,000)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={transactionCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setTransactionCount(isNaN(val) ? 1 : Math.max(1, Math.min(1000, val)));
                  }}
                  required
                  placeholder="30"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-mono font-semibold text-zinc-900 focus:outline-none focus:border-[#1faa6e] focus:bg-white transition-all"
                />
                <span className="text-[10px] text-zinc-400">Total ledger transactions to generate</span>
              </div>
            </div>

            {/* Split */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Balance Split Ratio
              </label>
              <select
                value={splitRatio}
                onChange={(e) => setSplitRatio(Number(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-xs font-medium text-zinc-900 focus:outline-none focus:border-[#1faa6e] focus:bg-white transition-all cursor-pointer"
              >
                <option value={0.5}>50% Checking / 50% Savings (Default)</option>
                <option value={0.6}>60% Checking / 40% Savings</option>
                <option value={0.7}>70% Checking / 30% Savings</option>
                <option value={1.0}>100% Checking / 0% Savings</option>
              </select>
            </div>

            {/* Balance Allocation Preview Card */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Calculated Closing Allocation
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-zinc-100 flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium text-zinc-500">Checking Balance Top-Up</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">
                    ${checkingShare.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-zinc-100 flex flex-col gap-0.5">
                  <span className="text-[10px] font-medium text-zinc-500">Savings Balance Top-Up</span>
                  <span className="text-sm font-bold text-zinc-900 font-mono">
                    ${savingsShare.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Advisory Note */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl text-[11px] text-zinc-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                <Building2 className="w-3.5 h-3.5 text-[#1faa6e]" />
                <span>Industry Transaction Profile:</span>
              </div>
              <p className="leading-relaxed">
                • <strong>Debits</strong>: Electrical engineering & transformer hardware (Siemens, Hitachi, Schneider, GE Vernova, Eaton, Mitsubishi, Prysmian, Wesco, Powell) + AT&T telecom + IRS quarterly taxes + Loan payments.<br/>
                • <strong>Credits</strong>: Client disbursements (Duke, NextEra, Dominion, Bechtel) + IRS tax refunds + Loan proceeds + Deposits (Mobile Check, PayPal, Cash App, Wire).<br/>
                • <strong>P2P Transfers</strong>: Sent and received funds with realistic peer names.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-3 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#1faa6e] hover:bg-[#18935f] text-white text-xs font-semibold rounded-2xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating History...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Generate Transactions & Update Balance</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
