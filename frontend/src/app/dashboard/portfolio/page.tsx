"use client";

import React from "react";
import { Plus, ArrowDownLeft } from "lucide-react";
import PageShell from "@/components/dashboard/PageShell";
import SectionHeader from "@/components/dashboard/SectionHeader";
import { usePortfolio } from "./usePortfolio";
import PortfolioStats from "./PortfolioStats";
import MarketTab from "./MarketTab";
import HoldingsTab from "./HoldingsTab";
import AccountPermissions from "./AccountPermissions";
import TradeModal from "./TradeModal";
import TransferModal from "./TransferModal";

export default function PortfolioPage() {
  const {
    activeTab,
    setActiveTab,
    stocks,
    stocksError,
    searchQuery,
    setSearchQuery,
    checkingBalance,
    savingsBalance,
    investCash,
    holdings,
    marginEnabled,
    shortEnabled,
    selectedStock,
    setSelectedStock,
    tradeType,
    setTradeType,
    sharesInput,
    setSharesInput,
    useMargin,
    setUseMargin,
    isTransferOpen,
    setIsTransferOpen,
    transferType,
    setTransferType,
    isSubmitting,
    currentPage,
    setCurrentPage,
    totalStocks,
    apiBase,
    handleExecuteTrade,
    handleExecuteTransfer,
    handleTogglePermissions,
    portfolioValue,
    marginPower,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    symbol,
  } = usePortfolio();

  return (
    <PageShell maxWidth="lg">
      <SectionHeader
        title="Investment Portfolio"
        subtitle="Trade stocks, utilize leverage with margin, and hedge with short-selling using real-time price feeds."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => { setTransferType("deposit"); setIsTransferOpen(true); }}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Top Up
            </button>
            <button
              onClick={() => { setTransferType("withdraw"); setIsTransferOpen(true); }}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 bg-white text-xs font-bold hover:bg-zinc-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Withdraw
            </button>
          </div>
        }
      />

      <PortfolioStats
        symbol={symbol}
        portfolioValue={portfolioValue}
        totalGainLoss={totalGainLoss}
        totalGainLossPercent={totalGainLossPercent}
        investCash={investCash}
        holdingsCount={holdings.length}
        marginPower={marginPower}
        marginEnabled={marginEnabled}
      />

      <div className="flex border-b border-zinc-200 mb-6">
        <button
          onClick={() => setActiveTab("market")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "market" ? "border-primary text-primary" : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          Browse Markets
        </button>
        <button
          onClick={() => setActiveTab("holdings")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "holdings" ? "border-primary text-primary" : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          My Portfolio ({holdings.length})
        </button>
      </div>

      {activeTab === "market" ? (
        stocksError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-xs font-bold text-red-600">
            {stocksError}
          </div>
        ) : (
          <MarketTab
            stocks={stocks}
            symbol={symbol}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            shortEnabled={shortEnabled}
            onTrade={(st, type) => { setSelectedStock(st); setTradeType(type); }}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalStocks={totalStocks}
          />
        )
      ) : (
        stocksError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-xs font-bold text-red-600">
            {stocksError}
          </div>
        ) : (
          <HoldingsTab
            holdings={holdings}
            stocks={stocks}
            symbol={symbol}
            onTrade={(st, type) => { setSelectedStock(st); setTradeType(type); }}
            onSwitchTab={() => setActiveTab("market")}
          />
        )
      )}

      <AccountPermissions
        marginEnabled={marginEnabled}
        setMarginEnabled={(val) => handleTogglePermissions(val, shortEnabled)}
        shortEnabled={shortEnabled}
        setShortEnabled={(val) => handleTogglePermissions(marginEnabled, val)}
      />

      {selectedStock && (
        <TradeModal
          selectedStock={selectedStock}
          symbol={symbol}
          tradeType={tradeType}
          setTradeType={setTradeType}
          sharesInput={sharesInput}
          setSharesInput={setSharesInput}
          useMargin={useMargin}
          setUseMargin={setUseMargin}
          investCash={investCash}
          marginEnabled={marginEnabled}
          shortEnabled={shortEnabled}
          marginPower={marginPower}
          onClose={() => { setSelectedStock(null); setSharesInput(""); }}
          onSubmit={handleExecuteTrade}
          submitting={isSubmitting}
          apiBase={apiBase}
        />
      )}

      {isTransferOpen && (
        <TransferModal
          transferType={transferType}
          checkingBalance={checkingBalance}
          savingsBalance={savingsBalance}
          investCash={investCash}
          symbol={symbol}
          onClose={() => setIsTransferOpen(false)}
          onSubmit={handleExecuteTransfer}
          submitting={isSubmitting}
        />
      )}
    </PageShell>
  );
}
