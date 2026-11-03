"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/types";
import type { NavItem } from "@/types";

function isActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] border-t border-zinc-200/80 bg-white/80 backdrop-blur-md shadow-lg pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          const Icon   = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-0"
            >
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  active ? "bg-primary/10" : "bg-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-all duration-200 ${
                    active ? "text-primary scale-105" : "text-zinc-400 hover:text-zinc-600"
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-bold tracking-wide transition-colors duration-200 ${
                  active ? "text-primary" : "text-zinc-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
