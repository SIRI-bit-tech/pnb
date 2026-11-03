"use client";

import React, { useRef, useEffect } from "react";
import { ExternalTransferSectionProps } from "./types";

export default function ExternalTransferSection({
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
  routingError,
  routingStatus,
  checkingRouting,
  bankSuggestions,
  setBankSuggestions,
  isBankNameManual,
  setIsBankNameManual
}: ExternalTransferSectionProps) {
  const suggestDebounceRef = useRef<NodeJS.Timeout | null>(null);

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
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, []);

  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
        External Bank Account
      </span>

      {/* ACH vs Wire Transfer Type */}
      <div className="flex gap-2 p-1 bg-zinc-50 border border-zinc-200 rounded-xl mb-2">
        <button 
          type="button"
          onClick={() => setTransferType("ach")}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            transferType === "ach" ? "bg-white text-primary shadow-sm border border-zinc-200" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          ACH Transfer ($1.00 Fee)
        </button>
        <button 
          type="button"
          onClick={() => setTransferType("wire")}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
            transferType === "wire" ? "bg-white text-primary shadow-sm border border-zinc-200" : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Wire Transfer ($25.00 Fee)
        </button>
      </div>

      {/* Routing Number Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase">Routing Number</label>
        <div className="relative">
          <input 
            type="text"
            maxLength={9}
            value={routingNum}
            onChange={(e) => setRoutingNum(e.target.value.replace(/\D/g, ""))}
            placeholder="021000021"
            className="w-full px-3.5 py-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white"
          />
          {checkingRouting && (
            <span className="absolute right-3 top-3 text-[9px] text-zinc-400 animate-pulse font-bold">Verifying...</span>
          )}
        </div>
        {routingError && <span className="text-[9px] text-red-500 font-bold">{routingError}</span>}
        {routingStatus === "success" && <span className="text-[9px] text-emerald-600 font-bold font-sans">✓ Verified routing bank</span>}
      </div>

      {/* Bank Name Input */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-[10px] font-bold text-zinc-400 uppercase">
          Bank Name {isBankNameManual && <span className="text-[9px] text-zinc-400 normal-case font-normal">(Manual entry active)</span>}
        </label>
        <input 
          type="text"
          value={bankName}
          onChange={handleBankNameChange}
          readOnly={!isBankNameManual && routingStatus === "success"}
          placeholder={isBankNameManual ? "Type to search bank (e.g. Chase)" : "e.g. JPMorgan Chase"}
          className={`w-full px-3.5 py-3 text-xs border rounded-xl focus:outline-none focus:border-primary focus:bg-white ${
            !isBankNameManual && routingStatus === "success" 
              ? "bg-zinc-100 text-zinc-500 cursor-not-allowed border-zinc-200" 
              : "bg-zinc-50 border-zinc-200"
          }`}
        />
        {isBankNameManual && bankSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-16 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
            {bankSuggestions.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBankName(b);
                  setBankSuggestions([]);
                }}
                className="w-full px-4 py-3 text-left hover:bg-zinc-50 text-xs text-zinc-800 border-b border-zinc-100 last:border-0"
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account Number Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase">Account Number</label>
        <input 
          type="text"
          value={accountNum}
          onChange={(e) => setAccountNum(e.target.value.replace(/\D/g, ""))}
          placeholder="123456789"
          className="w-full px-3.5 py-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white"
        />
      </div>

      {/* Account Name Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase">Beneficiary Name (Account Owner)</label>
        <input 
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-3.5 py-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white"
        />
      </div>
    </div>
  );
}
