"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DASHBOARD_NAV_ITEMS } from "@/types";
import type { NavItem } from "@/types";

function isActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

import { getApiBase } from "@/lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("session_token");
    if (!token) return;
    const apiBase = getApiBase();
    fetch(`${apiBase}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setProfile(data); })
      .catch(() => {});
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "CW";

  const displayName = profile?.full_name || "Personal Account";

  return (
    <aside className="fixed top-0 left-0 h-full w-64 hidden lg:flex flex-col z-40 border-r border-white/[0.05] bg-[#101828]">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/[0.05]">
        <Link href="/dashboard" className="inline-block py-0.5">
          <div className="bg-white/95 rounded-xl px-3 py-2 shadow-sm inline-flex items-center">
            <Image
              src="/Prescott-National-Bank-logo.png"
              alt="Prescott National Bank"
              width={80}
              height={80}
              className="h-9 md:h-10 w-auto object-contain"
              priority
            />
          </div>
        </Link>
        <p className="text-[10px] text-zinc-400 mt-1 tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          Member FDIC • Online Banking
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5 overflow-y-auto">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${active
                  ? "bg-primary/[0.12] text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? "text-[#1faa6e]" : "text-zinc-500 group-hover:text-white/70"
                }`} />
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light" />}
            </Link>
          );
        })}
      </nav>

      {/* User pill */}
      <div className="px-3 pb-5 border-t border-white/[0.05] pt-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/[0.04] transition-colors cursor-default">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary-light/30 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-zinc-500 truncate">FDIC Insured</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
