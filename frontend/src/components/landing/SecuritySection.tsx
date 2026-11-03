"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, Lock, Key, Server, Cpu } from "lucide-react";

export default function SecuritySection() {
  return (
    <section className="w-full px-6 md:px-8 py-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
      {/* Left Column: Native Institutional Security Matrix Card */}
      <div className="lg:col-span-6 relative">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xl shadow-zinc-900/5 relative overflow-hidden">
          {/* Subtle green ambient accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Matrix Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1faa6e] flex items-center justify-center border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-zinc-900">
                  Prescott National Bank Defense Matrix
                </h3>
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  Live Security Architecture
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ALL SYSTEMS ONLINE
            </div>
          </div>

          {/* 4 Security Architecture Tiers */}
          <div className="flex flex-col gap-3">
            {/* Layer 1 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700">
                  <Key className="w-4 h-4 text-[#1faa6e]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">Argon2id Key Derivation</p>
                  <p className="text-[10px] text-zinc-500">Salted & peppered cryptographic hashing</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-600">ZERO KNOWLEDGE</span>
            </div>

            {/* Layer 2 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700">
                  <Lock className="w-4 h-4 text-[#1faa6e]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">AES-256 GCM Transit Shrouding</p>
                  <p className="text-[10px] text-zinc-500">TLS 1.3 encrypted ledger pipelines</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-600">ENFORCED</span>
            </div>

            {/* Layer 3 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700">
                  <Cpu className="w-4 h-4 text-[#1faa6e]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">FIPS 140-2 Level 3 HSM</p>
                  <p className="text-[10px] text-zinc-500">Hardware-isolated transaction signing</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-600">ISOLATED</span>
            </div>

            {/* Layer 4 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700">
                  <Server className="w-4 h-4 text-[#1faa6e]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">FDIC Regulatory Vaults</p>
                  <p className="text-[10px] text-zinc-500">Certificate #38102 • Direct reserve audit</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-600">$250K INSURED</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column: Copy & Checklist */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-[#006d43] uppercase tracking-wider">
          Security Infrastructure
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#151c27] tracking-tight">
          Bank-Grade Security at Every Operational Layer
        </h2>
        <p className="text-base text-[#525f72] leading-relaxed">
          Prescott National Bank adheres to strict defense-in-depth methodologies to protect enterprise balances and proprietary transactions. Every authorization is cryptographically validated before clearing.
        </p>
        <ul className="flex flex-col gap-3.5 mt-2">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#1faa6e] mt-0.5 shrink-0" />
            <span className="text-sm text-[#151c27]">
              Time-based one-time password (TOTP) multi-factor authentication enforced on every withdrawal and debit issuance.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#1faa6e] mt-0.5 shrink-0" />
            <span className="text-sm text-[#151c27]">
              Automated Post-No-Debit (PND) security anomaly isolation to protect accounts against fraudulent intrusions.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#1faa6e] mt-0.5 shrink-0" />
            <span className="text-sm text-[#151c27]">
              Immutable audit trails for Federal Reserve and IRS direct clearing compliance.
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
