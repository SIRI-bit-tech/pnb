export interface ExternalTransferRequest {
  type: "ach" | "wire";
  routing_number: string;
  account_number: string;
  bank_name: string;
  amount: number;
  memo?: string;
  pin: string;
}

export interface RoutingVerifyResponse {
  valid: boolean;
  bank_name?: string;
  error?: string;
}

export interface RecipientUser {
  username: string;
  full_name: string;
}
