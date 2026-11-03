import React, { useState } from "react";
import { X, ShieldCheck, Lock } from "lucide-react";
import { W9Payload } from "./types";

interface W9CertificationModalProps {
  onClose: () => void;
  onSubmit: (payload: W9Payload) => Promise<void>;
  submitting: boolean;
}

export default function W9CertificationModal({
  onClose,
  onSubmit,
  submitting,
}: W9CertificationModalProps) {
  const [ssnLast4, setSsnLast4] = useState("");
  const [taxClassification, setTaxClassification] = useState("Individual/Sole proprietor");
  const [signatureName, setSignatureName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (ssnLast4.length !== 4) {
      setErrorMsg("Please enter the last 4 digits of your SSN or ITIN.");
      return;
    }
    if (!signatureName.trim()) {
      setErrorMsg("Please type your full legal name as digital signature.");
      return;
    }
    try {
      await onSubmit({
        ssn_last4: ssnLast4,
        tax_classification: taxClassification,
        signature_name: signatureName,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "W-9 certification failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000080]/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-zinc-950 text-sm">
                IRS Form W-9 Certification
              </h4>
              <p className="text-[10px] text-zinc-500">
                Taxpayer Identification Number & Certification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Federal Tax Classification
            </label>
            <select
              value={taxClassification}
              onChange={(e) => setTaxClassification(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 bg-white cursor-pointer"
            >
              <option value="Individual/Sole proprietor">Individual / Sole Proprietor</option>
              <option value="C Corporation">C Corporation</option>
              <option value="S Corporation">S Corporation</option>
              <option value="Partnership">Partnership</option>
              <option value="Trust/Estate">Trust / Estate</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              SSN or ITIN (Last 4 Digits)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={4}
                required
                disabled={submitting}
                placeholder="••••"
                value={ssnLast4}
                onChange={(e) => setSsnLast4(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-mono tracking-widest outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Digital Signature (Full Legal Name)
            </label>
            <input
              type="text"
              required
              disabled={submitting}
              placeholder="e.g. Johnathan Doe"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-150 text-[10px] font-semibold text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-150 text-[10px] text-zinc-500 leading-snug">
            Under penalties of perjury, I certify that the Taxpayer Identification Number shown on this form is correct and I am a U.S. citizen or U.S. resident.
          </div>

          <button
            type="submit"
            disabled={submitting || ssnLast4.length !== 4 || !signatureName.trim()}
            className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Verifying Certification..." : "Certify W-9 Tax Certification"}
          </button>
        </form>
      </div>
    </div>
  );
}
