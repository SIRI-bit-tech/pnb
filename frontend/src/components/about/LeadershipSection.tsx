"use client";

import React from "react";

export default function LeadershipSection() {
  return (
    <>
      {/* 5. Leadership */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-24 w-full">
        <div className="mb-12 border-b border-[#bccabe] pb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#151c27]">Leadership</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Leader 1 */}
          <div className="group">
            <div className="aspect-square w-full mb-4 overflow-hidden rounded-xl bg-[#e2e8f8] border border-[#bccabe] relative">
              <img 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj4TIUz2J1KB98jn154DoSMg6RipN4wGaeSzipQOtZAyx9mfKPtEx9UmP3BMlV7LRWtmAIfa_OmwMOruDUwrV9U7RqFljtPbFGVTLbyUHaEXVTSpQGIt6algQgUnm-gY-areIvzmFnYyFvpgW_eK7uQKwHdBmUAb0kg-HYUlUn5tw81-SbXN9L1_H_4kbq15OfKvP2T9WOIwIzGXfE7oFn83wBS1YegGpWO87c0r7WDJhT0AnC6RI" 
                alt="Sarah Jenkins"
              />
            </div>
            <h3 className="text-base font-bold text-[#151c27]">Sarah Jenkins</h3>
            <p className="text-xs text-[#525f72] font-semibold mt-1">Chief Executive Officer</p>
          </div>
          
          {/* Leader 2 */}
          <div className="group">
            <div className="aspect-square w-full mb-4 overflow-hidden rounded-xl bg-[#e2e8f8] border border-[#bccabe] relative">
              <img 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUWic-VH-P3wIsnjrpxqOGkeEfs3ydJjycLsGUySu8DO1pGx7QC5CxHQJyrU7D9DDUdLFYM5pkqxI1pfFMCObLkmqi9RvnVfGDJvqQt-chuRudjVsu99LX3CgnjXs5FTR_75WxijRI0S_j-W-k42egRKblUyy-v5kNv6nbRww9IY9d4EUbQW_mPVJBzt6j2OO5brVMNf07PMymSnVO_3j8jpUoOrMaPYhr-5UGJ7qFOPnJ7BSZbuQ" 
                alt="David Chen"
              />
            </div>
            <h3 className="text-base font-bold text-[#151c27]">David Chen</h3>
            <p className="text-xs text-[#525f72] font-semibold mt-1">Chief Technology Officer</p>
          </div>
          
          {/* Leader 3 */}
          <div className="group">
            <div className="aspect-square w-full mb-4 overflow-hidden rounded-xl bg-[#e2e8f8] border border-[#bccabe] relative">
              <img 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGXQzpcQCydS_8X14GstZ054YwEX7w5F2uZjo0uHsIZ4bTvCkM6fsE4uAkjK4nwDs-96DVWpQiuCxNG7ug51ZyF68wMZ6NcSiX2FC5de1oq15uwE6ijrVQZVbMDmifv5_CMNjUtRti0GE3VqspUooylc_c00KKG7LJh9-z3WejxzMGjerv4khCm5h-4JR1TwpGpPLkrEHsrzPNhLzGBBTkKmI5NLLVT6tMO2qX6BVqlmBNo28KJ6s" 
                alt="Elena Rodriguez"
              />
            </div>
            <h3 className="text-base font-bold text-[#151c27]">Elena Rodriguez</h3>
            <p className="text-xs text-[#525f72] font-semibold mt-1">Chief Risk Officer</p>
          </div>
          
          {/* Leader 4 */}
          <div className="group">
            <div className="aspect-square w-full mb-4 overflow-hidden rounded-xl bg-[#e2e8f8] border border-[#bccabe] relative">
              <img 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrfZ7VegQyT474dyHNkAYKbwIApXRrURH98l9JUbGLfyK_m_i-FsmstEtLBuhf1HK2vfupqA4fd_1bh85PMytjlNaL7DDxWIyEvt5xeLsxV-SRPnazb0U4dwubT1p_qb5D0dQa8oTNFwkm0EClYPWjCB5T2Y3c4uwonkabhbXy_6LPNPDmilue9wR68t5QX7IuGnn389QFe-OmjWNwtZVqiI8sTzvZbSPIpvnPFxWIFmCmLTC9Gzo" 
                alt="Marcus Thorne"
              />
            </div>
            <h3 className="text-base font-bold text-[#151c27]">Marcus Thorne</h3>
            <p className="text-xs text-[#525f72] font-semibold mt-1">Head of Institutional Banking</p>
          </div>
        </div>
      </section>

      {/* 6. Regulatory Section */}
      <section className="max-w-4xl mx-auto px-6 md:px-8 py-12 text-center w-full">
        <div className="bg-white border border-[#bccabe] p-8 rounded-xl shadow-sm">
          <div className="flex justify-center items-center mb-6 opacity-60 grayscale">
            <img 
              className="h-12 object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUQlbLOUgzyiCOnqEhGdvqTslfpWrWzShdok7RusYoYJ64m2G7Nh4_soibSvw8UdDaui8BY686o2kHx8zbtpVadlVaXa0tDLcpZDE3spybyNV1-lhFFWHo-uU_2pZHNSGhpOF1oyxGxcVvcnmPuGMh6MAXqSW6iPUsygDm6oaWMOa6IqjCEIh-KhINpPbz5OHEaJaRFLmDDdkRJsgyfCdhcKh9rCKrPzhVgQezPdCeU3rgPUMy4IA" 
              alt="FDIC Insured"
            />
          </div>
          <p className="text-sm text-[#525f72] leading-relaxed">
            Prescott National Bank is a member of the Federal Deposit Insurance Corporation (FDIC). Funds deposited with Prescott National Bank are insured up to the maximum amount allowed by law. We adhere strictly to all federal and state regulatory frameworks to ensure the absolute security and stability of our clients' capital.
          </p>
        </div>
      </section>
    </>
  );
}
