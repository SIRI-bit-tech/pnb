import React from "react";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import type { Transaction } from "@/types";

interface TransactionRowProps {
  transaction: any;
  onClick?: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  completed: "",               // no badge — shown by color only
  pending:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
  processing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  failed:    "bg-error/10 text-error border-error/20",
};

export function getTransactionLabel(tx: any): string {
  const memo = (tx.memo || "").trim();
  const memoLower = memo.toLowerCase();
  
  // 1. Personal Loan / Commercial Line of Credit Proceeds
  if (
    memoLower.includes("loan disbursement") || 
    memoLower.includes("personal loan") ||
    memoLower.includes("loan proceeds") ||
    memoLower.includes("line of credit") ||
    memoLower.includes("capital loan")
  ) {
    return "Prescott National Bank Loan Services";
  }

  // 2. IRS Tax Refund / Payment
  if (memoLower.includes("irs") || memoLower.includes("tax refund") || memoLower.includes("treas 310")) {
    return "Internal Revenue Service (IRS)";
  }

  // 3. Counterparty / Merchant / Recipient / Sender
  const externalName = tx.external_account_name || tx.externalAccountName;
  const recipientName = tx.recipient_full_name || tx.recipientFullName || tx.recipient_name;
  const recipientUser = tx.recipient_username || tx.recipientUsername;
  
  const senderName = tx.sender_full_name || tx.senderFullName || tx.sender_name;
  const senderUser = tx.sender_username || tx.senderUsername;
  
  const bank = tx.external_bank_name || tx.externalBankName;
  const type = tx.type;

  if (type === "debit") {
    if (externalName) return externalName;
    if (recipientName) return recipientName;
    if (recipientUser) return recipientUser.startsWith("@") ? recipientUser : `@${recipientUser}`;
    if (memo && !memoLower.startsWith("outbound")) return memo;
    if (bank) return bank;
    return "External Transfer";
  } else if (type === "credit") {
    if (externalName) return externalName;
    if (senderName) return senderName;
    if (senderUser) return senderUser.startsWith("@") ? senderUser : `@${senderUser}`;
    if (memo && !memoLower.startsWith("inbound") && !memoLower.startsWith("deposit")) return memo;
    if (bank) return bank;
    return "Inbound Deposit";
  }

  return externalName || memo || "Bank Transaction";
}

export function getTransactionDate(tx: any): string {
  const rawDate = tx.created_at || tx.createdAt || tx.date;
  if (!rawDate) return "Recent";
  try {
    const d = new Date(rawDate);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }) + " " + d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return "Recent";
  }
}

export default function TransactionRow({ transaction: tx, onClick }: TransactionRowProps) {
  const isCredit  = tx.type === "credit";
  const isPending = tx.status === "pending" || tx.status === "processing";

  const displayLabel = getTransactionLabel(tx);
  const displayDate = getTransactionDate(tx);

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: tx.currency ?? "USD",
  }).format(Math.abs(tx.amount));

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.035] transition-colors ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Direction icon */}
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
        isPending ? "bg-amber-500/10" : isCredit ? "bg-success/10" : "bg-error/10"
      }`}>
        {isPending
          ? <Clock        className="w-4 h-4 text-amber-400" />
          : isCredit
            ? <ArrowDownLeft className="w-4 h-4 text-success" />
            : <ArrowUpRight  className="w-4 h-4 text-error"  />
        }
      </div>

      {/* Label + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{displayLabel}</p>
        <p className="text-[10px] text-primary-muted mt-0.5">{displayDate}</p>
      </div>

      {/* Right side: amount + status badge */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`font-mono text-sm font-semibold ${
          isPending ? "text-amber-400" : isCredit ? "text-success" : "text-error"
        }`}>
          {isCredit ? "+" : "−"}{formattedAmount}
        </span>
        {tx.status !== "completed" && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[tx.status] || ""}`}>
            {tx.status}
          </span>
        )}
      </div>
    </div>
  );
}
