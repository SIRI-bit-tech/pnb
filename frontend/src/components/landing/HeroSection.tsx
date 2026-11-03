"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, CheckCircle, Wifi } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative w-full px-6 md:px-8 pt-28 pb-20 max-w-7xl mx-auto overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-emerald-500/10 via-[#006d43]/5 to-transparent blur-[100px] -z-10 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Brand Copy & CTAs */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Institutional Anchor Badge */}
          <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>San Francisco Financial District</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[52px] lg:leading-[60px] text-[#151c27] font-bold tracking-tight">
            Institutional Grade Banking for Modern Capital
          </h1>

          <p className="text-base sm:text-lg text-[#525f72] max-w-xl leading-relaxed">
            Secure high-yield treasury accounts with zero monthly fees, sub-second global transfers, and enterprise-grade virtual cards. Engineered for high-growth enterprises and discerning individuals.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-[#1faa6e] hover:bg-[#18935f] text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-emerald-900/20 hover:shadow-lg hover:shadow-emerald-900/30"
            >
              <span>Open an Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-white text-[#151c27] border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-xs"
            >
              Sign In to Banking
            </Link>
          </div>

          {/* Micro Trust Indicators */}
          <div className="pt-6 border-t border-zinc-200/80 grid grid-cols-3 gap-4 text-left">
            <div>
              <p className="font-mono text-base sm:text-lg font-bold text-zinc-900">$250,000</p>
              <p className="text-[11px] font-medium text-zinc-500">FDIC Insurance Limit</p>
            </div>
            <div>
              <p className="font-mono text-base sm:text-lg font-bold text-[#1faa6e]">$0.00 / mo</p>
              <p className="text-[11px] font-medium text-zinc-500">Zero Account Fees</p>
            </div>
            <div>
              <p className="font-mono text-base sm:text-lg font-bold text-zinc-900">24/7/365</p>
              <p className="text-[11px] font-medium text-zinc-500">Live Priority Support</p>
            </div>
          </div>
        </div>

        {/* Right Column: High-End CSS-Rendered Prescott National Bank Metal Debit Card + Live Floating Widgets */}
        <div className="lg:col-span-6 relative flex items-center justify-center py-6">
          {/* Ambient card back glow */}
          <div className="absolute w-[360px] h-[220px] rounded-3xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-2xl -z-10" />

          {/* Card Presentation Container */}
          <div className="relative w-full max-w-[440px]">
            {/* Top Floating Badge: Wire Settlement */}
            <div className="absolute -top-6 -right-2 sm:-right-4 z-20 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-zinc-200 shadow-lg shadow-zinc-900/5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Fedwire Inbound</p>
                <p className="font-mono text-xs font-bold text-zinc-900">+$250,000.00 USD</p>
              </div>
            </div>

            {/* The CSS-Rendered Prescott National Bank Metal Card */}
            <div className="w-full aspect-[1.586/1] rounded-2xl p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-[#0c1824] via-[#102233] to-[#081018] text-white shadow-2xl border border-white/10 select-none transition-transform duration-300 hover:scale-[1.02]">
              {/* Metallic Sheen Accent */}
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.07] via-transparent to-transparent pointer-events-none" />

              {/* Card Header: Brand Monogram + Bank Name */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-[#006d43] flex items-center justify-center text-white font-bold text-xs shadow-inner border border-emerald-300/30">
                    CW
                  </div>
                  <div>
                    <span className="font-heading font-extrabold tracking-wider text-sm block">
                      PRESCOTT <span className="text-[#1faa6e]">NATIONAL</span> BANK
                    </span>
                    <span className="text-[8px] font-mono tracking-widest text-zinc-400 uppercase block">
                      Commercial Treasury
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-zinc-400 rotate-90" />
                </div>
              </div>

              {/* Card Mid: Gold EMV Chip */}
              <div className="mt-6 sm:mt-7 flex items-center justify-between relative z-10">
                <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 p-0.5 shadow-inner border border-yellow-300/40 relative overflow-hidden flex flex-col justify-around">
                  <div className="w-full h-[1px] bg-amber-900/40" />
                  <div className="w-full h-[1px] bg-amber-900/40" />
                  <div className="w-full h-[1px] bg-amber-900/40" />
                  <div className="absolute inset-y-0 left-1/3 w-[1px] bg-amber-900/40" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase">
                  DEBIT PLATINUM
                </span>
              </div>

              {/* Card Number */}
              <div className="mt-4 sm:mt-5 relative z-10">
                <p className="font-mono text-base sm:text-lg tracking-[0.22em] text-zinc-100 font-semibold drop-shadow-sm">
                  ••••  ••••  ••••  8842
                </p>
              </div>

              {/* Card Bottom: Holder, Expiry, Visa Logo */}
              <div className="mt-4 flex items-end justify-between relative z-10">
                <div>
                  <p className="text-[7px] font-mono uppercase tracking-widest text-zinc-400">Cardholder</p>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-200">
                    ALEXANDER VANCE
                  </p>
                </div>

                <div>
                  <p className="text-[7px] font-mono uppercase tracking-widest text-zinc-400">Expires</p>
                  <p className="font-mono text-xs font-semibold text-zinc-300">09/29</p>
                </div>

                <div className="flex flex-col items-end">
                  <span className="font-heading font-black italic text-lg sm:text-xl tracking-tight text-white/90">
                    VISA
                  </span>
                  <span className="text-[7px] font-mono tracking-widest text-zinc-400 uppercase -mt-1">
                    Signature
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Floating Card: APY & Security Badge */}
            <div className="absolute -bottom-6 -left-2 sm:-left-4 z-20 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-zinc-200 shadow-lg shadow-zinc-900/5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#1faa6e] flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Treasury High-Yield</p>
                <p className="font-mono text-xs font-bold text-zinc-900">5.24% APY • Daily Yield</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
