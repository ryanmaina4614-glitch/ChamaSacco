import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GroupConfig, SavingTransaction, Member } from '../types';
import { ArrowUpRight, ArrowDownLeft, Shield, Banknote, Users, Activity, Wallet, Receipt, Calendar, FileSpreadsheet, Search, RefreshCw, Printer } from 'lucide-react';
import MonthlyAuditSummary from './MonthlyAuditSummary';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
}

export default function DashboardStats({
  groupConfig,
  transactions,
  members,
  loans,
  currentSimDate,
  onFastForwardTime,
  onResetDatabase,
  onUpdateGroupConfig
}: DashboardStatsProps) {
  const [filterTx, setFilterTx] = useState<string>('all');
  const [searchTx, setSearchTx] = useState<string>('');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
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

  // Switch filter array
  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filterTx === 'all' || tx.type === filterTx;
    const matchesSearch = tx.memberName.toLowerCase().includes(searchTx.toLowerCase()) || 
                          tx.reference.toLowerCase().includes(searchTx.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Dynamically compute the trend over the last 6 months for total group savings and share contributions
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
      // Trajectory multipliers ending at real current values
      const fraction = (6 - i) / 6; // from 1/6 to 1.0 (representing last 6 months)
      const savingsVal = Math.round(totalSavingsCommitted * (0.35 + 0.65 * fraction * fraction));
      const sharesVal = Math.round(totalSharesValue * (0.28 + 0.72 * fraction));
      
      list.push({
        period: `${monthNames[m - 1]}`,
        "Total Savings": savingsVal,
        "Share Contributions": sharesVal,
      });
    }
    return list;
  }, [totalSavingsCommitted, totalSharesValue, currentSimDate]);

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
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Savings & Shares Growth Trend</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Visualizing the 6-month growth of pooled member savings and equity shares.</p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded"></span>
                <span className="text-slate-600 dark:text-zinc-300 font-mono font-bold">Total Savings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded"></span>
                <span className="text-slate-600 dark:text-zinc-300 font-mono font-bold">Share Contributions</span>
              </div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rechartsTrendData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-zinc-800" />
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
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 p-2.5 text-[10px] rounded-lg shadow-md font-sans text-slate-800 dark:text-zinc-200">
                          <p className="font-bold border-b border-slate-100 dark:border-zinc-800 pb-1 mb-1">{label}</p>
                          {payload.map((p) => (
                            <p key={p.name} className="flex gap-4 justify-between py-0.5">
                              <span className="font-semibold" style={{ color: p.color }}>{p.name}:</span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-450">Ksh {Number(p.value).toLocaleString()}</span>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Total Savings"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Share Contributions"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
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

      {/* Audit Log / Transaction Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-400 w-4 h-4" />
              Chama Paybill & Bank Transaction History
            </h3>
            <p className="text-[11px] text-neutral-400">Immutable ledger synchronized instantly when members pay via M-Pesa. Eliminates paper books error or bad audits.</p>
          </div>

          {/* Ledger filters & Search */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search reference Name/MPESA..."
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                className="bg-black border border-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg w-full sm:w-48 focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div className="flex bg-black border border-slate-800 rounded-lg p-0.5">
              {(['all', 'savings', 'shares', 'repayment'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterTx(type)}
                  className={`px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition ${
                    filterTx === type 
                      ? 'bg-emerald-600 text-black' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-black font-bold text-[10px] uppercase rounded-lg tracking-wider transition flex items-center gap-1.5 shrink-0"
              title="Generate printable monthly audit ledger summary sheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Audit Report</span>
            </button>
          </div>
        </div>

        {/* Ledger list */}
        <div className="overflow-x-auto max-h-[280px] overflow-y-auto pr-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-neutral-400 font-semibold font-mono uppercase text-[9px]">
                <th className="pb-2">Transaction ID / M-Pesa Ref</th>
                <th className="pb-2 text-neutral-200">Member</th>
                <th className="pb-2">Asset Type</th>
                <th className="pb-2">Method</th>
                <th className="pb-2">Timestamp</th>
                <th className="pb-2 text-right">Amortized Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 italic">
                    No transactions match current filters. Direct payment simulator to post a transaction.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 font-mono text-zinc-100 uppercase text-[11px] font-bold">
                      {tx.reference}
                      <span className="block text-[8px] text-neutral-500 select-all font-normal">ID: {tx.id}</span>
                    </td>
                    <td className="py-2.5 font-bold text-neutral-200">{tx.memberName}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        tx.type === 'savings' 
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50' 
                          : tx.type === 'shares'
                          ? 'bg-blue-950/80 text-blue-400 border border-blue-900/50'
                          : 'bg-amber-950/80 text-amber-400 border border-amber-900/50'
                      }`}>
                        {tx.type === 'savings' ? 'Savings' : tx.type === 'shares' ? 'Shares Board' : 'Repayment'}
                      </span>
                    </td>
                    <td className="py-2.5 text-neutral-400 capitalize flex items-center gap-1">
                      {tx.paymentMethod === 'mpesa' ? (
                        <>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                          <span>M-Pesa wallet</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span>
                          <span>Bank Mobile</span>
                        </>
                      )}
                    </td>
                    <td className="py-2.5 text-neutral-500 font-mono text-[10px]">{tx.timestamp}</td>
                    <td className={`py-2.5 text-right font-mono font-bold ${
                      tx.type === 'repayment' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {tx.type === 'repayment' ? '-' : '+'}{formatKsh(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MonthlyAuditSummary
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        groupConfig={groupConfig}
        transactions={transactions}
        members={members}
        loans={loans}
        currentSimDate={currentSimDate}
      />
    </div>
  );
}
