export interface TaxPayment {
  id: string;
  user_id: string;
  tax_year: string;
  payment_type: "1040_estimated" | "balance_due" | "extension";
  amount: number;
  source_account: string;
  status: string;
  irs_confirmation_number: string;
  created_at: string;
}

export interface TaxDocument {
  id: string;
  tax_year: string;
  document_type: "1099-INT" | "1099-DIV" | "1099-B" | "1098";
  description: string;
  total_amount: number;
  pdf_url?: string | null;
  created_at: string;
}

export interface W9Certification {
  id: string;
  ssn_last4: string;
  tax_classification: string;
  signature_name: string;
  status: string;
  updated_at: string;
}

export interface IrsRefund {
  id: string;
  user_id: string;
  refund_amount: number;
  tax_year: string;
  status: "received" | "approved" | "deposited";
  estimated_deposit_date: string;
  created_at: string;
  deposited_at?: string | null;
}

export interface TaxOverview {
  routing_number: string;
  account_number: string;
  checking_account_number?: string | null;
  savings_account_number?: string | null;
  w9?: W9Certification | null;
  refund?: IrsRefund | null;
  recent_payments: TaxPayment[];
}

export interface TaxPaymentPayload {
  tax_year: string;
  payment_type: string;
  amount: number;
  source_account: string;
}

export interface W9Payload {
  ssn_last4: string;
  tax_classification: string;
  signature_name: string;
}
