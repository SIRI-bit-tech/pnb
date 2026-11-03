/**
 * dashboard.ts — All dashboard-level constant arrays and configs.
 * Import everything through @/types (which re-exports this via index.ts).
 */
import {
  LayoutDashboard,
  Send,
  History,
  ArrowDownToLine,
  CreditCard,
  Settings,
  TrendingUp,
  Receipt,
  Landmark,
  Headphones,
} from "lucide-react";
import type { NavItem, QuickActionItem } from "@/types/dashboard";

// ── Navigation ────────────────────────────────────────────────
export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { label: "Home",                href: "/dashboard",              icon: LayoutDashboard, exact: true },
  { label: "Send Money",          href: "/dashboard/send-money",   icon: Send },
  { label: "Transaction History", href: "/dashboard/transactions", icon: History },
  { label: "Deposits",            href: "/dashboard/deposits",     icon: ArrowDownToLine },
  { label: "Cards",               href: "/dashboard/cards",        icon: CreditCard },
  { label: "Loans",               href: "/dashboard/loans",        icon: Landmark },
  { label: "Tax & IRS",           href: "/dashboard/tax",          icon: Landmark },
  { label: "Support",             href: "/dashboard/support",      icon: Headphones },
  { label: "Settings",            href: "/dashboard/settings",     icon: Settings },
];

// Subset for mobile bottom nav (accessible on all mobile devices)
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home",     href: "/dashboard",              icon: LayoutDashboard, exact: true },
  { label: "Send",     href: "/dashboard/send-money",   icon: Send },
  { label: "History",  href: "/dashboard/transactions", icon: History },
  { label: "Cards",    href: "/dashboard/cards",        icon: CreditCard },
  { label: "Support",  href: "/dashboard/support",      icon: Headphones },
];

// ── Page titles (used by Header) ─────────────────────────────
export const DASHBOARD_PAGE_TITLES: Record<string, string> = {
  "/dashboard":                "Overview",
  "/dashboard/send-money":     "Send Money",
  "/dashboard/transactions":   "Transaction History",
  "/dashboard/deposits":       "Deposits",
  "/dashboard/cards":          "My Cards",
  "/dashboard/loans":          "Commercial Loans",
  "/dashboard/tax":            "Tax & IRS Filing",
  "/dashboard/support":        "Priority Banking Support",
  "/dashboard/settings":       "Settings",
  "/dashboard/notifications":  "Notifications",
};

// ── Quick Actions ─────────────────────────────────────────────
export const QUICK_ACTION_CONFIG: QuickActionItem[] = [
  {
    id:         "send",
    label:      "Send Money",
    icon:       Send,
    colorClass: "bg-primary/20 text-primary-light hover:bg-primary/30",
    href:       "/dashboard/send-money",
  },
  {
    id:         "portfolio",
    label:      "Portfolio",
    icon:       TrendingUp,
    colorClass: "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
    href:       "/dashboard/portfolio",
  },
  {
    id:          "bills",
    label:       "Pay Bills",
    icon:        Receipt,
    colorClass:  "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
    comingSoon:  true,
  },
  {
    id:          "loan",
    label:       "Loan",
    icon:        Landmark,
    colorClass:  "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30",
    comingSoon:  true,
  },
];
