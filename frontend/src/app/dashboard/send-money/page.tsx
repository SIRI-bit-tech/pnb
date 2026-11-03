"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, HelpCircle } from "lucide-react";
import { getApiBase } from "@/lib/api";
import { toast } from "sonner";
import TransactionReceiptModal from "@/components/dashboard/TransactionReceiptModal";
import PndRestrictionModal from "@/components/modals/PndRestrictionModal";

import ExternalTransferSection from "./ExternalTransferSection";
import InternationalTransferSection from "./InternationalTransferSection";
import TransferDetailsCard from "./TransferDetailsCard";
import PinVerificationModal from "./PinVerificationModal";

export default function SendMoneyPage() {
  const [activeTab, setActiveTab] = useState<"international" | "external">("international");
  
  // Shared States
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [pin, setPin] = useState("");
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [isPndModalOpen, setIsPndModalOpen] = useState(false);
  const [pndReason, setPndReason] = useState("");
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [accountBalances, setAccountBalances] = useState<any>(null);
  const [lastCompletedTx, setLastCompletedTx] = useState<any>(null);
  const [fromAccountType, setFromAccountType] = useState<"checking" | "savings">("checking");

  // International Transfer States
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [beneficiaryCountry, setBeneficiaryCountry] = useState("");
  const [ibanOrAccount, setIbanOrAccount] = useState("");
  const [swiftBic, setSwiftBic] = useState("");
  const [intlBankName, setIntlBankName] = useState("");
  const [intlBankCity, setIntlBankCity] = useState("");
  const [intlCurrency, setIntlCurrency] = useState("USD");

  // External Form States
  const [transferType, setTransferType] = useState<"ach" | "wire">("ach");
  const [routingNum, setRoutingNum] = useState("");
  const [accountNum, setAccountNum] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [routingError, setRoutingError] = useState("");
  const [checkingRouting, setCheckingRouting] = useState(false);
  const [routingStatus, setRoutingStatus] = useState<"idle" | "success" | "error">("idle");
  const [bankSuggestions, setBankSuggestions] = useState<string[]>([]);
  const [isBankNameManual, setIsBankNameManual] = useState(false);
  const [timing, setTiming] = useState<"now" | "schedule">("now");

  const loadData = async () => {
    const token = localStorage.getItem("session_token");
    if (!token) return;
    const apiBase = getApiBase();
    try {
      const pRes = await fetch(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (pRes.ok) setUserProfile(await pRes.json());
      const bRes = await fetch(`${apiBase}/auth/me/account`, { headers: { Authorization: `Bearer ${token}` } });
      if (bRes.ok) setAccountBalances(await bRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    if (routingNum.length === 9) {
      const verifyRouting = async () => {
        setCheckingRouting(true);
        setRoutingStatus("idle");
        setRoutingError("");
        setIsBankNameManual(false);
        try {
          const token = localStorage.getItem("session_token");
          const apiBase = getApiBase();
          const res = await fetch(`${apiBase}/transfers/verify-routing?routing_number=${routingNum}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.valid) {
            setBankName(data.bank_name);
            setRoutingStatus("success");
            setRoutingError("");
            setIsBankNameManual(false);
          } else {
            setRoutingError(data.error || "Invalid routing number checksum");
            setRoutingStatus("error");
            setIsBankNameManual(true);

            // Pop up toast for 30s
            toast.error("Couldn't verify routing number. Please enter bank name manually.", {
              duration: 30000,
            });

            // Clear error after 30s
            errorTimeoutRef.current = setTimeout(() => {
              setRoutingError("");
            }, 30000);
          }
        } catch {
          setRoutingError("Failed to verify routing number");
          setRoutingStatus("error");
          setIsBankNameManual(true);

          // Pop up toast for 30s
          toast.error("Couldn't verify routing number. Please enter bank name manually.", {
            duration: 30000,
          });

          // Clear error after 30s
          errorTimeoutRef.current = setTimeout(() => {
            setRoutingError("");
          }, 30000);
        } finally {
          setCheckingRouting(false);
        }
      };
      verifyRouting();
    } else {
      setRoutingStatus("idle");
      setRoutingError("");
      setIsBankNameManual(false);
      setBankSuggestions([]);
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [routingNum]);

  const handleTransferSubmit = async () => {
    if (!amount || !pin) return;
    setLoading(true);
    setStatusMsg({ type: "", text: "" });
    const token = localStorage.getItem("session_token");
    const apiBase = getApiBase();

    try {
      const url = `${apiBase}/transfers/${activeTab === "international" ? "international" : "external"}`;
      const payload = activeTab === "international"
        ? {
            beneficiary_name: beneficiaryName.trim(),
            beneficiary_address: beneficiaryAddress.trim() || undefined,
            beneficiary_country: beneficiaryCountry.trim(),
            iban_or_account: ibanOrAccount.trim().toUpperCase(),
            swift_bic: swiftBic.trim().toUpperCase(),
            bank_name: intlBankName.trim(),
            bank_city: intlBankCity.trim() || undefined,
            amount: parseFloat(amount),
            currency: intlCurrency,
            from_account_type: fromAccountType,
            memo: memo.trim() || undefined,
            pin: String(pin).trim()
          }
        : {
            type: transferType,
            routing_number: routingNum,
            account_number: accountNum,
            bank_name: bankName,
            account_name: accountName,
            amount: parseFloat(amount),
            memo: memo.trim() || undefined,
            pin: String(pin).trim(),
            from_account_type: fromAccountType
          };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ 
          type: "success", 
          text: activeTab === "international"
            ? `International Wire transfer of $${parseFloat(amount).toFixed(2)} to ${beneficiaryName} has been submitted for SWIFT settlement.`
            : `External ${transferType.toUpperCase()} transfer of $${parseFloat(amount).toFixed(2)} has been initiated.`
        });
        setLastCompletedTx({
          ...data,
          direction: "debit",
          source_account: fromAccountType,
          external_account_name: data.external_account_name || beneficiaryName.trim() || accountName.trim(),
          external_account_number: data.external_account_number || ibanOrAccount.trim() || accountNum.trim(),
          external_bank_name: data.external_bank_name || intlBankName.trim() || bankName.trim(),
          routing_number: data.routing_number || swiftBic.trim() || routingNum.trim(),
        });
        setIsPinOpen(false);
        setAmount("");
        setMemo("");
        setPin("");
        setBeneficiaryName("");
        setBeneficiaryAddress("");
        setBeneficiaryCountry("");
        setIbanOrAccount("");
        setSwiftBic("");
        setIntlBankName("");
        setIntlBankCity("");
        setRoutingNum("");
        setAccountNum("");
        setBankName("");
        setAccountName("");
        setRoutingStatus("idle");
        await loadData();
      } else {
        if (typeof data.detail === "string" && data.detail.startsWith("FROZEN:")) {
          setPndReason(data.detail.replace("FROZEN:", ""));
          setIsPinOpen(false);
          setIsPndModalOpen(true);
        } else {
          setStatusMsg({ type: "error", text: data.detail || "Transfer failed" });
          setIsPinOpen(false);
        }
      }
    } catch {
      setStatusMsg({ type: "error", text: "Connection error" });
      setIsPinOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const checkingVal = accountBalances?.checking_balance ? Number(accountBalances.checking_balance) : 0;
  const savingsVal = accountBalances?.savings_balance ? Number(accountBalances.savings_balance) : 0;
  const activeBalance = fromAccountType === "checking" ? checkingVal : savingsVal;
  const activeLast4 = fromAccountType === "checking" 
    ? (accountBalances?.checkingAccountNumber ? accountBalances.checkingAccountNumber.slice(-4) : "0000")
    : (accountBalances?.savingsAccountNumber ? accountBalances.savingsAccountNumber.slice(-4) : "0000");

  const fee = activeTab === "international" 
    ? 35.00 
    : (transferType === "wire" ? 25.00 : 1.00);

  const transferTypeLabel = activeTab === "international"
    ? "SWIFT Wire"
    : (transferType === "wire" ? "Domestic Wire" : "ACH");

  const isFormInvalid = activeTab === "international"
    ? (!beneficiaryName.trim() || !beneficiaryCountry.trim() || !ibanOrAccount.trim() || !swiftBic.trim() || (swiftBic.trim().length !== 8 && swiftBic.trim().length !== 11) || !intlBankName.trim() || !amount || parseFloat(amount) <= 0)
    : (!routingNum || !accountNum || !accountName || !bankName || !amount || parseFloat(amount) <= 0);

  const handleReview = async () => {
    // 1. Instant check if account is already known to be frozen
    if (accountBalances?.is_frozen) {
      setPndReason(
        accountBalances?.freezeReason || 
        accountBalances?.freeze_reason || 
        "We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity."
      );
      setIsPndModalOpen(true);
      return;
    }

    try {
      const token = localStorage.getItem("session_token");
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/transfers/send-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();

      // Check if account is restricted / frozen
      if (res.status === 403 || (typeof data.detail === "string" && data.detail.startsWith("FROZEN:"))) {
        const rawReason = typeof data.detail === "string" 
          ? data.detail.replace("FROZEN:", "") 
          : (data.detail?.freeze_reason || "We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity.");
        setPndReason(rawReason);
        setIsPndModalOpen(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.detail || "Failed to send authorization code");
      }

      setIsPinOpen(true);
      setPin("");
      toast.success("A 4-digit authorization code was sent to your email.");
    } catch (err: any) {
      if (err.message && err.message.startsWith("FROZEN:")) {
        setPndReason(err.message.replace("FROZEN:", ""));
        setIsPndModalOpen(true);
      } else {
        toast.error(err.message || "Failed to send transfer OTP");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-zinc-900 bg-background">
      <div className="hidden lg:flex items-center justify-between pb-3 border-b border-zinc-200/60">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Search SWIFT, routing numbers, payees..." className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-100 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-300" />
        </div>
        <HelpCircle className="w-4 h-4 text-zinc-600 hover:text-zinc-950 cursor-pointer" />
      </div>

      <div className="max-w-5xl mx-auto w-full pb-12">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-950 mb-1">Send Money</h2>
          <p className="text-xs text-zinc-500 font-semibold">Available Balance: <span className="font-mono text-zinc-800 font-bold">{fromAccountType.toUpperCase()} •••• {activeLast4}: ${activeBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></p>
        </div>

        <div className="flex border-b border-zinc-200 mb-8">
          <button 
            onClick={() => { setActiveTab("international"); setStatusMsg({ type: "", text: "" }); }} 
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${activeTab === "international" ? "text-primary border-primary" : "text-zinc-400 hover:text-zinc-600 border-transparent"}`}
          >
            International Transfer
          </button>
          <button 
            onClick={() => { setActiveTab("external"); setStatusMsg({ type: "", text: "" }); }} 
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${activeTab === "external" ? "text-primary border-primary" : "text-zinc-400 hover:text-zinc-600 border-transparent"}`}
          >
            Domestic External Transfer
          </button>
        </div>

        {statusMsg.text && (
          <div className={`p-4 rounded-2xl text-xs font-semibold mb-6 border flex items-center gap-2.5 ${statusMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            {activeTab === "international" ? (
              <InternationalTransferSection
                beneficiaryName={beneficiaryName}
                setBeneficiaryName={setBeneficiaryName}
                beneficiaryAddress={beneficiaryAddress}
                setBeneficiaryAddress={setBeneficiaryAddress}
                beneficiaryCountry={beneficiaryCountry}
                setBeneficiaryCountry={setBeneficiaryCountry}
                ibanOrAccount={ibanOrAccount}
                setIbanOrAccount={setIbanOrAccount}
                swiftBic={swiftBic}
                setSwiftBic={setSwiftBic}
                bankName={intlBankName}
                setBankName={setIntlBankName}
                bankCity={intlBankCity}
                setBankCity={setIntlBankCity}
                currency={intlCurrency}
                setCurrency={setIntlCurrency}
              />
            ) : (
              <ExternalTransferSection 
                transferType={transferType} 
                setTransferType={setTransferType} 
                routingNum={routingNum} 
                setRoutingNum={setRoutingNum} 
                accountNum={accountNum} 
                setAccountNum={setAccountNum} 
                bankName={bankName} 
                setBankName={setBankName} 
                accountName={accountName} 
                setAccountName={setAccountName} 
                routingError={routingError} 
                setRoutingError={setRoutingError} 
                routingStatus={routingStatus} 
                setRoutingStatus={setRoutingStatus} 
                checkingRouting={checkingRouting} 
                setCheckingRouting={setCheckingRouting} 
                bankSuggestions={bankSuggestions} 
                setBankSuggestions={setBankSuggestions} 
                isBankNameManual={isBankNameManual} 
                setIsBankNameManual={setIsBankNameManual} 
              />
            )}

            <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">From Account</label>
              <select value={fromAccountType} onChange={(e) => setFromAccountType(e.target.value as any)} className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-4 pr-10 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
                <option value="checking">Checking •••• {accountBalances?.checkingAccountNumber ? accountBalances.checkingAccountNumber.slice(-4) : "0000"} (${checkingVal.toLocaleString("en-US", { minimumFractionDigits: 2 })} available)</option>
                <option value="savings">Savings Yield •••• {accountBalances?.savingsAccountNumber ? accountBalances.savingsAccountNumber.slice(-4) : "0000"} (${savingsVal.toLocaleString("en-US", { minimumFractionDigits: 2 })} available)</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6 w-full">
            <TransferDetailsCard 
              amount={amount} 
              setAmount={setAmount} 
              memo={memo} 
              setMemo={setMemo} 
              timing={timing} 
              setTiming={setTiming} 
              onReview={handleReview} 
              disabled={isFormInvalid} 
              fee={fee}
              transferTypeLabel={transferTypeLabel}
            />
          </div>
        </div>
      </div>

      <PinVerificationModal isOpen={isPinOpen} onClose={() => setIsPinOpen(false)} amount={amount} pin={pin} setPin={setPin} onConfirm={handleTransferSubmit} loading={loading} />

      {lastCompletedTx && (
        <TransactionReceiptModal isOpen={!!lastCompletedTx} onClose={() => setLastCompletedTx(null)} transaction={lastCompletedTx} currentUserProfile={userProfile} />
      )}

      <PndRestrictionModal 
        isOpen={isPndModalOpen} 
        onClose={() => setIsPndModalOpen(false)} 
        reason={pndReason}
        accountNumber={fromAccountType === "checking" ? accountBalances?.checkingAccountNumber : accountBalances?.savingsAccountNumber}
      />
    </div>
  );
}
