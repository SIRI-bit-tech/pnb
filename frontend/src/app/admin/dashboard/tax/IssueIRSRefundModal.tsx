import React, { useState } from "react";
import { X, Landmark, DollarSign, ShieldAlert } from "lucide-react";

interface IssueIRSRefundModalProps {
  onClose: () => void;
  onSubmit: (payload: { user_email: string; refund_amount: number; status: string; tax_year: string }) => Promise<void>;
  submitting: boolean;
}

export default function IssueIRSRefundModal({
  onClose,
  onSubmit,
  submitting,
}: IssueIRSRefundModalProps) {
  const [userEmail, setUserEmail] = useState("");
  const [refundAmount, setRefundAmount] = useState("1250.00");
  const [statusVal, setStatusVal] = useState("approved");
  const [taxYear, setTaxYear] = useState("2025");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const amount = Number(refundAmount) || 0;
    if (amount <= 0) {
      setErrorMsg("Please enter a valid refund amount.");
      return;
    }
    if (!userEmail.trim()) {
      setErrorMsg("Please enter the applicant's email address.");
      return;
    }
    try {
      await onSubmit({
        user_email: userEmail.trim(),
        refund_amount: amount,
        status: statusVal,
        tax_year: taxYear,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to issue IRS refund deposit.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-zinc-950 text-sm">
                Issue / Update IRS Tax Refund
              </h4>
              <p className="text-[10px] text-zinc-500">
                Direct Treasury Tax Refund Deposit Engine
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
              User Email Address
            </label>
            <input
              type="email"
              required
              disabled={submitting}
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Refund Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  disabled={submitting}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
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
                <option value="2024">2024 Tax Return</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              IRS Status Stage
            </label>
            <select
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 bg-white cursor-pointer"
            >
              <option value="received">1. Return Received by IRS</option>
              <option value="approved">2. Refund Approved (Treasury Wire)</option>
              <option value="deposited">3. Deposited (Instant Checking Credit)</option>
            </select>
          </div>

          {statusVal === "deposited" && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
              Setting status to <strong>Deposited</strong> will instantly credit ${refundAmount} directly to the user's Checking Account balance!
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-150 text-[10px] font-semibold text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-bold text-xs hover:bg-zinc-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !userEmail.trim()}
              className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Save IRS Refund Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
