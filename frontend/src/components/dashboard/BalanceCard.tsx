"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { CURRENCY_SYMBOLS } from "@/types";
import { getApiBase } from "@/lib/api";

interface AccountDetails {
  account_number?: string;
  accountNumber?: string;
  routing_number?: string;
  routingNumber?: string;
  balance: number;
  savings_balance?: number;
  invest_balance?: number;
  currency: string;
}

export default function BalanceCard() {
  const [showBal, setShowBal] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRouting, setCopiedRouting] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const apiBase = getApiBase();
      try {
        const res = await fetch(`${apiBase}/auth/me/account`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAccount(data);
        } else {
          setError("Failed to load account details");
        }
      } catch (err) {
        setError("Unable to connect to service");
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl border border-white/[0.07] bg-white/[0.015] p-6 lg:p-8 h-48" />
    );
  }

  if (error || !account) {
    return (
      <div className="rounded-3xl border border-white/[0.07] bg-error/5 p-6 text-center text-error text-xs">
        {error || "No active account found"}
      </div>
    );
  }

  const symbol = CURRENCY_SYMBOLS[account.currency] || "$";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(account.balance);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-primary/25 via-primary/[0.06] to-transparent p-6 lg:p-8">
      {/* Ambient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />

      {/* Top row */}
      <div className="flex items-start justify-between mb-7 relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-primary-muted font-bold">
            Available Balance
          </p>
        </div>
        <button
          onClick={() => setShowBal(!showBal)}
          className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
          aria-label={showBal ? "Hide balance" : "Show balance"}
        >
          {showBal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Balance display */}
      <div className="mb-7 relative z-10">
        <div className="flex items-end gap-2">
          <span className="font-mono text-4xl lg:text-5xl font-bold text-white tracking-tight leading-none">
            {showBal ? `${symbol}${formatted}` : "••••••"}
          </span>
          <span className="font-mono text-sm text-primary-muted mb-1">
            {account.currency}
          </span>
        </div>
      </div>

      {/* Account details toggle */}
      <div className="relative z-10">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[11px] font-semibold text-primary-light hover:underline focus:outline-none"
        >
          {showDetails ? "Hide account details" : "View account details"}
        </button>

        {showDetails && (
          <div className={`mt-4 grid ${account.routingNumber ? "grid-cols-2" : "grid-cols-1"} gap-4 pt-4 border-t border-white/[0.07] animate-fadeIn`}>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-primary-muted font-bold mb-1">
                Account No.
              </p>
              <p className="font-mono text-xs lg:text-sm text-white">
                {account.accountNumber}
              </p>
            </div>
            {account.routingNumber && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-primary-muted font-bold mb-1">
                  Routing No.
                </p>
                <p className="font-mono text-xs lg:text-sm text-white">
                  {account.routingNumber}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
