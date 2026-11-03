"use client";

import React from "react";
import { NotificationsFormProps } from "./types";

export default function NotificationsForm({
  notifPrefs,
  onToggle
}: NotificationsFormProps) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-sm text-zinc-800">
      {Object.keys(notifPrefs)
        .filter((k) => k !== "id" && k !== "user_id")
        .map((k) => (
          <label 
            key={k} 
            className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0 cursor-pointer group"
          >
            <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-950 capitalize">
              {k.replace("_", " ")}
            </span>
            <input 
              type="checkbox" 
              checked={!!notifPrefs[k]} 
              onChange={() => onToggle(k)} 
              className="w-4 h-4 rounded border-zinc-300 bg-zinc-50 text-primary focus:ring-1 focus:ring-primary accent-[#1faa6e]" 
            />
          </label>
        ))}
    </div>
  );
}
