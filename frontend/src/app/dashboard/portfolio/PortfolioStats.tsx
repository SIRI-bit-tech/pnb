import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioStatsProps {
  symbol: string;
  portfolioValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  investCash: number;
  holdingsCount: number;
  marginPower: number;
  marginEnabled: boolean;
}

export default function PortfolioStats({
  symbol,
  portfolioValue = 0,
  totalGainLoss = 0,
  totalGainLossPercent = 0,
  investCash = 0,
  holdingsCount = 0,
  marginPower = 0,
  marginEnabled = false,
}: PortfolioStatsProps) {
  const safeVal = Number(portfolioValue) || 0;
  const safeGain = Number(totalGainLoss) || 0;
  const safeGainPercent = Number(totalGainLossPercent) || 0;
  const safeCash = Number(investCash) || 0;
  const safePower = Number(marginPower) || 0;
  const holdingsVal = Math.max(0, safeVal - safeCash);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
      <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Total Portfolio Value
        </span>
        <div className="font-mono text-2xl font-bold text-zinc-900 tracking-tight">
          {symbol}{safeVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1">
          {safeGain >= 0 ? (
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center font-mono">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +{symbol}{safeGain.toLocaleString("en-US", { minimumFractionDigits: 2 })} (+{safeGainPercent.toFixed(2)}%)
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-red-500 flex items-center font-mono">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              -{symbol}{Math.abs(safeGain).toLocaleString("en-US", { minimumFractionDigits: 2 })} ({safeGainPercent.toFixed(2)}%)
            </span>
          )}
          <span className="text-[9px] text-zinc-400 font-medium">All Time</span>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Available Portfolio Cash
        </span>
        <div className="font-mono text-2xl font-bold text-zinc-900 tracking-tight">
          {symbol}{safeCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-zinc-400 font-medium">Uninvested liquid cash</div>
      </div>

      <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Total Stock Holdings
        </span>
        <div className="font-mono text-2xl font-bold text-zinc-900 tracking-tight">
          {symbol}{holdingsVal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-zinc-400 font-medium">{holdingsCount} Active Positions</div>
      </div>

      <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Total Buying Power
        </span>
        <div className="font-mono text-2xl font-bold text-zinc-900 tracking-tight">
          {symbol}{safePower.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-zinc-400 font-medium">
          {marginEnabled ? "2x Leverage Active" : "Leverage Inactive"}
        </div>
      </div>
    </div>
  );
}
