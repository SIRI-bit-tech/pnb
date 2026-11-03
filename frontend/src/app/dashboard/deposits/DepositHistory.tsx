"use client";

import React from "react";
import EmptyState from "@/components/dashboard/EmptyState";
import type { Deposit } from "@/types";

interface DepositHistoryProps {
  loading: boolean;
  deposits: Deposit[];
}

export default function DepositHistory({ loading, deposits }: DepositHistoryProps) {
  const getStatusColor = (status: string) => {
    if (status === "approved") {
      return "text-success bg-success/15 border-success/20";
    }
    if (status === "rejected") {
      return "text-error bg-error/10 border-error/20";
    }
    return "text-amber-500 bg-amber-500/15 border-amber-500/20";
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
        Deposit History
      </p>
      
      {loading ? (
        <div className="animate-pulse rounded-3xl bg-zinc-50 border border-zinc-200/80 h-64" />
      ) : deposits.length === 0 ? (
        <EmptyState
          emoji=""
          title="No deposit history"
          description="Any check, CashApp, or PayPal deposit you submit will show up here."
        />
      ) : (
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[420px] pr-1">
          {deposits.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-sm"
            >
              <div>
                <p className="text-xs font-semibold text-zinc-800 capitalize">
                  {d.method} Deposit
                </p>
                <p className="text-[9px] text-zinc-400 mt-0.5 select-all">
                  Ref: {d.referenceId || "Check Upload"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-zinc-800">
                  ${Number(d.amount || 0).toFixed(2)}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${getStatusColor(
                    d.status
                  )}`}
                >
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
