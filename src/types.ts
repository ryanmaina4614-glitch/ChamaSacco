export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId: string; // Mandatory and unique identifier of accounts
  avatarColor: string;
  totalSavings: number;
  shareBalance: number; // calculated in Ksh
  activeLoans: number; // outstanding principal + remaining interest to pay
  creditScore: number; // dynamically adjusts based on repayment behavior (300 to 850)
  joinedDate: string;
  lastContributionDate?: string;
  role?: 'chairperson' | 'secretary' | 'treasurer' | 'member';
  status?: 'approved' | 'pending' | 'rejected';
  animalIcon?: string; // Animal or nature icon identifier for visual/illiterate verification
  profilePhoto?: string; // Optional custom photo url or local symbol
}

export type TransactionType = 'savings' | 'shares' | 'repayment';
export type PaymentMethod = 'mpesa' | 'bank_wallet';

export interface SavingTransaction {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  reference: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  syncStatus?: 'firebase_synced' | 'local_only';
}

export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'repaid' | 'overdue';

export interface GuarantorPledge {
  memberId: string;
  memberName: string;
  amountPledged: number;
  status: 'pending' | 'signed' | 'declined';
}

export interface VoteWithReason {
  status: 'approve' | 'reject';
  reason: string;
  name: string;
  timestamp: string;
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  amountApplied: number;
  principal: number;
  interestRate: number; // percentage (e.g., 5 for 5%)
  durationMonths: number;
  interestType: 'flat' | 'reducing';
  installmentTrack: 'weekly' | 'bi-weekly' | 'monthly';
  status: LoanStatus;
  dateApplied: string;
  dateRepayBy: string;
  purpose: string;
  votes: { [memberId: string]: 'approve' | 'reject' }; // multi-member signature system
  votesWithReason?: { [memberId: string]: VoteWithReason }; // chairperson-treasurer reasons
  guarantors?: GuarantorPledge[]; // Guarantor pooling
  repaymentHistory: {
    amount: number;
    date: string;
    reference: string;
  }[];
}

export interface SMSMessage {
  id: string;
  phone: string;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface USSDSession {
  state: 'idle' | 'welcome' | 'checking_balance' | 'deposit_select' | 'deposit_amount' | 'loan_apply' | 'loan_confirm' | 'repay_loan_select' | 'repay_loan_amount';
  tempAmount?: number;
  tempLoanDuration?: number;
  tempLoanPurpose?: string;
  selectedLoanId?: string;
}

export interface GroupConfig {
  groupName: string;
  registrationNumber: string;
  shareRate: number; // Ksh per share (e.g. 500)
  targetContribution: number; // monthly target (e.g. 1000)
  paybillNumber: string;
  vaultBalance: number;
  penaltyType: 'flat_fine' | 'interest_hike' | 'both' | 'none';
  flatMeetingFine: number; // e.g. Ksh 200
  lateInterestHikePercentage: number; // e.g. 2% 추가
  gracePeriodDays: number; // e.g. 5 days before penalty kicks in
  description?: string; // Sacco core description (min 50 chars required on creation)
  maxMembersLimit?: number; // Capped membership capacity limit
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  postedBy: string;
  role: 'chairperson' | 'secretary' | 'treasurer' | 'member';
  timestamp: string;
  imageUrl?: string;
  fileUrl?: string;
  videoUrl?: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'document' | 'other';
  uploadedBy: string;
  role: 'chairperson' | 'secretary' | 'treasurer' | 'member';
  timestamp: string;
  url: string;
  source: 'direct' | 'announcement';
}
