import React from "react";
import { Loan } from "./types";

interface LoanDetailsAndHistoryProps {
  loan: Loan;
  symbol: string;
}

export default function LoanDetailsAndHistory({ loan, symbol }: LoanDetailsAndHistoryProps) {
  const origDate = new Date(loan.approved_at || loan.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const projDate = new Date(loan.approved_at || loan.created_at);
  projDate.setMonth(projDate.getMonth() + loan.term_months);
  const formattedProjDate = projDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left: Loan Details */}
      <div className="w-full lg:w-80 p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-5">
        <h4 className="font-heading font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-3">
          Loan Details
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Interest Rate</span>
            <span className="font-bold text-zinc-900 font-mono">{loan.interest_rate}% APR</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Total Term</span>
            <span className="font-bold text-zinc-900">{loan.term_months} Months</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Original Loan Date</span>
            <span className="font-semibold text-zinc-700">{origDate}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Projected Payoff</span>
            <span className="font-semibold text-zinc-700">{formattedProjDate}</span>
          </div>
        </div>
      </div>

      {/* Right: Payment History Table */}
      <div className="flex-1 w-full p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h4 className="font-heading font-bold text-zinc-900 text-sm">
            Recent Payment History
          </h4>
          <span className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
            View All
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-indigo-50/50 text-indigo-950 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">DATE</th>
                <th className="p-3">AMOUNT</th>
                <th className="p-3">PRINCIPAL</th>
                <th className="p-3">INTEREST</th>
                <th className="p-3 rounded-r-xl text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {loan.payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-400">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                loan.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-3 font-mono text-[11px]">
                      {new Date(p.payment_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 font-mono font-bold text-zinc-900">
                      {symbol}{p.amount.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-zinc-600">
                      {symbol}{p.principal.toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-zinc-600">
                      {symbol}{p.interest.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Cleared
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
