import React, { useState } from "react";
import { X, DollarSign, Wallet, CheckCircle2, ShieldAlert } from "lucide-react";

interface MakePaymentModalProps {
  loanId: string;
  monthlyPayment: number;
  remainingBalance: number;
  checkingBalance: number;
  savingsBalance: number;
  symbol: string;
  onClose: () => void;
  onSubmit: (amount: number, source: string) => Promise<void>;
  submitting: boolean;
}

export default function MakePaymentModal({
  monthlyPayment,
  remainingBalance,
  checkingBalance,
  savingsBalance,
  symbol,
  onClose,
  onSubmit,
  submitting,
}: MakePaymentModalProps) {
  const [amountInput, setAmountInput] = useState(monthlyPayment.toFixed(2));
  const [sourceAccount, setSourceAccount] = useState<"checking" | "savings">("checking");
  const [errorMsg, setErrorMsg] = useState("");

  const amount = Number(amountInput) || 0;
  const avail = sourceAccount === "checking" ? checkingBalance : savingsBalance;
  const isInsufficient = amount > avail || amount <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficient || submitting) return;
    try {
      await onSubmit(amount, sourceAccount);
    } catch (err: any) {
      setErrorMsg(err.message || "Payment execution failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000080]/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-zinc-950 text-base">
                Make Loan Payment
              </h4>
              <p className="text-[10px] text-zinc-500">
                Remaining Balance: {symbol}{remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Pay From Account
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setSourceAccount("checking")}
                className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                  sourceAccount === "checking"
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900">Checking</span>
                  {sourceAccount === "checking" && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                </div>
                <span className="text-[11px] font-mono text-zinc-500 mt-1">
                  {symbol}{checkingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => setSourceAccount("savings")}
                className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                  sourceAccount === "savings"
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900">Savings</span>
                  {sourceAccount === "savings" && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                </div>
                <span className="text-[11px] font-mono text-zinc-500 mt-1">
                  {symbol}{savingsBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Payment Amount ({symbol})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-zinc-400">
                {symbol}
              </span>
              <input
                type="number"
                min="1"
                step="any"
                required
                disabled={submitting}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-zinc-900 font-mono disabled:opacity-50"
              />
            </div>
          </div>

          {isInsufficient && amountInput !== "" && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-150 text-[10px] font-semibold text-red-600 flex gap-2 items-center">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Insufficient balance in your selected account.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-150 text-[10px] font-semibold text-red-600">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || isInsufficient}
            className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Processing Payment..." : "Submit Loan Payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
