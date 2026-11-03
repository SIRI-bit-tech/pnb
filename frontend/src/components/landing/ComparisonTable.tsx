"use client";

import React from "react";
import { Check, X } from "lucide-react";

export default function ComparisonTable() {
  const comparisonData = [
    {
      feature: "Monthly Maintenance Fees",
      prescottNationalBank: "$0.00 / mo",
      traditional: "$25.00 – $50.00 / mo",
      isAdvantage: true,
    },
    {
      feature: "Fedwire & Domestic Wire Settlement",
      prescottNationalBank: "Sub-Minute Immediate",
      traditional: "2 – 4 Business Days",
      isAdvantage: true,
    },
    {
      feature: "Commercial Virtual Card Issuance",
      prescottNationalBank: "Instant Unlimited Provisioning",
      traditional: "Requires Branch Appointment",
      isAdvantage: true,
    },
    {
      feature: "Direct IRS Treasury & Refund Engine",
      prescottNationalBank: "Integrated Real-Time EFTPS",
      traditional: "Manual Paper / Third-Party",
      isAdvantage: true,
    },
    {
      feature: "Wealth Management & Equity Desk",
      prescottNationalBank: "Direct Bank-Linked Portfolio",
      traditional: "Separate Siloed Brokerage",
      isAdvantage: true,
    },
    {
      feature: "FDIC Insurance Protection",
      prescottNationalBank: "$250,000 per depositor",
      traditional: "$250,000 per depositor",
      isAdvantage: true,
    },
    {
      feature: "Live Institutional Support Desk",
      prescottNationalBank: "< 2 Minutes Average Wait (24/7)",
      traditional: "30+ Minute Call Queue",
      isAdvantage: true,
    },
  ];

  return (
    <section className="w-full px-6 md:px-8 py-24 bg-white border-t border-[#bccabe]">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <div className="text-center flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 self-center px-3 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-[#006d43] uppercase tracking-wider">
            Clear Transparency
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#151c27] tracking-tight">
            Prescott National Bank vs. Legacy Financial Institutions
          </h2>
          <p className="text-sm md:text-base text-[#525f72] max-w-2xl mx-auto">
            See how modern institutional digital rails compare against traditional brick-and-mortar legacy systems.
          </p>
        </div>
        
        <div className="w-full border border-[#bccabe] rounded-2xl overflow-hidden bg-[#f9f9ff] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0f3ff] border-b border-[#bccabe]">
                <th className="p-4 sm:p-5 text-xs font-semibold text-[#525f72] uppercase tracking-wider w-2/5">
                  Capability
                </th>
                <th className="p-4 sm:p-5 text-xs font-bold text-[#006d43] uppercase tracking-wider w-3/10 border-l border-[#bccabe] bg-[#e7eefe]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1faa6e]"></span>
                    Prescott National Bank
                  </div>
                </th>
                <th className="p-4 sm:p-5 text-xs font-semibold text-[#525f72] uppercase tracking-wider w-3/10 border-l border-[#bccabe]">
                  Legacy Wall St. Banks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bccabe]">
              {comparisonData.map((row, index) => (
                <tr key={index} className="hover:bg-white/80 transition-colors">
                  <td className="p-4 sm:p-5 text-xs sm:text-sm font-semibold text-[#151c27]">
                    {row.feature}
                  </td>
                  <td className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-[#1faa6e] font-bold border-l border-[#bccabe] bg-[#e7eefe]/40">
                    {row.prescottNationalBank}
                  </td>
                  <td className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-[#525f72] border-l border-[#bccabe]">
                    {row.traditional}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
