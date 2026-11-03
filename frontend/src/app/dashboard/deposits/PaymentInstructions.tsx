"use client";

import React from "react";

interface PaymentInstructionsProps {
  method: "cashapp" | "paypal";
  config: {
    cashapp_tag?: string;
    cashapp_qr_url?: string;
    paypal_email?: string;
    paypal_qr_url?: string;
  } | null;
}

export default function PaymentInstructions({ method, config }: PaymentInstructionsProps) {
  if (!config) return null;

  const isCashApp = method === "cashapp";
  const tag = isCashApp ? config.cashapp_tag : config.paypal_email;
  const qrUrl = isCashApp ? config.cashapp_qr_url : config.paypal_qr_url;

  return (
    <div className="flex flex-col items-center gap-4 p-5 rounded-3xl border border-zinc-200/80 bg-zinc-50/50 shadow-sm text-center">
      <div>
        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
          {isCashApp ? "CashApp Tag" : "PayPal Email"}
        </p>
        <p className="text-sm font-bold text-primary select-all">
          {tag || (isCashApp ? "$PrescottNationalBank" : "billing@prescottnational.com")}
        </p>
      </div>

      {qrUrl && (
        <div className="relative group flex items-center justify-center p-3 bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden w-40 h-40">
          <img
            src={qrUrl}
            alt={`${isCashApp ? "CashApp" : "PayPal"} Payment QR Code`}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <p className="text-[10px] text-zinc-400 max-w-xs leading-relaxed">
        Scan the QR code or send payment directly to the address above. Make sure to copy your reference transaction ID.
      </p>
    </div>
  );
}
