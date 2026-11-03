import React, { useState } from "react";
import { X, ShieldAlert } from "lucide-react";

interface RejectLoanModalProps {
  applicantName: string;
  amount: number;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  submitting: boolean;
}

export default function RejectLoanModal({
  applicantName,
  amount,
  onClose,
  onSubmit,
  submitting,
}: RejectLoanModalProps) {
  const [reason, setReason] = useState("Income verification does not meet minimum credit guidelines.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await onSubmit(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-zinc-950 text-sm">
                Decline Loan Application
              </h4>
              <p className="text-[10px] text-zinc-500">
                {applicantName} — ${amount.toLocaleString("en-US")}
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
              System Rejection Reason (Included in Email Notice)
            </label>
            <textarea
              required
              rows={3}
              disabled={submitting}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for declining loan application..."
              className="w-full p-3 rounded-xl border border-zinc-200 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-zinc-900 resize-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-[11px] text-red-800">
            Declining this application will dispatch a formal compliance notice email to the applicant stating the reason entered above.
          </div>

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
              disabled={submitting || !reason.trim()}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all cursor-pointer shadow-md shadow-red-500/20 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Confirm & Send Rejection Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
