import React from "react";
import { Zap, ShieldCheck, CalendarCheck2 } from "lucide-react";

export default function LoanFeaturesAndSteps() {
  return (
    <div className="flex flex-col gap-8 mb-8">
      {/* 3 Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 text-sm mb-1">Instant Approval</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Get a decision in seconds and funding as soon as tomorrow.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 text-sm mb-1">No Hidden Fees</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Zero origination fees, prepayment penalties, or surprises.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 text-sm mb-1">Flexible Repayment</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Choose a term from 12 to 60 months that fits your budget.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Step Process Card */}
      <div className="p-8 rounded-3xl bg-[#080d1a] border border-white/10 text-white shadow-xl flex flex-col gap-6">
        <h3 className="font-heading font-bold text-center text-base tracking-wide">
          Simple 3-Step Process
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-white">
              1
            </div>
            <h4 className="font-bold text-sm">Check Your Rate</h4>
            <p className="text-xs text-zinc-400">Fill out a quick form without affecting your credit score.</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-white">
              2
            </div>
            <h4 className="font-bold text-sm">Review & Submit</h4>
            <p className="text-xs text-zinc-400">Select your offer and provide any necessary documents securely.</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-white">
              3
            </div>
            <h4 className="font-bold text-sm">Get Your Funds</h4>
            <p className="text-xs text-zinc-400">Receive funds in your Prescott National Bank account as soon as the next day.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
