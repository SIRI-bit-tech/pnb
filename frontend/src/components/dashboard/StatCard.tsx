import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  subtext?: string;
}

export default function StatCard({ label, value, trend, subtext }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <p className="text-[10px] uppercase tracking-widest text-primary-muted font-bold">{label}</p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xl font-bold text-white">{value}</span>
        {trend === "up" && <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />}
        {trend === "down" && <TrendingDown className="w-4 h-4 text-error flex-shrink-0" />}
      </div>
      {subtext && <p className="text-[10px] text-primary-muted">{subtext}</p>}
    </div>
  );
}
