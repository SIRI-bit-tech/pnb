"use client";

import React from "react";
import { ShieldAlert, Mail, MapPin, AlertTriangle, X, Phone } from "lucide-react";

interface PndRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  supportEmail?: string;
  accountNumber?: string;
}

function cleanHoldReason(raw?: string): string {
  const fallback = "We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity.";
  
  if (!raw) return fallback;
  
  // Clean up legacy database entries containing internal acronyms or old template text
  if (
    raw.includes("Post-No-Debit") ||
    raw.includes("(PND)") ||
    raw.includes("routine security verification") ||
    raw.includes("regulatory compliance audit") ||
    raw.includes("pending completion of account review") ||
    raw.trim().length < 15
  ) {
    return fallback;
  }
  
  return raw;
}

export default function PndRestrictionModal({
  isOpen,
  onClose,
  reason,
  supportEmail = "support@prescottnational.com",
  accountNumber,
}: PndRestrictionModalProps) {
  if (!isOpen) return null;

  const displayReason = cleanHoldReason(reason);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 md:p-7 flex flex-col gap-5 text-zinc-900 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Security Alert Header */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-zinc-100">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 pr-6">
            <h2 className="text-base font-semibold text-zinc-950">
              Security Notice: Temporary Account Hold
            </h2>
            <p className="text-xs text-zinc-500">
              {accountNumber
                ? `Account ending in ${accountNumber.slice(-4)}`
                : "Your account"}{" "}
              has a temporary hold due to security verification.
            </p>
          </div>
        </div>

        {/* Reason / Flagged Trigger */}
        <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Security Notice Details
          </div>
          <p className="text-[13px] text-zinc-800 leading-relaxed font-medium">
            {displayReason}
          </p>
        </div>

        {/* What this means */}
        <div className="text-[13px] text-zinc-600 leading-relaxed space-y-3">
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
            <p className="font-medium text-zinc-800 text-xs">What this means for your account:</p>
            <ul className="space-y-1 text-[13px] text-zinc-600">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-medium mt-px">•</span>
                <span>Outgoing transfers, wires, bill payments, and debit card transactions are temporarily paused to protect your funds.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-medium mt-px">•</span>
                <span>Incoming deposits, payroll direct deposits, and incoming wire credits remain unrestricted and will post normally.</span>
              </li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-xs text-zinc-800">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              How to verify your identity & restore access
            </div>
            <p className="text-[13px] text-zinc-600 leading-relaxed">
              Visit any Prescott National Bank branch with a valid government-issued photo ID (Driver&apos;s License or Passport). In-person physical verification with an authorized branch representative is required to confirm identity and safely restore full account access.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-800">
              <Mail className="w-3.5 h-3.5 text-zinc-500" />
              <a
                href={`mailto:${supportEmail}`}
                className="text-[#1faa6e] hover:underline"
              >
                {supportEmail}
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-800">
              <Phone className="w-3.5 h-3.5 text-zinc-500" />
              <span>(24/7 Fraud & Verification Desk)</span>
            </div>
          </div>
        </div>

        {/* Dismiss */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
