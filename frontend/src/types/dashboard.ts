import type { LucideIcon } from "lucide-react";

// ── Account ───────────────────────────────────────────────────
export interface Account {
  id: string;
  balance: number;
  checking_balance?: number;
  checking_account_number?: string;
  checkingAccountNumber?: string;
  savings_balance?: number;
  savings_account_number?: string;
  savingsAccountNumber?: string;
  credit_balance?: number;
  credit_account_number?: string;
  currency: "USD" | "CAD" | "GBP";
  accountNumber: string;
  routingNumber?: string;
  is_frozen?: boolean;
}

// ── Transaction ───────────────────────────────────────────────
export interface Transaction {
  id: string;
  label: string;
  amount: number;
  currency: string;
  date: string;
  type: "credit" | "debit";
  status: "completed" | "pending" | "failed";
  senderUsername?: string;
  recipientUsername?: string;
  memo?: string;
}



// ── Nav ───────────────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

// ── Quick Actions ─────────────────────────────────────────────
export interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  href?: string;
  comingSoon?: boolean;
}

// ── Virtual Card ──────────────────────────────────────────────
export interface VirtualCard {
  id: string;
  last4: string;
  expiry: string;
  status: "active" | "frozen" | "pending";
  cardType: "visa" | "mastercard";
  cardholderName: string;
}

// ── Deposit ───────────────────────────────────────────────────
export type DepositMethod = "check" | "cashapp" | "paypal";
export type DepositStatus = "pending" | "approved" | "rejected";

export interface Deposit {
  id: string;
  method: DepositMethod;
  amount: number;
  status: DepositStatus;
  submittedAt: string;
  referenceId?: string;
  notes?: string;
}

// ── Notification ──────────────────────────────────────────────
export type NotificationType = "transaction" | "security" | "system";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

// ── API response wrappers ─────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  detail: string;
}
