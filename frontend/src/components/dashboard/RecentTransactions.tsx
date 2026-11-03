"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import TransactionRow from "./TransactionRow";
import EmptyState from "./EmptyState";
import TransactionReceiptModal from "./TransactionReceiptModal";
import type { Transaction } from "@/types";

import { getApiBase } from "@/lib/api";

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeReceiptTx, setActiveReceiptTx] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchRecentTransactionsAndProfile = async () => {
      const token = localStorage.getItem("session_token");
      if (!token) return;

      const apiBase = getApiBase();
      
      // Fetch user profile
      try {
        const profileRes = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Failed to load user profile for receipt:", err);
      }

      // Fetch transactions
      try {
        const res = await fetch(`${apiBase}/transfers/history?page=1&page_size=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const mapped = (data.transactions || []).map((t: any) => ({
            ...t,
            type: t.direction || (t.type === "deposit" ? "credit" : "debit")
          }));
          setTransactions(mapped);
        } else {
          setError("Failed to load transaction history");
        }
      } catch (err) {
        setError("Unable to retrieve recent transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTransactionsAndProfile();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
        {transactions.length > 0 && (
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-0.5 text-[11px] font-semibold text-primary-light hover:underline"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* States */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.015] h-16 w-full"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-white/[0.05] bg-error/5 p-4 text-center text-xs text-error">
          {error}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          emoji="💸"
          title="No transactions yet"
          description="Your transactions will show up here once you send or receive funds."
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {transactions.map((tx) => (
            <TransactionRow 
              key={tx.id} 
              transaction={tx} 
              onClick={() => setActiveReceiptTx(tx)}
            />
          ))}
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {activeReceiptTx && (
        <TransactionReceiptModal
          isOpen={!!activeReceiptTx}
          onClose={() => setActiveReceiptTx(null)}
          transaction={activeReceiptTx}
          currentUserProfile={profile}
        />
      )}
    </div>
  );
}
