import React from "react";
import { Clock, CheckCircle2, Lock } from "lucide-react";

interface PendingQueueSectionProps {
  pendingCards: any[];
  symbol: string;
}

export default function PendingQueueSection({ pendingCards, symbol }: PendingQueueSectionProps) {
  if (pendingCards.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mb-8">
      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-primary" /> Card Verification & Activation Queue
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingCards.map((c) => (
          <div key={c.id} className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">Visa Virtual Card (•••• {c.last4})</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                  c.status === "processing"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {c.status === "processing" ? `Activating (~${c.activation_remaining_minutes || 60}m)` : "Pending Verification"}
              </span>
            </div>
            <div className="text-xs text-zinc-600 font-medium flex justify-between">
              <span>Initial Funding:</span>
              <span className="font-mono font-bold text-zinc-900">
                {symbol}{c.funding_amount.toFixed(2)} ({c.source_account})
              </span>
            </div>

            <div className="border-t border-zinc-100 pt-3 flex flex-col gap-2 text-[11px] text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Requested & Funded from {c.source_account.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                {c.status === "processing" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                )}
                <span>Bank Security Verification</span>
              </div>
              <div className="flex items-center gap-2">
                {c.status === "processing" ? (
                  <Clock className="w-4 h-4 text-primary animate-pulse" />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-300" />
                )}
                <span>
                  1 to 2 Hour Delivery Timer{" "}
                  {c.status === "processing"
                    ? `(${c.activation_remaining_minutes || 60}m left)`
                    : "(Starts After Verification)"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
