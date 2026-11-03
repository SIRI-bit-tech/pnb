"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { TransferDetailsCardProps } from "./types";

export default function TransferDetailsCard({
  amount,
  setAmount,
  memo,
  setMemo,
  timing,
  setTiming,
  onReview,
  disabled,
  fee = 0,
  transferTypeLabel = "Transfer"
}: TransferDetailsCardProps) {
  const numericAmount = parseFloat(amount) || 0;
  const totalAmount = numericAmount > 0 ? numericAmount + fee : 0;

  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm flex flex-col h-full gap-5">
      {/* Amount Entry */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center block mb-2">
          Transfer Amount
        </span>
        
        <div className="relative flex items-center justify-center border-b border-zinc-200 pb-2 w-full max-w-[200px]">
          <span className="text-zinc-400 text-xl font-bold mr-1">$</span>
          <input 
            type="text" 
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            className="text-center bg-transparent border-none text-zinc-900 font-bold text-3xl p-0 focus:ring-0 w-full font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* Fee & Total Summary Breakdown */}
      {numericAmount > 0 && (
        <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-3.5 flex flex-col gap-2 text-xs">
          <div className="flex justify-between items-center text-zinc-500 text-[11px]">
            <span>Transfer Amount</span>
            <span className="font-mono font-medium text-zinc-800">
              ${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-500 text-[11px]">
            <span>{transferTypeLabel} Fee</span>
            <span className="font-mono font-medium text-zinc-800">
              ${fee.toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-200 flex justify-between items-center font-bold text-zinc-900 text-xs">
            <span>Total Debited</span>
            <span className="font-mono text-emerald-700">
              ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Memo entry */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase">Memo / Reference (Optional)</label>
        <input 
          type="text" 
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Invoice #, payroll, living expenses..."
          className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white"
        />
      </div>

      {/* Timing button toggles */}
      <div className="flex border border-zinc-200 bg-zinc-50 p-1 rounded-xl">
        <button 
          onClick={() => setTiming("now")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            timing === "now" ? "bg-white text-primary border border-zinc-200 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Send Now
        </button>
        <button 
          onClick={() => setTiming("schedule")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            timing === "schedule" ? "bg-white text-primary border border-zinc-200 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Schedule
        </button>
      </div>

      {/* Review Transfer trigger button */}
      <div className="pt-4 border-t border-zinc-100 mt-auto">
        <button 
          onClick={onReview}
          disabled={disabled}
          className="w-full py-3 bg-[#1faa6e] hover:bg-[#18935f] text-white rounded-xl font-bold text-xs transition-colors shadow-sm flex justify-center items-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          Review Transfer
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
