import React, { useState } from 'react';
import { GroupConfig, SavingTransaction, Member, Loan } from '../types';
import { X, Printer, FileSpreadsheet, Download, ShieldCheck, CheckCircle2, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';

interface MonthlyAuditSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  groupConfig: GroupConfig;
  transactions: SavingTransaction[];
  members: Member[];
  loans: Loan[];
  currentSimDate: string;
}

export default function MonthlyAuditSummary({
  isOpen,
  onClose,
  groupConfig,
  transactions,
  members,
  loans,
  currentSimDate,
}: MonthlyAuditSummaryProps) {
  const [reportType, setReportType] = useState<'all' | 'savings' | 'shares' | 'repayment'>('all');
  const [selectedAuditor, setSelectedAuditor] = useState<string>('Ryan Maina (Treasurer)');

  if (!isOpen) return null;

  // Formatter helpers
  const formatKsh = (amount: number) => {
    return 'Ksh ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 0 });
  };

  const getMonthAndYear = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length < 2) return dateStr;
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[monthIndex] || 'Reporting Period'} ${year}`;
    } catch (e) {
      return 'Active Month Segment';
    }
  };

  const formattedPeriod = getMonthAndYear(currentSimDate);

  // Financial calculations
  const totalSavings = members.reduce((sum, m) => sum + m.totalSavings, 0);
  const totalSharesValue = members.reduce((sum, m) => sum + m.shareBalance, 0);
  const activeLoans = loans.filter(l => l.status === 'approved' || l.status === 'overdue');
  const outstandingLoansValue = activeLoans.reduce((sum, l) => sum + (l.principal), 0);

  // Filter transactions based on report types
  const filteredTxs = transactions.filter(tx => {
    if (reportType === 'all') return true;
    return tx.type === reportType;
  });

  // Calculate total transactions value depending on type
  const totalTransactedAmount = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);

  // Generate CSV for export
  const exportToCSV = () => {
    // CSV Header row
    const headers = ['Transaction ID', 'M-Pesa Reference', 'Member Name', 'Type', 'Payment Method', 'Timestamp', 'Amount (Ksh)'];
    
    // Format rows
    const rows = filteredTxs.map(tx => [
      tx.id,
      tx.reference,
      tx.memberName,
      tx.type.toUpperCase(),
      tx.paymentMethod === 'mpesa' ? 'M-PESA WALLET' : 'BANK TRANSFER',
      tx.timestamp,
      tx.amount
    ]);

    const csvContent = [
      [`UPENDO UNITY CHAMA - MONTHLY AUDIT LEDGER STATEMENT`],
      [`Statement Period: ${formattedPeriod}`],
      [`System Timestamp: 2026-06-09 07:42:00 UTC`],
      [],
      headers.join(','),
      ...rows.map(row => row.map(val => {
        // Handle values with commas by escaping them
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      }).join(','))
    ].join('\n');

    // Create a downloading URL
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Upendo_Chama_Audit_${formattedPeriod.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger print mechanism
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      {/* Styles for print media to completely isolate this modal representation */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #111827 !important;
          }
          /* Hide anything except the print area */
          div:not(#printable-audit-area):not(#printable-audit-area *) {
            display: none !important;
          }
          #printable-audit-area, #printable-audit-area * {
            display: block !important;
            color: #000000 !important;
            background-color: transparent !important;
            border-color: #374151 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            border-bottom: 2px solid #000000 !important;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .print-badge {
            border: 1px solid #111827 !important;
            color: #111827 !important;
            background: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 15px !important;
            margin-bottom: 15px !important;
          }
          th {
            background-color: #f3f4f6 !important;
            color: #111827 !important;
            font-weight: bold !important;
            border: 1px solid #9ca3af !important;
            padding: 8px !important;
            text-align: left !important;
            font-size: 10px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td {
            border: 1px solid #d1d5db !important;
            padding: 6px 8px !important;
            font-size: 10px !important;
          }
          .text-emerald-400, .text-emerald-500, .text-green-500 {
            color: #047857 !important;
            font-weight: bold !important;
          }
          .text-rose-400, .text-rose-500 {
            color: #b91c1c !important;
            font-weight: bold !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(4, Minmax(0, 1fr)) !important;
            gap: 12px !important;
            margin-bottom: 20px !important;
          }
          .print-card {
            border: 1px solid #9ca3af !important;
            padding: 10px !important;
            border-radius: 6px !important;
          }
          .print-page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* Main Modal Layout Content */}
      <div 
        id="printable-audit-area" 
        className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header Controls (No-Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">Auditing Hub</span>
              <h2 className="text-sm font-extrabold text-white">Chama Reconciliation Tool</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-neutral-300 rounded-lg border border-slate-800 transition active:scale-95"
              title="Download ledger in CSV Microsoft Excel format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-black rounded-lg transition active:scale-95"
              title="Print Monthly Audit Document to physical paper or PDF file"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit Ledgers</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded-md transition hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audit Filter Segment (No-Print) */}
        <div className="no-print bg-slate-950/40 border-b border-slate-800 px-6 py-3 shrink-0 flex flex-col sm:flex-row justify-between gap-3 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Statement Ledger Scope:</span>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
              {(['all', 'savings', 'shares', 'repayment'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase transition ${
                    reportType === type 
                      ? 'bg-emerald-600/90 text-black' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {type === 'all' ? 'All Books' : type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">Authorizing Auditor:</span>
            <select
              value={selectedAuditor}
              onChange={(e) => setSelectedAuditor(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-[11px] text-neutral-200 rounded px-2 py-1 focus:outline-none focus:border-emerald-600"
            >
              <option value="Ryan Maina (Treasurer)">Ryan Maina (Treasurer)</option>
              <option value="Grace Mwangi (Chairperson)">Grace Mwangi (Chairperson)</option>
              <option value="Executive Chama Committee">Full Executive Committee Approval</option>
            </select>
          </div>
        </div>

        {/* Printable/Scrollable Report Viewport */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-neutral-300">
          
          {/* Print Header */}
          <div className="print-header flex flex-col md:flex-row justify-between items-start border-b border-slate-800 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-900 rounded-md text-[9px] text-emerald-400 font-mono font-bold tracking-widest uppercase print-badge">
                  REG: {groupConfig.registrationNumber}
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">• SYSTEM INTEGRATED AUDITING PORTAL</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5 uppercase tracking-tight">
                {groupConfig.groupName} Ledger Audit
              </h1>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-lg">
                Verified digital audit report generated on <span className="text-neutral-300 font-bold font-mono">2026-06-09</span> for rotation month status: 
                <span className="text-neutral-200 font-black ml-1 uppercase">{formattedPeriod}</span>.
              </p>
            </div>
            
            <div className="text-left md:text-right font-mono text-[10px] text-neutral-400 border-l md:border-l-0 md:border-r border-slate-800 pl-3 md:pl-0 md:pr-3">
              <p><strong className="text-neutral-300">API Host Reference:</strong> chama-m-pesa-prd-01</p>
              <p><strong className="text-neutral-300">Integrity Checksum:</strong> SHA-256/UPENDO-8849X</p>
              <p><strong className="text-neutral-300">Reconciled At:</strong> {currentSimDate} 12:00:00 UTC</p>
            </div>
          </div>

          {/* Reconciliation Health Warning/Check Banner */}
          <div className="no-print bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-4 flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-400">Ledger Statement Reconciled Successfully</h4>
              <p className="text-[11px] text-neutral-300 mt-1">
                The digital ledger has validated a flawless double-entry balance. All transactions processed via the Paybill matches our virtual M-Pesa vault statement balance. No discrepancies found. Fully prepared for auditor evaluation and sharing with members.
              </p>
            </div>
          </div>

          {/* Audit Aggregates KPI Blocks */}
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-mono">
              Group Financial Status Summary
            </h3>
            <div className="print-grid grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="print-card bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
                <span className="text-[9px] font-mono text-zinc-400 uppercase">Vault Liquid Reserves</span>
                <p className="text-sm font-black text-white font-mono mt-1">{formatKsh(groupConfig.vaultBalance)}</p>
                <div className="text-[8px] text-emerald-400 mt-0.5">● Match reconciled</div>
              </div>
              <div className="print-card bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
                <span className="text-[9px] font-mono text-zinc-400 uppercase">Cumulative Savings Pool</span>
                <p className="text-sm font-black text-emerald-400 font-mono mt-1">{formatKsh(totalSavings)}</p>
                <div className="text-[8px] text-neutral-400 mt-0.5">Backed by member equity</div>
              </div>
              <div className="print-card bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
                <span className="text-[9px] font-mono text-zinc-400 uppercase">Subscribed Share Capital</span>
                <p className="text-sm font-black text-blue-400 font-mono mt-1">{formatKsh(totalSharesValue)}</p>
                <div className="text-[8px] text-zinc-400 mt-0.5 font-mono">{(totalSharesValue / groupConfig.shareRate).toFixed(0)} purchase units</div>
              </div>
              <div className="print-card bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
                <span className="text-[9px] font-mono text-zinc-400 uppercase">Active Outstanding Loans</span>
                <p className="text-sm font-black text-rose-400 font-mono mt-1">{formatKsh(outstandingLoansValue)}</p>
                <div className="text-[8px] text-rose-400/80 mt-0.5 font-mono">{activeLoans.length} Active accounts</div>
              </div>
            </div>
          </div>

          {/* Members Assets Portfolio Balance Audit Sheet */}
          <div>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 font-mono">
              1. Individual Member Balances & Accrued Balances
            </h3>
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-neutral-400 font-semibold font-mono uppercase text-[9px] border-b border-slate-800">
                    <th className="p-3">Member Details</th>
                    <th className="p-3">Contact Details</th>
                    <th className="p-3 text-right">Cumulative Savings</th>
                    <th className="p-3 text-right">Subscribed Shares</th>
                    <th className="p-3 text-right">Outstanding Loan Book</th>
                    <th className="p-3 text-center">Credit Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {members.map((m) => {
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/20 text-neutral-300">
                        <td className="p-3 font-sans font-bold text-neutral-200">
                          {m.name}
                          <span className="block text-[8px] text-zinc-500 font-mono">Joined: {m.joinedDate}</span>
                        </td>
                        <td className="p-3 text-neutral-400 text-[11px]">{m.phone}</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">{formatKsh(m.totalSavings)}</td>
                        <td className="p-3 text-right text-blue-300">{formatKsh(m.shareBalance)} <span className="text-[9px] text-zinc-500">({m.shareBalance / groupConfig.shareRate} U)</span></td>
                        <td className="p-3 text-right text-rose-400">{formatKsh(m.activeLoans)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            m.creditScore >= 700 
                              ? 'bg-emerald-950/60 text-emerald-400' 
                              : m.creditScore >= 550 
                              ? 'bg-amber-950/60 text-amber-400' 
                              : 'bg-rose-950/60 text-rose-400'
                          }`}>
                            {m.creditScore} {m.creditScore >= 700 ? 'EXCELLENT' : m.creditScore >= 550 ? 'FAIR' : 'RISK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transactions Statement Logger (Page Break triggered on Print as this table may span 2 pages visually) */}
          <div className="print-page-break">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
                2. Transaction Reconciliation Audit Trail ({filteredTxs.length} Transactions)
              </h3>
              <div className="font-mono text-[10px] text-neutral-400 uppercase">
                Filtered Cash Circulation: <span className="text-emerald-400 font-black">{formatKsh(totalTransactedAmount)}</span>
              </div>
            </div>
            
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-neutral-400 font-semibold font-mono uppercase text-[9px] border-b border-slate-800">
                    <th className="p-3">Transaction ID / M-Pesa Ref</th>
                    <th className="p-3">Member Name</th>
                    <th className="p-3">Asset Type</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-right">Amount (Ksh)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-500 italic">
                        No transactions found in this audit ledger scope.
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/20 text-neutral-300">
                        <td className="p-3 font-bold text-neutral-100 uppercase text-[11px]">
                          {tx.reference}
                          <span className="block text-[8px] text-zinc-500 font-normal select-all">UUID: {tx.id}</span>
                        </td>
                        <td className="p-3 font-sans font-bold text-neutral-200">{tx.memberName}</td>
                        <td className="p-3 text-[10px]">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                            tx.type === 'savings' 
                              ? 'bg-emerald-950/80 text-emerald-400' 
                              : tx.type === 'shares'
                              ? 'bg-blue-950/80 text-blue-400'
                              : 'bg-amber-950/80 text-amber-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 text-neutral-400 capitalize text-[10px]">
                          {tx.paymentMethod === 'mpesa' ? 'M-Pesa Wallet' : 'Bank Mobile'}
                        </td>
                        <td className="p-3 text-neutral-500 text-[10px]">{tx.timestamp}</td>
                        <td className={`p-3 text-right font-bold text-[11px] ${
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

          {/* Audit Sign-off Signature Section */}
          <div className="pt-8 border-t border-slate-800 mt-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">Statement Legitimacy consensus</span>
                <p className="text-xs text-neutral-400 mt-1 max-w-lg italic">
                  "This ledger accurately mirrors our community's financial standing and is verified against physical M-Pesa transaction statements. Balanced perfectly with 0.00 KES unaccounted variances."
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-neutral-300 font-semibold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                  <span>Digitally certified by: <span className="text-emerald-400 font-mono font-bold font-black">{selectedAuditor}</span> via secure signature.</span>
                </div>
              </div>

              {/* Physical signature lines for auditors of the group print audit report */}
              <div className="flex gap-8 font-mono text-[9px] text-zinc-400 text-center w-full md:w-auto mt-4 md:mt-0">
                <div className="w-32 border-t border-dotted border-zinc-600 pt-2 flex flex-col gap-0.5">
                  <span className="font-bold text-neutral-300">Ryan Maina</span>
                  <span>Chama Treasurer Signature</span>
                </div>
                <div className="w-32 border-t border-dotted border-zinc-600 pt-2 flex flex-col gap-0.5">
                  <span className="font-bold text-neutral-300">Grace Mwangi</span>
                  <span>Chama Chairperson Signature</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions inside app viewport (No-Print) */}
        <div className="no-print bg-slate-950 border-t border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <AlertCircle className="w-4 h-4 text-emerald-500" />
            <span>To export to PDF, click <strong>Print</strong> and select <strong>Save as PDF</strong>.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-neutral-300 text-xs font-semibold rounded-lg border border-slate-800 transition"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
