import { Member, SavingTransaction, Loan, SMSMessage, GroupConfig } from './types';

export const INITIAL_GROUP_CONFIG: GroupConfig = {
  groupName: "Upendo Unity Chama",
  registrationNumber: "SHG/2024/7742",
  shareRate: 500, // 500 Ksh per share
  targetContribution: 1000, // 1000 Ksh monthly savings rate
  paybillNumber: "882882", // Upendo Paybill account
  vaultBalance: 84500, // Current cash pooled inside the physical-digital Chama vault
  penaltyType: "both",
  flatMeetingFine: 200,
  lateInterestHikePercentage: 2,
  gracePeriodDays: 5,
  description: "Upendo Unity is a community-driven self-help group focusing on progressive table-banking, micro-loans, and mutual growth.",
  maxMembersLimit: 4, // Initial capacity capped at 4 members to demonstrate "full" state immediately
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: "mem_1",
    name: "Linet Atieno",
    phone: "0711223344",
    email: "linet.atieno@upendochama.org",
    nationalId: "31829038",
    avatarColor: "bg-emerald-600",
    totalSavings: 28500,
    shareBalance: 15000, // 30 shares
    activeLoans: 12600, // Loan outstanding (12000 principal + 600 interest)
    creditScore: 810,
    joinedDate: "2024-01-10",
    lastContributionDate: "2026-05-15",
    role: "chairperson",
    status: "approved"
  },
  {
    id: "mem_2",
    name: "David Kamau",
    phone: "0722334455",
    email: "david.kamau@upendochama.org",
    nationalId: "28491029",
    avatarColor: "bg-blue-600",
    totalSavings: 35000,
    shareBalance: 25000, // 50 shares
    activeLoans: 0,
    creditScore: 840,
    joinedDate: "2024-01-12",
    lastContributionDate: "2026-05-18",
    role: "treasurer",
    status: "approved"
  },
  {
    id: "mem_3",
    name: "Grace Mwangi",
    phone: "0733445566",
    email: "grace.mwangi@upendochama.org",
    nationalId: "34829103",
    avatarColor: "bg-indigo-600",
    totalSavings: 18000,
    shareBalance: 10000, // 20 shares
    activeLoans: 0,
    creditScore: 785,
    joinedDate: "2024-02-05",
    lastContributionDate: "2026-05-12",
    role: "secretary",
    status: "approved"
  },
  {
    id: "mem_4",
    name: "Ezra Korir",
    phone: "0744556677",
    email: "ezra.korir@upendochama.org",
    nationalId: "29482038",
    avatarColor: "bg-amber-600",
    totalSavings: 11000,
    shareBalance: 5000, // 10 shares
    activeLoans: 4200, // Initial small loan (4000 principal + 200 interest)
    creditScore: 710,
    joinedDate: "2024-03-20",
    lastContributionDate: "2026-05-20",
    role: "member",
    status: "approved"
  }
];

export const INITIAL_LOANS: Loan[] = [
  {
    id: "loan_1",
    memberId: "mem_1",
    memberName: "Linet Atieno",
    amountApplied: 15000,
    principal: 15000,
    interestRate: 5, // 5%
    durationMonths: 3,
    interestType: "flat",
    installmentTrack: "monthly",
    status: "approved",
    dateApplied: "2026-04-01",
    dateRepayBy: "2026-07-01",
    purpose: "Purchasing hybrid farming seeds & organic fertilizer",
    votes: {
      "mem_2": "approve",
      "mem_3": "approve",
      "mem_4": "approve"
    },
    guarantors: [],
    repaymentHistory: [
      {
        amount: 3150,
        date: "2026-05-01",
        reference: "MPESA_HP928FK2"
      }
    ]
  },
  {
    id: "loan_2",
    memberId: "mem_4",
    memberName: "Ezra Korir",
    amountApplied: 8000,
    principal: 8000,
    interestRate: 5,
    durationMonths: 2,
    interestType: "reducing",
    installmentTrack: "monthly",
    status: "pending",
    dateApplied: "2026-06-01",
    dateRepayBy: "2026-08-01",
    purpose: "Restocking dual-sim phones inventory list for retail shop",
    votes: {
      "mem_1": "approve", // Has approval signature from Chairperson
    },
    guarantors: [
      {
        memberId: "mem_2",
        memberName: "David Kamau",
        amountPledged: 4000,
        status: "signed"
      }
    ],
    repaymentHistory: []
  }
];

export const INITIAL_TRANSACTIONS: SavingTransaction[] = [
  {
    id: "tx_101",
    memberId: "mem_1",
    memberName: "Linet Atieno",
    amount: 1000,
    type: "savings",
    paymentMethod: "mpesa",
    reference: "MPESA_TXF4109K",
    timestamp: "2026-05-15 09:14:22",
    status: "completed"
  },
  {
    id: "tx_102",
    memberId: "mem_2",
    memberName: "David Kamau",
    amount: 2500,
    type: "shares",
    paymentMethod: "mpesa",
    reference: "MPESA_TXB8820G",
    timestamp: "2026-05-18 14:10:05",
    status: "completed"
  },
  {
    id: "tx_103",
    memberId: "mem_3",
    memberName: "Grace Mwangi",
    amount: 1000,
    type: "savings",
    paymentMethod: "bank_wallet",
    reference: "BANK_BP820389N",
    timestamp: "2026-05-12 11:42:00",
    status: "completed"
  },
  {
    id: "tx_104",
    memberId: "mem_4",
    memberName: "Ezra Korir",
    amount: 1000,
    type: "savings",
    paymentMethod: "mpesa",
    reference: "MPESA_TXC9291V",
    timestamp: "2026-05-20 16:30:12",
    status: "completed"
  },
  {
    id: "tx_105",
    memberId: "mem_1",
    memberName: "Linet Atieno",
    amount: 3150,
    type: "repayment",
    paymentMethod: "mpesa",
    reference: "MPESA_HP928FK2",
    timestamp: "2026-05-01 10:05:00",
    status: "completed"
  }
];

export const INITIAL_SMS: SMSMessage[] = [
  {
    id: "sms_1",
    phone: "0711223344",
    sender: "UPENDO_CM",
    content: "M-PESA Confirmed. Received Ksh 1,000 for Savings in Upendo Unity Chama. Your cumulative savings is Ksh 28,500. Reference: MPESA_TXF4109K.",
    timestamp: "2026-05-15 09:15:00",
    isRead: false
  },
  {
    id: "sms_2",
    phone: "0711223344",
    sender: "UPENDO_CM",
    content: "REMINDER: Your microloan repayment of Ksh 4,200 is due on 2026-06-01. Please make prompt repayment to maintain your premium 810 credit rating.",
    timestamp: "2026-05-25 08:30:00",
    isRead: false
  }
];
