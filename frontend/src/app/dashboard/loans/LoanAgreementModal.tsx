import React, { useEffect } from "react";
import { X, Printer, Landmark } from "lucide-react";
import { Loan } from "./types";

interface LoanAgreementModalProps {
  loan?: Loan | null;
  draftAmount?: number;
  draftTermMonths?: number;
  draftMonthlyPayment?: number;
  draftTotalRepayment?: number;
  symbol: string;
  borrowerName: string;
  onClose: () => void;
}

export default function LoanAgreementModal({
  loan,
  draftAmount = 25000,
  draftTermMonths = 36,
  draftMonthlyPayment = 760.44,
  draftTotalRepayment = 27375.84,
  symbol,
  borrowerName,
  onClose,
}: LoanAgreementModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const loanId = loan ? loan.id : "DRAFT-APP-2026";
  const startDateObj = new Date(loan?.approved_at || loan?.created_at || Date.now());
  const origDate = startDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  
  const termMonths = loan ? loan.term_months : draftTermMonths;
  const matDateObj = new Date(startDateObj);
  matDateObj.setMonth(matDateObj.getMonth() + termMonths);
  const maturityDate = matDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const amount = loan ? loan.amount : draftAmount;
  const apr = loan ? loan.interest_rate : 5.99;
  const monthlyPay = loan ? loan.monthly_payment : draftMonthlyPayment;
  const totalRepay = loan ? loan.total_repayment : draftTotalRepayment;
  const financeCharge = Math.round((totalRepay - amount) * 100) / 100;

  return (
    <div className="fixed inset-0 bg-[#000080]/50 backdrop-blur-md flex items-center justify-center z-[100] p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-3xl h-[85vh] max-h-[800px] min-h-[400px] shadow-2xl relative flex flex-col overflow-hidden font-sans my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header Control Bar */}
        <div className="flex items-center justify-between p-5 md:px-8 md:py-5 border-b border-zinc-200 bg-white flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-primary border border-emerald-100 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-zinc-950 text-base">Master Loan Credit Agreement</h3>
              <p className="text-[11px] text-zinc-500 font-medium">Federal Truth in Lending Disclosure & Binding Credit Contract</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors">
              <Printer className="w-4 h-4" /> Download / Print PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Master Loan Agreement Body */}
        <div className="p-6 md:p-8 overflow-y-auto min-h-0 flex-1 flex flex-col gap-6 text-zinc-800 text-xs leading-relaxed print:p-0 print:overflow-visible">
          
          {/* Document Title Header */}
          <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
            <div>
              <h1 className="font-heading font-black text-xl text-zinc-950 tracking-wide uppercase">MASTER LOAN AGREEMENT</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PRESCOTT NATIONAL BANK, N.A. • INSTITUTIONAL TREASURY OPERATIONS</p>
              <p className="text-[10px] text-zinc-400">FDIC Certificate #38102 • Member Federal Reserve System</p>
            </div>
            <div className="text-right font-mono text-[10px] text-zinc-500">
              <span className="font-bold text-zinc-900 block">LOAN REF #{loanId.slice(0, 13).toUpperCase()}</span>
              <span>Effective Date: {origDate}</span>
            </div>
          </div>

          {/* Parties Preamble */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 font-serif leading-relaxed text-[11px] text-zinc-800">
            This Master Loan Agreement (the "Agreement") is entered into on this <strong>{origDate}</strong> (the "Effective Date"), by and between the parties identified below:<br/><br/>
            <strong>THE LENDER:</strong> Prescott National Bank, N.A., located at California Street, Financial District, San Francisco, CA (the "Lender").<br/>
            <strong>THE BORROWER:</strong> <strong>{borrowerName}</strong>, located at Customer Designated Account Address (the "Borrower").
          </div>

          {/* Truth in Lending Summary Box (TILA) */}
          <div className="border-2 border-zinc-900 rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
            <div className="bg-zinc-950 text-white font-bold text-[11px] px-4 py-2 uppercase tracking-wider">
              FEDERAL TRUTH IN LENDING DISCLOSURES (TILA ACT)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-200 text-center font-mono py-3 bg-zinc-50">
              <div className="p-3">
                <span className="text-[9px] font-bold text-zinc-400 uppercase block">ANNUAL PERCENTAGE RATE</span>
                <span className="text-base font-extrabold text-zinc-900">{apr}% APR</span>
              </div>
              <div className="p-3">
                <span className="text-[9px] font-bold text-zinc-400 uppercase block">FINANCE CHARGE</span>
                <span className="text-base font-bold text-zinc-900">{symbol}{financeCharge.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3">
                <span className="text-[9px] font-bold text-zinc-400 uppercase block">AMOUNT FINANCED</span>
                <span className="text-base font-bold text-zinc-900">{symbol}{amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3">
                <span className="text-[9px] font-bold text-zinc-400 uppercase block">TOTAL PAYMENTS</span>
                <span className="text-base font-extrabold text-emerald-600">{symbol}{totalRepay.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Complete Master Agreement Clauses */}
          <div className="flex flex-col gap-5 text-[11px] text-zinc-700 text-justify leading-relaxed">
            <div>
              <h5 className="font-bold text-zinc-950 uppercase mb-1">1. Principal Amount and Credit Facility</h5>
              <p><strong>1.1 Facility Amount:</strong> The Lender agrees to make available to the Borrower a term loan facility in the aggregate principal amount of <strong>{symbol}{amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> (the "Loan").</p>
              <p className="mt-1"><strong>1.2 Purpose of Funds:</strong> The Borrower certifies that the proceeds of this Loan shall be utilized strictly for personal liquidity, debt consolidation, or working capital financing.</p>
              <p className="mt-1"><strong>1.3 Conditions Precedent to Disbursement:</strong> Execution of this signed Agreement, verification of identity, and no material adverse financial changes.</p>
            </div>

            <div>
              <h5 className="font-bold text-zinc-950 uppercase mb-1">2. Interest, Fees, and Payments</h5>
              <p><strong>2.1 Interest Rate:</strong> The unpaid principal balance shall accrue interest from disbursement date at a fixed rate equal to <strong>{apr}% per annum</strong>.</p>
              <p className="mt-1"><strong>2.2 Computation of Interest:</strong> Calculated daily on a 360-day year basis and actual days elapsed.</p>
              <p className="mt-1"><strong>2.3 Repayment Schedule:</strong> Borrower shall repay the Loan in <strong>{termMonths} consecutive monthly installments of {symbol}{monthlyPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>, commencing 30 days from Effective Date and continuing until the Maturity Date.</p>
              <p className="mt-1"><strong>2.4 Maturity Date:</strong> Final repayment deadline for all principal, interest, and fees is <strong>{maturityDate}</strong> (the "Maturity Date").</p>
              <p className="mt-1"><strong>2.5 Late Fees:</strong> Installments overdue past 15 calendar days incur a late fee equal to 5.00% of overdue volume.</p>
            </div>

            <div>
              <h5 className="font-bold text-zinc-950 uppercase mb-1">3. Collateral and Security Interest</h5>
              <p><strong>3.1 Grant of Security Interest:</strong> To secure performance, Borrower grants Lender a primary lien on designated funding accounts.</p>
              <p className="mt-1"><strong>3.2 Maintenance of Collateral:</strong> Borrower shall maintain accounts in good standing.</p>
            </div>

            <div>
              <h5 className="font-bold text-zinc-950 uppercase mb-1">4. Affirmative and Negative Covenants</h5>
              <p>Borrower agrees to comply with all applicable local and federal laws, maintain accurate financial records, and refrain from transferring material business assets without prior written Lender authorization.</p>
            </div>

            <div>
              <h5 className="font-bold text-zinc-950 uppercase mb-1">5. Events of Default & Remedies</h5>
              <p>Non-payment past grace period or misrepresentation constitutes an Event of Default. Upon Default, Lender may declare remaining principal immediately due (Acceleration), raise applicable interest by +4.00% per annum, and recover all third-party collection costs.</p>
            </div>

            <div>
              <h5 className="font-bold text-zinc-950 uppercase mb-1">6. Miscellaneous Provisions</h5>
              <p>Governed by federal banking regulations and laws of the United States. If any provision is held invalid, remaining terms continue in full force.</p>
            </div>
          </div>

          {/* Executed Signatures & Official Bank Stamp */}
          <div className="mt-4 pt-6 border-t-2 border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-6 flex-shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/80 border-2 border-dashed border-amber-600/40 text-amber-900">
              <div className="w-12 h-12 rounded-full border-2 border-red-600 bg-red-600/10 flex items-center justify-center text-[8px] font-black text-red-700 uppercase text-center leading-none p-1 font-mono rotate-[-6deg]">
                OFFICIAL SEAL<br />APPROVED<br />FDIC
              </div>
              <div className="text-[10px]">
                <span className="font-bold block uppercase text-red-800">PRESCOTT NATIONAL TREASURY AUDIT</span>
                <span className="text-zinc-600 font-mono">SEAL REG: #{loanId.slice(0, 10).toUpperCase()}-2026</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-[10px]">
              <div className="border-t border-zinc-900 pt-1.5 flex flex-col">
                <span className="font-serif italic text-sm text-indigo-900">Marcus Vance</span>
                <span className="font-bold uppercase text-zinc-900">FOR THE LENDER (Prescott National Bank, N.A.)</span>
                <span className="text-zinc-400 font-mono">Title: Chief Credit Officer • {origDate}</span>
              </div>
              <div className="border-t border-zinc-900 pt-1.5 flex flex-col">
                <span className="font-serif italic text-sm text-emerald-900">{borrowerName}</span>
                <span className="font-bold uppercase text-zinc-900">FOR THE BORROWER</span>
                <span className="text-zinc-400 font-mono">Digital Signature • Verified ({origDate})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
