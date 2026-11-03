import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MockStock, Holding, TradeType, TransferType } from "./types";

export function usePortfolio() {
  const [activeTab, setActiveTab] = useState<"market" | "holdings">("market");
  const [stocks, setStocks] = useState<MockStock[]>([]);
  const [stocksError, setStocksError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkingBalance, setCheckingBalance] = useState<number>(0);
  const [savingsBalance, setSavingsBalance] = useState<number>(0);
  const [investCash, setInvestCash] = useState<number>(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [marginEnabled, setMarginEnabled] = useState(false);
  const [shortEnabled, setShortEnabled] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [selectedStock, setSelectedStock] = useState<MockStock | null>(null);
  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [sharesInput, setSharesInput] = useState("");
  const [useMargin, setUseMargin] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferType, setTransferType] = useState<TransferType>("deposit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStocks, setTotalStocks] = useState(0);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const fetchPortfolioData = async (pageNum = currentPage, search = searchQuery) => {
    const token = localStorage.getItem("session_token");
    if (!token) return;
    try {
      const statsRes = await fetch(`${apiBase}/portfolio/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (statsRes.ok) {
        const d = await statsRes.json();
        setCheckingBalance(Number(d.checking_balance));
        setSavingsBalance(Number(d.savings_balance));
        setInvestCash(Number(d.investment_balance));
        setMarginEnabled(d.margin_enabled);
        setShortEnabled(d.short_enabled);
        setCurrency(d.currency || "USD");
      }
      const holdingsRes = await fetch(`${apiBase}/portfolio/holdings`, { headers: { Authorization: `Bearer ${token}` } });
      if (holdingsRes.ok) setHoldings(await holdingsRes.json());

      const stocksRes = await fetch(`${apiBase}/portfolio/stocks?page=${pageNum}&page_size=10&search=${search}`, { headers: { Authorization: `Bearer ${token}` } });
      if (stocksRes.ok) {
        const d = await stocksRes.json();
        setStocks(d.stocks || []);
        setTotalStocks(d.total_count || 0);
        setStocksError("");
      } else {
        setStocks([]);
        setTotalStocks(0);
        setStocksError("Real-time stock and crypto data is currently unavailable right now.");
      }
    } catch {
      setStocks([]);
      setTotalStocks(0);
      setStocksError("Real-time stock and crypto data is currently unavailable right now.");
    }
  };

  useEffect(() => {
    fetchPortfolioData(currentPage, searchQuery);
    const interval = setInterval(() => {
      fetchPortfolioData(currentPage, searchQuery);
    }, 15000);
    return () => clearInterval(interval);
  }, [currentPage, searchQuery]);

  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    const qty = parseInt(sharesInput);
    if (isNaN(qty) || qty <= 0) return toast.error("Invalid share quantity");

    setIsSubmitting(true);
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/portfolio/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticker: selectedStock.ticker, shares: qty, action: tradeType, price: selectedStock.price, use_margin: useMargin })
      });
      if (res.ok) {
        toast.success("Order executed successfully");
        await fetchPortfolioData();
        setSelectedStock(null);
        setSharesInput("");
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || "Failed to execute order");
      }
    } catch {
      toast.error("Network error executing order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteTransfer = async (amount: number, source: string) => {
    if (isNaN(amount) || amount <= 0) return toast.error("Invalid amount");
    setIsSubmitting(true);
    const token = localStorage.getItem("session_token");
    try {
      const backendTransferType = transferType === "deposit" ? "top_up" : "withdraw";
      const res = await fetch(`${apiBase}/portfolio/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, source_account: source, type: backendTransferType })
      });
      if (res.ok) {
        toast.success(`Portfolio ${transferType === "deposit" ? "deposit" : "withdrawal"} completed`);
        await fetchPortfolioData();
        setIsTransferOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Transfer failed");
      }
    } catch {
      toast.error("Network error executing transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePermissions = async (margin: boolean, short: boolean) => {
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/portfolio/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ margin_enabled: margin, short_enabled: short })
      });
      if (res.ok) {
        setMarginEnabled(margin);
        setShortEnabled(short);
        toast.success("Account permissions updated");
      }
    } catch {
      toast.error("Failed to update permissions");
    }
  };

  const totalCost = holdings.reduce((sum, h) => {
    const avgCost = Number(h.avg_cost ?? h.avgCost ?? 0);
    return sum + (Number(h.shares) || 0) * avgCost;
  }, 0);

  const totalValue = holdings.reduce((sum, h) => {
    const avgCost = Number(h.avg_cost ?? h.avgCost ?? 0);
    const livePrice = stocks.find(s => s.ticker === h.ticker)?.price ?? h.current_price ?? avgCost;
    const p = Number(livePrice) || avgCost;
    const shares = Number(h.shares) || 0;
    return sum + (h.type === "long" ? shares * p : shares * avgCost + (avgCost - p) * shares);
  }, 0);

  const portfolioValue = investCash + totalValue;

  const totalGainLoss = holdings.reduce((sum, h) => {
    const avgCost = Number(h.avg_cost ?? h.avgCost ?? 0);
    const livePrice = stocks.find(s => s.ticker === h.ticker)?.price ?? h.current_price ?? avgCost;
    const p = Number(livePrice) || avgCost;
    const shares = Number(h.shares) || 0;
    const val = shares * p;
    const cost = shares * avgCost;
    return sum + (h.type === "long" ? val - cost : cost - val);
  }, 0);

  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const marginPower = marginEnabled ? investCash * 2 : investCash;
  const symbol = currency === "GBP" ? "£" : "$";

  return {
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
    fetchPortfolioData,
    handleExecuteTrade,
    handleExecuteTransfer,
    handleTogglePermissions,
    totalValue,
    portfolioValue,
    marginPower,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    symbol,
  };
}
