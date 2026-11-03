"use client";

import React from "react";

export default function HistorySection() {
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-24 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[#151c27]">Our History</h2>
          <div className="space-y-6 text-[#525f72] text-base leading-relaxed">
            <p>
              Founded in 1998 in San Francisco's Financial District, Prescott National Bank emerged from a simple realization: institutional finance had become too opaque, relying on legacy systems that penalized efficiency and obscured true costs. A team of former quantitative analysts and software engineers set out to build a modern infrastructure from the ground up, prioritizing mathematical precision and absolute clarity.
            </p>
            <p>
              By 2000 we had opened our first corporate accounts and secured Series A funding — then spent the following decade scaling operations. Our international footprint followed with a Canada launch in 2013 and a United Kingdom presence in 2017, bringing institutional-grade banking to three countries.
            </p>
            <p>
              Today, Prescott National Bank manages more than $10 billion in assets, serving thousands of high-growth enterprises and discerning individuals. We remain committed to our founding ethos: banking should be a flawless utility, an invisible engine that empowers your capital without exacting hidden tolls.
            </p>
          </div>
        </div>
        
        <div className="lg:col-span-4 lg:col-start-9 mt-12 lg:mt-0">
          <div className="bg-white border border-[#bccabe] p-8 rounded-xl h-full shadow-sm">
            <h3 className="text-xs font-bold text-[#006d43] mb-8 uppercase tracking-widest">Milestones</h3>
            <div className="relative border-l border-[#bccabe] ml-3 space-y-8">
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-[#1faa6e] rounded-full -left-[6.5px] top-1.5 border-2 border-white"></div>
                <h4 className="text-base font-bold text-[#151c27]">1998</h4>
                <p className="text-sm text-[#525f72] mt-1">Prescott National Bank founded in San Francisco; core ledger engineering begins.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-[#bccabe] rounded-full -left-[6.5px] top-1.5 border-2 border-white"></div>
                <h4 className="text-base font-bold text-[#151c27]">2000</h4>
                <p className="text-sm text-[#525f72] mt-1">First corporate accounts opened; Series A funding secured.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-[#bccabe] rounded-full -left-[6.5px] top-1.5 border-2 border-white"></div>
                <h4 className="text-base font-bold text-[#151c27]">2010</h4>
                <p className="text-sm text-[#525f72] mt-1">Expanded operations.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-[#bccabe] rounded-full -left-[6.5px] top-1.5 border-2 border-white"></div>
                <h4 className="text-base font-bold text-[#151c27]">2013</h4>
                <p className="text-sm text-[#525f72] mt-1">International expansion — Canada market launch.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-[#bccabe] rounded-full -left-[6.5px] top-1.5 border-2 border-white"></div>
                <h4 className="text-base font-bold text-[#151c27]">2017</h4>
                <p className="text-sm text-[#525f72] mt-1">United Kingdom operations launched; European foothold established.</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-[#bccabe] rounded-full -left-[6.5px] top-1.5 border-2 border-white"></div>
                <h4 className="text-base font-bold text-[#151c27]">2020</h4>
                <p className="text-sm text-[#525f72] mt-1">Reached $10B in assets under management.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
