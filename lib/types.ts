export interface Plan {
  id: string;
  name: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  totalSeats: number;
  occupiedSeats: number;
  priceUSD: number;
  status: "active" | "expired" | "upcoming";
  createdAt: string;
}

export interface Member {
  id: string;
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  planId: string;
  planName: string;
  joinDate: string;
  expiryDate: string;
  status: "active" | "expired" | "pending";
  heardAboutUs: string;
  emailToAdd: string; // Email to add to the Claude team plan
  payments: PaymentRef[];
  createdAt: string;
}

export interface PaymentRef {
  paymentId: string;
  amount: number;
  date: string;
  type: "join" | "renewal" | "new_plan";
}

export interface Payment {
  id: string;
  reference: string;
  memberEmail: string;
  memberUid?: string;
  planId: string;
  amount: number;
  type: "join" | "renewal" | "new_plan";
  status: "pending" | "complete" | "failed" | "cancelled";
  notchPayRef?: string;
  heardAboutUs?: string;
  emailToAdd?: string;
  displayName?: string;
  paidAt?: string;
  webhookVerified: boolean;
  createdAt: string;
}

export interface WaitingEntry {
  id: string;
  email: string;
  displayName: string;
  uid: string;
  amount: number;
  paymentRef?: string;
  status: "waiting" | "plan_created" | "refunded";
  createdAt: string;
}

export interface PricingConfig {
  baseCostFCFA: number;      // 18500 — what Anthropic charges (FCFA equiv)
  marginFCFA: number;        // 2000
  notchPayFeePercent: number; // 0.02
  fullPriceFCFA: number;     // computed: (baseCost + margin) * (1 + fee) ≈ 21000
  currency: string;          // XAF
}

export interface AdminUser {
  email: string;
  role: "superadmin" | "admin";
  pinHash?: string;
  createdAt: string;
}
