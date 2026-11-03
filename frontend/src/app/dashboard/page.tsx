"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Plus, 
  CreditCard, 
  ShieldCheck, 
  ArrowRightLeft, 
  TrendingUp, 
  Wallet, 
  ChevronRight, 
  Sparkles,
  DollarSign,
  AlertCircle,
  Landmark
} from "lucide-react";
import { getTransactionLabel, getTransactionDate } from "@/components/dashboard/TransactionRow";
import TransactionReceiptModal from "@/components/dashboard/TransactionReceiptModal";
import VirtualCardWidget from "@/app/dashboard/cards/VirtualCardWidget";
import type { Transaction } from "@/types";
import { getApiBase } from "@/lib/api";

export default function DashboardHome() {
  const [account, setAccount] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [spending, setSpending] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [receiptTx, setReceiptTx] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem("session_token");
    if (!token) return;
    const apiBase = getApiBase();

    try {
      // 1. Fetch user profile
      const profileRes = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      // 2. Fetch primary banking account details
      const accountRes = await fetch(`${apiBase}/auth/me/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (accountRes.ok) {
        const accountData = await accountRes.json();
        setAccount(accountData);
      }

      // 3. Fetch credit cards
      const cardsRes = await fetch(`${apiBase}/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCards(cardsData);
      }

      // 4. Fetch spending breakdown
      const spendingRes = await fetch(`${apiBase}/transfers/spending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (spendingRes.ok) {
        const spendingData = await spendingRes.json();
        setSpending(spendingData);
      }

      // 5. Fetch transactions
      const txRes = await fetch(`${apiBase}/transfers/history?page=1&page_size=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        const mapped = (txData.transactions || []).map((t: any) => ({
          ...t,
          type: t.direction || (t.type === "deposit" ? "credit" : "debit")
        }));
        setTransactions(mapped);
      }
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleApplyCard = async () => {
    setApplying(true);
    const token = localStorage.getItem("session_token");
    if (!token) return;
    const apiBase = getApiBase();

    try {
      const res = await fetch(`${apiBase}/cards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  const handleToggleFreezeCard = async (cardId: string) => {
    const token = localStorage.getItem("session_token");
    if (!token) return;
    const apiBase = getApiBase();

    // Optimistically update card freeze status locally
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, is_frozen: !c.is_frozen } : c));

    try {
      const res = await fetch(`${apiBase}/cards/${cardId}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        // Rollback on error
        await loadDashboardData();
      }
    } catch (err) {
      await loadDashboardData();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-48 w-full bg-white border border-zinc-200 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 lg:col-span-2 bg-white border border-zinc-200 rounded-3xl" />
          <div className="h-80 bg-white border border-zinc-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Formatting variables
  const symbol = account?.currency === "GBP" ? "£" : account?.currency === "CAD" ? "C$" : "$";
  
  // Total balance sum
  const checkingBalance = account?.checking_balance ? Number(account.checking_balance) : 0;
  const savingsBalance = account?.savings_balance ? Number(account.savings_balance) : 0;
  const creditBalance = account?.credit_balance ? Number(account.credit_balance) : 0;
  const totalBalance = checkingBalance + savingsBalance - Math.abs(creditBalance);

  const formattedTotal = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalBalance);

  // Active card logic
  const activeCard = cards && cards.length > 0 ? cards[0] : null;

  // Spending categories logic
  const spendingBreakdown = spending?.breakdown || { Housing: 0, Food: 0, Transport: 0, Other: 0 };
  const spendingPercentages = spending?.percentages || { Housing: 0, Food: 0, Transport: 0, Other: 0 };
  const totalSpentVal = spending?.total_spending || 0;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* LEFT COLUMN (BENTO BLOCK A) - col-span-8 */}
        <div className="lg:col-span-8 flex flex-col gap-5 w-full">
          
          {/* Bento Card: Account Balance Dashboard */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Total Available Balance
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight leading-none">
                  {symbol}{formattedTotal}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                  ▲ +2.4%
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
                {profile?.created_at && (
                  <>
                    <span>Member Since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                    <span>•</span>
                  </>
                )}
                <span>As of {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>

            {/* Sub-Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6 border-t border-zinc-100">
              {/* Checking Card */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 flex flex-col justify-between min-h-[96px]">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    ...{account?.checkingAccountNumber ? account.checkingAccountNumber.slice(-4) : "0000"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 mt-3">
                  <span className="text-[10px] font-bold text-zinc-400">Checking</span>
                  <span className="font-mono text-base font-bold text-zinc-900 leading-none">
                    {symbol}{checkingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Savings Card */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 flex flex-col justify-between min-h-[96px]">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    ...{account?.savingsAccountNumber ? account.savingsAccountNumber.slice(-4) : "0000"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 mt-3">
                  <span className="text-[10px] font-bold text-zinc-400">Savings Yield</span>
                  <span className="font-mono text-base font-bold text-zinc-900 leading-none">
                    {symbol}{savingsBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Virtual Visa Card */}
              {activeCard ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 flex flex-col justify-between min-h-[96px]">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      ...{activeCard.last4}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-3">
                    <span className="text-[10px] font-bold text-zinc-400">Virtual Visa Card</span>
                    <span className="font-mono text-base font-bold text-zinc-900 leading-none">
                      {symbol}{(activeCard.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/dashboard/cards"
                  className={`rounded-2xl border border-dashed border-zinc-200 bg-white hover:bg-zinc-50/50 p-4 flex flex-col justify-center items-center gap-1.5 transition-colors group cursor-pointer ${applying ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-primary">Apply for Credit Card</span>
                </Link>
              )}
            </div>

            {/* Bottom Actions links */}
            <div className="flex items-center gap-4 pt-2 font-semibold text-xs text-primary">
              <Link href="/dashboard/accounts" className="hover:underline flex items-center gap-1">
                Account Details <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link href="/dashboard/transactions" className="hover:underline flex items-center gap-1">
                View Statements <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Bento Card: Recent Transactions */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Recent Transactions
              </span>
              <Link 
                href="/dashboard/transactions" 
                className="text-[10px] font-bold text-primary hover:underline uppercase flex items-center gap-0.5"
              >
                View All
              </Link>
            </div>

            {transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-100 rounded-2xl">
                No transaction records available.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {transactions.map((tx) => {
                  const isCredit = tx.type === "credit";
                  const isPending = tx.status === "pending" || tx.status === "processing";
                  const displayLabel = getTransactionLabel(tx);
                  const displayDate = getTransactionDate(tx);
                  const formattedAmt = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: tx.currency ?? "USD",
                  }).format(Math.abs(tx.amount));

                  return (
                    <div 
                      key={tx.id}
                      onClick={() => setReceiptTx(tx)}
                      className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isPending ? "bg-amber-50" : isCredit ? "bg-emerald-50" : "bg-red-50"
                        }`}>
                          {isPending ? (
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                          ) : isCredit ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-zinc-900 truncate leading-none">
                            {displayLabel}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-medium mt-1">
                            {displayDate.split(" ")[0]} {displayDate.split(" ")[1]} • {
                              (tx.memo || "").toLowerCase().includes("loan disbursement")
                                ? "LOAN DISBURSEMENT"
                                : (tx.memo || "").toLowerCase().includes("irs") || (tx.memo || "").toLowerCase().includes("tax refund")
                                  ? "IRS TAX REFUND"
                                  : isCredit
                                    ? "INBOUND DEPOSIT"
                                    : "OUTBOUND PAYMENT"
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-bold font-mono ${
                          isPending ? "text-amber-500" : isCredit ? "text-emerald-600" : "text-zinc-900"
                        }`}>
                          {isCredit ? "+" : "−"}{formattedAmt}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                          isPending 
                            ? "bg-amber-50 text-amber-600" 
                            : tx.status === "failed" 
                              ? "bg-red-50 text-red-600" 
                              : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (BENTO BLOCK B) - col-span-4 */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          
          {/* Quick Actions Panel */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col gap-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Quick Actions
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              <Link href="/dashboard/send-money" className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-zinc-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-primary flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold text-zinc-700">Transfer</span>
              </Link>
              <Link href="/dashboard/tax" className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-zinc-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-primary flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold text-zinc-700">Pay IRS</span>
              </Link>
              <Link href="/dashboard/transactions" className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-zinc-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-primary flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold text-zinc-700">Pay Bills</span>
              </Link>
              <Link href="/dashboard/deposits" className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-zinc-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-primary flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold text-zinc-700">Deposit</span>
              </Link>
              <Link href="/dashboard/portfolio" className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-zinc-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-primary flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold text-zinc-700">Portfolio</span>
              </Link>
            </div>
          </div>

          {/* Cards Manager Widget */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Your Cards
              </span>
              <Link href="/dashboard/cards" className="text-[10px] font-bold text-primary hover:underline">
                Manage Cards →
              </Link>
            </div>

            {activeCard ? (
              <VirtualCardWidget
                card={activeCard}
                symbol={symbol}
                showFreeze={false}
                compact={true}
              />
            ) : (
              <div className="py-8 text-center flex flex-col items-center gap-3">
                <AlertCircle className="w-6 h-6 text-zinc-300" />
                <p className="text-[10px] text-zinc-400 leading-normal max-w-[180px]">
                  No active virtual cards found. Apply above to generate one.
                </p>
              </div>
            )}
          </div>

          {/* Spending Analytics Progress Circle */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Spending Breakdown
              </span>
              <span className="text-[10px] font-bold text-zinc-700 font-mono bg-zinc-100 px-2 py-0.5 rounded-full">
                {symbol}{totalSpentVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-5 py-2">
              {/* SVG Ring Progress */}
              <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f4f4f5" strokeWidth="3" />
                  {transactions.length > 0 && (() => {
                    const totalCredit = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    const totalDebit = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    const totalVol = totalCredit + totalDebit;
                    if (totalVol === 0) return null;
                    const debitPct = (totalDebit / totalVol) * 100;
                    const creditPct = (totalCredit / totalVol) * 100;
                    return (
                      <>
                        <circle 
                          cx="18" cy="18" r="16" 
                          fill="transparent" 
                          stroke="#ef4444" 
                          strokeWidth="3.2" 
                          strokeDasharray={`${debitPct} 100`}
                          pathLength="100"
                        />
                        <circle 
                          cx="18" cy="18" r="16" 
                          fill="transparent" 
                          stroke="#10b981" 
                          strokeWidth="3.2" 
                          strokeDasharray={`${creditPct} 100`}
                          strokeDashoffset={`-${debitPct}`}
                          pathLength="100"
                        />
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-800">
                  {transactions.length > 0 ? "100%" : "0%"}
                </div>
              </div>

              {/* Transactions List */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                {transactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className="flex justify-between items-center text-[10px] gap-2">
                    <span className="truncate font-medium text-zinc-700">{getTransactionLabel(tx)}</span>
                    <span className="font-mono font-bold text-zinc-900 whitespace-nowrap">
                      {tx.type === "credit" ? "+" : "−"}{new Intl.NumberFormat("en-US", { style: "currency", currency: tx.currency ?? "USD" }).format(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-[10px] text-zinc-400">No transactions to show</div>
                )}
              </div>
            </div>
          </div>


        </div>

      </div>

      {/* Transaction Receipt Modal */}
      {receiptTx && (
        <TransactionReceiptModal 
          isOpen={!!receiptTx}
          onClose={() => setReceiptTx(null)}
          transaction={receiptTx}
          currentUserProfile={profile}
        />
      )}
    </div>
  );
}
