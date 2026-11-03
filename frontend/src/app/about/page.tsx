"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import HistorySection from "@/components/about/HistorySection";
import CorePrinciples from "@/components/about/CorePrinciples";
import StatsSection from "@/components/about/StatsSection";
import LeadershipSection from "@/components/about/LeadershipSection";

export default function About() {
  return (
    <div className="bg-[#f9f9ff] text-[#151c27] font-sans min-h-screen flex flex-col antialiased">
      <Navbar />

      <main className="flex-grow flex flex-col pt-16">
        
        {/* 1. Header Section */}
        <section className="relative pt-24 pb-16 px-6 md:px-8 overflow-hidden border-b border-[#bccabe] bg-[#f0f3ff]">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#151c27]">
              Banking Built on Transparency and Trust.
            </h1>
            <p className="text-lg text-[#525f72] max-w-2xl mx-auto leading-relaxed">
              We started Prescott National Bank to eliminate the friction and hidden costs of traditional institutional finance.
            </p>
          </div>
          <div 
            className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBI-IkcN0y-RPS2pBd3YQpxdDzkwjgJVCf9Dh794Vzmh7OMm5FSgRksT9uWOfhhZYzkod8hx6YfLqsGvBZgyib46gLm-bBSr4pd81L9sQZK8WaFSQgBCSPwkTpvzTgaSWx1x3J1aOuMqZNL14X8wNvU97axpXRZ3Zn6n9hK11PFBAMp2PXQQkhXqiMToz59bme8SPFmYML7phY1QtAfAMeWeCdJvh-JQyqR0orFXWx09Svs4j6GVBw')`
            }} 
          />
        </section>

        {/* 2. Story + Timeline */}
        <HistorySection />

        {/* 3. Values 4-Card Grid */}
        <CorePrinciples />

        {/* 4. By-the-numbers */}
        <StatsSection />

        {/* 5. Leadership & Regulatory */}
        <LeadershipSection />

        {/* 6. Closing CTA */}
        <section className="py-24 text-center">
          <div className="max-w-2xl mx-auto px-6 md:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#151c27] mb-8">Ready to switch banks?</h2>
            <Link href="/register" className="bg-[#1faa6e] text-white px-8 py-4 rounded font-semibold text-sm uppercase tracking-wider scale-95 active:scale-90 transition-all hover:bg-[#006d43] hover:shadow-lg">
              Open an Account Today
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
