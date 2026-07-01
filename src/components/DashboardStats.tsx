import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GroupConfig, SavingTransaction, Member } from '../types';
import { ArrowUpRight, ArrowDownLeft, Shield, Banknote, Users, Activity, Wallet, Receipt, Calendar, FileSpreadsheet, Search, RefreshCw, Printer, Volume2, Languages, Eye } from 'lucide-react';
import MonthlyAuditSummary from './MonthlyAuditSummary';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface DashboardStatsProps {
  groupConfig: GroupConfig;
  transactions: SavingTransaction[];
  members: Member[];
  loans: any[];
  currentSimDate: string;
  onFastForwardTime: () => void;
  onResetDatabase: () => void;
  onUpdateGroupConfig?: (config: GroupConfig) => void;
  elderlyMode?: boolean;
  swahiliMode?: boolean;
  speakPhrase?: (text: string, isSwahili: boolean) => void;
}

export default function DashboardStats({
  groupConfig,
  transactions,
  members,
  loans,
  currentSimDate,
  onFastForwardTime,
  onResetDatabase,
  onUpdateGroupConfig,
  elderlyMode = false,
  swahiliMode = false,
  speakPhrase
}: DashboardStatsProps) {
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [configForm, setConfigForm] = useState<GroupConfig>({ ...groupConfig });

  React.useEffect(() => {
    setConfigForm({ ...groupConfig });
  }, [groupConfig]);

  // Calculations
  const totalSavingsCommitted = members.reduce((sum, m) => sum + m.totalSavings, 0);
  const totalSharesValue = members.reduce((sum, m) => sum + m.shareBalance, 0);
  
  // Calculate total outstanding loans
  const activeLoansList = loans.filter(l => l.status === 'approved' || l.status === 'overdue');
  const totalActiveLoansPrincipal = activeLoansList.reduce((sum, l) => {
    // outstanding principal remaining is stored in activeLoans in member.
    // Let's compute outstanding total
    return sum + (l.principal);
  }, 0);

  const interestRateText = "5% Period Interest (Accrued to Group Pool Portfolio)";

  // Format currency helper
  const formatKsh = (amount: number) => {
    return 'Ksh ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 0 });
  };

  // Selected monthly period state for the detailed side breakdown panel
  const [selectedPeriod, setSelectedPeriod] = React.useState<string | null>(null);

  // Dynamically compute the monthly savings trends and loan disbursement patterns over the last 6 months
  const rechartsTrendData = React.useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [yearStr, monthStr] = (currentSimDate || "2026-06-09").split('-');
    const currentYear = parseInt(yearStr) || 2026;
    const currentMonth = parseInt(monthStr) || 6;

    const list = [];
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      
      const monthLabel = `${monthNames[m - 1]}`;
      const yearMonthStr = `${y}-${String(m).padStart(2, '0')}`;

      // Calculate actual savings deposits in this specific month
      const monthSavingsTxs = transactions.filter(tx => {
        if (!tx.timestamp) return false;
        return tx.timestamp.startsWith(yearMonthStr) && tx.type === 'savings';
      });
      const actualSavingsAmt = monthSavingsTxs.reduce((sum, tx) => sum + tx.amount, 0);

      // Calculate actual loan disbursements in this specific month
      const monthLoans = loans.filter(l => {
        if (!l.dateApplied) return false;
        return l.dateApplied.startsWith(yearMonthStr) && l.status === 'approved';
      });
      const actualLoanAmt = monthLoans.reduce((sum, l) => sum + (l.principal || l.amountApplied || 0), 0);

      // Realistic baseline curves blended with actual simulated data
      const baselineSavings = [8000, 12000, 15000, 18000, 22000, 25000];
      const baselineLoans = [4000, 6000, 8000, 11000, 13000, 17000];
      
      const idx = 5 - i;
      const savingsVal = actualSavingsAmt > 0 ? actualSavingsAmt : baselineSavings[idx];
      const loansVal = actualLoanAmt > 0 ? actualLoanAmt : baselineLoans[idx];

      list.push({
        period: monthLabel,
        yearMonth: yearMonthStr,
        "Monthly Savings": savingsVal,
        "Loan Disbursements": loansVal,
        savingsTransactions: monthSavingsTxs,
        loanRecords: monthLoans,
      });
    }
    return list;
  }, [transactions, loans, currentSimDate]);

  // Dynamically select the displayed period data fallback to the latest month
  const currentPeriodData = React.useMemo(() => {
    if (!rechartsTrendData || rechartsTrendData.length === 0) return null;
    const found = rechartsTrendData.find(d => d.period === selectedPeriod);
    return found || rechartsTrendData[rechartsTrendData.length - 1]; // Fallback to last month
  }, [rechartsTrendData, selectedPeriod]);

  // Get transactional records or fallbacks for display in the side breakdown panel
  const displayedSavingsTxs = React.useMemo(() => {
    if (!currentPeriodData) return [];
    if (currentPeriodData.savingsTransactions && currentPeriodData.savingsTransactions.length > 0) {
      return currentPeriodData.savingsTransactions;
    }
    // Baseline simulated allocations using group member names to ensure data clarity
    const targetAmt = currentPeriodData["Monthly Savings"];
    const activeMembers = members.filter(m => m.status === 'approved' || !m.status);
    if (activeMembers.length === 0) return [];
    
    const shareAmt = Math.round(targetAmt / activeMembers.length);
    return activeMembers.map((m, idx) => ({
      id: `sim-tx-${currentPeriodData.period}-${m.id}`,
      memberName: m.name,
      amount: idx === activeMembers.length - 1 ? targetAmt - (shareAmt * (activeMembers.length - 1)) : shareAmt,
      type: 'savings' as const,
      paymentMethod: 'mpesa' as const,
      reference: `MPESA_SIM_${currentPeriodData.period.toUpperCase()}${102 + idx}`,
      timestamp: `${currentSimDate.split('-')[0]}-${currentPeriodData.period}-15 10:00:00`,
      status: 'completed' as const,
      isProjected: true
    }));
  }, [currentPeriodData, members, currentSimDate]);

  const displayedLoans = React.useMemo(() => {
    if (!currentPeriodData) return [];
    if (currentPeriodData.loanRecords && currentPeriodData.loanRecords.length > 0) {
      return currentPeriodData.loanRecords;
    }
    // Baseline loan allocations matching the trending figures using actual Sacco borrowers
    const targetAmt = currentPeriodData["Loan Disbursements"];
    const activeMembers = members.filter(m => m.status === 'approved' || !m.status);
    if (activeMembers.length === 0 || targetAmt <= 0) return [];

    const borrower = activeMembers[1 % activeMembers.length] || activeMembers[0];
    return [{
      id: `sim-loan-${currentPeriodData.period}-${borrower.id}`,
      memberName: borrower.name,
      principal: targetAmt,
      purpose: "Micro-business expansion & inventories",
      status: 'approved' as const,
      dateApplied: `${currentSimDate.split('-')[0]}-${currentPeriodData.period}-02`,
      isProjected: true
    }];
  }, [currentPeriodData, members, currentSimDate]);

  // Accumulate the 5 most major actions sequentially for the Recent Group Activity widget:
  const recentActivities = React.useMemo(() => {
    const list: Array<{ id: string; type: string; title: string; desc: string; date: string; iconType: 'member' | 'disburse' | 'transaction' | 'repay' | 'apply' }> = [];

    // 1. Members joined
    members.forEach(m => {
      if (m.status === 'approved' || !m.status) {
        list.push({
          id: `act-mem-${m.id}`,
          type: 'Member Joined',
          title: `Member Enrolled`,
          desc: `${m.name} joined as Sacco ${m.role || 'member'}.`,
          date: m.joinedDate || '2026-06-01',
          iconType: 'member'
        });
      } else if (m.status === 'pending') {
        list.push({
          id: `act-mem-pending-${m.id}`,
          type: 'Member Application',
          title: 'Membership Applied',
          desc: `${m.name} requested permission to join.`,
          date: m.joinedDate || '2026-06-05',
          iconType: 'apply'
        });
      }
    });

    // 2. Loans disbursed or applied
    loans.forEach((l, index) => {
      const formattedPrincipal = 'Ksh ' + (l.principal || l.amountApplied || 0).toLocaleString();
      if (l.status === 'approved') {
        list.push({
          id: `act-loan-${l.id || index}`,
          type: 'Loan Disbursed',
          title: `Credit Disbursed`,
          desc: `Loan of ${formattedPrincipal} disbursed to ${l.memberName}.`,
          date: l.dateApplied || '2026-06-05',
          iconType: 'disburse'
        });
      } else if (l.status === 'pending') {
        list.push({
          id: `act-loan-pending-${l.id || index}`,
          type: 'Credit Request',
          title: `Loan Requested`,
          desc: `${l.memberName} requested a loan of ${formattedPrincipal}.`,
          date: l.dateApplied || '2026-06-02',
          iconType: 'apply'
        });
      }
    });

    // 3. Financial Transactions completed
    transactions.forEach(tx => {
      const typeLabel = tx.type === 'savings' ? 'Savings Deposited' : tx.type === 'shares' ? 'Shares Purchased' : 'Vault Contribution';
      const formattedAmount = 'Ksh ' + tx.amount.toLocaleString();
      list.push({
        id: `act-tx-${tx.id}`,
        type: 'Transaction Completed',
        title: typeLabel,
        desc: `${tx.memberName} completed payment of ${formattedAmount}.`,
        date: tx.timestamp ? tx.timestamp.substring(0, 10) : '2026-06-08',
        iconType: 'transaction'
      });
    });

    // Sort descending by date
    return list
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [members, loans, transactions]);

  if (elderlyMode) {
    return (
      <div className="space-y-8 text-left">
        {/* Simple Swahili/English Header with Voice */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/15 rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <span className="bg-white/20 text-[10px] uppercase font-mono px-3 py-1 rounded-full font-bold tracking-wider">
              {swahiliMode ? 'Muonekano Rahisi wa Wazee na Msaada wa Sauti' : 'Elderly Easy Mode & Spoken Voice Assistance'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {swahiliMode ? `Habari, Karibu kwenye ${groupConfig.groupName}!` : `Hello, Welcome to ${groupConfig.groupName}!`}
            </h1>
            <p className="text-sm sm:text-base text-emerald-100 max-w-2xl font-medium">
              {swahiliMode 
                ? 'Kwenye ukurasa huu, unaweza kuona kiasi cha pesa kilicho kwenye Chama na akiba zako kwa herufi kubwa na rahisi kuelewa. Bofya alama ya spika kusikiliza maelezo.' 
                : 'Here you can view group funds and savings in extra large, easy-to-read cards. Click any speaker button to listen to accounts read out loud.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const phrase = swahiliMode 
                    ? `Mfumo wa kusaidia wazee umewashwa. Pesa za sasa kwenye sanduku ni ${groupConfig.vaultBalance} Shilingi za Kenya. Akiba yenu yote ni ${totalSavingsCommitted} Shilingi.` 
                    : `Easy assistance mode is active. Current group cash balance is ${groupConfig.vaultBalance} Kenya Shillings. All members savings is ${totalSavingsCommitted} Shillings.`;
                  speakPhrase?.(phrase, swahiliMode);
                }}
                className="px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-black text-xs uppercase rounded-2xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Volume2 className="w-5 h-5 shrink-0 animate-pulse text-emerald-600" />
                <span>{swahiliMode ? 'Sikiliza Hali ya Chama Hapa' : 'Listen to Group Summary'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Zero-Text Quick-Touch Visual Symbols */}
        <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div>
            <span className="bg-indigo-100 text-indigo-800 text-[9px] uppercase font-mono px-2 py-0.5 rounded-md font-bold">
              {swahiliMode ? 'GUSA PICHA KUFUATA HUDUMA' : 'TAP SYMBOLS FOR QUICK CHAMA ACTIONS'}
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              {swahiliMode ? 'Msaada wa Picha (Color-Symbol Guide)' : 'Zero-Text Action Metaphors'}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              {swahiliMode 
                ? 'Wanachama wasiojua kusoma wanaweza kubofya picha hizi kusikia salio au kuanza huduma moja kwa moja.' 
                : 'Illiterate or elderly members can tap these icons to visually verify actions and hear explanations.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            {/* 1. Green Arrow into Traditional Kiondo Basket */}
            <div 
              onClick={() => {
                const phrase = swahiliMode 
                  ? "Kiondo cha Akiba. Hapa ni mahali pa kuweka amana na kutoa michango ya kikundi. Mshale wa kijani unaonyesha kuingiza akiba ndani ya kikapu cha chama cha wanyororo au kuweka akiba ya kawaida."
                  : "Savings Basket. This represents adding money into our traditional Chama pot. The green arrow points inside to show your contribution going in.";
                speakPhrase?.(phrase, swahiliMode);
              }}
              className="group bg-emerald-50/70 hover:bg-emerald-100/90 border-2 border-emerald-400 p-5 rounded-2xl flex flex-col items-center text-center transition cursor-pointer transform hover:-translate-y-1 shadow-sm"
            >
              {/* Basket SVG */}
              <div className="w-24 h-24 relative flex items-center justify-center bg-white rounded-full shadow-inner p-2 border border-emerald-100">
                {/* Green Arrow pointing into pot */}
                <div className="absolute top-1 animate-bounce z-10">
                  <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11 4h2v10h3l-4 4-4-4h3z" />
                  </svg>
                </div>
                {/* Woven Kiondo basket */}
                <svg className="w-16 h-16 text-[#b48348]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4">
                  <path d="M20,40 C20,80 80,80 80,40" strokeWidth="6" strokeLinecap="round" />
                  <path d="M25,43 C25,75 75,75 75,43" strokeWidth="4" />
                  <path d="M30,46 C30,70 70,70 70,46" strokeWidth="3" />
                  <path d="M35,46 L35,68" />
                  <path d="M42,46 L42,70" />
                  <path d="M50,46 L50,70" />
                  <path d="M58,46 L58,70" />
                  <path d="M65,46 L65,68" />
                  <path d="M15,40 C15,25 30,25 30,40" />
                  <path d="M85,40 C85,25 70,25 70,40" />
                </svg>
              </div>
              <h4 className="font-extrabold text-emerald-950 text-sm mt-3 uppercase tracking-wider">
                {swahiliMode ? 'Kiondo cha Akiba' : 'Savings Basket'}
              </h4>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md mt-1">
                {swahiliMode ? 'Mshale wa Kijani' : 'Green Arrow IN'}
              </span>
            </div>

            {/* 2. Blue Hand handing over cash */}
            <div 
              onClick={() => {
                const phrase = swahiliMode 
                  ? "Mikopo ya Upendo. Mkono wa bluu ukipokea au kupeana pesa. Gusa hapa kuangalia mikopo yako au kuanzisha maombi mapya ya mkopo ya dharura."
                  : "Loan Application. The blue hand represents lending and assistance. Tap here to request capital for your retail store or emergency bills.";
                speakPhrase?.(phrase, swahiliMode);
              }}
              className="group bg-blue-50/70 hover:bg-blue-100/90 border-2 border-blue-400 p-5 rounded-2xl flex flex-col items-center text-center transition cursor-pointer transform hover:-translate-y-1 shadow-sm"
            >
              {/* Blue Hand SVG */}
              <div className="w-24 h-24 relative flex items-center justify-center bg-white rounded-full shadow-inner p-2 border border-blue-100">
                <div className="absolute top-1 text-emerald-600 animate-pulse text-xs font-black font-mono">
                  Ksh
                </div>
                <svg className="w-16 h-16 text-blue-600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4">
                  <rect x="35" y="20" width="36" height="18" rx="2" fill="#d1fae5" stroke="#059669" strokeWidth="2" transform="rotate(-10 50 30)" />
                  <path d="M20,60 C30,60 40,65 50,65 C60,65 75,55 85,55 C90,55 92,60 88,65 C80,72 65,80 50,80 L20,80 Z" strokeWidth="5" strokeLinecap="round" fill="#eff6ff" />
                  <path d="M25,55 C30,45 42,50 42,60" strokeWidth="4" />
                </svg>
              </div>
              <h4 className="font-extrabold text-blue-950 text-sm mt-3 uppercase tracking-wider">
                {swahiliMode ? 'Mkono wa Mikopo' : 'Loan Application'}
              </h4>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100/60 px-2 py-0.5 rounded-md mt-1">
                {swahiliMode ? 'Mkono wa Bluu' : 'Blue Hand OUT'}
              </span>
            </div>

            {/* 3. Red Warning Clock/Shield */}
            <div 
              onClick={() => {
                const phrase = swahiliMode 
                  ? "Tahadhari ya Faini. Ngao nyekundu na saa. Inakuonya kuhusu mikopo ambayo imechelewa kulipwa au faini ya mikutano iliyokosa ili kulinda chama chako."
                  : "Overdue Penalties & Meeting Fines. The red shield warning clock alerts you about overdue dates or outstanding penalties to prevent credit score drop.";
                speakPhrase?.(phrase, swahiliMode);
              }}
              className="group bg-rose-50/70 hover:bg-rose-100/90 border-2 border-rose-400 p-5 rounded-2xl flex flex-col items-center text-center transition cursor-pointer transform hover:-translate-y-1 shadow-sm"
            >
              {/* Red warning shield/clock SVG */}
              <div className="w-24 h-24 relative flex items-center justify-center bg-white rounded-full shadow-inner p-2 border border-rose-100">
                <svg className="w-16 h-16 text-rose-600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4">
                  <path d="M25,25 L50,15 L75,25 C75,50 65,75 50,85 C35,75 25,50 25,25 Z" strokeWidth="5" strokeLinejoin="round" fill="#fff5f5" />
                  <circle cx="50" cy="45" r="14" stroke="#e11d48" strokeWidth="2" />
                  <path d="M50,45 L50,38" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M50,45 L58,45" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
                  <path d="M50,72 L50,68" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <h4 className="font-extrabold text-rose-950 text-sm mt-3 uppercase tracking-wider">
                {swahiliMode ? 'Tahadhari ya Faini' : 'Overdue Warning'}
              </h4>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-100/60 px-2 py-0.5 rounded-md mt-1">
                {swahiliMode ? 'Saa na Ngao Nyekundu' : 'Red Clock & Shield'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Gigantic Simplified Accessibility Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Vault Cash Reserves */}
          <div 
            onClick={() => {
              const text = swahiliMode 
                ? `Kiasi cha pesa zilizomo kwenye sanduku hivi sasa kwa ajili ya kukopesha wanachama ni Shilingi ${groupConfig.vaultBalance}.` 
                : `The cash balance currently inside the group box is ${groupConfig.vaultBalance} Kenya Shillings, ready to be given as loans.`;
              speakPhrase?.(text, swahiliMode);
            }}
            className="bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 p-6 rounded-3xl transition duration-150 cursor-pointer shadow-md flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-emerald-805 font-extrabold text-xs uppercase tracking-widest bg-emerald-100 px-2.5 py-1 rounded-lg">
                  {swahiliMode ? '🏦 PESA KIKOPONI (VAULT)' : '🏦 POOLED BANK CASH (VAULT)'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mt-4 tracking-tight">
                  {formatKsh(groupConfig.vaultBalance)}
                </h2>
              </div>
              <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-md shrink-0">
                <Wallet className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-emerald-800 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0" />
              <span>
                {swahiliMode 
                  ? 'Bofya hapa kusikia maelezo ya pesa kikoponi' 
                  : 'Click anywhere on this card to listen to this balance'}
              </span>
            </div>
          </div>

          {/* Card 2: Cumulative Member Savings */}
          <div 
            onClick={() => {
              const text = swahiliMode 
                ? `Jumla ya akiba zote ambazo sisi sote wanachama tumeweka pamoja ni Shilingi ${totalSavingsCommitted}.` 
                : `The total savings put together by all of us members is ${totalSavingsCommitted} Kenya Shillings.`;
              speakPhrase?.(text, swahiliMode);
            }}
            className="bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-300 p-6 rounded-3xl transition duration-150 cursor-pointer shadow-md flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-indigo-805 font-extrabold text-xs uppercase tracking-widest bg-indigo-100 px-2.5 py-1 rounded-lg">
                  {swahiliMode ? '🌸 AKIBA ZA WANACHAMA' : '🌸 MEMBERS COOPERATIVE SAVINGS'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-indigo-950 mt-4 tracking-tight">
                  {formatKsh(totalSavingsCommitted)}
                </h2>
              </div>
              <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-md shrink-0">
                <Banknote className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-indigo-800 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping shrink-0" />
              <span>
                {swahiliMode 
                  ? 'Bofya hapa kusikia maelezo ya akiba zote' 
                  : 'Click anywhere on this card to listen to savings balance'}
              </span>
            </div>
          </div>

          {/* Card 3: Shares Equity Capital */}
          <div 
            onClick={() => {
              const text = swahiliMode 
                ? `Thamani ya hisa zote ambazo wanachama wamejinunulia hivi sasa ni Shilingi ${totalSharesValue}.` 
                : `The total value of shares bought by members in this group is ${totalSharesValue} Kenya Shillings.`;
              speakPhrase?.(text, swahiliMode);
            }}
            className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 p-6 rounded-3xl transition duration-150 cursor-pointer shadow-md flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-blue-805 font-extrabold text-xs uppercase tracking-widest bg-blue-100 px-2.5 py-1 rounded-lg">
                  {swahiliMode ? '📈 HISA ZA CHAMA' : '📈 TOTAL GROUP SHARES'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mt-4 tracking-tight">
                  {formatKsh(totalSharesValue)}
                </h2>
              </div>
              <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-md shrink-0">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-blue-800 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
              <span>
                {swahiliMode 
                  ? 'Bofya hapa kusikia maelezo ya hisa zako' 
                  : 'Click anywhere on this card to listen to share values'}
              </span>
            </div>
          </div>

          {/* Card 4: Outstanding Credit Portfolio */}
          <div 
            onClick={() => {
              const text = swahiliMode 
                ? `Jumla ya mikopo ya sasa iliyotolewa kwa wanachama kukuza biashara na mashamba yao ni Shilingi ${totalActiveLoansPrincipal}.` 
                : `Total active loans given out to members to support their farms and businesses is ${totalActiveLoansPrincipal} Kenya Shillings.`;
              speakPhrase?.(text, swahiliMode);
            }}
            className="bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 p-6 rounded-3xl transition duration-150 cursor-pointer shadow-md flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-rose-805 font-extrabold text-xs uppercase tracking-widest bg-rose-100 px-2.5 py-1 rounded-lg">
                  {swahiliMode ? '💰 MIKOPO ILIYO NJE' : '💰 ACTIVE OUTSTANDING LOANS'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-rose-950 mt-4 tracking-tight">
                  {formatKsh(totalActiveLoansPrincipal)}
                </h2>
              </div>
              <div className="bg-rose-600 text-white rounded-2xl p-4 shadow-md shrink-0">
                <Activity className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-rose-800 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shrink-0" />
              <span>
                {swahiliMode 
                  ? 'Bofya hapa kusikia maelezo ya mikopo yote' 
                  : 'Click anywhere on this card to listen to active loan book'}
              </span>
            </div>
          </div>
        </div>

        {/* Very Simple Graphical/Text Guide on how to interact */}
        <div className="bg-white border-2 border-slate-250 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-amber-500 text-black text-xs font-black rounded-lg">GUIDE</span>
              {swahiliMode ? 'Mwongozo Mwepesi wa Kazi Kuu za Chama' : 'Simple Guide for Core Chama Functions'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-semibold">
              {swahiliMode 
                ? 'Je unataka kuweka akiba au kuomba mkopo? Fuata maagizo haya mepesi chini.' 
                : 'Do you want to deposit money or apply for a loan? Follow these easy steps below.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 bg-emerald-50/50 border border-emerald-150 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-emerald-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">1</span>
                {swahiliMode ? 'Jinsi ya Kuweka Akiba (Deposit)' : 'How to Add Savings (Deposit)'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {swahiliMode 
                  ? 'Kuweka akiba ni rahisi! Bofya "Sandbox Simulator: Visible" iliyo juu ili uone simu ya mkononi upande wa kulia. Kisha bofya "M-Pesa App", andika kiasi unachotaka, na weka nambari yako ya PIN ya siri.' 
                  : 'Adding savings is easy! Toggle "Sandbox Simulator: Visible" at the top to see the mobile handset on the right. Then tap "M-Pesa App", type your amount, and enter your secret PIN to complete payment.'}
              </p>
              <button
                onClick={() => {
                  const p = swahiliMode 
                    ? "Ili kuweka akiba, angalia simu iliyo upande wa kulia. Chagua neno M-Pesa App. Andika kiasi cha pesa mfano Shilingi elfu moja, kisha bofya tuma. Mfumo utakutaka uweke PIN ya simu yako kukamilisha kwa usalama kabisa."
                    : "To add savings, look at the phone on the right. Tap M-Pesa App. Choose saving, enter an amount like 1000, and click send. Enter your pin on the screen to finalize.";
                  speakPhrase?.(p, swahiliMode);
                }}
                className="text-[11px] font-extrabold text-emerald-700 underline flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>{swahiliMode ? 'Sikiliza Maagizo ya Akiba' : 'Listen to Savings Guide'}</span>
              </button>
            </div>

            <div className="p-5 bg-indigo-50/50 border border-indigo-150 rounded-2xl space-y-3">
              <h4 className="font-extrabold text-indigo-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">2</span>
                {swahiliMode ? 'Jinsi ya Kuomba Mkopo (Borrow)' : 'How to Request a Loan (Borrow)'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {swahiliMode 
                  ? 'Kupata mkopo ni haraka na hakuna makaratasi! Unaweza kuomba hadi mara tatu ya akiba yako ya sasa. Piga kodi ya nyota tatu nane nne, reli kwenye simu ya mkononi kulia kuanza maombi.' 
                  : 'Getting a loan is paperless and instant! You can borrow up to 3x your total savings. Dial star three eight four star five five hash on the simulated phone on the right to start.'}
              </p>
              <button
                onClick={() => {
                  const p = swahiliMode 
                    ? "Ili kuomba mkopo mpya, piga simu ukitumia kodi ya nyota tatu nane nne, reli upande wa kulia. Chagua nambari ya tatu yaani Kuomba Mkopo. Andika kiasi unachotaka na muda wa kulipa kisha ubonyeze tuma."
                    : "To borrow a loan, dial star three eight four, hash on the simulator phone to the right. Choose option three for Loan. Type your amount, then click submit to register your request instantly.";
                  speakPhrase?.(p, swahiliMode);
                }}
                className="text-[11px] font-extrabold text-indigo-700 underline flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>{swahiliMode ? 'Sikiliza Maagizo ya Mikopo' : 'Listen to Borrowing Guide'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Rotation Time Machine inside Easy View */}
        <div className="bg-amber-500/10 border-2 border-amber-300 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-black text-amber-950 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
              {swahiliMode ? 'Mzunguko wa Sasa wa Kikundi' : 'Current Chama Cycle Date'}
            </h4>
            <p className="text-xs font-mono font-bold text-amber-900">
              {swahiliMode ? `Leo ni tarehe: ${currentSimDate}` : `Current simulation date: ${currentSimDate}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onFastForwardTime();
                const text = swahiliMode 
                  ? "Muda umesogezwa mbele kwa mwezi mmoja. Karibu kwenye mzunguko mpya." 
                  : "Time fast-forwarded by one month. Welcome to the next cycle.";
                speakPhrase?.(text, swahiliMode);
              }}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-xs text-black font-black uppercase rounded-2xl tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{swahiliMode ? 'Sogeza Mbele +Mwezi 1' : 'Fast Forward +1 Month'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Panel & Time Machine */}
      <div className="bg-gradient-to-r from-emerald-50 to-white border border-emerald-150 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-600 w-5 h-5 shrink-0" />
            <span className="text-emerald-700 font-extrabold tracking-wide uppercase text-[10px]">Digitized Community Ledger</span>
          </div>
          <h1 id="chama-title" className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">{groupConfig.groupName}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered Self-Help Group: <span className="font-mono text-slate-700 font-bold">{groupConfig.registrationNumber}</span> • Share Purchase Unit: <span className="text-emerald-700 font-bold">{formatKsh(groupConfig.shareRate)}</span>
          </p>
          
          {/* Group-Exclusive Lock & Privacy Indicator */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-indigo-700 dark:text-indigo-400 font-mono font-bold bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              🔒 Secure Group-Exclusive Ledger (Restricted to {groupConfig.groupName} Members)
            </span>
          </div>
        </div>

        {/* Time Machine controls */}
        <div className="flex items-center gap-3 bg-white/90 border border-slate-200 p-3 rounded-xl shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Chama Rotation Cycle
            </div>
            <p className="text-xs font-mono font-bold text-slate-800">{currentSimDate}</p>
          </div>
          <button
            onClick={onFastForwardTime}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-xs text-black font-extrabold py-1.5 px-3 rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
          >
            Fast Forward +1 Month
          </button>
          
          <button
            onClick={onResetDatabase}
            className="text-slate-400 hover:text-red-500 p-1 rounded-md transition cursor-pointer"
            title="Reset to Seed Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>      {/* Primary Financial Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Vault Cash Reserves */}
        <motion.div 
          id="stats-card-vault" 
          whileHover={{ scale: 1.04, y: -6, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.15), 0 8px 10px -6px rgba(16, 185, 129, 0.15)" }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs transition hover:border-emerald-300 cursor-pointer text-left"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-tight">Digital Vault Cash</p>
              <h2 className="text-xl font-extrabold text-slate-905 mt-1 tracking-tight">{formatKsh(groupConfig.vaultBalance)}</h2>
            </div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg p-2.5">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-605 text-emerald-605 font-bold">● Securely Pooled</span>
            <span>Available to disburse</span>
          </div>
        </motion.div>

        {/* Card 2: Cumulative Member Savings */}
        <motion.div 
          id="stats-card-savings" 
          whileHover={{ scale: 1.04, y: -6, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.15), 0 8px 10px -6px rgba(99, 102, 241, 0.15)" }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs transition hover:border-indigo-300 cursor-pointer text-left"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-tight">Member Savings Vault</p>
              <h2 className="text-xl font-extrabold text-emerald-600 mt-1 tracking-tight">{formatKsh(totalSavingsCommitted)}</h2>
            </div>
            <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg p-2.5">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-450 flex items-center justify-between">
            <span>Target: {formatKsh(groupConfig.targetContribution)}/ea</span>
            <span className="text-slate-450 font-bold">100% Audit-Secure</span>
          </div>
        </motion.div>

        {/* Card 3: Shares Equity Capital */}
        <motion.div 
          id="stats-card-shares" 
          whileHover={{ scale: 1.04, y: -6, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.15), 0 8px 10px -6px rgba(59, 130, 246, 0.15)" }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs transition hover:border-blue-350 cursor-pointer text-left"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-tight">Total Equity Shares</p>
              <h2 className="text-xl font-extrabold text-slate-905 mt-1 tracking-tight">{formatKsh(totalSharesValue)}</h2>
            </div>
            <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded-lg p-2.5">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-450 flex items-center justify-between">
            <span>Total Shares: {totalSharesValue / groupConfig.shareRate} Units</span>
            <span className="text-blue-600 font-bold">Dividend Eligible</span>
          </div>
        </motion.div>

        {/* Card 4: Outstanding Credit Portfolio */}
        <motion.div 
          id="stats-card-credit" 
          whileHover={{ scale: 1.04, y: -6, boxShadow: "0 10px 25px -5px rgba(244, 63, 94, 0.15), 0 8px 10px -6px rgba(244, 63, 94, 0.15)" }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs transition hover:border-rose-350 cursor-pointer text-left"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-tight">Active Loan Book Value</p>
              <h2 className="text-xl font-extrabold text-rose-600 mt-1 tracking-tight">{formatKsh(totalActiveLoansPrincipal)}</h2>
            </div>
            <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-lg p-2.5">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-455 flex items-center justify-between">
            <span className="text-[9px] text-rose-605 uppercase font-mono font-bold">{activeLoansList.length} Active Borrowers</span>
            <span>{interestRateText.split(' ')[0]} Yield</span>
          </div>
        </motion.div>

      </div>

      {/* Dynamic Grid: Chart Trend and Recent Activity Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recharts Cumulative Ledger Growth Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs transition duration-150">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Monthly Savings & Loan Disbursements</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Visualizing monthly savings deposits versus active credit capital allocation patterns.</p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded"></span>
                <span className="text-slate-600 dark:text-zinc-300 font-mono font-bold">Monthly Savings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-indigo-500 rounded"></span>
                <span className="text-slate-600 dark:text-zinc-300 font-mono font-bold">Loan Disbursements</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-2 italic">💡 Pro-Tip: Click on any month bar to inspect ledger transaction details</p>
              
              <motion.div
                key={currentSimDate} // Entrance animation on load or time sync
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="h-56 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rechartsTrendData}
                    onClick={(state) => {
                      if (state && state.activeLabel) {
                        setSelectedPeriod(state.activeLabel);
                      }
                    }}
                    margin={{ top: 10, right: 5, left: -5, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-zinc-805" />
                    <XAxis
                      dataKey="period"
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      dy={6}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `Ksh ${(val / 1000)}k`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 p-2.5 text-[10px] rounded-lg shadow-md font-sans text-slate-800 dark:text-zinc-200">
                              <p className="font-bold border-b border-slate-100 dark:border-zinc-800 pb-1 mb-1">{label} Overview</p>
                              {payload.map((p) => (
                                <p key={p.name} className="flex gap-4 justify-between py-0.5">
                                  <span className="font-semibold" style={{ color: p.color }}>{p.name}:</span>
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-450">Ksh {Number(p.value).toLocaleString()}</span>
                                </p>
                              ))}
                              <p className="text-[8px] text-indigo-400 mt-1.5 font-bold uppercase tracking-wider">⚡ Click Bar to load detailed ledger</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="Monthly Savings"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1300}
                      isAnimationActive={true}
                    >
                      {rechartsTrendData.map((entry, index) => {
                        const isSelected = entry.period === (currentPeriodData?.period);
                        return (
                          <Cell 
                            key={`cell-savings-${index}`} 
                            fill={isSelected ? "#047857" : "#10b981"} 
                            cursor="pointer" 
                            className="transition duration-150"
                          />
                        );
                      })}
                    </Bar>
                    <Bar
                      dataKey="Loan Disbursements"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1300}
                      isAnimationActive={true}
                    >
                      {rechartsTrendData.map((entry, index) => {
                        const isSelected = entry.period === (currentPeriodData?.period);
                        return (
                          <Cell 
                            key={`cell-loans-${index}`} 
                            fill={isSelected ? "#4338ca" : "#6366f1"} 
                            cursor="pointer" 
                            className="transition duration-150"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Side-Panel Breakdown Container */}
            <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800 md:pl-5 pt-4 md:pt-0 flex flex-col justify-between h-full min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 mb-3">
                  <span className="text-[10px] tracking-wider uppercase font-mono font-bold text-slate-400 dark:text-zinc-500">
                    Ledger: {currentPeriodData?.period} 2026
                  </span>
                  <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded px-1.5 py-0.5 font-bold">
                    Active Details
                  </span>
                </div>

                {/* Savings Breakdown */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">Total Savings Pool</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600">Ksh {currentPeriodData?.["Monthly Savings"].toLocaleString()}</span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {displayedSavingsTxs.map((tx: any) => (
                      <div key={tx.id} className="flex justify-between items-center text-[10px] bg-slate-50 dark:bg-zinc-955 p-1.5 rounded-lg border border-slate-100/65 dark:border-zinc-850">
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[85px]" title={tx.memberName}>
                          {tx.memberName}
                        </span>
                        <div className="flex items-center gap-1 text-right shrink-0">
                          {tx.isProjected && <span className="text-[8px] text-amber-500 font-bold" title="No live transactions are registered here yet. Showing projected recurring base contributions.">Proj</span>}
                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">Ksh {tx.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {displayedSavingsTxs.length === 0 && (
                      <p className="text-[9px] text-slate-400 italic">No savings recorded.</p>
                    )}
                  </div>
                </div>

                {/* Loans Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">Disbursed Credit</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600">Ksh {currentPeriodData?.["Loan Disbursements"].toLocaleString()}</span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                    {displayedLoans.map((l: any) => (
                      <div key={l.id} className="flex justify-between items-center text-[10px] bg-indigo-50/30 dark:bg-indigo-950/20 p-1.5 rounded-lg border border-indigo-100/45 dark:border-indigo-900/20">
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[85px]" title={l.memberName}>
                          {l.memberName}
                        </span>
                        <div className="flex items-center gap-1 text-right shrink-0">
                          {l.isProjected && <span className="text-[8px] text-amber-500 font-bold" title="Projected credit circulation trend limit">Proj</span>}
                          <span className="font-mono font-black text-slate-900 dark:text-zinc-100">Ksh {(l.principal || l.amountApplied || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {displayedLoans.length === 0 && (
                      <p className="text-[9px] text-slate-400 italic">No microloans disbursed in this period.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[8px] text-slate-400 mt-2">
                * Real metrics are live-mapped directly from automated transaction records.
              </div>
            </div>
          </div>
        </div>

        {/* Recent Group Activity Widget */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col justify-between transition duration-150">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-zinc-800">
              <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight leading-none">Recent Group Activity</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">SACCO LEDGER ACTIONS</p>
              </div>
            </div>

            <div className="space-y-3.5 custom-scrollbar overflow-y-auto max-h-[160px] pr-1">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-[11px] leading-snug">
                  <div className="p-1.5 bg-slate-50 dark:bg-zinc-955 border border-slate-150 dark:border-zinc-800 rounded-lg shrink-0 mt-0.5">
                    {act.iconType === 'member' && <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    {act.iconType === 'apply' && <Activity className="w-3.5 h-3.5 text-amber-500" />}
                    {act.iconType === 'disburse' && <Banknote className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />}
                    {act.iconType === 'transaction' && <Receipt className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-slate-800 dark:text-zinc-200">{act.title}</p>
                    <p className="text-slate-500 dark:text-zinc-400 text-[10px] font-medium leading-normal mt-0.5">{act.desc}</p>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono block mt-1">{act.date}</span>
                  </div>
                </div>
              ))}

              {recentActivities.length === 0 && (
                <p className="text-xs text-slate-400 italic py-6 text-center">No recent ledger interactions.</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-[10px] font-mono text-slate-400 dark:text-zinc-500">
            <span>Last 5 Major events</span>
            <span className="text-emerald-500 font-bold uppercase">● LIVE SYNCED</span>
          </div>
        </div>

      </div>

      {/* Policy and Config Board */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="text-indigo-400">⚙️</span>
              Chama Rulebook & Custom Financial Policies
            </h3>
            <p className="text-[11px] text-neutral-400">Configure customizable baseline share prices, grace days, and penalty multipliers.</p>
          </div>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-neutral-200 text-xs font-bold rounded-lg transition shrink-0 cursor-pointer"
          >
            {isConfigOpen ? 'Collapse Settings' : 'Customize Policy Board'}
          </button>
        </div>

        {isConfigOpen && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateGroupConfig) {
                onUpdateGroupConfig(configForm);
                alert("Success: Custom Chama financial rules, baseline shares and penalties successfully saved!");
              }
            }}
            className="mt-5 space-y-4 border-t border-slate-800 pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Chama Group Name</label>
                <input
                  type="text"
                  value={configForm.groupName}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, groupName: e.target.value }))}
                  className="w-full bg-black border border-slate-800 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Baseline Share Price (Ksh)</label>
                <input
                  type="number"
                  value={configForm.shareRate}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, shareRate: Math.max(1, Number(e.target.value)) }))}
                  className="w-full bg-black border border-slate-800 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Monthly Target Savings (Ksh)</label>
                <input
                  type="number"
                  value={configForm.targetContribution}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, targetContribution: Math.max(1, Number(e.target.value)) }))}
                  className="w-full bg-black border border-slate-800 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Overdue Grace Period (Days)</label>
                <input
                  type="number"
                  value={configForm.gracePeriodDays}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, gracePeriodDays: Math.max(0, Number(e.target.value)) }))}
                  className="w-full bg-black border border-slate-800 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="e.g. 5 days"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Missed Meeting Fine (Ksh)</label>
                <input
                  type="number"
                  value={configForm.flatMeetingFine}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, flatMeetingFine: Math.max(0, Number(e.target.value)) }))}
                  className="w-full bg-black border border-slate-800 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Late Payment Interest Hike (%)</label>
                <input
                  type="number"
                  value={configForm.lateInterestHikePercentage}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, lateInterestHikePercentage: Math.max(0, Number(e.target.value)) }))}
                  className="w-full bg-black border border-slate-800 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Overdue Penalty Model:</span>
                <div className="flex bg-black border border-slate-800 rounded p-0.5">
                  {(['flat_fine', 'interest_hike', 'both', 'none'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setConfigForm(prev => ({ ...prev, penaltyType: mode }))}
                      className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition cursor-pointer ${
                        configForm.penaltyType === mode 
                          ? 'bg-indigo-600 text-white' 
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {mode === 'flat_fine' ? 'Flat Fine' : mode === 'interest_hike' ? 'Int Hike' : mode === 'both' ? 'Both' : 'None'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-black font-extrabold text-xs rounded transition uppercase tracking-wider cursor-pointer font-sans"
              >
                Apply Custom Rules
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
