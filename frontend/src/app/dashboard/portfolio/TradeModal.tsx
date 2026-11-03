import React from "react";
import { X, ShieldAlert } from "lucide-react";
import { MockStock, TradeType } from "./types";
import StockDetails from "./StockDetails";
import OrderSummary from "./OrderSummary";

interface TradeModalProps {
  selectedStock: MockStock;
  symbol: string;
  tradeType: TradeType;
  setTradeType: (type: TradeType) => void;
  sharesInput: string;
  setSharesInput: (val: string) => void;
  useMargin: boolean;
  setUseMargin: (val: boolean) => void;
  investCash: number;
  marginEnabled: boolean;
  shortEnabled: boolean;
  marginPower: number;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  apiBase: string;
}

export default function TradeModal({
  selectedStock,
  symbol,
  tradeType,
  setTradeType,
  sharesInput,
  setSharesInput,
  useMargin,
  setUseMargin,
  investCash,
  marginEnabled,
  shortEnabled,
  marginPower,
  onClose,
  onSubmit,
  submitting = false,
  apiBase,
}: TradeModalProps) {
  const estValue = (Number(sharesInput) || 0) * selectedStock.price;
  const maxAllowedCash = (useMargin && marginEnabled) ? investCash * 2 : investCash;
  const hasError = tradeType === "buy" && estValue > maxAllowedCash && sharesInput !== "";
  const maxShares = Math.floor(maxAllowedCash / selectedStock.price);

  return (
    <div className="fixed inset-0 bg-[#000080]/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-heading font-bold text-zinc-950 text-base flex items-center gap-1.5">
              Order Entry: {selectedStock.ticker}
            </h4>
            <p className="text-[10px] text-zinc-500">{selectedStock.name} — Current Price: {symbol}{selectedStock.price.toFixed(2)}</p>
          </div>
          <button 
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-zinc-100 text-xs font-semibold">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setTradeType("buy")}
              className={`py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                tradeType === "buy" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setTradeType("sell")}
              className={`py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                tradeType === "sell" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Sell
            </button>
            {shortEnabled && (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setTradeType("short")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                    tradeType === "short" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Short
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setTradeType("cover")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                    tradeType === "cover" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Cover
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Number of Shares</label>
            <input
              type="number"
              min="1"
              required
              disabled={submitting}
              placeholder="Enter share quantity..."
              value={sharesInput}
              onChange={e => setSharesInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-zinc-800 font-mono disabled:opacity-50 disabled:bg-zinc-50"
            />
          </div>

          <OrderSummary
            symbol={symbol}
            price={selectedStock.price}
            estValue={estValue}
            investCash={investCash}
            tradeType={tradeType}
            marginEnabled={marginEnabled}
            useMargin={useMargin}
            setUseMargin={setUseMargin}
            submitting={submitting}
          />

          {hasError && (
            <div className="p-3 rounded-2xl bg-red-55/70 border border-red-200 text-[10px] font-semibold text-red-600 flex gap-2 items-start animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 text-left">
                <span className="font-bold">Insufficient Buying Power</span>
                <span>
                  This order costs <strong>{symbol}{estValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>. 
                  You can buy a maximum of <strong>{maxShares} shares</strong> 
                  {!useMargin && marginEnabled ? ` (or up to ${Math.floor(investCash * 2 / selectedStock.price)} shares with margin)` : ""} instead.
                </span>
              </div>
            </div>
          )}

          {tradeType === "short" && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-150 text-[10px] font-medium text-red-600 flex gap-2 items-start">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Risk Disclosure:</strong> Short-selling creates open-ended debt exposure. Loss values are unbounded if market price continues to escalate.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || hasError}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Executing Order..." : "Confirm Order Execution"}
          </button>
        </form>
        <StockDetails ticker={selectedStock.ticker} apiBase={apiBase} symbol={symbol} />
      </div>
    </div>
  );
}
