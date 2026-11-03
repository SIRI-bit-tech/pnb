"use client";

import React, { useState, useEffect } from "react";
import PageShell from "@/components/dashboard/PageShell";
import SectionHeader from "@/components/dashboard/SectionHeader";
import TransactionRow, { getTransactionLabel, getTransactionDate } from "@/components/dashboard/TransactionRow";
import EmptyState from "@/components/dashboard/EmptyState";
import TransactionReceiptModal from "@/components/dashboard/TransactionReceiptModal";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Search, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Download, 
  Printer, 
  TrendingUp, 
  CreditCard,
  DollarSign,
  X
} from "lucide-react";
import { getApiBase } from "@/lib/api";
import type { Transaction } from "@/types";
 
// Category calculation helper for unified search and display
export function getTransactionCategoryInfo(tx: any) {
  const isCredit = tx.type === "credit";
  const memoLower = (tx.memo || "").toLowerCase();

  let categoryLabel = isCredit ? "Deposit" : "Transfer";
  let categoryStyle = isCredit
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : "bg-purple-50 text-purple-600 border-purple-100";

  if (
    memoLower.includes("loan disbursement") || 
    memoLower.includes("personal loan") || 
    memoLower.includes("line of credit") || 
    memoLower.includes("loan proceeds") ||
    memoLower.includes("capital loan")
  ) {
    categoryLabel = "Loan Proceeds";
    categoryStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
  } else if (memoLower.includes("loan autopay") || memoLower.includes("loan payment")) {
    categoryLabel = "Loan Repayment";
    categoryStyle = "bg-purple-50 text-purple-600 border-purple-100";
  } else if (memoLower.includes("irs") || memoLower.includes("tax refund") || memoLower.includes("treas 310")) {
    categoryLabel = "Tax Refund";
    categoryStyle = "bg-indigo-50 text-indigo-600 border-indigo-100";
  } else if (memoLower.includes("tax payment") || memoLower.includes("eftps") || memoLower.includes("usatax")) {
    categoryLabel = "Tax Payment";
    categoryStyle = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (
    memoLower.includes("airline") ||
    memoLower.includes("flight") ||
    memoLower.includes("airways") ||
    memoLower.includes("delta air") ||
    memoLower.includes("united air") ||
    memoLower.includes("emirates") ||
    memoLower.includes("qatar airways") ||
    memoLower.includes("british airways") ||
    memoLower.includes("lufthansa") ||
    memoLower.includes("pnr:") ||
    memoLower.includes("e-ticket") ||
    (tx.external_account_name && (
      tx.external_account_name.toLowerCase().includes("airline") ||
      tx.external_account_name.toLowerCase().includes("airways") ||
      tx.external_account_name.toLowerCase().includes("air lines") ||
      tx.external_account_name.toLowerCase().includes("expedia") ||
      tx.external_account_name.toLowerCase().includes("booking.com")
    ))
  ) {
    categoryLabel = "Airline Booking";
    categoryStyle = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (
    memoLower.includes("virtual card") ||
    memoLower.includes("card funding") ||
    memoLower.includes("card payment") ||
    memoLower.includes("pos debit") ||
    memoLower.includes("card purchase")
  ) {
    categoryLabel = "Card Transaction";
    categoryStyle = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (!isCredit && (tx.recipient_username || tx.recipientUsername)) {
    categoryLabel = "P2P Send";
    categoryStyle = "bg-blue-50 text-blue-600 border-blue-100";
  } else if (
    isCredit &&
    (tx.sender_username || tx.senderUsername || memoLower.includes("p2p transfer from") || memoLower.includes("p2p credit"))
  ) {
    categoryLabel = "P2P Receive";
    categoryStyle = "bg-blue-50 text-blue-600 border-blue-100";
  } else if (isCredit) {
    categoryLabel = "Deposit";
    categoryStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
  } else if (tx.type === "ach" || tx.type === "wire") {
    categoryLabel = tx.type.toUpperCase();
    categoryStyle = "bg-pink-50 text-pink-600 border-pink-100";
  }

  return { label: categoryLabel, style: categoryStyle };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeReceiptTx, setActiveReceiptTx] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSize = 50; // Show more transactions on the full page view

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");

  const fetchTransactionsAndProfile = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    const token = localStorage.getItem("session_token");
    if (!token) return;

    const apiBase = getApiBase();
    
    // Fetch user profile
    try {
      const profileRes = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }

    // Fetch transactions
    try {
      const res = await fetch(
        `${apiBase}/transfers/history?page=${page}&page_size=${pageSize}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        const mapped = (data.transactions || []).map((t: any) => ({
          ...t,
          type: t.direction || (t.type === "deposit" ? "credit" : "debit")
        }));
        setTransactions(mapped);
        setTotalCount(data.total_count || 0);
      } else {
        setError("Unable to retrieve transaction records");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactionsAndProfile();
  }, [page]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTransactionsAndProfile(true);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Date", "Transaction ID", "Description", "Category", "Status", "Amount", "Currency"];
    const rows = transactions.map(tx => {
      const isCredit = tx.type === "credit";
      const amtStr = `${isCredit ? "+" : "-"}${Math.abs(tx.amount)}`;
      return [
        getTransactionDate(tx),
        tx.id,
        getTransactionLabel(tx),
        tx.type === "credit" ? "Income" : "Transfer",
        tx.status,
        amtStr,
        tx.currency || "USD"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Prescott_National_Bank_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate stats dynamically
  const balance = Number(profile?.account?.balance ?? 0);
  const currencySymbol = profile?.account?.currency === "GBP" ? "£" : profile?.account?.currency === "CAD" ? "C$" : "$";
  const maskedAccNum = profile?.account?.accountNumber 
    ? `Checking (**** ${profile.account.accountNumber.slice(-4)})` 
    : "Checking (****)";

  const monthlySpendingLimit = 5000.00;
  // Calculate this month's successful debits
  const monthlySpending = transactions
    .filter(tx => tx.type === "debit" && tx.status === "completed")
    .reduce((acc, tx) => acc + Math.abs(Number(tx.amount)), 0);

  const spendingProgress = Math.min((monthlySpending / monthlySpendingLimit) * 100, 100);


  // Reset pagination to page 1 on filter/search change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedStatus, selectedTimeframe]);

  // Client-side search and filters
  const filteredTransactions = transactions.filter(tx => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    let matchesSearch = true;
    if (query) {
      const label = getTransactionLabel(tx).toLowerCase();
      const memoText = (tx.memo || "").toLowerCase();
      const rawId = (tx.id || "").toLowerCase();
      const cleanId = rawId.replace(/[^a-z0-9]/g, "");
      const cleanQuery = query.replace(/[^a-z0-9]/g, "");
      const category = getTransactionCategoryInfo(tx).label.toLowerCase();

      const recipientName = (tx.recipient_full_name || tx.recipientFullName || tx.recipient_name || "").toLowerCase();
      const recipientUser = (tx.recipient_username || tx.recipientUsername || "").toLowerCase();
      const senderName = (tx.sender_full_name || tx.senderFullName || tx.sender_name || "").toLowerCase();
      const senderUser = (tx.sender_username || tx.senderUsername || "").toLowerCase();
      const bankName = (tx.external_bank_name || tx.externalBankName || "").toLowerCase();
      const extAccount = (tx.external_account_name || tx.externalAccountName || "").toLowerCase();

      // Amount matching (e.g. 12000, 12,000, $12,000)
      const numAmount = Math.abs(Number(tx.amount || 0));
      const amountStr = numAmount.toString();
      const formattedAmt = numAmount.toLocaleString("en-US", { minimumFractionDigits: 2 });
      const queryWithoutMoney = query.replace(/[$,]/g, "");

      matchesSearch = (
        label.includes(query) ||
        memoText.includes(query) ||
        rawId.includes(query) ||
        (cleanQuery.length >= 3 && cleanId.includes(cleanQuery)) ||
        category.includes(query) ||
        recipientName.includes(query) ||
        recipientUser.includes(query) ||
        senderName.includes(query) ||
        senderUser.includes(query) ||
        bankName.includes(query) ||
        extAccount.includes(query) ||
        amountStr.includes(queryWithoutMoney) ||
        formattedAmt.includes(queryWithoutMoney) ||
        (tx.currency || "").toLowerCase().includes(query)
      );
    }

    // 2. Status
    let matchesStatus = true;
    if (selectedStatus !== "all") {
      const txStatus = (tx.status || "").toLowerCase().trim();
      const filterStatus = selectedStatus.toLowerCase().trim();
      if (filterStatus === "completed") {
        matchesStatus = txStatus === "completed" || txStatus === "success";
      } else if (filterStatus === "pending") {
        matchesStatus = txStatus === "pending" || txStatus === "processing";
      } else {
        matchesStatus = txStatus === filterStatus;
      }
    }

    // 3. Timeframe
    let matchesTime = true;
    if (selectedTimeframe !== "all") {
      const rawDate = tx.created_at || tx.createdAt || tx.date;
      if (!rawDate) {
        matchesTime = false;
      } else {
        const txDate = new Date(rawDate);
        if (isNaN(txDate.getTime())) {
          matchesTime = false;
        } else {
          const now = new Date();
          if (selectedTimeframe === "this_year") {
            matchesTime = txDate.getFullYear() === now.getFullYear();
          } else if (selectedTimeframe === "last_year") {
            matchesTime = txDate.getFullYear() === now.getFullYear() - 1;
          } else {
            const days = parseInt(selectedTimeframe, 10);
            if (!isNaN(days)) {
              const diffMs = now.getTime() - txDate.getTime();
              const diffDays = diffMs / (1000 * 60 * 60 * 24);
              matchesTime = diffDays >= -1 && diffDays <= days;
            }
          }
        }
      }
    }

    return matchesSearch && matchesStatus && matchesTime;
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <PageShell maxWidth="full">
      {/* Page Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/60 pb-5 print:hidden">
        <SectionHeader
          title="Transaction History"
          subtitle="Review all incoming and outgoing payments across your accounts."
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statement
          </button>
        </div>
      </div>

      {/* Summary Bento Cards Row (Printable) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available Balance Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 flex flex-col justify-between gap-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Total Available Balance
              </span>
              <span className="font-mono text-3xl font-bold text-zinc-900 mt-1">
                {currencySymbol}{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs pt-3 border-t border-zinc-100">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold text-[10px]">
              ● +2.4% from last month
            </span>
            <span className="text-zinc-400 font-semibold">{maskedAccNum}</span>
          </div>
        </div>

        {/* Monthly Spending Card */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 flex flex-col justify-between gap-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Last Two Months Spending
              </span>
              <span className="font-mono text-3xl font-bold text-zinc-900 mt-1">
                {currencySymbol}{monthlySpending.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5 pt-3 border-t border-zinc-100">
            <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${spendingProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-zinc-400">
              <span>{spendingProgress.toFixed(0)}% of monthly budget</span>
              <span>Limit: {currencySymbol}{monthlySpendingLimit.toLocaleString("en-US")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Toolbar (Hidden when printing) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl print:hidden shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, category, amount or reference..."
            className="w-full bg-white border border-zinc-200 focus:border-primary rounded-xl pl-11 pr-10 py-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Select */}
          <div className="relative flex items-center bg-white border border-zinc-200 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 mr-2" />
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-transparent text-xs text-zinc-700 focus:outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="all" className="bg-white text-zinc-800">All Time</option>
              <option value="30" className="bg-white text-zinc-800">Last 30 Days</option>
              <option value="60" className="bg-white text-zinc-800">Last 60 Days</option>
              <option value="90" className="bg-white text-zinc-800">Last 90 Days</option>
              <option value="this_year" className="bg-white text-zinc-800">This Year (2026)</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="relative flex items-center bg-white border border-zinc-200 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400 mr-2" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs text-zinc-700 focus:outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="all" className="bg-white text-zinc-800">All Statuses</option>
              <option value="completed" className="bg-white text-zinc-800">Completed</option>
              <option value="pending" className="bg-white text-zinc-800">Pending</option>
              <option value="processing" className="bg-white text-zinc-800">Processing</option>
              <option value="failed" className="bg-white text-zinc-800">Failed</option>
            </select>
          </div>

          {/* Reset Filters button if any filter active */}
          {(searchQuery || selectedStatus !== "all" || selectedTimeframe !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("all");
                setSelectedTimeframe("all");
              }}
              className="px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-semibold text-zinc-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Reset all filters"
            >
              <X className="w-3 h-3 text-zinc-400" />
              Reset
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 transition-all disabled:opacity-30 flex items-center justify-center cursor-pointer shadow-sm"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Transactions List View / Table */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-zinc-200 bg-white h-16 w-full"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-xs text-red-700">
          {error}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="No transactions found"
          description={
            searchQuery || selectedStatus !== "all" || selectedTimeframe !== "all"
              ? "No transactions match your search query or selected filters. Try clearing filters to see all records."
              : "We couldn't find any transactions matching your account history."
          }
          action={
            (searchQuery || selectedStatus !== "all" || selectedTimeframe !== "all") ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("all");
                  setSelectedTimeframe("all");
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-all cursor-pointer shadow-sm"
              >
                Clear all filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Table Header for larger screens */}
          <div className="hidden md:grid grid-cols-12 px-6 py-3 border-b border-zinc-200/60 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {/* Table Rows (Fully responsive: grid layout on desktop, stacked card layout on mobile) */}
          <div className="flex flex-col gap-2 print:gap-1">
            {filteredTransactions.map((tx: any) => {
              const isCredit = tx.type === "credit";
              const isPending = tx.status === "pending" || tx.status === "processing";
              const displayLabel = getTransactionLabel(tx);
              const displayDate = getTransactionDate(tx);
              const formattedAmount = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: tx.currency ?? "USD",
              }).format(Math.abs(tx.amount));

              let statusDotColor = "bg-success";
              let statusTextColor = "text-success";
              if (tx.status === "pending" || tx.status === "processing") {
                statusDotColor = "bg-amber-500";
                statusTextColor = "text-amber-600";
              } else if (tx.status === "failed") {
                statusDotColor = "bg-error";
                statusTextColor = "text-error";
              }

              // Categorize into custom pill
              const { label: categoryLabel, style: categoryStyle } = getTransactionCategoryInfo(tx);

              return (
                <div
                  key={tx.id}
                  onClick={() => setActiveReceiptTx(tx)}
                  className="flex flex-col md:grid md:grid-cols-12 md:items-center px-5 md:px-6 py-4 rounded-2xl border border-zinc-200/80 bg-white hover:bg-zinc-50 cursor-pointer transition-colors duration-150 gap-3 md:gap-0 shadow-sm"
                >
                  {/* Date Column */}
                  <div className="md:col-span-2 w-full flex items-center justify-between md:block text-xs text-zinc-600 font-medium pb-2 md:pb-0 border-b border-zinc-100 md:border-0">
                    <span className="md:hidden text-[10px] uppercase font-bold tracking-wider text-zinc-400">Date</span>
                    <span className="whitespace-nowrap">{displayDate.split(" ").slice(0, 3).join(" ")}</span>
                  </div>

                  {/* Description Column */}
                  <div className="md:col-span-4 w-full flex items-center gap-3.5 min-w-0">
                    {/* Direction Icon */}
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isPending ? "bg-amber-500/10" : isCredit ? "bg-success/10" : "bg-error/10"
                    }`}>
                      {isPending
                        ? <Clock className="w-4 h-4 text-amber-500" />
                        : isCredit
                          ? <ArrowDownLeft className="w-4 h-4 text-success" />
                          : <ArrowUpRight className="w-4 h-4 text-error" />
                      }
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-zinc-900 truncate">{displayLabel}</span>
                      <span className="text-[10px] text-zinc-400 font-mono truncate mt-0.5">
                        Transaction ID: #{tx.id.toString().replace(/-/g, "").slice(0, 10)}
                      </span>
                    </div>
                  </div>

                  {/* Category Column */}
                  <div className="md:col-span-2 w-full flex items-center justify-between md:block">
                    <span className="md:hidden text-[10px] uppercase font-bold tracking-wider text-zinc-400">Category</span>
                    <span className={`inline-block whitespace-nowrap text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${categoryStyle}`}>
                      {categoryLabel}
                    </span>
                  </div>

                  {/* Status Column */}
                  <div className="md:col-span-2 w-full flex items-center justify-between md:justify-center">
                    <span className="md:hidden text-[10px] uppercase font-bold tracking-wider text-zinc-400">Status</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
                      <span className={`text-xs font-semibold capitalize ${statusTextColor}`}>{tx.status}</span>
                    </div>
                  </div>

                  {/* Amount Column */}
                  <div className="md:col-span-2 w-full flex items-center justify-between md:justify-end font-mono">
                    <span className="md:hidden text-[10px] uppercase font-bold tracking-wider text-zinc-400 font-sans">Amount</span>
                    <span className={`text-sm font-bold whitespace-nowrap ${
                      isPending ? "text-amber-600" : isCredit ? "text-success" : "text-zinc-900"
                    }`}>
                      {isCredit ? "+" : "−"}{formattedAmount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-5 border-t border-zinc-200/60 print:hidden">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-sm"
              >
                Previous
              </button>
              <span className="text-xs text-zinc-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {activeReceiptTx && (
        <TransactionReceiptModal
          isOpen={!!activeReceiptTx}
          onClose={() => setActiveReceiptTx(null)}
          transaction={activeReceiptTx}
          currentUserProfile={profile}
        />
      )}

      {/* Specific Print Style Adjustments */}
      <style jsx global>{`
        @media print {
          /* Hide sidebar, headers, inputs, action buttons, pagination */
          .print\\:hidden, button, input, select, header, nav, aside {
            display: none !important;
          }
          /* Make container fit full print width */
          body, main, .PageShell, .printable-receipt {
            background: white !important;
            color: black !important;
          }
          /* Ensure transaction rows are clearly printed */
          .border {
            border-color: #ddd !important;
          }
          .text-white {
            color: black !important;
          }
          .text-primary-muted {
            color: #555 !important;
          }
        }
      `}</style>
    </PageShell>
  );
}
