export type Role = 'ADMIN' | 'MEMBER';
export type AccountState = 'ADMIN' | 'MEMBER_ACTIVE' | 'MEMBER_INACTIVE' | 'MEMBER_UNLINKED';
export type FeeStatus = 'PAID' | 'PENDING' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'OTHER';
export type ProofStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  role: Role;
  status: string;
  profileImageUrl: string | null;
  accountState: AccountState;
  membership: { gymId: string; status: MembershipStatus } | null;
}

export interface Payment {
  id: string;
  feeId: string;
  amount: string;
  paidOn: string;
  method: PaymentMethod;
  reference: string | null;
  note: string | null;
  status: 'ACTIVE' | 'VOIDED';
  recordedBy: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  billingYear?: number;
  billingMonth?: number;
  member?: { id: string; gymId: string; fullName: string };
}

export interface Fee {
  id: string;
  membershipId: string;
  billingYear: number;
  billingMonth: number;
  label: string;
  amount: string;
  status: FeeStatus;
  dueDate: string;
  paidAt: string | null;
  payment: Payment | null;
  proof?: { id: string; status: ProofStatus; rejectReason: string | null; createdAt: string } | null;
  member?: { id: string; gymId: string; fullName: string; phone?: string };
}

export interface MemberRow {
  id: string;
  gymId: string;
  fullName: string;
  phone: string;
  email: string | null;
  joinedOn: string;
  monthlyFee: string;
  status: MembershipStatus;
  plan: { id: string; name: string } | null;
  accountStatus: string | null;
  profileImageUrl: string | null;
  currentFee: { id: string; amount: string; status: FeeStatus; label: string } | null;
  outstanding: { amount: string; count: number };
}

export interface MemberDetail extends Omit<MemberRow, 'currentFee' | 'outstanding'> {
  billingStartsOn: string;
  summary: { outstandingAmount: string; pendingCount: number; paidCount: number };
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyFee: string;
  features: string[];
  isPublic: boolean;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface SiteSettings {
  general: { gymName: string; tagline: string; description: string };
  contact: { address: string; phone: string; email: string; mapUrl?: string; hours: { label: string; time: string }[] };
  social: { facebook?: string; instagram?: string; youtube?: string; twitter?: string };
  membership: { note: string };
}

export interface SiteData {
  settings: SiteSettings;
  plans: Plan[];
  faqs: { id: string; question: string; answer: string }[];
  gallery: { id: string; url: string; caption: string; category: string }[];
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProofItem {
  id: string;
  feeId: string;
  status: ProofStatus;
  method: PaymentMethod;
  reference: string | null;
  note: string | null;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  billingYear: number;
  billingMonth: number;
  label: string;
  amount: string;
  feeStatus: 'PENDING' | 'PAID';
  imageUrl: string;
  member?: { id: string; gymId: string; fullName: string; phone: string };
  reviewedBy?: string | null;
}

export interface MonthPoint {
  year: number;
  month: number;
  label: string;
  total: number;
  paid: number;
  unpaid: number;
  paidAmount: string;
  unpaidAmount: string;
}
