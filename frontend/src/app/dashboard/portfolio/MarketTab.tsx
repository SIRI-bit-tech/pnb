import React from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { MockStock } from "./types";

interface MarketTabProps {
  stocks: MockStock[];
  symbol: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  shortEnabled: boolean;
  onTrade: (stock: MockStock, type: "buy" | "short") => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalStocks: number;
}

export default function MarketTab({
  stocks,
  symbol,
  searchQuery,
  setSearchQuery,
  shortEnabled,
  onTrade,
  currentPage,
  setCurrentPage,
  totalStocks,
}: MarketTabProps) {
  const totalPages = Math.max(1, Math.ceil(totalStocks / 10));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by stock ticker or company name..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset page to 1 when search changes
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-zinc-800"
        />
      </div>

      <div className="rounded-3xl border border-zinc-200/90 bg-white overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-50/70 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider">Company</th>
                <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-right">Price</th>
                <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-right">Change</th>
                <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-center hidden md:table-cell">Trend (1D)</th>
                <th className="px-6 py-4 font-bold text-zinc-400 uppercase text-[10px] tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {stocks.length > 0 ? (
                stocks.map(stock => {
                  const isPositive = stock.change >= 0;
                  return (
                    <tr key={stock.ticker} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700">
                            {stock.ticker.split("/")[0]}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{stock.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
                              {stock.ticker.includes("/") ? `${stock.ticker} (Crypto)` : `${stock.ticker}:NASDAQ`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-zinc-900">
                        {symbol}{stock.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {isPositive ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50">
                            <TrendingUp className="w-3 h-3" />
                            +{stock.change.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-red-500 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50">
                            <TrendingDown className="w-3 h-3" />
                            {stock.change.toFixed(2)}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center hidden md:table-cell">
                        <div className="inline-flex items-center justify-center h-10 w-24">
                          <svg className="w-full h-full" viewBox="0 0 100 30">
                            <path
                              d={`M ${stock.sparkline.map((val, i) => {
                                const min = Math.min(...stock.sparkline);
                                const max = Math.max(...stock.sparkline);
                                const delta = max - min || 1;
                                const x = (i / (stock.sparkline.length - 1)) * 90 + 5;
                                const y = 25 - ((val - min) / delta) * 20;
                                return `${x} ${y}`;
                              }).join(" L ")}`}
                              fill="none"
                              stroke={isPositive ? "#10B981" : "#EF4444"}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onTrade(stock, "buy")}
                            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                          >
                            Buy
                          </button>
                          {shortEnabled && (
                            <button
                              onClick={() => onTrade(stock, "short")}
                              className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              Short
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium">
                    No stocks found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalStocks > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-6 py-3.5 text-xs">
            <span className="text-zinc-500 font-medium">
              Showing <strong className="text-zinc-800">{Math.min(totalStocks, (currentPage - 1) * 10 + 1)}-{Math.min(totalStocks, currentPage * 10)}</strong> of <strong className="text-zinc-800">{totalStocks}</strong> assets
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
              >
                Previous
              </button>
              <span className="font-bold text-zinc-600 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
