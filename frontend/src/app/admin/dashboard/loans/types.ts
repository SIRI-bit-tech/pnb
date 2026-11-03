export interface AdminLoanRequest {
  id: string;
  user_id: string;
  user_email: string;
  applicant_name: string;
  amount: number;
  term_months: number;
  interest_rate: number;
  monthly_payment: number;
  total_repayment: number;
  remaining_balance: number;
  employment_status: string;
  destination_account: string;
  status: "pending" | "approved" | "rejected" | "paid_off";
  rejection_reason?: string | null;
  created_at: string;
  approved_at?: string | null;
}
