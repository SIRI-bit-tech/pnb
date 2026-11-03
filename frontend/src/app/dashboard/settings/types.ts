export interface ProfileData {
  full_name: string;
  username: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  dob?: string;
  sex?: string;
  profile_image_url?: string;
  email?: string;
  phone_number?: string;
  created_at?: string;
  two_factor_enabled?: boolean;
}

export interface ProfileFormProps {
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export interface SecurityFormProps {
  currentPw: string;
  setCurrentPw: (pw: string) => void;
  newPw: string;
  setNewPw: (pw: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  twoFactorEnabled: boolean;
  onTwoFactorUpdate: (enabled: boolean) => void;
}

export interface NotificationsFormProps {
  notifPrefs: Record<string, boolean>;
  onToggle: (key: string) => Promise<void>;
}
