export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone_number: string;
  country: "US" | "CA" | "UK";
  state: string;
  city: string;
  zip_code: string;
  role: "user" | "admin";
  currency: "USD" | "CAD" | "GBP";
  is_verified: boolean;
  profile_image_url?: string;
}

export interface AuthResponse {
  message: string;
  email: string;
  phone_number?: string;
  is_verified?: boolean;
  has_pin?: boolean;
  access_token?: string | null;
  token_type?: string | null;
}

export interface FormError {
  field?: string;
  message: string;
}
