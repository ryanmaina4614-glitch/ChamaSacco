import React, { useState, useEffect } from 'react';
import { GroupConfig, Member, SavingTransaction, Loan, SMSMessage, Announcement, DocumentFile } from './types';
import {
  INITIAL_GROUP_CONFIG,
  INITIAL_MEMBERS,
  INITIAL_TRANSACTIONS,
  INITIAL_LOANS,
  INITIAL_SMS
} from './sampleData';

import DashboardStats from './components/DashboardStats';
import MemberSection from './components/MemberSection';
import LoanGovernance from './components/LoanGovernance';
import PhoneSimulator from './components/PhoneSimulator';
import LandingAndAuth from './components/LandingAndAuth';

import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  BadgePercent, 
  Smartphone,
  Info,
  CloudLightning,
  LogOut,
  Building2,
  Coins,
  Scale,
  Calendar,
  MessageSquare,
  FolderOpen,
  TrendingUp,
  Sliders,
  User,
  DollarSign,
  Menu,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

import { onSnapshot } from 'firebase/firestore';
import { 
  testConnection,
  seedInitialDataIfNeeded, 
  saveGroupAttributes, 
  saveMember, 
  saveTransaction, 
  saveLoan, 
  saveSMSMessage, 
  resetFirestoreDatabase,
  getGroupDocRef,
  getMembersColRef,
  getTransactionsColRef,
  getLoansColRef,
  getSmsColRef,
  getAnnouncementsColRef,
  getDocumentsColRef,
  saveAnnouncement,
  saveDocumentFile,
  OperationType,
  handleFirestoreError
} from './lib/chamaService';


export default function App() {
  // Authentication & Group Navigation states
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Navigation: arbitrary tab ID triggers
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Core synchronized persistent states
  const [groupConfig, setGroupConfig] = useState<GroupConfig>(INITIAL_GROUP_CONFIG);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [transactions, setTransactions] = useState<SavingTransaction[]>(INITIAL_TRANSACTIONS);
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>(INITIAL_SMS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);

  const [investments, setInvestments] = useState<any[]>(() => {
    const saved = localStorage.getItem('chama_investments');
    return saved ? JSON.parse(saved) : [
      { id: 'inv_1', name: "Kajiado East Land Plot #44", category: "Real Estate", value: 1200000, yield: "+12.4% over 1yr" },
      { id: 'inv_2', name: "Kenya Treasury Bond FXD1/2026/10Yr", category: "Government Securities", value: 450000, yield: "14.2% Fixed Coupon" },
      { id: 'inv_3', name: "Safaricom PLC Shared Portfolio (15k Units)", category: "Equities", value: 330000, yield: "Dividend Yield Tracked" },
    ];
  });
  useEffect(() => {
    localStorage.setItem('chama_investments', JSON.stringify(investments));
  }, [investments]);

  const [events, setEvents] = useState<any[]>(() => {
    const saved = localStorage.getItem('chama_events');
    return saved ? JSON.parse(saved) : [
      { id: 'evt_1', title: "Monthly Contribution Cycle Review", date: "2026-06-15", time: "14:00", location: "Upendo Unity Hall & Zoom", description: "Standard cycle table banking rotation round" },
      { id: 'evt_2', title: "Bi-Weekly Executive Board Assessment", date: "2026-06-18", time: "18:30", location: "Board Room Room 4B", description: "Consensus loan review for pending applications" }
    ];
  });
  useEffect(() => {
    localStorage.setItem('chama_events', JSON.stringify(events));
  }, [events]);

  // Time Machine Simulation state
  const [currentSimDate, setCurrentSimDate] = useState<string>("2026-06-09");
  
  // Selected Member phone simulation target
  const [activeMemberId, setActiveMemberId] = useState<string>("mem_1");

  // Global theme switcher ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Firebase/Safaricom connection states
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSimulation, setShowSimulation] = useState<boolean>(false);

  // Load state on mount / setup Firebase seeding
  useEffect(() => {
    // Initial verification
    testConnection();

    // Cold-boot from local storage fallback
    const savedGroupId = localStorage.getItem('chama_active_group_id');
    const savedLoggedIn = localStorage.getItem('chama_is_logged_in');
    const savedConfig = localStorage.getItem('chama_group_config');
    const savedMembers = localStorage.getItem('chama_members');
    const savedTransactions = localStorage.getItem('chama_transactions');
    const savedLoans = localStorage.getItem('chama_loans');
    const savedSms = localStorage.getItem('chama_sms');
    const savedAnnouncements = localStorage.getItem('chama_announcements');
    const savedDocuments = localStorage.getItem('chama_documents');
    const savedDate = localStorage.getItem('chama_sim_date');
    const savedActiveMember = localStorage.getItem('chama_active_member_id');
    const savedOnline = localStorage.getItem('chama_is_online');

    if (savedGroupId) setActiveGroupId(savedGroupId);
    if (savedLoggedIn) setIsLoggedIn(savedLoggedIn === 'true');
    if (savedConfig) setGroupConfig(JSON.parse(savedConfig));
    if (savedMembers) setMembers(JSON.parse(savedMembers));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedLoans) setLoans(JSON.parse(savedLoans));
    if (savedSms) setSmsMessages(JSON.parse(savedSms));
    if (savedAnnouncements) setAnnouncements(JSON.parse(savedAnnouncements));
    if (savedDocuments) setDocuments(JSON.parse(savedDocuments));
    if (savedDate) setCurrentSimDate(savedDate);
    if (savedActiveMember) setActiveMemberId(savedActiveMember);
    if (savedOnline !== null) setIsOnline(savedOnline === 'true');

    // Seed database if online and group has been selected
    if (isOnline && savedGroupId) {
      seedInitialDataIfNeeded(savedGroupId);
    }
  }, [isOnline]);

  // Real-time Firestore snapshot listeners
  useEffect(() => {
    if (!isOnline || !activeGroupId) return;

    const dynamicGroupRef = getGroupDocRef(activeGroupId);
    const dynamicMembersColRef = getMembersColRef(activeGroupId);
    const dynamicTransactionsColRef = getTransactionsColRef(activeGroupId);
    const dynamicLoansColRef = getLoansColRef(activeGroupId);
    const dynamicSmsColRef = getSmsColRef(activeGroupId);

    // 1. Group config doc listener
    const unsubGroup = onSnapshot(dynamicGroupRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGroupConfig({
          groupName: data.groupName || INITIAL_GROUP_CONFIG.groupName,
          registrationNumber: data.registrationNumber || INITIAL_GROUP_CONFIG.registrationNumber,
          shareRate: data.shareRate || INITIAL_GROUP_CONFIG.shareRate,
          targetContribution: data.targetContribution || INITIAL_GROUP_CONFIG.targetContribution,
          paybillNumber: data.paybillNumber || INITIAL_GROUP_CONFIG.paybillNumber,
          vaultBalance: data.vaultBalance !== undefined ? data.vaultBalance : INITIAL_GROUP_CONFIG.vaultBalance,
          penaltyType: data.penaltyType || INITIAL_GROUP_CONFIG.penaltyType,
          flatMeetingFine: data.flatMeetingFine !== undefined ? data.flatMeetingFine : INITIAL_GROUP_CONFIG.flatMeetingFine,
          lateInterestHikePercentage: data.lateInterestHikePercentage !== undefined ? data.lateInterestHikePercentage : INITIAL_GROUP_CONFIG.lateInterestHikePercentage,
          gracePeriodDays: data.gracePeriodDays !== undefined ? data.gracePeriodDays : INITIAL_GROUP_CONFIG.gracePeriodDays,
        });
        if (data.currentSimDate) setCurrentSimDate(data.currentSimDate);
        if (data.activeMemberId) setActiveMemberId(data.activeMemberId);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `groups/${activeGroupId}`);
    });

    // 2. Members subcollection listener
    const unsubMembers = onSnapshot(dynamicMembersColRef, (snap) => {
      const ms: Member[] = [];
      snap.forEach((doc) => {
        ms.push(doc.data() as Member);
      });
      ms.sort((a, b) => a.id.localeCompare(b.id));
      if (ms.length > 0) setMembers(ms);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `groups/${activeGroupId}/members`);
    });

    // 3. Transactions subcollection listener
    const unsubTransactions = onSnapshot(dynamicTransactionsColRef, (snap) => {
      const txs: SavingTransaction[] = [];
      snap.forEach((doc) => {
        txs.push(doc.data() as SavingTransaction);
      });
      txs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      if (txs.length > 0) setTransactions(txs);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `groups/${activeGroupId}/transactions`);
    });

    // 4. Loans subcollection listener
    const unsubLoans = onSnapshot(dynamicLoansColRef, (snap) => {
      const ls: Loan[] = [];
      snap.forEach((doc) => {
        ls.push(doc.data() as Loan);
      });
      ls.sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
      if (ls.length > 0) setLoans(ls);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `groups/${activeGroupId}/loans`);
    });

    // 5. SMS Messages subcollection listener
    const unsubSms = onSnapshot(dynamicSmsColRef, (snap) => {
      const smsList: SMSMessage[] = [];
      snap.forEach((doc) => {
        smsList.push(doc.data() as SMSMessage);
      });
      smsList.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      if (smsList.length > 0) setSmsMessages(smsList);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `groups/${activeGroupId}/smsMessages`);
    });

    // 6. Announcements subcollection listener
    const dynamicAnnRef = getAnnouncementsColRef(activeGroupId);
    const unsubAnnouncements = onSnapshot(dynamicAnnRef, (snap) => {
      const anns: Announcement[] = [];
      snap.forEach((doc) => {
        anns.push(doc.data() as Announcement);
      });
      anns.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setAnnouncements(anns);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `groups/${activeGroupId}/announcements`);
    });

    // 7. Documents subcollection listener
    const dynamicDocRef = getDocumentsColRef(activeGroupId);
    const unsubDocuments = onSnapshot(dynamicDocRef, (snap) => {
      const docsList: DocumentFile[] = [];
      snap.forEach((doc) => {
        docsList.push(doc.data() as DocumentFile);
      });
      docsList.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setDocuments(docsList);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `groups/${activeGroupId}/documents`);
    });

    return () => {
      unsubGroup();
      unsubMembers();
      unsubTransactions();
      unsubLoans();
      unsubSms();
      unsubAnnouncements();
      unsubDocuments();
    };
  }, [isOnline, activeGroupId]);

  // Save state to LocalStorage (offline caching)
  useEffect(() => {
    localStorage.setItem('chama_group_config', JSON.stringify(groupConfig));
    localStorage.setItem('chama_members', JSON.stringify(members));
    localStorage.setItem('chama_transactions', JSON.stringify(transactions));
    localStorage.setItem('chama_loans', JSON.stringify(loans));
    localStorage.setItem('chama_sms', JSON.stringify(smsMessages));
    localStorage.setItem('chama_announcements', JSON.stringify(announcements));
    localStorage.setItem('chama_documents', JSON.stringify(documents));
    localStorage.setItem('chama_sim_date', currentSimDate);
    localStorage.setItem('chama_active_member_id', activeMemberId);
    localStorage.setItem('chama_is_online', isOnline ? 'true' : 'false');
    if (activeGroupId) {
      localStorage.setItem('chama_active_group_id', activeGroupId);
    } else {
      localStorage.removeItem('chama_active_group_id');
    }
    localStorage.setItem('chama_is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [groupConfig, members, transactions, loans, smsMessages, announcements, documents, currentSimDate, activeMemberId, isOnline, activeGroupId, isLoggedIn]);

  // Handler to sync pending transactions and states with real Google Firestore
  const handleSyncWithFirebase = async () => {
    if (!isOnline) {
      alert("Cannot synchronize: Phone signal is offline. Hook onto active cellular network first!");
      return;
    }
    const groupId = activeGroupId || 'upendo_unity';
    setIsSyncing(true);

    try {
      // 1. Sync group configuration
      await saveGroupAttributes(groupId, {
        ...groupConfig,
        currentSimDate,
        activeMemberId
      });

      // 2. Sync members
      for (const m of members) {
        await saveMember(groupId, m);
      }

      // 3. Sync transactions (marking outstanding as synced)
      const syncedTx = transactions.map(t => ({
        ...t,
        syncStatus: 'firebase_synced' as const
      }));
      for (const t of syncedTx) {
        await saveTransaction(groupId, t);
      }
      setTransactions(syncedTx);

      // 4. Sync loans
      for (const l of loans) {
        await saveLoan(groupId, l);
      }

      // 5. Sync sms messages
      for (const sms of smsMessages) {
        await saveSMSMessage(groupId, sms);
      }

      // 6. Generate confirmation text
      const syncSms: SMSMessage = {
        id: 'sms_sync_' + Date.now().toString().slice(-4),
        phone: currentMember.phone,
        sender: "SYSTEM_CM",
        content: `Firebase Node Live: Auto-sync pushed transaction payloads to Google Firestore database safely. Ledger status: 100% cloud backup completed.`,
        timestamp: currentSimDate + " " + new Date().toTimeString().split(' ')[0],
        isRead: false
      };
      setSmsMessages(prev => [syncSms, ...prev]);
      await saveSMSMessage(groupId, syncSms);

      setIsSyncing(false);
      alert("Firebase Cloud Backup: All offline ledger collections successfully synchronized with Google Firestore database!");
    } catch (e) {
      setIsSyncing(false);
      alert("Synchronization warning: Check network stability or configuration parameters. Error: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  // Find currently active simulation member
  const currentMember = members.find(m => m.id === activeMemberId) || members[0] || INITIAL_MEMBERS[0];

  // Reset to original seed levels
  const handleResetDatabase = async () => {
    if (window.confirm("Are you sure you want to reset the Chama database? All simulated payments and loans will be restored to seed levels.")) {
      if (isOnline) {
        setIsSyncing(true);
        await resetFirestoreDatabase();
        setIsSyncing(false);
        alert("Firestore database and local cache successfully reset and re-seeded starting index!");
      } else {
        setGroupConfig(INITIAL_GROUP_CONFIG);
        setMembers(INITIAL_MEMBERS);
        setTransactions(INITIAL_TRANSACTIONS);
        setLoans(INITIAL_LOANS);
        setSmsMessages(INITIAL_SMS);
        setCurrentSimDate("2026-06-09");
        setActiveMemberId("mem_1");
        alert("Local cache reset to default initial seed states!");
      }
    }
  };


  // Switch phone profile selection
  const handleSelectMember = (memberId: string) => {
    setActiveMemberId(memberId);
  };

  // Approve a pending member (Chairperson administrative role action)
  const handleApproveMember = async (memberId: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updated = { ...m, status: 'approved' as const };
        if (isOnline) {
          saveMember(activeGroupId || 'upendo_unity', updated);
        }
        return updated;
      }
      return m;
    }));

    // Generate simulated confirmation SMS on the network
    const approvedMember = members.find(m => m.id === memberId);
    if (approvedMember) {
      const welcomeSMS: SMSMessage = {
        id: 'sms_approve_' + Date.now().toString().slice(-6),
        phone: approvedMember.phone,
        sender: "CHAMA_BOARD",
        content: `CONGRATULATIONS: Your join request for ${groupConfig.groupName} was approved by Chairperson ${currentMember.name}. Welcome to our cooperative!`,
        timestamp: currentSimDate + " " + new Date().toTimeString().split(' ')[0],
        isRead: false
      };
      setSmsMessages(prev => [welcomeSMS, ...prev]);
      if (isOnline) {
        await saveSMSMessage(activeGroupId || 'upendo_unity', welcomeSMS);
      }
    }
  };

  // Reject a pending member (Chairperson administrative role action)
  const handleRejectMember = async (memberId: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updated = { ...m, status: 'rejected' as const };
        if (isOnline) {
          saveMember(activeGroupId || 'upendo_unity', updated);
        }
        return updated;
      }
      return m;
    }));

    // Generate feedback SMS
    const rejectedMember = members.find(m => m.id === memberId);
    if (rejectedMember) {
      const rejectSMS: SMSMessage = {
        id: 'sms_reject_' + Date.now().toString().slice(-6),
        phone: rejectedMember.phone,
        sender: "CHAMA_BOARD",
        content: `MEMBERSHIP FEEDBACK: Your request to join ${groupConfig.groupName} was declined by the Board of Directors. Please reach out to the chairperson for any enquiries.`,
        timestamp: currentSimDate + " " + new Date().toTimeString().split(' ')[0],
        isRead: false
      };
      setSmsMessages(prev => [rejectSMS, ...prev]);
      if (isOnline) {
        await saveSMSMessage(activeGroupId || 'upendo_unity', rejectSMS);
      }
    }
  };

  // Assign role (Chairperson administrative role action)
  const handleAssignRole = async (memberId: string, role: 'chairperson' | 'secretary' | 'treasurer' | 'member') => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const updated = { ...m, role };
        if (isOnline) {
          saveMember(activeGroupId || 'upendo_unity', updated);
        }
        return updated;
      }
      return m;
    }));

    // Generate role update SMS
    const targetMemberObj = members.find(m => m.id === memberId);
    if (targetMemberObj) {
      const newRoleTitle = role.charAt(0).toUpperCase() + role.slice(1);
      const roleSMS: SMSMessage = {
        id: 'sms_role_' + Date.now().toString().slice(-6),
        phone: targetMemberObj.phone,
        sender: "CHAMA_BOARD",
        content: `OFFICIAL CORRESPONDENCE: You have been appointed as the ${newRoleTitle} of ${groupConfig.groupName} by Chairperson ${currentMember.name}. Leadership roles updated.`,
        timestamp: currentSimDate + " " + new Date().toTimeString().split(' ')[0],
        isRead: false
      };
      setSmsMessages(prev => [roleSMS, ...prev]);
      if (isOnline) {
        await saveSMSMessage(activeGroupId || 'upendo_unity', roleSMS);
      }
    }
  };

  // Add transaction (triggered by Simulated Wallet PIN authorize or direct dashboard deposit)
  const handleAddTransaction = (newTx: Omit<SavingTransaction, 'id' | 'timestamp' | 'reference' | 'status'>) => {
    const randomRef = 'MPESA_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = currentSimDate + " " + new Date().toTimeString().split(' ')[0];
    const txId = 'tx_' + Date.now().toString().slice(-6);

    const transaction: SavingTransaction = {
      ...newTx,
      id: txId,
      reference: randomRef,
      timestamp,
      status: 'completed',
      syncStatus: isOnline ? 'firebase_synced' : 'local_only'
    };

    // 1. Update general transactions historical stack
    setTransactions(prev => [transaction, ...prev]);

    // 2. Adjust target member holdings (Savings or Shares)
    const targetMember = members.find(m => m.id === transaction.memberId) || currentMember;
    const totalSavings = transaction.type === 'savings' ? targetMember.totalSavings + transaction.amount : targetMember.totalSavings;
    const shareBalance = transaction.type === 'shares' ? targetMember.shareBalance + transaction.amount : targetMember.shareBalance;
    const updatedMember: Member = {
      ...targetMember,
      totalSavings,
      shareBalance,
      lastContributionDate: currentSimDate
    };

    setMembers(prev => prev.map(m => m.id === transaction.memberId ? updatedMember : m));

    // 3. Increment group pooled reserves
    setGroupConfig(prev => ({
      ...prev,
      vaultBalance: prev.vaultBalance + transaction.amount
    }));

    // 4. Send automated SMS Alert
    const typeLabel = transaction.type === 'savings' ? 'Savings Vault' : 'Equity Shares';
    const totalLabel = transaction.type === 'savings' ? totalSavings : shareBalance;

    const confirmationSMS: SMSMessage = {
      id: 'sms_' + Date.now().toString().slice(-6),
      phone: targetMember.phone,
      sender: "UPENDO_CM",
      content: `M-PESA Confirmed. Ksh ${transaction.amount.toLocaleString()} credited to your Upendo ${typeLabel} account. Total: Ksh ${totalLabel.toLocaleString()}. Ref: ${randomRef}.`,
      timestamp,
      isRead: false
    };

    setSmsMessages(prev => [confirmationSMS, ...prev]);

    // Firestore Sync
    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveTransaction(gId, transaction);
      saveMember(gId, updatedMember);
      saveGroupAttributes(gId, { vaultBalance: groupConfig.vaultBalance + transaction.amount });
      saveSMSMessage(gId, confirmationSMS);
    }
  };

  // Handle USSD Applied Loan requests (direct from Phone simulator)
  const handleApplyLoanUSSD = (amount: number, duration: number, purpose: string) => {
    const loanId = 'loan_' + Date.now().toString().slice(-6);
    const dateApplied = currentSimDate;
    
    // Add 3 months repay date
    const parts = currentSimDate.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]) + duration;
    if (month > 12) {
      month -= 12;
      year += 1;
    }
    const dateRepayBy = `${year}-${month.toString().padStart(2, '0')}-${parts[2]}`;

    const newLoan: Loan = {
      id: loanId,
      memberId: currentMember.id,
      memberName: currentMember.name,
      amountApplied: amount,
      principal: amount,
      interestRate: 5, // 5% flat/reducing base rate
      durationMonths: duration,
      interestType: 'flat',
      installmentTrack: 'monthly',
      purpose,
      status: 'pending',
      dateApplied,
      dateRepayBy,
      votes: {},
      guarantors: [],
      repaymentHistory: []
    };

    setLoans(prev => [newLoan, ...prev]);

    // Alert applicant about submission status
    const notifySMS: SMSMessage = {
      id: 'sms_alert_' + Date.now().toString().slice(-6),
      phone: currentMember.phone,
      sender: "UPENDO_CM",
      content: `Upendo Security Alert: Your loan request of Ksh ${amount.toLocaleString()} was successfully recorded. Awaiting executive signature consensus before disbursement.`,
      timestamp: currentSimDate + " 12:00:00",
      isRead: false
    };

    setSmsMessages(prev => [notifySMS, ...prev]);

    // Firestore Sync
    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveLoan(gId, newLoan);
      saveSMSMessage(gId, notifySMS);
    }
  };

  // Directly handle Dashboard structured Loan Applications
  const handleApplyNewLoan = (
    amount: number,
    duration: number,
    interestType: 'flat' | 'reducing',
    purpose: string,
    installmentTrack: 'weekly' | 'bi-weekly' | 'monthly',
    guarantorsList?: { memberId: string; memberName: string; amountPledged: number }[]
  ) => {
    const loanId = 'loan_' + Date.now().toString().slice(-6);
    const dateApplied = currentSimDate;
    
    // Compute dateRepayBy
    const parts = currentSimDate.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]) + duration;
    if (month > 12) {
      month -= 12;
      year += 1;
    }
    const dateRepayBy = `${year}-${month.toString().padStart(2, '0')}-${parts[2]}`;

    // Map incoming guarantees
    const mappedGuarantors = guarantorsList?.map(g => ({
      memberId: g.memberId,
      memberName: g.memberName,
      amountPledged: g.amountPledged,
      status: 'pending' as const
    })) || [];

    const newLoan: Loan = {
      id: loanId,
      memberId: activeMemberId,
      memberName: currentMember.name,
      amountApplied: amount,
      principal: amount,
      interestRate: 5,
      durationMonths: duration,
      interestType,
      installmentTrack,
      purpose,
      status: 'pending',
      dateApplied,
      dateRepayBy,
      votes: {},
      guarantors: mappedGuarantors,
      repaymentHistory: []
    };

    setLoans(prev => [newLoan, ...prev]);

    const createdSms: SMSMessage[] = [];

    // Send SMS alerts to requested guarantors (if any)
    mappedGuarantors.forEach(g => {
      const gMember = members.find(m => m.id === g.memberId);
      if (gMember) {
        const guarantorSms: SMSMessage = {
          id: 'sms_guar_req_' + Math.random().toString(36).substring(2, 6),
          phone: gMember.phone,
          sender: "UPENDO_CM",
          content: `Hi ${gMember.name}, ${currentMember.name} requested you to act as a Guarantor for their loan of Ksh ${amount.toLocaleString()}. Pledged amount required: Ksh ${g.amountPledged.toLocaleString()}. Log into Lending Board to sign off.`,
          timestamp: currentSimDate + " 10:10:00",
          isRead: false
        };
        createdSms.push(guarantorSms);
      }
    });

    // Generate notification SMS
    const applySMS: SMSMessage = {
      id: 'sms_' + Date.now().toString().slice(-6),
      phone: currentMember.phone,
      sender: "UPENDO_CM",
      content: `Your loan application of Ksh ${amount.toLocaleString()} was successfully posted. Required: 2 executive votes ${mappedGuarantors.length > 0 ? "and guarantor sign-offs" : ""}. Status: Pending.`,
      timestamp: currentSimDate + " 10:00:00",
      isRead: false
    };
    createdSms.push(applySMS);

    setSmsMessages(prev => [...createdSms, ...prev]);

    // Firestore Sync
    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveLoan(gId, newLoan);
      createdSms.forEach(sms => {
        saveSMSMessage(gId, sms);
      });
    }
  };

  // Sign pledge guarantee
  const handleSignGuarantor = (loanId: string, guarantorMemberId: string) => {
    const loanToUpdate = loans.find(l => l.id === loanId);
    if (!loanToUpdate || !loanToUpdate.guarantors) return;

    const updatedGuarantors = loanToUpdate.guarantors.map(g => {
      if (g.memberId === guarantorMemberId) {
        return { ...g, status: 'signed' as const };
      }
      return g;
    });

    const updatedLoan: Loan = {
      ...loanToUpdate,
      guarantors: updatedGuarantors
    };

    const borrower = members.find(m => m.id === loanToUpdate.memberId) || currentMember;
    const guarantor = members.find(m => m.id === guarantorMemberId);
    const timestamp = currentSimDate + " " + new Date().toTimeString().split(' ')[0];
    const notifySMS: SMSMessage = {
      id: 'sms_guar_sign_' + Date.now().toString().slice(-4),
      phone: borrower.phone,
      sender: "UPENDO_CM",
      content: `${guarantor?.name || 'Guarantor'} has signed as guarantor for your Ksh ${loanToUpdate.principal.toLocaleString()} loan request. Status: Active.`,
      timestamp,
      isRead: false
    };

    setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
    setSmsMessages(prev => [notifySMS, ...prev]);

    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveLoan(gId, updatedLoan);
      saveSMSMessage(gId, notifySMS);
    }
  };

  // Cast committee signature votes on standard loans
  const handleVoteLoan = (loanId: string, voterId: string, status: 'approve' | 'reject') => {
    const loanToUpdate = loans.find(l => l.id === loanId);
    if (!loanToUpdate) return;

    const updatedLoan: Loan = {
      ...loanToUpdate,
      votes: {
        ...loanToUpdate.votes,
        [voterId]: status
      }
    };

    setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));

    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveLoan(gId, updatedLoan);
    }
  };

  // Disburse funds immediately upon collective committee consensus
  const handleDisburseLoan = (loanId: string) => {
    const loanToDisburse = loans.find(l => l.id === loanId);
    if (!loanToDisburse) return;

    const interestRate = 5; // 5%
    let calculatedInterest = 0;
    if (loanToDisburse.interestType === 'flat') {
      calculatedInterest = loanToDisburse.principal * (interestRate / 100) * loanToDisburse.durationMonths;
    } else {
      // Simple reducing balance accumulation over period for display
      let principalRemaining = loanToDisburse.principal;
      const monthlyPrincipal = loanToDisburse.principal / loanToDisburse.durationMonths;
      for (let i = 0; i < loanToDisburse.durationMonths; i++) {
        calculatedInterest += principalRemaining * (interestRate / 100);
        principalRemaining -= monthlyPrincipal;
      }
    }

    const totalDue = loanToDisburse.principal + calculatedInterest;

    const updatedLoan: Loan = {
      ...loanToDisburse,
      status: 'approved'
    };

    const newVaultBalance = Math.max(0, groupConfig.vaultBalance - loanToDisburse.principal);

    const borrower = members.find(m => m.id === loanToDisburse.memberId) || currentMember;
    const updatedBorrower: Member = {
      ...borrower,
      activeLoans: borrower.activeLoans + totalDue
    };

    const randomRef = 'MPESA_XFD' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = currentSimDate + " " + new Date().toTimeString().split(' ')[0];

    const payoutTx: SavingTransaction = {
      id: 'tx_loandisp_' + Date.now().toString().slice(-6),
      memberId: loanToDisburse.memberId,
      memberName: loanToDisburse.memberName,
      amount: loanToDisburse.principal,
      type: 'savings', // Payout transactions act as savings deductions visually
      paymentMethod: 'mpesa',
      reference: randomRef,
      timestamp,
      status: 'completed',
      syncStatus: isOnline ? 'firebase_synced' : 'local_only'
    };

    const disburseSMS: SMSMessage = {
      id: 'sms_disb_' + Date.now().toString().slice(-6),
      phone: borrower.phone,
      sender: "MPESA_SFC",
      content: `M-PESA: Ksh ${loanToDisburse.principal.toLocaleString()} sent from UPENDO UNITY CHAMA Paybill to ${borrower.name}. Your outstanding Chama Loan balance: Ksh ${totalDue.toLocaleString()} (Amortizing interest included). Reference: ${randomRef}.`,
      timestamp,
      isRead: false
    };

    setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
    setGroupConfig(prev => ({ ...prev, vaultBalance: newVaultBalance }));
    setMembers(prev => prev.map(m => m.id === loanToDisburse.memberId ? updatedBorrower : m));
    setTransactions(prev => [payoutTx, ...prev]);
    setSmsMessages(prev => [disburseSMS, ...prev]);

    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveLoan(gId, updatedLoan);
      saveGroupAttributes(gId, { vaultBalance: newVaultBalance });
      saveMember(gId, updatedBorrower);
      saveTransaction(gId, payoutTx);
      saveSMSMessage(gId, disburseSMS);
    }
  };

  // Perform installment principal repayments via phone STK simulator
  const handleRepayLoanUSSD = (loanId: string, amount: number) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    // 1. Calculate updated member holdings
    const borrower = members.find(m => m.id === targetLoan.memberId) || currentMember;
    const updatedBorrower: Member = {
      ...borrower,
      activeLoans: Math.max(0, borrower.activeLoans - amount),
      creditScore: Math.min(850, borrower.creditScore + 15)
    };

    // 2. Increment Chama Group Vault balance
    const newVaultBalance = groupConfig.vaultBalance + amount;

    // 3. Append to repayments archive list logs
    const randomRefHist = 'MPESA_RPY' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const updatedHistory = [
      ...targetLoan.repaymentHistory,
      {
        amount,
        date: currentSimDate,
        reference: randomRefHist
      }
    ];

    // If outstanding is zero or very close, mark repaid
    const totalPaid = updatedHistory.reduce((sum, h) => sum + h.amount, 0);
    const interestRate = 5;
    let calculatedInterest = 0;
    if (targetLoan.interestType === 'flat') {
      calculatedInterest = targetLoan.principal * (interestRate / 100) * targetLoan.durationMonths;
    } else {
      let principalRemaining = targetLoan.principal;
      const monthlyPrincipal = targetLoan.principal / targetLoan.durationMonths;
      for (let i = 0; i < targetLoan.durationMonths; i++) {
        calculatedInterest += principalRemaining * (interestRate / 100);
        principalRemaining -= monthlyPrincipal;
      }
    }
    const totalObligation = targetLoan.principal + calculatedInterest;
    const newLoanStatus = totalPaid >= totalObligation ? 'repaid' : targetLoan.status;

    const updatedLoan: Loan = {
      ...targetLoan,
      repaymentHistory: updatedHistory,
      status: newLoanStatus as any
    };

    // 4. Add generic transaction entry to main ledger
    const randomRefTx = 'MPESA_RPY' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = currentSimDate + " " + new Date().toTimeString().split(' ')[0];
    const repaymentTx: SavingTransaction = {
      id: 'tx_repay_' + Date.now().toString().slice(-6),
      memberId: targetLoan.memberId,
      memberName: targetLoan.memberName,
      amount,
      type: 'repayment',
      paymentMethod: 'mpesa',
      reference: randomRefTx,
      timestamp,
      status: 'completed',
      syncStatus: isOnline ? 'firebase_synced' : 'local_only'
    };

    // 5. Instantly alert user via Safaricom confirmation SMS
    const repaymentSMS: SMSMessage = {
      id: 'sms_repay_confirm_' + Date.now().toString().slice(-6),
      phone: borrower.phone,
      sender: "UPENDO_CM",
      content: `M-PESA Confirmed. Upendo paid Ksh ${amount.toLocaleString()} for Loan Repayment. Securely logged to automated ledger. Your credit score increased +15.`,
      timestamp,
      isRead: false
    };

    setMembers(prev => prev.map(m => m.id === targetLoan.memberId ? updatedBorrower : m));
    setGroupConfig(prev => ({ ...prev, vaultBalance: newVaultBalance }));
    setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
    setTransactions(prev => [repaymentTx, ...prev]);
    setSmsMessages(prev => [repaymentSMS, ...prev]);

    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveMember(gId, updatedBorrower);
      saveGroupAttributes(gId, { vaultBalance: newVaultBalance });
      saveLoan(gId, updatedLoan);
      saveTransaction(gId, repaymentTx);
      saveSMSMessage(gId, repaymentSMS);
    }
  };

  // Chama Rotation Date Fast Forward Cycle Selector (+1 month)
  const handleFastForwardTime = () => {
    const parts = currentSimDate.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const nextDate = `${year}-${month.toString().padStart(2, '0')}-${parts[2]}`;
    setCurrentSimDate(nextDate);

    // Helpers for grace period calculation
    const getGraceDueDate = (dateStr: string, graceDays: number) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + graceDays);
      return d;
    };

    const updatedLoansList: Loan[] = [];
    const updatedMembersMap = new Map<string, Member>();
    const newTransactionsList: SavingTransaction[] = [];
    const newSMSList: SMSMessage[] = [];

    // Initialize map of members for instant access and updating
    members.forEach(m => {
      updatedMembersMap.set(m.id, { ...m });
    });

    // 1. Scan for active approved loans.
    const newLoansState = loans.map(l => {
      if (l.status === 'approved') {
        const repYDate = new Date(l.dateRepayBy);
        const simDateObj = new Date(nextDate);
        const graceDateObj = getGraceDueDate(l.dateRepayBy, groupConfig.gracePeriodDays);

        if (simDateObj > graceDateObj) {
          // EXCEEDED GRACE PERIOD: Severe Overdue status & credit score penalty!
          let penaltyInterestAmount = 0;
          let flatFineAmount = 0;

          // Compute custom penalties
          if (groupConfig.penaltyType === 'interest_hike' || groupConfig.penaltyType === 'both') {
            penaltyInterestAmount = Math.round(l.principal * (groupConfig.lateInterestHikePercentage / 100));
          }
          if (groupConfig.penaltyType === 'flat_fine' || groupConfig.penaltyType === 'both') {
            flatFineAmount = groupConfig.flatMeetingFine;
          }

          const totalPenaltyFee = penaltyInterestAmount + flatFineAmount;

          const borrower = updatedMembersMap.get(l.memberId) || { ...currentMember };
          const updatedBorrower: Member = {
            ...borrower,
            activeLoans: borrower.activeLoans + totalPenaltyFee,
            creditScore: Math.max(300, borrower.creditScore - 60)
          };
          updatedMembersMap.set(l.memberId, updatedBorrower);

          // Log transaction for penalty applied (so audit log captures it!)
          if (totalPenaltyFee > 0) {
            const penaltyTx: SavingTransaction = {
              id: 'tx_penalty_' + Date.now().toString().slice(-6) + '_' + Math.random().toString(36).substring(2, 5),
              memberId: l.memberId,
              memberName: l.memberName,
              amount: totalPenaltyFee,
              type: 'savings', // Acts as liability debit visually
              paymentMethod: 'mpesa',
              reference: 'FINE_LATE_' + Math.random().toString(36).substring(2, 6).toUpperCase(),
              timestamp: nextDate + " 08:00:00",
              status: 'completed',
              syncStatus: isOnline ? 'firebase_synced' : 'local_only'
            };
            newTransactionsList.push(penaltyTx);
          }

          // Fire urgent arrears reminder SMS
          const alertArrearsSMS: SMSMessage = {
            id: 'sms_overdue_' + Date.now().toString().slice(-6) + '_' + Math.random().toString(36).substring(2, 5),
            phone: borrower.phone,
            sender: "UPENDO_CM",
            content: `URGENT WARNING: Your Upendo Microloan of Ksh ${l.principal.toLocaleString()} is overdue (Grace Period of ${groupConfig.gracePeriodDays} days exceeded). Penalty: Ksh ${totalPenaltyFee.toLocaleString()} applied. Credit score fell to ${Math.max(300, borrower.creditScore - 60)}.`,
            timestamp: nextDate + " 08:05:00",
            isRead: false
          };
          newSMSList.push(alertArrearsSMS);

          const lUpdated: Loan = {
            ...l,
            status: 'overdue'
          };
          return lUpdated;

        } else if (simDateObj > repYDate) {
          // Past due date but WITHIN GRACE PERIOD: alert without score drop!
          const borrower = updatedMembersMap.get(l.memberId) || { ...currentMember };
          const graceSMS: SMSMessage = {
            id: 'sms_grace_' + Date.now().toString().slice(-6) + '_' + Math.random().toString(36).substring(2, 5),
            phone: borrower.phone,
            sender: "UPENDO_CM",
            content: `ALERT: Your loan of Ksh ${l.principal.toLocaleString()} was due on ${l.dateRepayBy}. You are in the ${groupConfig.gracePeriodDays}-day GRACE PERIOD. Please repay prompt before credit score hits.`,
            timestamp: nextDate + " 08:00:00",
            isRead: false
          };
          newSMSList.push(graceSMS);
        }
      }
      return l;
    });

    // 2. Trigger automated monthly targets reminders
    members.forEach(m => {
      const monthlyTargetSMS: SMSMessage = {
        id: 'sms_monthly_' + Date.now().toString().slice(-6) + '_' + Math.random().toString(36).substring(2, 5),
        phone: m.phone,
        sender: "UPENDO_CM",
        content: `CHAMA REMINDER: Contribution cycle for Month of ${nextDate.split('-')[1]}/2026 is active. Baseline Share: Ksh ${groupConfig.shareRate.toLocaleString()} • Monthly targets: Ksh ${groupConfig.targetContribution.toLocaleString()} savings.`,
        timestamp: nextDate + " 09:15:00",
        isRead: false
      };
      newSMSList.push(monthlyTargetSMS);
    });

    // Commit state changes locally
    setLoans(newLoansState);
    const finalMembersState = Array.from(updatedMembersMap.values());
    setMembers(finalMembersState);

    if (newTransactionsList.length > 0) {
      setTransactions(prevTx => [...newTransactionsList, ...prevTx]);
    }
    if (newSMSList.length > 0) {
      setSmsMessages(prevSms => [...newSMSList, ...prevSms]);
    }

    // Firestore updates
    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveGroupAttributes(gId, { 
        currentSimDate: nextDate,
        vaultBalance: groupConfig.vaultBalance // maintain vault balance
      });
      
      finalMembersState.forEach(m => {
        saveMember(gId, m);
      });

      newLoansState.forEach(l => {
        saveLoan(gId, l);
      });

      newTransactionsList.forEach(tx => {
        saveTransaction(gId, tx);
      });

      newSMSList.forEach(sms => {
        saveSMSMessage(gId, sms);
      });
    }
  };

  // Helper for member-specific approved loans mapping
  const activeMemberLoans = loans.filter(l => l.memberId === currentMember.id);

  if (!activeGroupId || !isLoggedIn) {
    return (
      <LandingAndAuth 
        isOnline={isOnline}
        onSelectGroup={(groupId, memberId) => {
          setActiveGroupId(groupId);
          setIsLoggedIn(true);
          setActiveMemberId(memberId);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white antialiased">
      
      {/* Top Banner with group name, sync triggers, network toggles, and Mobile Hamburger trigger */}
      <header className="border-b border-slate-200/60 bg-white/75 backdrop-blur-md sticky top-0 z-50 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Trigger */}
            <button 
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 md:hidden transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-2 rounded-lg text-white font-extrabold flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block tracking-widest uppercase font-bold leading-none mb-0.5">CHAMA LEDGER PLATFORM</span>
                <h2 className="text-sm font-extrabold text-slate-900 leading-none">{groupConfig.groupName}</h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sandbox Mode Toggle Button */}
            <button
              onClick={() => setShowSimulation(!showSimulation)}
              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border transition font-bold select-none cursor-pointer ${
                showSimulation 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle Phone Handset Simulation Sandbox"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>Sandbox Simulator: {showSimulation ? 'Visible' : 'Hidden'}</span>
            </button>

            {/* Cellular Network Toggle Button */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border transition font-bold select-none cursor-pointer ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title="Toggle cellular connection state"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </button>

            {/* Sync trigger */}
            <button
              onClick={handleSyncWithFirebase}
              disabled={isSyncing || !isOnline}
              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                !isOnline
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : isSyncing
                  ? 'bg-slate-50 text-amber-600 border-slate-200 animate-pulse'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <CloudLightning className="w-3.5 h-3.5 shrink-0" />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Global theme toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-805 transition cursor-pointer"
              title="Toggle Global Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              )}
            </button>

            {/* Exit/Logout Button */}
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setActiveGroupId(null);
                localStorage.removeItem('chama_active_group_id');
                localStorage.setItem('chama_is_logged_in', 'false');
              }}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container consisting of Left Sidebar + Content Area */}
      <div className="flex-grow flex relative">
        
        {/* SIDEBAR FOR DESKTOP AND RESPONSIVE DRAWERS */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-150 flex flex-col justify-between transition-transform duration-300 transform md:sticky md:top-[60px] md:h-[calc(100vh-65px)] md:translate-x-0
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 space-y-5 overflow-y-auto flex-1">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-[9px] font-mono font-extrabold text-slate-400 tracking-wider">WORKSPACE CORES</p>
              <nav className="mt-2 space-y-1">
                {[
                  { id: 'dashboard', label: 'Primary Dashboard', icon: LayoutDashboard },
                  { id: 'members', label: 'Group Membership', icon: Users },
                  { id: 'contributions', label: 'Member Contributions', icon: Coins },
                  { id: 'loans', label: 'Loan Management', icon: Scale },
                  { id: 'bank', label: 'Bank Management', icon: Building2 },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.id === 'contributions' && activeTab === 'members');
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'contributions') {
                          setActiveTab('members');
                        } else {
                          setActiveTab(item.id);
                        }
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-bold transition-all text-left ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <p className="text-[9px] font-mono font-extrabold text-slate-400 tracking-wider">FUNDS & ROTATION</p>
              <nav className="mt-2 space-y-1">
                {[
                  { id: 'investments', label: 'Group Investments', icon: TrendingUp },
                  { id: 'calendar', label: 'Events and Calendar', icon: Calendar },
                  { id: 'communications', label: 'SMS & Communications', icon: MessageSquare },
                  { id: 'documents', label: 'Documents & Files', icon: FolderOpen },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-bold transition-all text-left ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="text-[9px] font-mono font-extrabold text-slate-400 tracking-wider">LEDGER SECURITY</p>
              <nav className="mt-2 space-y-1">
                {[
                  { id: 'financials', label: 'Financial Statements', icon: DollarSign },
                  { id: 'administration', label: 'Administration Console', icon: Sliders },
                  { id: 'my-profile', label: 'My Simulator Profile', icon: User },
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-bold transition-all text-left ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sidebar drawer footer */}
          <div className="p-4 border-t border-slate-150 bg-slate-50 text-[10px] space-y-1">
            <p className="font-bold text-slate-800">Operator Profile</p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[9px]">
                {currentMember.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-700 truncate leading-tight">{currentMember.name}</p>
                <p className="text-[9px] text-slate-400 truncate font-mono">SIM • {currentMember.phone}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* BACKDROP FOR MOBILE SIDEBAR DRAWER */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-100/40 z-35 md:hidden backdrop-blur-xs"
          />
        )}

        {/* WORKSPACE CONTENT AREA WITH IMMERSIVE HANDSET SIMULATOR SPLIT */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* WORKSPACE SCREEN CONTENT COLUMN */}
            <div className={`${showSimulation ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
              
              {/* Main operational tabs */}
              {activeTab === 'dashboard' && (
                <DashboardStats
                  groupConfig={groupConfig}
                  transactions={transactions}
                  members={members}
                  loans={loans}
                  currentSimDate={currentSimDate}
                  onFastForwardTime={handleFastForwardTime}
                  onResetDatabase={handleResetDatabase}
                  onUpdateGroupConfig={setGroupConfig}
                />
              )}

               {activeTab === 'members' && (
                <MemberSection
                  members={members}
                  activeMember={currentMember}
                  onSelectMember={handleSelectMember}
                  onAddMember={(name, phone, email, nationalId) => {
                    const newMemberId = 'mem_' + (members.length + 1) + '_' + Math.random().toString(36).substring(2, 5);
                    const newMember: Member = {
                      id: newMemberId,
                      name,
                      phone,
                      email,
                      nationalId,
                      avatarColor: [
                        'bg-purple-600', 'bg-rose-600', 'bg-blue-600', 'bg-slate-600', 'bg-pink-600'
                      ][members.length % 5],
                      totalSavings: 0,
                      shareBalance: 0,
                      activeLoans: 0,
                      creditScore: 750,
                      joinedDate: currentSimDate,
                      role: 'member',
                      status: 'approved' // Admin manually entered them in active session
                    };
                    setMembers(prev => [...prev, newMember]);
                    if (isOnline) {
                      saveMember(activeGroupId || 'upendo_unity', newMember);
                    }
                  }}
                  transactions={transactions}
                  groupConfigShareRate={groupConfig.shareRate}
                  groupConfig={groupConfig}
                  onApproveMember={handleApproveMember}
                  onRejectMember={handleRejectMember}
                  onAssignRole={handleAssignRole}
                  onUpdateMaxLimit={(newLimit) => {
                    const updatedConfig = { ...groupConfig, maxMembersLimit: newLimit };
                    setGroupConfig(updatedConfig);
                    if (isOnline) {
                      saveGroupAttributes(activeGroupId || 'upendo_unity', updatedConfig);
                    }
                  }}
                />
               )}

              {activeTab === 'loans' && (
                <LoanGovernance
                  members={members}
                  loans={loans}
                  groupConfig={groupConfig}
                  activeMember={currentMember}
                  onApplyNewLoan={handleApplyNewLoan}
                  onVoteLoan={handleVoteLoan}
                  onDisburseLoan={handleDisburseLoan}
                  onSignGuarantor={handleSignGuarantor}
                />
              )}

              {/* A. BANK MANAGEMENT MOCK VIEW */}
              {activeTab === 'bank' && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                      Commercial Banking Integration
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Link ChamaSacco ledgers to commercial commercial banks or trust holding systems to escrow collective funds.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-150 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 uppercase font-mono font-bold">Primary Escrow Account</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[8px] font-mono font-bold">CONNECTED</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-800">Co-operative Bank of Kenya Ltd</p>
                      <p className="text-lg font-mono font-extrabold text-slate-900">Ksh {groupConfig.vaultBalance.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Account : 01120092828300 • Branch : Haile Selassie</p>
                    </div>

                    <div className="border border-slate-150 p-4 rounded-xl space-y-2 bg-slate-50/50">
                      <span className="text-xs text-slate-500 uppercase font-mono font-bold">Automatic Settlement</span>
                      <p className="text-xs font-semibold text-slate-705 leading-normal">
                        Every transaction is audited via secure multi-party signatures. Capital reserves reside safely within verified trust accounts with real-time liquidity reporting.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* B. INVESTMENTS VIEW */}
              {activeTab === 'investments' && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Group Investments Tracker
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Monitor collaborative real estate holdings, Treasury bonds, and joint equity portfolios.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { name: "Kajiado East Land Plot #44", category: "Real Estate", value: 1200000, yield: "+12.4% over 1yr" },
                      { name: "Kenya Treasury Bond FXD1/2026/10Yr", category: "Government Securities", value: 450000, yield: "14.2% Fixed Coupon" },
                      { name: "Safaricom PLC Shared Portfolio (15k Units)", category: "Equities", value: 330000, yield: "Dividend Yield Tracked" },
                    ].map((inv, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-slate-150 rounded-xl hover:border-slate-300 transition">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{inv.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{inv.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-800 font-mono">Ksh {inv.value.toLocaleString()}</p>
                          <span className="text-[10px] text-emerald-600 font-mono font-bold">{inv.yield}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* C. EVENTS AND CALENDAR */}
              {activeTab === 'calendar' && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      Community Events & Deadlines
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Stay updated with scheduled rotations, social emergency fund disbursements, and loan evaluation sessions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-100 p-4 rounded-xl space-y-3">
                      <p className="text-xs uppercase font-mono font-bold text-slate-400">UPCOMING CYCLE MEETINGS</p>
                      
                      <div className="space-y-2">
                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <p className="text-xs font-bold text-slate-800">Monthly Contribution Deadline</p>
                          <p className="text-[10px] font-mono text-slate-505 mt-0.5">Simulated date: Day 9 of next rotation</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <p className="text-xs font-bold text-slate-800">Joint Security Review Circle</p>
                          <p className="text-[10px] font-mono text-slate-505 mt-0.5">Bi-weekly consensus round</p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-100 p-4 rounded-xl space-y-2 text-center flex flex-col justify-center">
                      <span className="text-3xl font-bold text-emerald-600 font-mono">{members.length}</span>
                      <p className="text-xs font-bold text-slate-700">Members Synced</p>
                      <p className="text-[10px] text-slate-405">Everyone holds voting weights for loan approval processes.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* D. COMMUNICATIONS VIEW */}
              {activeTab === 'communications' && (
                <div className="space-y-6">
                  {/* News and Announcements Feed */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-emerald-600" />
                          Sacco News & Announcement Hub
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Official real-time briefs, media attachments, and notice sheets published by management board.
                        </p>
                      </div>
                      {['chairperson', 'treasurer', 'secretary'].includes(currentMember.role || '') ? (
                        <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase rounded-lg">
                          ✍️ Editor Authority: {currentMember.role}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-50 text-slate-500 border border-slate-200 uppercase rounded-lg">
                          👀 Reader View
                        </span>
                      )}
                    </div>

                    {/* Announcement input form for Chairperson, Treasurer, and Secretary */}
                    {['chairperson', 'treasurer', 'secretary'].includes(currentMember.role || '') && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                        <p className="text-xs uppercase font-mono font-extrabold text-slate-700 tracking-wider">📢 Publish New Announcement & Broadcast (Chairperson / Treasurer / Secretary)</p>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const f = e.currentTarget;
                          const title = (f.elements.namedItem('annTitle') as HTMLInputElement).value;
                          const content = (f.elements.namedItem('annContent') as HTMLTextAreaElement).value;
                          const attachType = (f.elements.namedItem('annAttachType') as HTMLSelectElement).value as 'none' | 'image' | 'file' | 'video';
                          const attachFileName = (f.elements.namedItem('annFileName') as HTMLInputElement).value;

                          if (!title || !content) {
                            alert("Please provide both a brief title and message content.");
                            return;
                          }

                          let attachUrl = "";
                          if (attachType === 'image') attachUrl = "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80";
                          if (attachType === 'video') attachUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
                          if (attachType === 'file') attachUrl = "https://pdfobject.com/pdf/sample.pdf";

                          const newAnnId = 'ann_' + Date.now();
                          const newAnn: Announcement = {
                            id: newAnnId,
                            title,
                            content,
                            postedBy: currentMember.name,
                            role: currentMember.role || 'member',
                            timestamp: currentSimDate + " " + new Date().toTimeString().split(' ')[0],
                            imageUrl: attachType === 'image' ? attachUrl : undefined,
                            fileUrl: attachType === 'file' ? attachUrl : undefined,
                            videoUrl: attachType === 'video' ? attachUrl : undefined
                          };

                          // Auto Sync Attachment with Documents list
                          if (attachType !== 'none') {
                            const newDocFile: DocumentFile = {
                              id: 'doc_' + Date.now(),
                              name: attachFileName || `${title} attached file`,
                              type: attachType === 'file' ? 'pdf' : attachType,
                              uploadedBy: currentMember.name,
                              role: currentMember.role || 'member',
                              timestamp: currentSimDate + " " + new Date().toTimeString().split(' ')[0],
                              url: attachUrl,
                              source: 'announcement'
                            };

                            setDocuments(prev => [newDocFile, ...prev]);
                            if (isOnline) {
                              saveDocumentFile(activeGroupId || 'upendo_unity', newDocFile);
                            }
                          }

                          setAnnouncements(prev => [newAnn, ...prev]);
                          if (isOnline) {
                            saveAnnouncement(activeGroupId || 'upendo_unity', newAnn);
                          }

                          f.reset();
                          alert(`Success! Announcement "${title}" published and media file synchronized into Documents tab.`);
                        }} className="space-y-3 text-left">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold">Brief Category/Title:</label>
                              <input required type="text" name="annTitle" placeholder="e.g. Annual Audit Brief & Photos" className="w-full text-xs p-2 border border-slate-200 rounded text-slate-800 bg-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold">Media Type:</label>
                                <select name="annAttachType" className="w-full text-xs p-2 border border-slate-200 rounded text-slate-800 bg-white">
                                  <option value="none">无 (No Media)</option>
                                  <option value="image">🖼️ Image Photo</option>
                                  <option value="file">📁 Document File / PDF</option>
                                  <option value="video">🎥 MP4 Briefing Video</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold">Attachment Name:</label>
                                <input type="text" name="annFileName" placeholder="e.g. audit_memo.pdf" className="w-full text-xs p-2 border border-slate-200 rounded text-slate-800 bg-white" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold block">Announcement Message Board Notes:</label>
                            <textarea required name="annContent" rows={2} placeholder="Write details here..." className="w-full text-xs p-2 border border-slate-200 rounded text-slate-800 bg-white" />
                          </div>
                          <div className="flex justify-end pt-1">
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-black text-xs uppercase font-extrabold px-5 py-2 rounded-lg transition">
                              Publish Sacco Announcement & Sync Files
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Announcement Feed Render */}
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase font-mono font-extrabold text-slate-400 tracking-wider">BULLETIN ARCHIVE BOARD</p>
                      {announcements.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-250 italic text-xs">
                          No announcements have been published for this rotation group yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {announcements.map((ann) => (
                            <div key={ann.id} className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3 text-left">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-800">{ann.title}</h4>
                                  <span className="text-[9px] text-slate-400 font-mono">{ann.timestamp}</span>
                                </div>
                                <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                                  {ann.role} ({ann.postedBy.split(' ')[0]})
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>

                              {/* Attachment preview blocks */}
                              {ann.imageUrl && (
                                <div className="space-y-1.5">
                                  <span className="text-[9px] text-slate-400 font-mono font-semibold block">Attached Photo Preview:</span>
                                  <img referrerPolicy="no-referrer" src={ann.imageUrl} alt="Attached Announcement Media" className="w-full h-32 object-cover rounded-lg border border-slate-200 shadow-xs" />
                                </div>
                              )}

                              {ann.fileUrl && (
                                <div className="p-2.5 bg-white border border-slate-150 rounded-lg flex items-center justify-between">
                                  <span className="text-[11px] font-semibold text-slate-700">📄 Attached PDF Brief.pdf</span>
                                  <a href={ann.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline">Open Document</a>
                                </div>
                              )}

                              {ann.videoUrl && (
                                <div className="space-y-1.5">
                                  <span className="text-[9px] text-slate-400 font-mono font-semibold block">Attached Briefing Video Player:</span>
                                  <div className="relative aspect-video w-full rounded-lg bg-black overflow-hidden border border-slate-250 flex items-center justify-center">
                                    <video controls className="w-full h-full object-cover">
                                      <source src={ann.videoUrl} type="video/mp4" />
                                    </video>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cellular Outbox System Logs */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        SIM Cellular Outbox Logs
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Monitor automated SMS cellular reminders dispatched during table banking operations.
                      </p>
                    </div>

                    <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-slate-50 p-2.5 border-b border-slate-150 text-[10px] font-mono font-extrabold text-slate-505">
                        LIVE SYSTEM CELLULAR OUTBOX logs
                      </div>
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {smsMessages.map((sms) => (
                          <div key={sms.id} className="p-3 bg-white text-xs space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-indigo-700 font-bold">To: {sms.phone} • {sms.sender}</span>
                              <span className="text-slate-400">{sms.timestamp}</span>
                            </div>
                            <p className="text-slate-705 font-medium leading-relaxed bg-slate-50/50 p-2 rounded border border-slate-100">{sms.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* E. DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-emerald-600" />
                        Share Capital Certificates & Documents
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Sacco bylaws, general constitutions, ledger audit archives, and media uploaded across channels.
                      </p>
                    </div>
                    {currentMember.role === 'secretary' ? (
                      <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase rounded-lg">
                        ✍️ Secretary Uploader Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-50 text-slate-500 border border-slate-200 uppercase rounded-lg">
                        👀 View Only (Secretary Can Upload)
                      </span>
                    )}
                  </div>

                  {/* Secretary explicit Document Uploader */}
                  {currentMember.role === 'secretary' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                      <p className="text-xs uppercase font-mono font-extrabold text-slate-700 tracking-wider">📁 Upload Official Document File (Secretary Exclusive Privilege)</p>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const f = e.currentTarget;
                        const name = (f.elements.namedItem('docName') as HTMLInputElement).value;
                        const type = (f.elements.namedItem('docType') as HTMLSelectElement).value as 'pdf' | 'document' | 'other';

                        if (!name) {
                          alert("Please specify a document display name.");
                          return;
                        }

                        const newDoc: DocumentFile = {
                          id: 'doc_' + Date.now(),
                          name,
                          type,
                          uploadedBy: currentMember.name,
                          role: currentMember.role || 'member',
                          timestamp: currentSimDate + " " + new Date().toTimeString().split(' ')[0],
                          url: "https://pdfobject.com/pdf/sample.pdf",
                          source: 'direct'
                        };

                        setDocuments(prev => [newDoc, ...prev]);
                        if (isOnline) {
                          saveDocumentFile(activeGroupId || 'upendo_unity', newDoc);
                        }

                        f.reset();
                        alert(`Success! Official document file "${name}" uploaded to Sacco archives.`);
                      }} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold block">Document Name:</label>
                          <input required type="text" name="docName" placeholder="e.g. AGM_Minutes_2026.pdf" className="w-full text-xs p-2 border border-slate-200 rounded text-slate-800 bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-bold block">File Type:</label>
                          <select name="docType" className="w-full text-xs p-2 border border-slate-200 rounded text-slate-800 bg-white">
                            <option value="pdf">PDF Document</option>
                            <option value="document">Excel spreadsheet (XLS)</option>
                            <option value="other">Other Governance File</option>
                          </select>
                        </div>
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-black text-xs uppercase font-extrabold py-2 rounded-lg transition">
                          Upload Document File
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Document Grid */}
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase font-mono font-extrabold text-slate-400 tracking-wider">OFFICIAL SACCO DOCUMENT ARCHIVE</p>
                    
                    {/* Hardcoded system books */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 border border-slate-150 rounded-xl flex items-center justify-between gap-3 bg-white hover:shadow-xs transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold text-[11px]">PDF</div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-slate-800">Sacco Constitution & Bylaws</p>
                            <p className="text-[9px] text-slate-400 font-mono">1.2 MB • System File</p>
                          </div>
                        </div>
                        <a href="https://pdfobject.com/pdf/sample.pdf" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline shrink-0">Open</a>
                      </div>

                      <div className="p-4 border border-slate-150 rounded-xl flex items-center justify-between gap-3 bg-white hover:shadow-xs transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[11px]">XLS</div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-slate-800">Ledger Statement Audit</p>
                            <p className="text-[9px] text-slate-400 font-mono">Real-time ledger • System File</p>
                          </div>
                        </div>
                        <a href="https://pdfobject.com/pdf/sample.pdf" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline shrink-0">Open</a>
                      </div>

                      {/* Display dynamically synchronized documents & news media attachments */}
                      {documents.map((docFile) => (
                        <div key={docFile.id} className="p-4 border border-slate-150 rounded-xl flex items-center justify-between gap-3 bg-white hover:shadow-xs transition">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                              docFile.type === 'image' ? 'bg-amber-50 text-amber-700' : docFile.type === 'video' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-55 text-red-700'
                            }`}>
                              {docFile.type === 'image' ? 'IMG' : docFile.type === 'video' ? 'MP4' : 'DF'}
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{docFile.name}</p>
                              <p className="text-[9px] text-slate-400 font-mono truncate uppercase flex items-center gap-1">
                                {docFile.source === 'announcement' ? '📢 News attachment' : `👤 uploaded by ` + docFile.uploadedBy.split(' ')[0]}
                              </p>
                            </div>
                          </div>
                          <a href={docFile.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline shrink-0">Open</a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* F. FINANCIALS */}
              {activeTab === 'financials' && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Financial Statements & Audits
                  </h3>
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl font-mono text-xs text-slate-600 space-y-2 text-left">
                    <div className="flex justify-between">
                      <span>Total Registered Savings Cap:</span>
                      <span className="font-bold text-slate-800">Ksh {members.reduce((sum, m) => sum + m.totalSavings, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Purchased Share Equity:</span>
                      <span className="font-bold text-slate-800">Ksh {members.reduce((sum, m) => sum + m.shareBalance, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Active Out Loans:</span>
                      <span className="font-bold text-slate-800">Ksh {loans.filter(l => l.status === 'approved' || l.status === 'overdue').reduce((sum, l) => sum + l.principal, 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                      <span>Total Audited Vault Assets:</span>
                      <span>Ksh {(groupConfig.vaultBalance).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* G. ADMINISTRATION */}
              {activeTab === 'administration' && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-emerald-600" />
                      Administration Console & Variables
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure group rules, view connection latency, or trigger a full database rewrite to default seeds.
                    </p>
                  </div>

                  <div className="space-y-4 text-left border-t border-slate-100 pt-4">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-2 text-amber-900 leading-normal font-medium">
                      <p className="font-bold">Sandbox Safe Resets</p>
                      <p>Running into weird data loops during simulation? Push the button below to revert Firestore & Local storage back to original validated clean defaults.</p>
                      <button
                        onClick={handleResetDatabase}
                        className="py-1.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded transition text-xs font-bold pointer"
                      >
                        Reset Ledger to 2026 Seed Defaults
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* H. MY PROFILE */}
              {activeTab === 'my-profile' && (
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    Active SIM Profile Card
                  </h3>
                  
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl text-left">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white uppercase ${currentMember.avatarColor}`}>
                      {currentMember.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{currentMember.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{currentMember.phone} • Member since {currentMember.joinedDate}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold font-mono">Credit Score: {currentMember.creditScore}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold font-mono">Savings: Ksh {currentMember.totalSavings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* HANDSET INTEGRATED SIMULATOR COLUMN (right 4 columns) */}
            {showSimulation && (
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <h3 className="text-xs uppercase font-extrabold text-emerald-600 tracking-widest flex items-center justify-center gap-1.5 mb-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                    SIMULATOR SIM CARD TOGGLE
                  </h3>
                  <p className="text-[11px] text-slate-505 leading-normal font-medium">
                    Currently running as: <strong className="text-slate-800">{currentMember.name}</strong>. Feel free to swap active profiles in the Membership tab.
                  </p>
                </div>

                <PhoneSimulator
                  activeMember={currentMember}
                  members={members}
                  groupConfig={groupConfig}
                  allSMS={smsMessages}
                  onAddTransaction={handleAddTransaction}
                  onApplyLoanUSSD={handleApplyLoanUSSD}
                  onRepayLoanUSSD={handleRepayLoanUSSD}
                  activeMemberLoans={activeMemberLoans}
                />
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Footer Branding Area */}
      <footer className="border-t border-slate-200/60 bg-white/70 py-6 text-center text-[11px] text-slate-500 relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="font-medium">© 2026 Upendo Unity Systems • Secure Digitized Multi-Party consensus automation ledger.</p>
          <div className="flex gap-4 font-mono font-bold">
            <span className="text-emerald-600">● Microfinance Chama V4.2</span>
            <span>Made for table banking and rotations</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
