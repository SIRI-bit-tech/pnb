"use client";

import React, { useState, useRef, useEffect } from "react";
import FormInput from "@/components/FormInput";
import { toast } from "sonner";

interface ExternalFormProps {
  transferType: "ach" | "wire";
  setTransferType: (type: "ach" | "wire") => void;
  routingNum: string;
  setRoutingNum: (num: string) => void;
  accountNum: string;
  setAccountNum: (num: string) => void;
  bankName: string;
  setBankName: (name: string) => void;
  accountName: string;
  setAccountName: (name: string) => void;
  amount: string;
  setAmount: (amt: string) => void;
  memo: string;
  setMemo: (memo: string) => void;
  onContinue: () => void;
}

export default function ExternalForm({
  transferType,
  setTransferType,
  routingNum,
  setRoutingNum,
  accountNum,
  setAccountNum,
  bankName,
  setBankName,
  accountName,
  setAccountName,
  amount,
  setAmount,
  memo,
  setMemo,
  onContinue,
}: ExternalFormProps) {
  const [routingError, setRoutingError] = useState("");
  const [checkingRouting, setCheckingRouting] = useState(false);
  const [routingStatus, setRoutingStatus] = useState<"idle" | "success" | "error">("idle");
  const [isBankNameManual, setIsBankNameManual] = useState(false);

  // Autocomplete Suggestions
  const [bankSuggestions, setBankSuggestions] = useState<string[]>([]);
  const suggestDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const fee = transferType === "ach" ? 1.0 : 25.0;
  const timing = transferType === "ach" ? "3-5 Business Days" : "Same Day / Next Day";
  const parsedAmount = parseFloat(amount) || 0;
  const totalCost = parsedAmount > 0 ? (parsedAmount + fee).toFixed(2) : "0.00";

  const handleRoutingBlur = async () => {
    if (routingNum.length !== 9) {
      setRoutingError("Routing number must be exactly 9 digits");
      setRoutingStatus("error");
      setBankName("");
      setIsBankNameManual(true);
      toast.error("Routing number must be exactly 9 digits. Please enter bank name manually.");
      return;
    }

    setCheckingRouting(true);
    setRoutingStatus("idle");
    setRoutingError("");
    setIsBankNameManual(false);
    const token = localStorage.getItem("session_token");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    try {
      const res = await fetch(`${apiBase}/transfers/verify-routing?routing_number=${routingNum}`, {
        headers: { Authorization: `Bearer ${token}` },
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
        setBankName("");
        setIsBankNameManual(true);
        toast.error("Couldn't verify routing number. Please enter bank name manually.");
      }
    } catch {
      setRoutingError("Failed to verify routing number");
      setRoutingStatus("error");
      setBankName("");
      setIsBankNameManual(true);
      toast.error("Couldn't verify routing number. Please enter bank name manually.");
    } finally {
      setCheckingRouting(false);
    }
  };

  const handleBankNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBankName(val);

    if (!isBankNameManual) return;

    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);

    if (val.trim().length === 0) {
      setBankSuggestions([]);
      return;
    }

    suggestDebounceRef.current = setTimeout(async () => {
      const token = localStorage.getItem("session_token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      try {
        const res = await fetch(`${apiBase}/transfers/suggest-banks?q=${val}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBankSuggestions(data);
        }
      } catch (err) {
        console.error("Bank suggestions fetch failed", err);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/[0.05] rounded-xl">
        <button
          type="button"
          onClick={() => setTransferType("ach")}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            transferType === "ach" ? "bg-white/5 text-white" : "text-primary-muted hover:text-white"
          }`}
        >
          ACH Transfer ($1.00 Fee)
        </button>
        <button
          type="button"
          onClick={() => setTransferType("wire")}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            transferType === "wire" ? "bg-white/5 text-white" : "text-primary-muted hover:text-white"
          }`}
        >
          Wire Transfer ($25.00 Fee)
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <FormInput
            label="Routing Number"
            value={routingNum}
            onChange={(e) => {
              setRoutingNum(e.target.value.replace(/\D/g, "").slice(0, 9));
              setRoutingStatus("idle");
              setRoutingError("");
            }}
            onBlur={handleRoutingBlur}
            placeholder="9 digits"
            className="pr-12"
          />
          <div className="absolute right-4 top-[18px] flex items-center justify-center pointer-events-none z-10">
            {checkingRouting && (
              <svg className="animate-spin h-5 w-5 text-primary-light" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {!checkingRouting && routingStatus === "success" && (
              <svg className="h-5 w-5 text-success animate-in zoom-in-50 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {!checkingRouting && routingStatus === "error" && (
              <svg className="h-5 w-5 text-error animate-in zoom-in-50 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          {routingError && (
            <p className="text-[10px] text-error mt-1 font-semibold">{routingError}</p>
          )}
        </div>

        <div className="relative">
          <FormInput
            label={isBankNameManual ? "Bank Name (Enter Manually)" : "Bank Name (Auto-filled)"}
            value={bankName}
            onChange={handleBankNameChange}
            placeholder={isBankNameManual ? "Enter bank name..." : "Verified Bank"}
            disabled={!isBankNameManual}
          />
          {isBankNameManual && bankSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-[#0c0f19] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
              {bankSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setBankName(s);
                    setBankSuggestions([]);
                  }}
                  className="w-full px-4 py-3 text-left text-xs text-white hover:bg-white/5 border-b border-white/[0.05] last:border-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <FormInput
          label="Account Number"
          value={accountNum}
          onChange={(e) => setAccountNum(e.target.value.replace(/\D/g, "").slice(0, 17))}
          placeholder="4-17 digits"
        />

        <FormInput
          label="Recipient Account Name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="e.g. John Doe"
        />
      </div>

      <FormInput
        label="Amount ($)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
      />
      <FormInput
        label="Memo (Optional)"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="What's this for?"
      />

      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-primary-muted">Est. Processing Time:</span>
          <span className="text-white font-semibold">{timing}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-primary-muted">Transfer Fee:</span>
          <span className="text-white font-semibold">${fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-white/[0.08] pt-2 mt-1">
          <span className="text-primary-muted font-medium">Total Deducted:</span>
          <span className="text-primary-light font-bold">${totalCost}</span>
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={
          !bankName ||
          !accountName ||
          accountName.length < 2 ||
          routingNum.length !== 9 ||
          accountNum.length < 4 ||
          !amount ||
          parsedAmount <= 0 ||
          checkingRouting
        }
        className="w-full py-3 rounded-2xl bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:pointer-events-none mt-2"
      >
        Continue
      </button>
    </div>
  );
}
