"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Inbox, FileText, Settings, ArrowRightLeft, Landmark, X } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: any;
  exact?: boolean;
};

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/dashboard/users", label: "User Management", icon: Users },
  { href: "/admin/dashboard/accounts", label: "Accounts & Balances", icon: CreditCard },
  { href: "/admin/dashboard/cards", label: "Virtual Card Requests", icon: CreditCard },
  { href: "/admin/dashboard/loans", label: "Loan Applications", icon: Landmark },
  { href: "/admin/dashboard/tax", label: "IRS Compliance", icon: Landmark },
  { href: "/admin/dashboard/deposits", label: "Check & App Deposits", icon: FileText },
  { href: "/admin/dashboard/transactions", label: "Wire & ACH Transfers", icon: ArrowRightLeft },
  { href: "/admin/dashboard/support", label: "Support Tickets", icon: Inbox },
  { href: "/admin/dashboard/settings", label: "System Settings", icon: Settings },
];

function isActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export default function AdminSidebar({
  isOpen = false,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity duration-200 motion-reduce:transition-none ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-64 flex flex-col z-50 lg:z-40 border-r border-white/[0.05] bg-[#101828] transition-transform duration-200 ease-out motion-reduce:transition-none lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/[0.05]">
          <div className="flex items-start justify-between gap-2">
            <Link
              href="/admin/dashboard"
              onClick={onClose}
              className="inline-block py-0.5"
            >
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
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="lg:hidden p-2 -mr-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 tracking-widest uppercase font-semibold">Admin Command Center</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium ${
                  active
                    ? "bg-purple-500/[0.12] text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon 
                  className={`w-4 h-4 flex-shrink-0 ${
                    active ? "text-purple-400" : "text-zinc-500 group-hover:text-white/70"
                  }`} 
                />
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User pill */}
        <div className="px-3 pb-5 border-t border-white/[0.05] pt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/[0.04] transition-colors cursor-default">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/40 to-purple-400/30 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              SA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">System Administrator</p>
              <p className="text-[10px] text-zinc-500 truncate">Full Access</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
