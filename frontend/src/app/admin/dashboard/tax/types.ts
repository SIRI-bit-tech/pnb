export interface AdminTaxPayment {
  id: string;
  user_id: string;
  user_email: string;
  applicant_name: string;
  tax_year: string;
  payment_type: string;
  amount: number;
  source_account: string;
  status: string;
  irs_confirmation_number: string;
  created_at: string;
}

export interface AdminTaxCompliance {
  verified_w9_count: number;
  total_users: number;
  w9_compliance_rate: number;
  total_federal_tax_paid: number;
  tax_year: string;
  backup_withholding_rate: string;
}
