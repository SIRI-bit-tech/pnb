"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QUICK_ACTION_CONFIG } from "@/types";
import Modal from "@/components/Modal";
import type { QuickActionItem } from "@/types";

export default function QuickActions() {
  const router = useRouter();
  const [comingSoonAction, setComingSoonAction] = useState<string | null>(null);

  const handleActionClick = (action: QuickActionItem) => {
    if (action.comingSoon) {
      setComingSoonAction(action.label);
    } else if (action.href) {
      router.push(action.href);
    }
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-2.5 lg:gap-4">
        {QUICK_ACTION_CONFIG.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className="group flex flex-col items-center gap-3 py-4 px-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] hover:bg-white/[0.04] transition-all duration-200"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${action.colorClass}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-primary-muted group-hover:text-white transition-colors text-center leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      <Modal
        isOpen={!!comingSoonAction}
        onClose={() => setComingSoonAction(null)}
        title={comingSoonAction ?? ""}
        footer={
          <button
            onClick={() => setComingSoonAction(null)}
            className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            Got it
          </button>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl">
            🚀
          </div>
          <p className="text-sm font-semibold text-white">Coming Soon</p>
          <p className="text-xs text-primary-muted max-w-[220px] leading-relaxed">
            <strong>{comingSoonAction}</strong> features are currently being finalized.
            We will notify you as soon as this service is enabled.
          </p>
        </div>
      </Modal>
    </>
  );
}
