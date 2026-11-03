export interface RecipientUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export interface AccountBalances {
  checking_balance: number;
  savings_balance: number;
  checkingAccountNumber?: string;
  savingsAccountNumber?: string;
}

export interface P2PTransferSectionProps {
  username: string;
  setUsername: (username: string) => void;
  searchResults: RecipientUser[];
  setSearchResults: (results: RecipientUser[]) => void;
  selectedUser: RecipientUser | null;
  setSelectedUser: (user: RecipientUser | null) => void;
}

export interface ExternalTransferSectionProps {
  transferType: "ach" | "wire";
  setTransferType: (type: "ach" | "wire") => void;
  routingNum: string;
  setRoutingNum: (num: string) => void;
  accountNum: string;
  setAccountNum: (num: string) => void;
  bankName: string;
  setBankName: (name: string) => void;
  accountName: string;
  setAccountName: (name: string) => void;
  routingError: string;
  setRoutingError: (err: string) => void;
  routingStatus: "idle" | "success" | "error";
  setRoutingStatus: (status: "idle" | "success" | "error") => void;
  checkingRouting: boolean;
  setCheckingRouting: (checking: boolean) => void;
  bankSuggestions: string[];
  setBankSuggestions: (suggestions: string[]) => void;
  isBankNameManual: boolean;
  setIsBankNameManual: (manual: boolean) => void;
}

export interface InternationalTransferSectionProps {
  beneficiaryName: string;
  setBeneficiaryName: (name: string) => void;
  beneficiaryAddress: string;
  setBeneficiaryAddress: (address: string) => void;
  beneficiaryCountry: string;
  setBeneficiaryCountry: (country: string) => void;
  ibanOrAccount: string;
  setIbanOrAccount: (val: string) => void;
  swiftBic: string;
  setSwiftBic: (swift: string) => void;
  bankName: string;
  setBankName: (name: string) => void;
  bankCity: string;
  setBankCity: (city: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
}

export interface FromAccountCardSelectProps {
  fromAccountType: "checking" | "savings";
  setFromAccountType: (type: "checking" | "savings") => void;
  accountBalances: AccountBalances | null;
}

export interface TransferDetailsCardProps {
  amount: string;
  setAmount: (amt: string) => void;
  memo: string;
  setMemo: (memo: string) => void;
  timing: "now" | "schedule";
  setTiming: (timing: "now" | "schedule") => void;
  onReview: () => void;
  disabled: boolean;
  fee?: number;
  transferTypeLabel?: string;
}

export interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  pin: string;
  setPin: (pin: string) => void;
  onConfirm: () => void;
  loading: boolean;
}
