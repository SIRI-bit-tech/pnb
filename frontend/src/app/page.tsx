"use client";

import React from "react";
import Link from "next/link";
import { Building2, Shield, Lock, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import HeroSection from "@/components/landing/HeroSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import SecuritySection from "@/components/landing/SecuritySection";
import ComparisonTable from "@/components/landing/ComparisonTable";

export default function Home() {
  return (
    <div className="bg-[#f9f9ff] text-[#151c27] font-sans min-h-screen flex flex-col antialiased">
      {/* TopNavBar */}
      <Navbar />

      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <HeroSection />

        {/* Trust Bar */}
        <section className="w-full border-y border-[#bccabe] bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 flex flex-wrap justify-center md:justify-between items-center gap-6 text-xs text-[#3d4a41] font-semibold tracking-wider uppercase">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#6d7a70]" />
              <span>FDIC Insured up to $250,000</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-[#bccabe]" />
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#6d7a70]" />
              <span>AES-256 Encryption</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-[#bccabe]" />
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#6d7a70]" />
              <span>SOC 2 Type II Compliant</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <FeaturesGrid />

        {/* Stats Strip */}
        <section className="w-full bg-[#0B1929] py-16 px-6 md:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#dce2f3]/20">
            <div className="flex flex-col gap-2 pt-4 md:pt-0">
              <span className="font-mono text-3xl md:text-[40px] font-bold text-[#1faa6e]">2.4M+</span>
              <span className="text-xs text-[#f9f9ff] uppercase tracking-wider font-semibold">Active Accounts</span>
            </div>
            <div className="flex flex-col gap-2 pt-8 md:pt-0">
              <span className="font-mono text-3xl md:text-[40px] font-bold text-[#1faa6e]">$0</span>
              <span className="text-xs text-[#f9f9ff] uppercase tracking-wider font-semibold">Monthly Fees</span>
            </div>
            <div className="flex flex-col gap-2 pt-8 md:pt-0">
              <span className="font-mono text-3xl md:text-[40px] font-bold text-[#1faa6e]">4.9/5</span>
              <span className="text-xs text-[#f9f9ff] uppercase tracking-wider font-semibold">App Rating</span>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <SecuritySection />

        {/* Comparison Table */}
        <ComparisonTable />

        {/* Final CTA */}
        <section className="w-full bg-[#0B1929] py-20 px-6 md:px-8 text-center">
          <div className="max-w-3xl mx-auto flex flex-col gap-6 items-center">
            <h2 className="text-3xl font-bold text-[#f9f9ff]">Open an account in minutes</h2>
            <p className="text-base text-[#bac7dd]/80 mb-4">Join thousands of modern enterprises building their financial future with Prescott National Bank.</p>
            <Link href="/register" className="bg-[#1faa6e] text-white px-10 py-4 rounded-xl text-sm font-bold hover:bg-[#18935f] transition-all shadow-lg shadow-emerald-950/40">
              Open Account Now
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
