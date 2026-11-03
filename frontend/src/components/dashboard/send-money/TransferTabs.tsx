"use client";

import React from "react";

interface TransferTabsProps {
  activeTab: "p2p" | "external";
  setActiveTab: (tab: "p2p" | "external") => void;
  onTabChange?: () => void;
}

export default function TransferTabs({
  activeTab,
  setActiveTab,
  onTabChange,
}: TransferTabsProps) {
  return (
    <div className="flex rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
      <button
        onClick={() => {
          setActiveTab("p2p");
          if (onTabChange) onTabChange();
        }}
        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
          activeTab === "p2p"
            ? "bg-white/10 text-white"
            : "text-primary-muted hover:text-white"
        }`}
      >
        Prescott National Bank User
      </button>
      <button
        onClick={() => {
          setActiveTab("external");
          if (onTabChange) onTabChange();
        }}
        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
          activeTab === "external"
            ? "bg-white/10 text-white"
            : "text-primary-muted hover:text-white"
        }`}
      >
        External Bank
      </button>
    </div>
  );
}
