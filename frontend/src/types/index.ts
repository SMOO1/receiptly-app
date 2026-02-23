// Receiptly App Types
// @author Zidane Virani

export interface Receipt {
  id: string;
  created_at: string;
  user_id: string;
  vendor: string;
  date: string;
  total: number;
  image_url: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface DashboardStats {
  totalSpent: number;
  receiptCount: number;
  avgPerReceipt: number;
  topVendor: string;
  monthlySpent: number;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  ReviewReceipt: { receipt?: Receipt; imageUri?: string };
  TransactionDetail: { receipt: Receipt };
};

export type AuthStackParamList = {
  Login: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Scan: undefined;
  Settings: undefined;
};
