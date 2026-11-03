"use client";

import React, { useState, useEffect } from "react";
import { Plus, CreditCard } from "lucide-react";
import PageShell from "@/components/dashboard/PageShell";
import SectionHeader from "@/components/dashboard/SectionHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import VirtualCardWidget from "./VirtualCardWidget";
import RequestCardModal from "./RequestCardModal";
import PendingQueueSection from "./PendingQueueSection";
import { toast } from "sonner";
import { getApiBase } from "@/lib/api";

export default function CardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingBalance, setCheckingBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiBase = getApiBase();
  const symbol = currency === "GBP" ? "£" : "$";

  const fetchCardsAndBalances = async () => {
    const token = localStorage.getItem("session_token");
    if (!token) return;
    try {
      const [cardsRes, statsRes, accRes] = await Promise.all([
        fetch(`${apiBase}/cards`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/portfolio/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/auth/me/account`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cardsRes.ok) setCards(await cardsRes.json());
      if (accRes.ok) {
        const acc = await accRes.json();
        setCheckingBalance(Number(acc.checking_balance || 0));
        setSavingsBalance(Number(acc.savings_balance || 0));
        setCurrency(acc.currency || "USD");
      } else if (statsRes.ok) {
        const d = await statsRes.json();
        setCheckingBalance(Number(d.checking_balance || 0));
        setSavingsBalance(Number(d.savings_balance || 0));
        setCurrency(d.currency || "USD");
      }
    } catch {
      toast.error("Failed to load cards or balance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardsAndBalances();
    const interval = setInterval(fetchCardsAndBalances, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestCard = async (amount: number, source: string) => {
    setSubmitting(true);
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, source_account: source }),
      });
      if (res.ok) {
        toast.success("Card request submitted for bank security verification");
        setIsModalOpen(false);
        await fetchCardsAndBalances();
      } else {
        const err = await res.json();
        let msg = err.detail || "Card request failed";
        if (typeof msg === "string" && msg.startsWith("FROZEN:")) {
          msg = `Account Restricted: ${msg.replace("FROZEN:", "")}`;
        }
        toast.error(msg);
      }
    } catch {
      toast.error("Network error requesting virtual card");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFreeze = async (cardId: string) => {
    setSubmitting(true);
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/cards/${cardId}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Card freeze status updated");
        await fetchCardsAndBalances();
      } else {
        toast.error("Failed to toggle freeze state");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCards = cards.filter((c) => c.status === "completed");
  const pendingCards = cards.filter((c) => c.status === "pending" || c.status === "processing");
  const totalCardBalance = activeCards.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);

  return (
    <PageShell maxWidth="lg">
      <SectionHeader
        title="My Cards"
        subtitle="Manage active virtual Visa debit cards, initial account funding, and freeze controls."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
          >
            <Plus className="w-3.5 h-3.5" /> Request New Card
          </button>
        }
      />

      {/* Cards Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-3xl border border-zinc-200/90 bg-white shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active Cards</span>
          <span className="font-mono text-2xl font-bold text-zinc-900">{activeCards.length}</span>
          <span className="text-[10px] text-zinc-500">Max limit of 3 cards</span>
        </div>
        <div className="p-4 rounded-3xl border border-zinc-200/90 bg-white shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Card Balance</span>
          <span className="font-mono text-2xl font-bold text-zinc-900">
            {symbol}{totalCardBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-zinc-500">Available across active cards</span>
        </div>
        <div className="p-4 rounded-3xl border border-zinc-200/90 bg-white shadow-sm flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pending Approvals</span>
          <span className="font-mono text-2xl font-bold text-zinc-900">{pendingCards.length}</span>
          <span className="text-[10px] text-zinc-500">Awaiting security verification</span>
        </div>
      </div>

      <PendingQueueSection pendingCards={pendingCards} symbol={symbol} />

      {/* Active Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-56 rounded-3xl bg-zinc-200" />
          <div className="h-56 rounded-3xl bg-zinc-200" />
        </div>
      ) : activeCards.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8 text-zinc-400" />}
          title="No active cards issued"
          description="Request a new virtual Visa debit card. Funds will be transferred from your chosen account and submitted for bank verification."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer shadow-md shadow-primary/20"
            >
              Request New Card
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeCards.map((c) => (
            <VirtualCardWidget
              key={c.id}
              card={c}
              symbol={symbol}
              onToggleFreeze={handleToggleFreeze}
              submitting={submitting}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <RequestCardModal
          checkingBalance={checkingBalance}
          savingsBalance={savingsBalance}
          symbol={symbol}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleRequestCard}
          submitting={submitting}
        />
      )}
    </PageShell>
  );
}
