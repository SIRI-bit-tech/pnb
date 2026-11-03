import React, { useState } from "react";
import { Landmark, Copy, Check, ArrowDownToLine, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import { TaxOverview } from "./types";
import { toast } from "sonner";

interface IRSRefundDirectDepositCardProps {
  overview: TaxOverview;
}

export default function IRSRefundDirectDepositCard({ overview }: IRSRefundDirectDepositCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const refund = overview.refund;

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-8 items-stretch mb-8">
      {/* Left Column: IRS Direct Deposit Credentials */}
      <div className="flex-1 flex flex-col gap-6 justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-zinc-950 text-base">
                IRS Direct Deposit Info
              </h3>
              <p className="text-[11px] text-zinc-500">
                Use these exact credentials for Form 1040 Line 21 to receive fast tax refund deposits.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              IRS Routing Number (9-Digit)
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-bold text-zinc-900">
                {overview.routing_number}
              </span>
              <button
                onClick={() => copyToClipboard(overview.routing_number, "Routing Number")}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                {copiedField === "Routing Number" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Account Number (Checking)
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-base font-bold text-zinc-900">
                {overview.account_number}
              </span>
              <button
                onClick={() => copyToClipboard(overview.account_number, "Account Number")}
                className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                {copiedField === "Account Number" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
          <ShieldCheck className="w-4 h-4" />
          <span>Prescott National Bank FDIC-Insured Direct Deposit Treasury Network</span>
        </div>
      </div>

      {/* Right Column: Dynamic 3-Stage IRS Refund Tracker */}
      <div className="w-full md:w-80 p-6 rounded-2xl bg-[#080d1a] border border-white/10 text-white flex flex-col justify-between gap-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <ArrowDownToLine className="w-3.5 h-3.5 text-primary" /> IRS Refund Tracker
          </span>
          {refund ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
              ${refund.refund_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              No Pending Deposit
            </span>
          )}
        </div>

        {!refund ? (
          <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
            <Clock className="w-8 h-8 text-zinc-600" />
            <span className="text-xs font-bold text-zinc-300">No Active IRS Refund Pending</span>
            <p className="text-[10px] text-zinc-400 leading-normal max-w-[200px]">
              Submit your tax return using the Routing & Account numbers to receive fast refunds.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Step 1: Received */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div>
                <span className="text-xs font-bold block text-white">Return Received</span>
                <span className="text-[10px] text-zinc-400">Accepted by IRS</span>
              </div>
            </div>

            <div className={`w-0.5 h-3 ml-3.5 -my-2 ${refund.status === "approved" || refund.status === "deposited" ? "bg-emerald-500" : "bg-zinc-700"}`} />

            {/* Step 2: Approved */}
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                refund.status === "approved" || refund.status === "deposited"
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-400"
              }`}>
                {refund.status === "approved" || refund.status === "deposited" ? "✓" : "2"}
              </div>
              <div>
                <span className="text-xs font-bold block text-white">Refund Approved</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Treasury Wire Authorized</span>
              </div>
            </div>

            <div className={`w-0.5 h-3 ml-3.5 -my-2 ${refund.status === "deposited" ? "bg-emerald-500" : "bg-zinc-700"}`} />

            {/* Step 3: Deposited */}
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                refund.status === "deposited"
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-400"
              }`}>
                {refund.status === "deposited" ? "✓" : "3"}
              </div>
              <div>
                <span className="text-xs font-bold block text-zinc-300">
                  {refund.status === "deposited" ? "Deposited to Checking" : "Deposit Sent"}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {refund.status === "deposited" ? "Funds Added to Balance" : `Est: ${refund.estimated_deposit_date}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
