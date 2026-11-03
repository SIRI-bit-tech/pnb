export interface LoanPayment {
  id: string;
  amount: number;
  principal: number;
  interest: number;
  status: string;
  payment_date: string;
}

export interface Loan {
  id: string;
  user_id: string;
  amount: number;
  term_months: number;
  interest_rate: number;
  monthly_payment: number;
  total_repayment: number;
  remaining_balance: number;
  employment_status: string;
  destination_account: string;
  status: "pending" | "approved" | "rejected" | "paid_off";
  autopay_enabled?: boolean;
  rejection_reason?: string | null;
  approved_at?: string | null;
  created_at: string;
  payments: LoanPayment[];
  paid_amount: number;
  payoff_percentage: number;
}

export interface LoanApplyPayload {
  amount: number;
  term_months: number;
  employment_status: string;
  destination_account: string;
}

export interface LoanPaymentPayload {
  amount: number;
  source_account: string;
}
