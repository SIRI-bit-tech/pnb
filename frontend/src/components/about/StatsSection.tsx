"use client";

import React from "react";

export default function StatsSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 w-full">
      <div className="bg-white border border-[#bccabe] rounded-xl p-8 flex flex-col md:flex-row justify-around items-center gap-8 text-center shadow-sm">
        <div>
          <div className="text-3xl font-bold text-[#006d43] mb-1 font-mono">2018</div>
          <div className="text-xs text-[#525f72] uppercase tracking-wider font-semibold">Founded</div>
        </div>
        <div className="hidden md:block w-px h-12 bg-[#bccabe]"></div>
        <div>
          <div className="text-3xl font-bold text-[#006d43] mb-1 font-mono">50 / 3</div>
          <div className="text-xs text-[#525f72] uppercase tracking-wider font-semibold">States & Countries Covered</div>
        </div>
        <div className="hidden md:block w-px h-12 bg-[#bccabe]"></div>
        <div>
          <div className="text-3xl font-bold text-[#006d43] mb-1 font-mono">150+</div>
          <div className="text-xs text-[#525f72] uppercase tracking-wider font-semibold">Employees</div>
        </div>
      </div>
    </section>
  );
}
