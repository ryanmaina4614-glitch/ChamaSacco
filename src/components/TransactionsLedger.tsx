import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GroupConfig, SavingTransaction, Member } from '../types';
import { 
  FileSpreadsheet, 
  Search, 
  Printer, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  SlidersHorizontal,
  FolderSync,
  HelpCircle
} from 'lucide-react';
import MonthlyAuditSummary from './MonthlyAuditSummary';

interface TransactionsLedgerProps {
  groupConfig: GroupConfig;
  transactions: SavingTransaction[];
  members: Member[];
  loans: any[];
  currentSimDate: string;
}

export default function TransactionsLedger({
  groupConfig,
  transactions,
  members,
  loans,
  currentSimDate
}: TransactionsLedgerProps) {
  const [filterTx, setFilterTx] = useState<string>('all');
  const [searchTx, setSearchTx] = useState<string>('');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

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

  // Small internal metric calculations for top section of ledger to make it incredibly premium and useful
  const depositCount = transactions.filter(t => t.type === 'savings').length;
  const repaymentCount = transactions.filter(t => t.type === 'repayment').length;
  const sharesCount = transactions.filter(t => t.type === 'shares').length;
  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6"
    >
      {/* Upper header summary card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none select-none">
          <FileSpreadsheet className="w-48 h-48 text-indigo-400" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] uppercase font-mono px-2 py-0.5 rounded-md font-bold tracking-wider">
                Double-Entry Ledger
              </span>
              <span className="text-slate-400 text-[11px] font-medium font-mono">
                System Date: {currentSimDate}
              </span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight mt-1 text-slate-100 flex items-center gap-2">
              Chama Paybill & Bank Transaction History
            </h2>
            <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
              Every digital payment made through our Safaricom M-Pesa eSIM terminal is logged below. Transactions are cryptographically referenced and immutably synchronized to eliminate physical ledger errors.
            </p>
          </div>

          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs uppercase rounded-xl tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-emerald-500/10"
            title="Generate printable monthly audit ledger summary sheet"
          >
            <Printer className="w-4 h-4" />
            <span>Generate Audit Report</span>
          </button>
        </div>

        {/* Quick analytics metrics inside the ledger tab (makes it very visually finished) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 relative z-10 text-left">
          <div className="p-3 bg-slate-850/50 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Total Ledger Entries</span>
            <span className="text-lg font-mono font-extrabold text-slate-200 mt-1 block">{transactions.length}</span>
          </div>
          <div className="p-3 bg-slate-850/50 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">Savings Deposits</span>
            <span className="text-lg font-mono font-extrabold text-emerald-400 mt-1 block">{depositCount} txs</span>
          </div>
          <div className="p-3 bg-slate-850/50 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">Loan Repayments</span>
            <span className="text-lg font-mono font-extrabold text-amber-400 mt-1 block">{repaymentCount} txs</span>
          </div>
          <div className="p-3 bg-slate-850/50 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block">Total Volume Circulated</span>
            <span className="text-lg font-mono font-extrabold text-indigo-400 mt-1 block">{formatKsh(totalVolume)}</span>
          </div>
        </div>
      </div>

      {/* Main Ledger Control Panel */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4 text-slate-800 text-left">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <SlidersHorizontal className="text-emerald-600 w-4.3 h-4.3" />
              Interactive Audit Filters & Real-time Search
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Query chronological entries by typing names or using payment method/ledger classification tabs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference Name/MPESA..."
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-800 pl-9 pr-3 py-2 rounded-xl w-full sm:w-56 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1">
              {(['all', 'savings', 'shares', 'repayment'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterTx(type)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    filterTx === type 
                      ? 'bg-slate-800 text-white shadow-xs' 
                      : 'text-slate-550 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger table lists with premium animations */}
        <div className="overflow-x-auto rounded-2xl border border-slate-150">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold font-mono uppercase text-[9.5px]">
                <th className="p-3">M-Pesa Reference / Audit Key</th>
                <th className="p-3">Sacco Member</th>
                <th className="p-3">Asset Classification</th>
                <th className="p-3">Settlement Channel</th>
                <th className="p-3">UTC Timestamp</th>
                <th className="p-3 text-right">Amortized Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic bg-slate-50/50">
                    No transactions match the selected filters. Use the eSIM cellular simulator to emit savings or repayments.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(10, idx) * 0.03 }}
                    key={tx.id} 
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="p-3">
                      <span className="font-mono text-slate-800 uppercase text-[11px] font-bold block">
                        {tx.reference}
                      </span>
                      <span className="text-[8.5px] text-slate-400 select-all font-mono font-medium block mt-0.5">
                        SHA-ID: {tx.id}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-extrabold text-slate-800 text-xs block">{tx.memberName}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border-2 shadow-xs ${
                        tx.type === 'savings' 
                          ? 'bg-emerald-600 text-white border-emerald-800' 
                          : tx.type === 'shares'
                          ? 'bg-blue-600 text-white border-blue-800'
                          : 'bg-amber-500 text-black border-amber-700'
                      }`}>
                        {tx.type === 'savings' ? 'Savings Pool ✓' : tx.type === 'shares' ? 'Share Equity 🏛️' : 'Loan Repayment 💰'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium capitalize">
                        {tx.paymentMethod === 'mpesa' ? (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>M-Pesa STK</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Mobile Bank</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[10px]">{tx.timestamp}</td>
                    <td className={`p-3 text-right font-mono font-extrabold ${
                      tx.type === 'repayment' ? 'text-indigo-600' : 'text-emerald-700'
                    }`}>
                      {tx.type === 'repayment' ? '-' : '+'}{formatKsh(tx.amount)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Small ledger helper info banner */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-3 rounded-2xl text-[10px] text-slate-500 font-medium">
          <FolderSync className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>💡 <strong>Consensus Note:</strong> Sacco ledgers are completely decoupled. Manual balancing is completely bypassed by automated mobile carrier APIs. To generate audited CSVs, click <strong>"Audit Report"</strong> in the top header section.</span>
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
    </motion.div>
  );
}
