"use client";

import React from "react";
import { Zap, ShieldCheck, CreditCard, Activity, Landmark, ArrowUpRight, BarChart3, Globe } from "lucide-react";

export default function FeaturesGrid() {
  const features = [
    {
      icon: Zap,
      badge: "Instant Rails",
      title: "Real-Time Multi-Rail Settlement",
      description: "Move capital instantly across Fedwire, RTP, ACH, and SWIFT cross-border networks with sub-second confirmation and zero intermediary markup.",
      highlight: "< 60s Settlement"
    },
    {
      icon: CreditCard,
      badge: "Commercial Cards",
      title: "Virtual & Physical Metal Cards",
      description: "Generate Visa virtual cards instantly with granular spend limits, automated merchant categorization, and physical matte black titanium cards.",
      highlight: "Unlimited Provisioning"
    },
    {
      icon: Landmark,
      badge: "Tax Treasury",
      title: "Direct IRS Treasury Integration",
      description: "Submit quarterly 1040/941 tax payments directly to the US Treasury and track incoming federal tax direct deposit refunds with live progress telemetry.",
      highlight: "Official Treasury Agent"
    },
    {
      icon: BarChart3,
      badge: "Wealth Management",
      title: "Integrated Equity & Stock Portfolios",
      description: "Execute equity trades, allocate cash across index ETFs, track unrealized and realized P&L, and manage investment portfolios directly in your bank account.",
      highlight: "Real-Time Ledger"
    },
    {
      icon: ShieldCheck,
      badge: "Security",
      title: "Hardware & Cryptographic Protection",
      description: "Argon2id password hashing, time-based one-time passwords (TOTP), automated post-no-debit fraud defense, and FIPS 140-2 Level 3 hardware security.",
      highlight: "SOC 2 Type II"
    },
    {
      icon: Globe,
      badge: "Global Liquidity",
      title: "Multi-Currency Operating Vaults",
      description: "Hold, convert, and transact in USD, CAD, and GBP balances simultaneously with institutional foreign exchange rates and zero hidden conversion markups.",
      highlight: "3 Currency Desks"
    }
  ];

  return (
    <section className="w-full px-6 md:px-8 py-24 bg-[#f0f3ff]">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Section Header */}
        <div className="text-center flex flex-col gap-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 self-center px-3 py-1 rounded-full bg-white border border-[#bccabe] text-xs font-semibold text-[#006d43] uppercase tracking-wider shadow-xs">
            Institutional Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#151c27] tracking-tight">
            Engineered for Velocity, Precision, and Control
          </h2>
          <p className="text-base text-[#525f72] leading-relaxed">
            Everything your enterprise requires to manage institutional liquidity, disburse capital globally, and protect balance sheet reserves.
          </p>
        </div>
        
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div 
                key={index}
                className="group relative bg-white border border-[#bccabe] hover:border-[#1faa6e]/50 rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-emerald-950/5 hover:-translate-y-1"
              >
                <div>
                  {/* Card Header: Icon & Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#e7eefe] text-[#1faa6e] flex items-center justify-center transition-colors group-hover:bg-[#1faa6e] group-hover:text-white">
                      <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#006d43] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      {feat.badge}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-lg font-bold text-[#151c27] mb-2.5 group-hover:text-[#006d43] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-[#525f72] leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                {/* Footer Highlight */}
                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-[#151c27]">
                  <span className="text-[#1faa6e] font-mono text-[11px] font-bold">{feat.highlight}</span>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#1faa6e] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
