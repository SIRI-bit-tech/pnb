import React, { useState } from "react";
import { DollarSign, RefreshCw, FileText, ArrowUpRight } from "lucide-react";
import { Loan } from "./types";

interface ActiveLoanHeaderCardProps {
  loan: Loan;
  symbol: string;
  onOpenPaymentModal: () => void;
  onOpenAgreementModal: () => void;
  onToggleAutopay: (enabled: boolean) => Promise<void>;
}

export default function ActiveLoanHeaderCard({
  loan,
  symbol,
  onOpenPaymentModal,
  onOpenAgreementModal,
  onToggleAutopay,
}: ActiveLoanHeaderCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const isAutopayOn = loan.autopay_enabled !== false;

  const nextPaymentDate = new Date();
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);
  const formattedNextDate = nextPaymentDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onToggleAutopay(!isAutopayOn);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-stretch mb-8">
      {/* Main Loan Stats Box */}
      <div className="flex-1 p-6 md:p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between gap-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
              REMAINING BALANCE
            </span>
            <span className="font-mono text-3xl md:text-4xl font-extrabold text-zinc-950">
              {symbol}{loan.remaining_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active & Current
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Next Payment Date
            </span>
            <span className="font-heading font-bold text-indigo-950 text-base">
              {formattedNextDate}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Next Payment Amount
            </span>
            <span className="font-mono font-bold text-indigo-950 text-base">
              {symbol}{loan.monthly_payment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-500">Payoff Progress</span>
            <span className="text-primary font-bold">{loan.payoff_percentage}% Paid</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200/60">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, loan.payoff_percentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>{symbol}{loan.paid_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} Paid</span>
            <span>{symbol}{loan.total_repayment.toLocaleString("en-US", { minimumFractionDigits: 2 })} Total</span>
          </div>
        </div>
      </div>

      {/* Action Sidebar Cards */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <button
          onClick={onOpenPaymentModal}
          className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <DollarSign className="w-5 h-5" /> Make a Payment
        </button>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-4">
          {/* Live Interactive Autopay Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                <RefreshCw className={`w-4 h-4 ${isAutopayOn ? "text-emerald-600 animate-spin-slow" : "text-zinc-400"}`} />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs text-zinc-900 block">Autopay Settings</span>
                <span className={`text-[10px] font-semibold ${isAutopayOn ? "text-emerald-600" : "text-amber-600"}`}>
                  {isAutopayOn ? "Currently Active" : "Paused / Manual"}
                </span>
              </div>
            </div>

            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                isAutopayOn ? "bg-primary" : "bg-zinc-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                  isAutopayOn ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* View Loan Agreement Trigger */}
          <div
            onClick={onOpenAgreementModal}
            className="border-t border-zinc-100 pt-3 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs text-zinc-900 block">View Loan Agreement</span>
                <span className="text-[10px] text-zinc-400">PDF Document</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
