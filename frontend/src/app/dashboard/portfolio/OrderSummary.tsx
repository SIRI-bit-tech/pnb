import React from "react";
import { Percent } from "lucide-react";

interface OrderSummaryProps {
  symbol: string;
  price: number;
  estValue: number;
  investCash: number;
  tradeType: string;
  marginEnabled: boolean;
  useMargin: boolean;
  setUseMargin: (val: boolean) => void;
  submitting: boolean;
}

export default function OrderSummary({
  symbol,
  price,
  estValue,
  investCash,
  tradeType,
  marginEnabled,
  useMargin,
  setUseMargin,
  submitting,
}: OrderSummaryProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-150 flex flex-col gap-2.5 text-xs text-zinc-600 font-medium">
      <div className="flex items-center justify-between">
        <span>Price per Share</span>
        <span className="font-mono text-zinc-800">{symbol}{price.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Estimated Value</span>
        <span className="font-mono text-zinc-800 font-bold">
          {symbol}{estValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="border-t border-zinc-150 my-1" />
      <div className="flex items-center justify-between">
        <span>Available cash collateral</span>
        <span className="font-mono text-zinc-800">{symbol}{investCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </div>
      {tradeType === "buy" && marginEnabled && (
        <div className="flex items-center justify-between border-t border-dashed border-zinc-200 pt-2 mt-1">
          <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5 text-zinc-400" /> Utilise Margin Financing</span>
          <button
            type="button"
            disabled={submitting}
            onClick={() => setUseMargin(!useMargin)}
            className={`w-9 h-5 rounded-full transition-colors relative outline-none flex items-center cursor-pointer disabled:opacity-50 ${
              useMargin ? "bg-primary" : "bg-zinc-200"
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
              useMargin ? "right-0.5" : "left-0.5"
            }`} />
          </button>
        </div>
      )}
    </div>
  );
}
