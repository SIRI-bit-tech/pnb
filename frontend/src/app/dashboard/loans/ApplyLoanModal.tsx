import React, { useState } from "react";
import { X, Landmark, CheckCircle2, ShieldAlert, FileText, ExternalLink } from "lucide-react";
import { LoanApplyPayload } from "./types";

interface ApplyLoanModalProps {
  amount: number;
  termMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  checkingBalance: number;
  savingsBalance: number;
  symbol: string;
  onClose: () => void;
  onSubmit: (payload: LoanApplyPayload) => Promise<void>;
  onReviewAgreement?: () => void;
  submitting: boolean;
}

export default function ApplyLoanModal({
  amount,
  termMonths,
  monthlyPayment,
  totalRepayment,
  checkingBalance,
  savingsBalance,
  symbol,
  onClose,
  onSubmit,
  onReviewAgreement,
  submitting,
}: ApplyLoanModalProps) {
  const [destinationAccount, setDestinationAccount] = useState<"checking" | "savings">("checking");
  const [employmentStatus, setEmploymentStatus] = useState("Employed");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!agreedToTerms) {
      setErrorMsg("You must review and agree to the Prescott National Bank Promissory Note & Loan Agreement.");
      return;
    }
    try {
      await onSubmit({
        amount,
        term_months: termMonths,
        employment_status: employmentStatus,
        destination_account: destinationAccount,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit loan application.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000080]/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-zinc-950 text-base">
                Apply for Personal Loan
              </h4>
              <p className="text-[10px] text-zinc-500">
                {symbol}{amount.toLocaleString("en-US")} for {termMonths} Months
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
          {/* Destination Account */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Deposit Loan Funds To
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDestinationAccount("checking")}
                className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                  destinationAccount === "checking"
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900">Checking</span>
                  {destinationAccount === "checking" && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                </div>
                <span className="text-[11px] font-mono text-zinc-500 mt-1">
                  {symbol}{checkingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => setDestinationAccount("savings")}
                className={`p-3 rounded-2xl border text-left flex flex-col transition-all cursor-pointer ${
                  destinationAccount === "savings"
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900">Savings</span>
                  {destinationAccount === "savings" && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                </div>
                <span className="text-[11px] font-mono text-zinc-500 mt-1">
                  {symbol}{savingsBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </button>
            </div>
          </div>

          {/* Employment Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Employment Status
            </label>
            <select
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              disabled={submitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs font-semibold text-zinc-900 bg-white cursor-pointer"
            >
              <option value="Employed">Employed (Full-Time / Part-Time)</option>
              <option value="Self-Employed">Self-Employed / Contractor</option>
              <option value="Business Owner">Business Owner / Entrepreneur</option>
              <option value="Retired">Retired</option>
              <option value="Other">Other Income Source</option>
            </select>
          </div>

          {/* Mandatory Loan Agreement Review & Consent */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs text-indigo-950">Loan Credit Agreement</span>
              </div>
              {onReviewAgreement && (
                <button
                  type="button"
                  onClick={onReviewAgreement}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Review PDF <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-zinc-700 font-medium">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={submitting}
                className="mt-0.5 rounded border-zinc-300 text-primary focus:ring-primary cursor-pointer w-4 h-4"
              />
              <span>
                I have read and agree to the <strong>Prescott National Bank Consumer Loan Promissory Note & Federal TILA Disclosures</strong>.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-150 text-[10px] font-semibold text-red-600 flex gap-2 items-center">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !agreedToTerms}
            className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting Application..." : "Confirm & Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
