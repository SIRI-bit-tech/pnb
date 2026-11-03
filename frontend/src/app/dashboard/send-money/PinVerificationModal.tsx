"use client";

import React from "react";
import { X } from "lucide-react";
import { PinVerificationModalProps } from "./types";

export default function PinVerificationModal({
  isOpen,
  onClose,
  amount,
  pin,
  setPin,
  onConfirm,
  loading
}: PinVerificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md" onClick={onClose} />
      
      {/* Dialog Body */}
      <div className="relative z-10 w-full max-w-[380px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-zinc-800 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
          <span className="text-sm font-bold text-zinc-950">Authorization Required</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-xs text-zinc-500 leading-normal">
          We sent a 4-digit authorization code to your registered email address to confirm sending <span className="font-bold text-zinc-800">${amount}</span>.
        </p>

        <div className="flex flex-col gap-4">
          <input 
            type="text"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            className="text-center font-bold text-2xl tracking-[0.5em] py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary placeholder-zinc-300"
          />

          <button 
            onClick={onConfirm}
            disabled={pin.length < 4 || loading}
            className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            {loading ? "Processing..." : "Confirm & Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
