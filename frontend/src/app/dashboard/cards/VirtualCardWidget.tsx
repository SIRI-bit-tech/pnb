import React, { useState } from "react";
import { Eye, EyeOff, Lock, Unlock, Wifi } from "lucide-react";

interface CardItem {
  id: string;
  card_number: string;
  last4: string;
  expiry: string;
  cvv: string;
  status: string;
  is_frozen: boolean;
  cardholder_name: string;
  balance: number;
}

interface VirtualCardWidgetProps {
  card: CardItem;
  symbol: string;
  onToggleFreeze?: (id: string) => Promise<void>;
  submitting?: boolean;
  showFreeze?: boolean;
  compact?: boolean;
}

export default function VirtualCardWidget({
  card,
  symbol,
  onToggleFreeze,
  submitting = false,
  showFreeze = true,
  compact = false,
}: VirtualCardWidgetProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formattedNumber = showDetails
    ? card.card_number.replace(/(.{4})/g, "$1 ").trim()
    : `•••• •••• •••• ${card.last4}`;

  return (
    <div
      className={`relative w-full rounded-2xl bg-gradient-to-br from-[#0c0f19] via-[#121829] to-[#080a12] border border-white/10 shadow-xl overflow-hidden flex flex-col justify-between text-white transition-all duration-300 ${
        card.is_frozen ? "opacity-75 grayscale-[40%]" : ""
      } ${compact ? "p-4 aspect-[1.586/1]" : "p-5 md:p-6 h-56 max-w-sm"}`}
    >
      {/* Background Sheen Glow */}
      <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar: Bank Logo, Chip, Contactless */}
      <div className="flex items-center justify-between z-10">
        <div>
          <span className={`font-heading font-extrabold tracking-widest text-white block ${compact ? "text-xs" : "text-sm"}`}>
            PRESCOTT <span className="text-primary font-normal">NATIONAL</span>
          </span>
          <span className="block text-[7px] font-mono tracking-widest text-zinc-400 uppercase">
            Prescott National Bank Platinum Debit
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Gold EMV Chip */}
          <div className={`rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 p-0.5 shadow-inner border border-yellow-300/40 relative overflow-hidden flex flex-col justify-around ${compact ? "w-8 h-5" : "w-10 h-7"}`}>
            <div className="w-full h-[1px] bg-amber-900/30" />
            <div className="w-full h-[1px] bg-amber-900/30" />
            <div className="w-full h-[1px] bg-amber-900/30" />
          </div>
          <Wifi className={`text-zinc-400 rotate-90 ${compact ? "w-3 h-3" : "w-4 h-4"}`} />
        </div>
      </div>

      {/* Center: Card Number & Unmask Button */}
      <div className="z-10 flex flex-col gap-1 my-auto">
        <div className="flex items-center justify-between">
          <span className={`font-mono font-bold tracking-widest text-zinc-100 drop-shadow-md ${compact ? "text-xs sm:text-sm" : "text-base md:text-lg"}`}>
            {formattedNumber}
          </span>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={showDetails ? "Hide Card Details" : "Show Card Details"}
          >
            {showDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className={`flex items-center gap-4 font-mono text-zinc-300 ${compact ? "text-[9px]" : "text-[10px]"}`}>
          <div>
            <span className="text-[7px] text-zinc-500 uppercase block tracking-wider">EXPIRY</span>
            <span>{showDetails ? card.expiry : "••/••"}</span>
          </div>
          <div>
            <span className="text-[7px] text-zinc-500 uppercase block tracking-wider">CVV</span>
            <span>{showDetails ? card.cvv : "•••"}</span>
          </div>
          <div className="ml-auto text-right">
            <span className="text-[7px] text-zinc-500 uppercase block tracking-wider">BALANCE</span>
            <span className="font-bold text-primary font-mono">
              {symbol}{card.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Name & Visa Brand */}
      <div className="z-10 flex items-center justify-between border-t border-white/10 pt-2 mt-0.5">
        <div className="min-w-0 pr-2">
          <span className="text-[7px] text-zinc-400 uppercase block tracking-wider">CARDHOLDER</span>
          <span className={`font-bold uppercase tracking-wider text-zinc-100 font-mono truncate block ${compact ? "text-[10px] max-w-[120px]" : "text-xs max-w-[150px]"}`}>
            {card.cardholder_name}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {showFreeze && onToggleFreeze && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => onToggleFreeze(card.id)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                card.is_frozen
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-white/10 text-zinc-200 border-white/20 hover:bg-white/20"
              }`}
            >
              {card.is_frozen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {card.is_frozen ? "Unfreeze" : "Freeze"}
            </button>
          )}
          <span className={`font-serif italic font-extrabold tracking-wider text-white ${compact ? "text-xs" : "text-sm"}`}>
            VISA
          </span>
        </div>
      </div>
    </div>
  );
}
