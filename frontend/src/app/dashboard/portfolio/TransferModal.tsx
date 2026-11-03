import React, { useState } from "react";
import { X, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { TransferType } from "./types";

interface TransferModalProps {
  symbol: string;
  transferType: TransferType;
  checkingBalance: number;
  savingsBalance: number;
  investCash: number;
  onClose: () => void;
  onSubmit: (amount: number, sourceAccount: "checking" | "savings") => void;
  submitting?: boolean;
}

export default function TransferModal({
  symbol,
  transferType,
  checkingBalance,
  savingsBalance,
  investCash,
  onClose,
  onSubmit,
  submitting = false,
}: TransferModalProps) {
  const [sourceAccount, setSourceAccount] = useState<"checking" | "savings">("checking");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!isNaN(amountNum) && amountNum > 0) {
      onSubmit(amountNum, sourceAccount);
    }
  };

  const isTopUp = transferType === "deposit";
  const activeBalance = sourceAccount === "checking" ? checkingBalance : savingsBalance;

  return (
    <div className="fixed inset-0 bg-[#000080]/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-heading font-bold text-zinc-950 text-base flex items-center gap-1.5">
              {isTopUp ? (
                <>
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600 bg-emerald-55 rounded-lg p-0.5" /> Top Up Portfolio Cash
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-5 h-5 text-zinc-700 bg-zinc-100 rounded-lg p-0.5" /> Withdraw Portfolio Cash
                </>
              )}
            </h4>
            <p className="text-[10px] text-zinc-500">
              {isTopUp 
                ? "Add funds from your bank balances into your investment account" 
                : "Move investment profits or cash back to your bank account"}
            </p>
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
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {isTopUp ? "Source Account" : "Destination Account"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setSourceAccount("checking")}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer disabled:opacity-50 ${
                  sourceAccount === "checking"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
                }`}
              >
                Checking ({symbol}{checkingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })})
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setSourceAccount("savings")}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer disabled:opacity-50 ${
                  sourceAccount === "savings"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
                }`}
              >
                Savings ({symbol}{savingsBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })})
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-zinc-400 text-sm">{symbol}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                disabled={submitting}
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-zinc-800 font-mono font-bold disabled:opacity-50 disabled:bg-zinc-50"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-150 flex flex-col gap-2.5 text-xs text-zinc-600 font-medium">
            <div className="flex items-center justify-between">
              <span>Selected Account Balance</span>
              <span className="font-mono text-zinc-800">{symbol}{activeBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Investment Portfolio Cash</span>
              <span className="font-mono text-zinc-800">{symbol}{investCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Processing..." : isTopUp ? "Top Up Portfolio" : "Withdraw Funds"}
          </button>
        </form>
      </div>
    </div>
  );
}
