"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShieldAlert, DollarSign } from "lucide-react";
import PageShell from "@/components/dashboard/PageShell";
import SectionHeader from "@/components/dashboard/SectionHeader";
import CustomizeLoanCard from "./CustomizeLoanCard";
import LoanFeaturesAndSteps from "./LoanFeaturesAndSteps";
import ApplyLoanModal from "./ApplyLoanModal";
import ActiveLoanHeaderCard from "./ActiveLoanHeaderCard";
import LoanDetailsAndHistory from "./LoanDetailsAndHistory";
import MakePaymentModal from "./MakePaymentModal";
import LoanAgreementModal from "./LoanAgreementModal";
import { Loan, LoanApplyPayload } from "./types";
import { toast } from "sonner";
import { getApiBase } from "@/lib/api";

export default function UserLoansPage() {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingBalance, setCheckingBalance] = useState(0);
  const [savingsBalance, setSavingsBalance] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [borrowerName, setBorrowerName] = useState("Customer");

  const [amount, setAmount] = useState(25000);
  const [termMonths, setTermMonths] = useState(36);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiBase = getApiBase();
  const symbol = currency === "GBP" ? "£" : "$";

  const getTieredInterestRate = (amt: number): number => {
    if (amt < 10000) return 10.0;
    if (amt <= 50000) return 20.0;
    return 25.0;
  };

  const interestRate = getTieredInterestRate(amount);
  const r = (interestRate / 100.0) / 12.0;
  const n = termMonths;
  const monthlyPayment = Math.round(((amount * r * ((1 + r) ** n)) / (((1 + r) ** n) - 1)) * 100) / 100;
  const totalRepayment = Math.round(monthlyPayment * n * 100) / 100;

  const fetchLoanData = async () => {
    const token = localStorage.getItem("session_token");
    if (!token) return;
    try {
      const [loanRes, accRes, userRes] = await Promise.all([
        fetch(`${apiBase}/loans`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/auth/me/account`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (loanRes.ok) setLoan(await loanRes.json() || null);
      if (accRes.ok) {
        const acc = await accRes.json();
        setCheckingBalance(Number(acc.checking_balance || 0));
        setSavingsBalance(Number(acc.savings_balance || 0));
        setCurrency(acc.currency || "USD");
      }
      if (userRes.ok) {
        const u = await userRes.json();
        setBorrowerName(u.full_name || "Customer");
      }
    } catch {
      toast.error("Failed to load loan data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoanData(); }, []);

  const handleApplyLoan = async (payload: LoanApplyPayload) => {
    setSubmitting(true);
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/loans/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Loan application submitted for bank security verification");
        setIsApplyModalOpen(false);
        await fetchLoanData();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Loan application failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleMakePayment = async (payAmount: number, sourceAccount: string) => {
    if (!loan) return;
    setSubmitting(true);
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/loans/${loan.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: payAmount, source_account: sourceAccount }),
      });
      if (res.ok) {
        toast.success("Loan payment submitted successfully");
        setIsPayModalOpen(false);
        await fetchLoanData();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Payment failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAutopay = async (enabled: boolean) => {
    if (!loan) return;
    const token = localStorage.getItem("session_token");
    try {
      const res = await fetch(`${apiBase}/loans/${loan.id}/autopay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || (enabled ? "Autopay Enabled" : "Autopay Paused"));
        setLoan((prev) => prev ? { ...prev, autopay_enabled: enabled } : null);
      }
    } catch {
      toast.error("Failed to update Autopay setting");
    }
  };

  return (
    <PageShell maxWidth="lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <SectionHeader
          title={loan && loan.status === "approved" ? `Personal Loan #${loan.id.slice(0, 8)}` : "Personal Loans"}
          subtitle="Customizable financing, competitive APR rates, and flexible repayment options."
        />
        {loan && loan.status === "approved" && (
          <button onClick={() => setIsPayModalOpen(true)} className="py-3 px-5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center justify-center gap-2 flex-shrink-0">
            <DollarSign className="w-4 h-4" /> Repay Loan
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-zinc-100 animate-pulse mb-8" />
      ) : loan && loan.status === "pending" ? (
        <div className="flex flex-col gap-8">
          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-4 shadow-sm">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex flex-col gap-1">
              <h4 className="font-bold text-sm">Application Under Bank Security Review</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your loan application for <strong>{symbol}{loan.amount.toLocaleString("en-US")}</strong> ({loan.term_months} Months) is undergoing bank security verification. You will receive an email notice once compliance review completes.
              </p>
            </div>
          </div>
          <CustomizeLoanCard amount={amount} setAmount={setAmount} termMonths={termMonths} setTermMonths={setTermMonths} symbol={symbol} interestRate={interestRate} monthlyPayment={monthlyPayment} totalRepayment={totalRepayment} onOpenApplyModal={() => setIsApplyModalOpen(true)} />
          <LoanFeaturesAndSteps />
        </div>
      ) : loan && loan.status === "approved" ? (
        <div className="flex flex-col gap-4">
          <ActiveLoanHeaderCard loan={loan} symbol={symbol} onOpenPaymentModal={() => setIsPayModalOpen(true)} onOpenAgreementModal={() => setIsAgreementModalOpen(true)} onToggleAutopay={handleToggleAutopay} />
          <LoanDetailsAndHistory loan={loan} symbol={symbol} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {loan && loan.status === "rejected" && loan.rejection_reason && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 mb-4 text-xs">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div><strong>Previous Loan Status Notice:</strong> {loan.rejection_reason}</div>
            </div>
          )}
          <CustomizeLoanCard amount={amount} setAmount={setAmount} termMonths={termMonths} setTermMonths={setTermMonths} symbol={symbol} interestRate={interestRate} monthlyPayment={monthlyPayment} totalRepayment={totalRepayment} onOpenApplyModal={() => setIsApplyModalOpen(true)} />
          <LoanFeaturesAndSteps />
        </div>
      )}

      {isApplyModalOpen && (
        <ApplyLoanModal amount={amount} termMonths={termMonths} monthlyPayment={monthlyPayment} totalRepayment={totalRepayment} checkingBalance={checkingBalance} savingsBalance={savingsBalance} symbol={symbol} onClose={() => setIsApplyModalOpen(false)} onSubmit={handleApplyLoan} onReviewAgreement={() => setIsAgreementModalOpen(true)} submitting={submitting} />
      )}

      {isPayModalOpen && loan && (
        <MakePaymentModal loanId={loan.id} monthlyPayment={loan.monthly_payment} remainingBalance={loan.remaining_balance} checkingBalance={checkingBalance} savingsBalance={savingsBalance} symbol={symbol} onClose={() => setIsPayModalOpen(false)} onSubmit={handleMakePayment} submitting={submitting} />
      )}

      {isAgreementModalOpen && (
        <LoanAgreementModal loan={loan} draftAmount={amount} draftTermMonths={termMonths} draftMonthlyPayment={monthlyPayment} draftTotalRepayment={totalRepayment} symbol={symbol} borrowerName={borrowerName} onClose={() => setIsAgreementModalOpen(false)} />
      )}
    </PageShell>
  );
}
