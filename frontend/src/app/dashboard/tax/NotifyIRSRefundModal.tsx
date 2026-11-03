import React, { useState } from "react";
import { X, ArrowDownToLine, DollarSign, ShieldCheck } from "lucide-react";

interface NotifyIRSRefundModalProps {
  onClose: () => void;
  onSubmit: (refundAmount: number, taxYear: string) => Promise<void>;
  submitting: boolean;
}

export default function NotifyIRSRefundModal({
  onClose,
  onSubmit,
  submitting,
}: NotifyIRSRefundModalProps) {
  const [amountInput, setAmountInput] = useState("2450.00");
  const [taxYear, setTaxYear] = useState("2025");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const amount = Number(amountInput) || 0;
    if (amount <= 0) {
      setErrorMsg("Please enter a valid expected refund amount.");
      return;
    }
    try {
      await onSubmit(amount, taxYear);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit expected IRS refund.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000080]/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-zinc-950 text-sm">
                Notify Bank of Expected IRS Refund
              </h4>
              <p className="text-[10px] text-zinc-500">
                Activate Live IRS Direct Deposit Tracker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Expected Refund Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  disabled={submitting}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Tax Year
              </label>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 bg-white cursor-pointer"
              >
                <option value="2025">2025 Tax Return</option>
                <option value="2026">2026 Tax Return</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-800 leading-snug flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              Submitting your expected tax refund amount activates Prescott National Bank Live Treasury Tracking and prepares your Checking Account for direct deposit funding.
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-150 text-[10px] font-semibold text-red-600">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !amountInput}
            className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
          >
            {submitting ? "Activating IRS Refund Tracker..." : "Activate Live IRS Refund Tracker"}
          </button>
        </form>
      </div>
    </div>
  );
}
