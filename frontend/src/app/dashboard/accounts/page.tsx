"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Landmark, Wallet, TrendingUp, Building2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserProfile, Account } from "@/types";

import { getApiBase } from "@/lib/api";

export default function AccountsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("session_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const apiBase = getApiBase();

    Promise.all([
      fetch(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${apiBase}/auth/me/account`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([meRes, accRes]) => {
        if (!meRes.ok || !accRes.ok) throw new Error("Failed to load account");
        setProfile(await meRes.json());
        setAccount(await accRes.json());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || !account) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm font-medium text-zinc-400">Failed to load account details.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-medium hover:bg-zinc-700">
          Retry
        </button>
      </div>
    );
  }

  const symbol = account.currency === "USD" || account.currency === "CAD" ? "$" : account.currency === "GBP" ? "£" : "$";
  const showRouting = profile.country === "US" || profile.country === "CA";

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-heading font-bold text-zinc-900 tracking-tight">Account Details</h1>
          <p className="text-xs text-zinc-500 mt-1">View your full account numbers and routing details.</p>
        </div>
      </div>

      {account.is_frozen && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 mt-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-500">Account Frozen</h3>
            <p className="text-xs text-red-400 mt-1 leading-relaxed">
              Your account has been temporarily frozen. Outbound transfers, external deposits, and card transactions are currently disabled. Please contact support for assistance.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start mt-2">
        {/* Checking Account */}
        <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 md:p-8 shadow-sm flex flex-col gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900">Checking Account</span>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Primary</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Available Balance</span>
              <span className="font-mono text-4xl font-bold text-zinc-900 tracking-tight">
                {symbol}{Number(account.checking_balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Number</span>
              <span className="font-mono text-lg font-medium text-zinc-700 tracking-[0.2em]">
                {account.checkingAccountNumber || "Not Available"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Savings Account */}
          <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 md:p-8 shadow-sm flex flex-col gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-zinc-900">Savings Yield</span>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Reserve</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Available Balance</span>
                <span className="font-mono text-4xl font-bold text-zinc-900 tracking-tight">
                  {symbol}{Number(account.savings_balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Number</span>
                <span className="font-mono text-lg font-medium text-zinc-700 tracking-[0.2em]">
                  {account.savingsAccountNumber || "Not Available"}
                </span>
              </div>
            </div>
          </div>

          {/* Routing Information */}
          {showRouting && account.routingNumber && (
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-zinc-900">Institution Details</span>
              </div>

              <div className="flex flex-col gap-2 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Routing Number (ABA)</span>
                <span className="font-mono text-xl font-bold text-zinc-800 tracking-[0.1em]">
                  {account.routingNumber}
                </span>
                <span className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                  Use this routing number for domestic wire transfers and ACH deposits within {profile.country}.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
