"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("admin_session_token");
    router.push("/admin/login");
  };

  const getHeaderInfo = () => {
    if (pathname === "/admin/dashboard") {
      return {
        title: "Overview",
        subtitle: "Real-time command center analytics for Prescott National Bank"
      };
    }
    if (pathname.startsWith("/admin/dashboard/users")) {
      return {
        title: "User Management",
        subtitle: "Manage all registered user accounts and permissions"
      };
    }
    if (pathname.startsWith("/admin/dashboard/accounts")) {
      return {
        title: "Accounts & Balances",
        subtitle: "View checking/savings details and freeze/top up accounts"
      };
    }
    if (pathname.startsWith("/admin/dashboard/deposits")) {
      return {
        title: "Check & App Deposits",
        subtitle: "Review and approve manual check or mobile app deposits"
      };
    }
    if (pathname.startsWith("/admin/dashboard/transactions")) {
      return {
        title: "Wire & ACH Transfers",
        subtitle: "Approve, confirm, or reject outbound wire and ACH ledger entries"
      };
    }
    if (pathname.startsWith("/admin/dashboard/support")) {
      return {
        title: "Support Tickets",
        subtitle: "Resolve and respond to customer support tickets"
      };
    }
    if (pathname.startsWith("/admin/dashboard/settings")) {
      return {
        title: "System Settings",
        subtitle: "Configure CashApp, PayPal tags and global settings"
      };
    }
    return {
      title: "Control Panel",
      subtitle: "System Administrator console"
    };
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 lg:px-8 lg:py-6 bg-[#f9f9ff]/80 backdrop-blur-xl border-b border-zinc-200 lg:border-none">
      {/* Mobile Menu Button - (Simplified for now) */}
      <button className="lg:hidden p-2 -ml-2 text-zinc-600 rounded-xl hover:bg-black/5 mr-2">
        <Menu className="w-5 h-5" />
      </button>

      {/* Dynamic Title / Subtitle */}
      <div className="flex flex-col flex-1 min-w-0">
        <h1 className="text-lg lg:text-xl font-heading font-bold text-zinc-950 truncate">{title}</h1>
        <p className="hidden md:block text-[11px] text-zinc-500 mt-0.5 truncate">{subtitle}</p>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3 lg:gap-4 ml-auto lg:ml-0">
        <button className="relative p-2.5 text-zinc-500 rounded-xl hover:bg-black/5 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-purple-500 rounded-full ring-2 ring-[#f9f9ff]" />
        </button>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
