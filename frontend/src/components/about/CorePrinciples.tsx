"use client";

import React from "react";
import { Shield, Eye, Users, Zap } from "lucide-react";

export default function CorePrinciples() {
  return (
    <section className="bg-[#f0f3ff] py-24 border-y border-[#bccabe]">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#151c27]">Core Principles</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-[#bccabe] p-6 rounded-xl hover:border-[#1faa6e] transition-colors duration-200 group shadow-sm">
            <div className="w-12 h-12 bg-[#f0f3ff] rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#1faa6e] group-hover:text-white transition-colors text-[#006d43]">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#151c27] mb-2">Security First</h3>
            <p className="text-sm text-[#525f72] leading-relaxed">
              Enterprise-grade encryption and rigorous access controls form the bedrock of our infrastructure.
            </p>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white border border-[#bccabe] p-6 rounded-xl hover:border-[#1faa6e] transition-colors duration-200 group shadow-sm">
            <div className="w-12 h-12 bg-[#f0f3ff] rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#1faa6e] group-hover:text-white transition-colors text-[#006d43]">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#151c27] mb-2">Radical Transparency</h3>
            <p className="text-sm text-[#525f72] leading-relaxed">
              Zero hidden fees. Complete visibility into every transaction and yield generation mechanism.
            </p>
          </div>
          
          {/* Card 3 */}
          <div className="bg-white border border-[#bccabe] p-6 rounded-xl hover:border-[#1faa6e] transition-colors duration-200 group shadow-sm">
            <div className="w-12 h-12 bg-[#f0f3ff] rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#1faa6e] group-hover:text-white transition-colors text-[#006d43]">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#151c27] mb-2">Inclusive Access</h3>
            <p className="text-sm text-[#525f72] leading-relaxed">
              Democratizing access to institutional-grade financial instruments for all eligible clients.
            </p>
          </div>
          
          {/* Card 4 */}
          <div className="bg-white border border-[#bccabe] p-6 rounded-xl hover:border-[#1faa6e] transition-colors duration-200 group shadow-sm">
            <div className="w-12 h-12 bg-[#f0f3ff] rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#1faa6e] group-hover:text-white transition-colors text-[#006d43]">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#151c27] mb-2">Continuous Innovation</h3>
            <p className="text-sm text-[#525f72] leading-relaxed">
              Relentlessly refining our technology stack to optimize speed, reliability, and user experience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
