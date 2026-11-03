"use client";

import React from "react";
import { Globe, Building2, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { InternationalTransferSectionProps } from "./types";
import { POPULAR_COUNTRIES, ALL_COUNTRIES } from "@/lib/countries";

const MAJOR_CURRENCIES = [
  { code: "USD", label: "USD - US Dollar ($)" },
  { code: "EUR", label: "EUR - Euro (€)" },
  { code: "GBP", label: "GBP - British Pound (£)" },
  { code: "CAD", label: "CAD - Canadian Dollar (C$)" },
  { code: "AUD", label: "AUD - Australian Dollar (A$)" },
  { code: "CHF", label: "CHF - Swiss Franc (CHF)" },
  { code: "JPY", label: "JPY - Japanese Yen (¥)" },
  { code: "SGD", label: "SGD - Singapore Dollar (S$)" },
  { code: "AED", label: "AED - UAE Dirham (AED)" },
];

export default function InternationalTransferSection({
  beneficiaryName,
  setBeneficiaryName,
  beneficiaryAddress,
  setBeneficiaryAddress,
  beneficiaryCountry,
  setBeneficiaryCountry,
  ibanOrAccount,
  setIbanOrAccount,
  swiftBic,
  setSwiftBic,
  bankName,
  setBankName,
  bankCity,
  setBankCity,
  currency,
  setCurrency,
}: InternationalTransferSectionProps) {
  const isSwiftValid = swiftBic.length === 8 || swiftBic.length === 11;

  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider block">
              International SWIFT / Wire Transfer
            </span>
            <span className="text-[10px] text-zinc-400">
              Cross-border wire settled via SWIFT GPI network
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          SWIFT PRIORITY
        </span>
      </div>

      {/* SWIFT / Fee Advisory Card */}
      <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-zinc-600">
          <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-[11px] leading-tight">
            Delivery: <strong className="text-zinc-800">1–3 Business Days</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] leading-tight">
            Wire Out Fee: <strong className="text-zinc-900">$35.00 USD</strong>
          </span>
        </div>
      </div>

      {/* Section 1: Beneficiary Details */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          1. Beneficiary Information
        </span>

        {/* Beneficiary Legal Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase">
            Beneficiary Full Legal / Corporate Name *
          </label>
          <input
            type="text"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            placeholder="e.g. Acme Global Holdings Ltd / Jane Doe"
            className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Country & Address Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Beneficiary Country */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">
              Beneficiary Country *
            </label>
            <select
              value={beneficiaryCountry}
              onChange={(e) => setBeneficiaryCountry(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all font-medium cursor-pointer"
            >
              <option value="">Select destination country...</option>
              <optgroup label="Popular Destinations">
                {POPULAR_COUNTRIES.map((c) => (
                  <option key={`pop-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All Countries (A–Z)">
                {ALL_COUNTRIES.map((c) => (
                  <option key={`all-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Beneficiary Address */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">
              Street Address & City
            </label>
            <input
              type="text"
              value={beneficiaryAddress}
              onChange={(e) => setBeneficiaryAddress(e.target.value)}
              placeholder="e.g. 100 Bishopsgate, London"
              className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Destination Bank & SWIFT */}
      <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          2. Destination Bank & Wire Routing
        </span>

        {/* SWIFT / BIC Code & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center justify-between">
              <span>SWIFT / BIC Code *</span>
              <span className="text-[9px] text-zinc-400 font-normal">8 or 11 chars</span>
            </label>
            <input
              type="text"
              maxLength={11}
              value={swiftBic}
              onChange={(e) => setSwiftBic(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="e.g. BARCGB22"
              className={`w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-zinc-50 border rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all ${
                swiftBic.length > 0 && !isSwiftValid
                  ? "border-amber-300 bg-amber-50/30"
                  : isSwiftValid
                  ? "border-emerald-300"
                  : "border-zinc-200"
              }`}
            />
            {swiftBic.length > 0 && !isSwiftValid && (
              <span className="text-[9px] text-amber-600 font-medium">
                SWIFT code must be 8 or 11 characters.
              </span>
            )}
            {isSwiftValid && (
              <span className="text-[9px] text-emerald-600 font-medium">
                ✓ Valid SWIFT / BIC length
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">
              Settlement Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all font-medium cursor-pointer"
            >
              {MAJOR_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bank Name & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">
              Destination Bank Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Barclays Bank PLC"
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
              />
              <Building2 className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">
              Bank City / Branch
            </label>
            <input
              type="text"
              value={bankCity}
              onChange={(e) => setBankCity(e.target.value)}
              placeholder="e.g. London"
              className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* IBAN / Account Number */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center justify-between">
            <span>IBAN / Account Number *</span>
            <span className="text-[9px] text-zinc-400 font-normal">International format</span>
          </label>
          <input
            type="text"
            value={ibanOrAccount}
            onChange={(e) => setIbanOrAccount(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="e.g. GB29BARC20041538165037"
            className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Compliance & Regulatory Notice */}
      <div className="rounded-xl bg-zinc-50/80 border border-zinc-200/60 p-3 flex items-start gap-2.5 text-[10px] text-zinc-500">
        <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
        <span>
          Cross-border transactions are screened against OFAC and FinCEN sanctions lists. Wire transfers sent after 4:00 PM EST begin settlement on the next Federal Reserve banking day.
        </span>
      </div>
    </div>
  );
}
