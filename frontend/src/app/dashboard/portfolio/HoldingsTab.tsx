import React from "react";
import EmptyState from "@/components/dashboard/EmptyState";
import { Holding, MockStock } from "./types";

interface HoldingsTabProps {
  holdings: Holding[];
  stocks: MockStock[];
  symbol: string;
  onTrade: (stock: any, type: "buy" | "sell" | "cover") => void;
  onSwitchTab: () => void;
}

export default function HoldingsTab({
  holdings,
  stocks,
  symbol,
  onTrade,
  onSwitchTab,
}: HoldingsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {holdings.length > 0 ? (
        <div className="rounded-3xl border border-zinc-200/90 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-50/70 border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider">Holding</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-right">Shares</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-right font-mono">Avg Cost</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-right font-mono">Current Price</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-right">Value</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-right">Total Gain/Loss</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {holdings.map(h => {
                  const stockData = stocks.find(s => s.ticker === h.ticker);
                  const avgCost = Number(h.avg_cost ?? h.avgCost ?? 0);
                  const currentPrice = Number(stockData?.price ?? h.current_price ?? avgCost);
                  const shares = Number(h.shares) || 0;
                  const positionCost = shares * avgCost;
                  
                  let positionValue = 0;
                  let pnl = 0;

                  if (h.type === "long") {
                    positionValue = shares * currentPrice;
                    pnl = positionValue - positionCost;
                  } else {
                    pnl = (avgCost - currentPrice) * shares;
                    positionValue = positionCost + pnl;
                  }
                  
                  const pnlPercent = positionCost > 0 ? (pnl / positionCost) * 100 : 0;
                  const isGain = pnl >= 0;

                  return (
                    <tr key={`${h.ticker}-${h.type}`} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700">
                            {h.ticker}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-zinc-900">{stockData?.name || h.name || h.ticker}</p>
                              {h.type === "short" ? (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-red-500 bg-red-50 border border-red-100 px-1 py-0.5 rounded-md">Short</span>
                              ) : (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded-md">Long</span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-wider">{h.ticker}:NASDAQ</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-zinc-700">
                        {shares}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-zinc-600">
                        {symbol}{avgCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-zinc-600">
                        {symbol}{currentPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-zinc-900">
                        {symbol}{positionValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {isGain ? (
                          <span className="text-emerald-600 text-xs font-bold">
                            +{symbol}{pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })} (+{pnlPercent.toFixed(2)}%)
                          </span>
                        ) : (
                          <span className="text-red-500 text-xs font-bold">
                            -{symbol}{Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })} ({pnlPercent.toFixed(2)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {h.type === "long" ? (
                            <>
                              <button
                                onClick={() => onTrade(stockData || { ticker: h.ticker, name: h.ticker, price: currentPrice, change: 0, sparkline: [] }, "buy")}
                                className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50 cursor-pointer"
                              >
                                Buy More
                              </button>
                              <button
                                onClick={() => onTrade(stockData || { ticker: h.ticker, name: h.ticker, price: currentPrice, change: 0, sparkline: [] }, "sell")}
                                className="px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                              >
                                Sell
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onTrade(stockData || { ticker: h.ticker, name: h.ticker, price: currentPrice, change: 0, sparkline: [] }, "cover")}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              Cover Short
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          emoji="📈"
          title="No holdings found"
          description="Start building your investment portfolio. Click the button below to browse active stock markets."
          action={
            <button
              onClick={onSwitchTab}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer"
            >
              Browse Markets
            </button>
          }
        />
      )}
    </div>
  );
}
