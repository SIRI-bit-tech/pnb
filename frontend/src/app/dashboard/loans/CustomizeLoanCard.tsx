import React from "react";
import { ArrowRight } from "lucide-react";

interface CustomizeLoanCardProps {
  amount: number;
  setAmount: (val: number) => void;
  termMonths: number;
  setTermMonths: (val: number) => void;
  symbol: string;
  interestRate: number;
  monthlyPayment: number;
  totalRepayment: number;
  onOpenApplyModal: () => void;
}

export default function CustomizeLoanCard({
  amount,
  setAmount,
  termMonths,
  setTermMonths,
  symbol,
  interestRate,
  monthlyPayment,
  totalRepayment,
  onOpenApplyModal,
}: CustomizeLoanCardProps) {
  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-8 items-stretch mb-8 font-sans">
      {/* Left: Controls */}
      <div className="flex-1 flex flex-col gap-6 justify-between">
        <h3 className="font-heading font-bold text-zinc-950 text-lg">
          Customize Your Personal Loan
        </h3>

        {/* Amount Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              LOAN AMOUNT
            </span>
            <span className="font-mono text-2xl font-bold text-zinc-900">
              {symbol}{amount.toLocaleString("en-US")}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={100000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-zinc-100 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>{symbol}1,000</span>
            <span>{symbol}100,000</span>
          </div>
        </div>

        {/* Term Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              LOAN TERM
            </span>
            <span className="font-mono text-xl font-bold text-zinc-900">
              {termMonths} Months
            </span>
          </div>
          <input
            type="range"
            min={12}
            max={60}
            step={12}
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-zinc-100 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>12 Mos</span>
            <span>60 Mos</span>
          </div>
        </div>
      </div>

      {/* Right: Summary Box */}
      <div className="w-full md:w-80 p-6 rounded-2xl bg-zinc-50 border border-zinc-150 flex flex-col justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
            ESTIMATED MONTHLY PAYMENT
          </span>
          <span className="font-mono text-3xl font-extrabold text-primary block">
            {symbol}{monthlyPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-zinc-200/80 pt-4 text-xs">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block font-semibold">Tiered Interest Rate</span>
            <span className="font-bold text-emerald-600 text-sm">{interestRate}% APR</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block font-semibold">Total Repayment</span>
            <span className="font-bold text-zinc-900 font-mono">
              {symbol}{totalRepayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div>
          <button
            onClick={onOpenApplyModal}
            className="w-full py-3.5 px-4 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center justify-center gap-2"
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-zinc-400 text-center block mt-2">
            Checking your rate won't impact your credit score.
          </span>
        </div>
      </div>
    </div>
  );
}
