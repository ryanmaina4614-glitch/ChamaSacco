import React, { useState, useEffect } from 'react';
import { Member, Loan, GroupConfig } from '../types';
import { 
  ShieldAlert, 
  Users, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  BadgePercent, 
  Calculator, 
  CalendarDays, 
  TrendingDown, 
  Coins, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface LoanGovernanceProps {
  members: Member[];
  loans: Loan[];
  groupConfig: GroupConfig;
  activeMember: Member;
  onApplyNewLoan: (
    amount: number, 
    duration: number, 
    interestType: 'flat' | 'reducing', 
    purpose: string,
    installmentTrack: 'weekly' | 'bi-weekly' | 'monthly',
    guarantorsList?: { memberId: string; memberName: string; amountPledged: number }[]
  ) => void;
  onVoteLoan: (loanId: string, voterId: string, status: 'approve' | 'reject', voterName: string, reason?: string) => void;
  onDisburseLoan: (loanId: string) => void;
  onSignGuarantor?: (loanId: string, guarantorMemberId: string) => void;
}

export default function LoanGovernance({
  members,
  loans,
  groupConfig,
  activeMember,
  onApplyNewLoan,
  onVoteLoan,
  onDisburseLoan,
  onSignGuarantor
}: LoanGovernanceProps) {
  const baseInterestRate = 5; // 5% per cycle (monthly)

  // Primary request form configuration state
  const [applyAmount, setApplyAmount] = useState<string>('12000');
  const [applyDuration, setApplyDuration] = useState<number>(3);
  const [applyInterestType, setApplyInterestType] = useState<'flat' | 'reducing'>('flat');
  const [applyInstallmentTrack, setApplyInstallmentTrack] = useState<'weekly' | 'bi-weekly' | 'monthly'>('monthly');
  const [applyPurpose, setApplyPurpose] = useState<string>('Restocking retail kiosk inventory & seed purchase');
  const [applyError, setApplyError] = useState<string>('');

  // Guarantor pooling state
  const [pledges, setPledges] = useState<{ memberId: string; memberName: string; amountPledged: number }[]>([]);
  const [tempGuarantorId, setTempGuarantorId] = useState<string>('');
  const [tempPledgeAmount, setTempPledgeAmount] = useState<string>('');

  // Dual mode: Allows custom inputs inside the preview calculator card that sync with the state
  const handleAmountChange = (val: string) => {
    setApplyAmount(val);
  };

  // Helper date calculation for schedule preview starts from current simulation date (fallback to today)
  const calculateDueDate = (installmentIndex: number, track: 'weekly' | 'bi-weekly' | 'monthly') => {
    const defaultStart = new Date("2026-06-10");
    const resultDate = new Date(defaultStart);
    
    if (track === 'weekly') {
      resultDate.setDate(defaultStart.getDate() + (installmentIndex * 7));
    } else if (track === 'bi-weekly') {
      resultDate.setDate(defaultStart.getDate() + (installmentIndex * 14));
    } else {
      resultDate.setMonth(defaultStart.getMonth() + installmentIndex);
    }

    return resultDate.toLocaleDateString('en-KE', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Advanced repayment calculations supporting multi-track periodicity and reducing schedules
  const calculateAmortization = (
    principal: number, 
    months: number, 
    type: 'flat' | 'reducing', 
    track: 'weekly' | 'bi-weekly' | 'monthly'
  ) => {
    // Determine number of installments based on frequency track over the month duration
    let periodsPerMonth = 1;
    if (track === 'weekly') periodsPerMonth = 4;
    else if (track === 'bi-weekly') periodsPerMonth = 2;

    const totalInstallments = months * periodsPerMonth;
    
    // Divide base monthly interest rate across periods safely
    const nominalRatePerCycle = (baseInterestRate / 100) / periodsPerMonth;
    
    let totalInterest = 0;
    const schedule: { 
      index: number; 
      dueDate: string;
      principalRepayment: number; 
      interestRepayment: number; 
      totalPayment: number; 
      remainingBalance: number;
    }[] = [];

    if (type === 'flat') {
      // Flat computation: Interest is static based on initial principal
      totalInterest = principal * (baseInterestRate / 100) * months;
      const interestPerInstallment = totalInterest / totalInstallments;
      const principalPerInstallment = principal / totalInstallments;
      const totalPerInstallment = principalPerInstallment + interestPerInstallment;
      
      let outstanding = principal + totalInterest;

      for (let i = 1; i <= totalInstallments; i++) {
        outstanding -= totalPerInstallment;
        schedule.push({
          index: i,
          dueDate: calculateDueDate(i, track),
          principalRepayment: principalPerInstallment,
          interestRepayment: interestPerInstallment,
          totalPayment: totalPerInstallment,
          remainingBalance: Math.max(0, outstanding)
        });
      }
    } else {
      // Reducing balance: Interest is calculated over remaining active principal
      let remainingPrincipal = principal;
      const principalPerInstallment = principal / totalInstallments;
      
      for (let i = 1; i <= totalInstallments; i++) {
        const interestThisCycle = remainingPrincipal * nominalRatePerCycle;
        totalInterest += interestThisCycle;
        const totalPaidThisCycle = principalPerInstallment + interestThisCycle;
        remainingPrincipal -= principalPerInstallment;

        schedule.push({
          index: i,
          dueDate: calculateDueDate(i, track),
          principalRepayment: principalPerInstallment,
          interestRepayment: interestThisCycle,
          totalPayment: totalPaidThisCycle,
          remainingBalance: Math.max(0, remainingPrincipal)
        });
      }
    }

    const totalRepayable = principal + totalInterest;
    const regularInstallment = totalRepayable / totalInstallments;

    return {
      totalInstallments,
      totalInterest,
      totalRepayable,
      regularInstallment,
      schedule
    };
  };

  const parsedAmount = Math.max(0, parseFloat(applyAmount) || 0);
  const termsResult = calculateAmortization(parsedAmount, applyDuration, applyInterestType, applyInstallmentTrack);

  // Submit loan application triggers
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(applyAmount);
    const limit = activeMember.totalSavings * 3;

    if (isNaN(amt) || amt <= 0) {
      setApplyError("Please specify a valid principal amount.");
      return;
    }

    if (amt > limit) {
      setApplyError(`Limit Denied! Applied Ksh ${amt.toLocaleString()}. Your maximum borrow limit is capped at 3x savings (Ksh ${limit.toLocaleString()}). Save more to unlock larger pools!`);
      return;
    }

    if (amt > groupConfig.vaultBalance) {
      setApplyError(`The Chama vault balance is currently Ksh ${groupConfig.vaultBalance.toLocaleString()}. The group cannot finance this loan level today.`);
      return;
    }

    setApplyError('');
    onApplyNewLoan(amt, applyDuration, applyInterestType, applyPurpose, applyInstallmentTrack, pledges);
    
    // Reset inputs
    setApplyAmount('12000');
    setApplyPurpose('Retail restocking');
    setApplyInstallmentTrack('monthly');
    setPledges([]);
    alert("Loan application uploaded successfully! Please secure at least 2 executive signatures below.");
  };

  const getVoteStatus = (loan: Loan, committeeMemberId: string) => {
    return loan.votes[committeeMemberId];
  };

  const getApprovalCount = (loan: Loan) => {
    return Object.values(loan.votes).filter(v => v === 'approve').length;
  };

  const formatKsh = (amount: number) => {
    return 'Ksh ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6">
      
      {/* Intro section */}
      <div className="bg-gradient-to-r from-emerald-50 to-indigo-50/50 border border-slate-150 p-6 rounded-2xl">
        <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <BadgePercent className="text-emerald-600 w-5.5 h-5.5 shrink-0" />
          Collateral-Free Table Lending & Governance
        </h2>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
          Members borrow collaboratively from aggregated reserves under community interest formulas. No bank credit scores required—instead, creditworthiness is guaranteed securely by mutual handshake, fellow guarantor pledges, and 100% auditable ledger transparency.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Request Microloan input form (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5 text-slate-800">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800">Request Chama Microloan</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Enter details to generate your digital approval schedule. Borrow limit is capped relative to your saved capital indicators.</p>
          </div>

          <form onSubmit={handleApply} className="space-y-4 text-xs">
            
            {/* Applicant trust status */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase tracking-wider">APPLICANT SIGNATURE</span>
                <span className="font-extrabold text-slate-800 text-xs">{activeMember.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase tracking-wider">COLLATERAL CEILING (3x)</span>
                <span className="font-extrabold text-emerald-700 font-mono text-xs block">
                  {formatKsh(activeMember.totalSavings * 3)}
                </span>
              </div>
            </div>

            {/* Principal value Selector */}
            <div className="space-y-1.5">
              <label className="text-slate-700 block text-[11px] font-extrabold uppercase tracking-wide">Principal Currency Level (Ksh)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 font-mono text-slate-400 font-bold">Ksh</span>
                <input
                  type="number"
                  value={applyAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 pl-11 text-slate-800 w-full text-xs font-mono font-extrabold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  placeholder="e.g. 10000"
                  required
                />
              </div>
            </div>

            {/* Sliders or Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 block text-[11px] font-extrabold uppercase tracking-wide mb-1.5">Amortization Period</label>
                <select
                  value={applyDuration}
                  onChange={(e) => setApplyDuration(parseInt(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 w-full text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                >
                  <option value={1}>1 Month Duration</option>
                  <option value={2}>2 Months Duration</option>
                  <option value={3}>3 Months Duration</option>
                  <option value={6}>6 Months Duration</option>
                  <option value={12}>12 Months Duration</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-extrabold uppercase tracking-wide mb-1.5">Interest Formula</label>
                <select
                  value={applyInterestType}
                  onChange={(e) => setApplyInterestType(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 w-full text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                >
                  <option value="flat">Flat Interest Rate (5% / mo)</option>
                  <option value="reducing">Reducing Balance Rate (5% / mo)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-700 block text-[11px] font-extrabold uppercase tracking-wide mb-1.5">Installment Cycle Track</label>
                <select
                  value={applyInstallmentTrack}
                  onChange={(e) => setApplyInstallmentTrack(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 w-full text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                >
                  <option value="monthly">Monthly Repayments</option>
                  <option value="bi-weekly">Bi-weekly Cycles (Fortnightly)</option>
                  <option value="weekly">Weekly Cycles (Every 7 Days)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-extrabold uppercase tracking-wide mb-1.5">Purpose Statement</label>
                <input
                  type="text"
                  value={applyPurpose}
                  onChange={(e) => setApplyPurpose(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 w-full text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  placeholder="e.g. Cattle purchase"
                  required
                />
              </div>
            </div>

            {/* Guarantor pooling input and list */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className="text-[10px] text-indigo-700 uppercase tracking-widest font-extrabold block">Community Guarantor Pledges (Trust Matrix)</span>
              <p className="text-[11px] text-slate-500">Chama security convention: request co-members to back this application using their private savings as a buffer.</p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={tempGuarantorId}
                  onChange={(e) => setTempGuarantorId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-[11px] focus:outline-none w-full sm:w-1/2 font-bold focus:bg-white transition"
                >
                  <option value="">-- Choose Guarantor --</option>
                  {members.filter(m => m.id !== activeMember.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({formatKsh(m.totalSavings)} Savings)</option>
                  ))}
                </select>
                <div className="flex gap-1.5 w-full sm:w-1/2">
                  <input
                    type="number"
                    placeholder="Pledge (Ksh)"
                    value={tempPledgeAmount}
                    onChange={(e) => setTempPledgeAmount(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-[11px] w-full font-mono font-bold focus:outline-none focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!tempGuarantorId) return;
                      const gMember = members.find(m => m.id === tempGuarantorId);
                      if (!gMember) return;
                      const amt = Number(tempPledgeAmount);
                      if (isNaN(amt) || amt <= 0) {
                        alert("Please specify a valid pledge amount.");
                        return;
                      }
                      if (amt > gMember.totalSavings) {
                        alert(`Action Denied! Pledge of Ksh ${amt.toLocaleString()} exceeds this guarantor's actual active savings pool of ${formatKsh(gMember.totalSavings)}.`);
                        return;
                      }
                      if (pledges.some(p => p.memberId === tempGuarantorId)) {
                        alert("This guarantor is already staged for this loan.");
                        return;
                      }
                      setPledges(prev => [...prev, { memberId: gMember.id, memberName: gMember.name, amountPledged: amt }]);
                      setTempGuarantorId('');
                      setTempPledgeAmount('');
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-155 rounded-xl px-4 text-[11px] transition font-extrabold shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {pledges.length > 0 && (
                <div className="space-y-1.5 mt-2 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 text-[11px]">
                  <span className="text-[10px] text-indigo-800 font-extrabold block mb-1 uppercase tracking-tight">Active Staged Guarantor Commitments:</span>
                  {pledges.map((p, pIdx) => (
                    <div key={pIdx} className="flex justify-between items-center text-slate-750 font-medium">
                      <span>👤 {p.memberName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-indigo-650 font-extrabold">{formatKsh(p.amountPledged)}</span>
                        <button
                          type="button"
                          onClick={() => setPledges(prev => prev.filter((_, i) => i !== pIdx))}
                          className="text-red-500 hover:text-red-700 font-bold px-1.5 bg-slate-200/50 hover:bg-slate-200/80 rounded transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {applyError && (
              <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200/80 text-rose-800 flex items-start gap-2 leading-relaxed">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-rose-500" />
                <span className="text-[11px] font-medium">{applyError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition text-xs shadow-md cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] tracking-wider"
            >
              Submit Signed Loan Request for Board Review
            </button>
          </form>
        </div>


        {/* Right Hand: LOAN AMORTIZATION PREVIEW component (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5 text-slate-800 relative">
          
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Calculator className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                Loan Amortization Preview
              </h3>
              <p className="text-[11px] text-slate-505 mt-0.5">Real-time projection schedule generated live from input targets.</p>
            </div>
            <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 rounded px-2 py-0.5 font-mono font-bold">
              5% / mo rate
            </span>
          </div>

          {/* Live Amortization Sliders */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-4">
            
            {/* Quick amount preview and manual visual slider */}
            <div>
              <div className="flex justify-between font-mono text-[10px] mb-1.5">
                <span className="text-slate-550 font-bold uppercase">PREVIEW PRINCIPAL</span>
                <span className="text-slate-800 font-extrabold text-xs">{formatKsh(parsedAmount)}</span>
              </div>
              <input
                type="range"
                min={2000}
                max={60000}
                step={2000}
                value={parsedAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                className="w-full accent-emerald-600 bg-slate-200 rounded-lg appearance-none h-1 cursor-pointer"
              />
            </div>

            {/* Quick toggle duration inside the visualizer */}
            <div>
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-slate-550 font-bold uppercase">REPAYMENT TIMESTEP</span>
                <span className="text-indigo-600 font-bold">{applyDuration} Month{applyDuration > 1 ? 's' : ''} duration</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 6].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setApplyDuration(m)}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-extrabold border transition cursor-pointer text-center ${
                      applyDuration === m 
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700' 
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {m} Mo
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics of the calculated loan payment structure */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex flex-col justify-center">
              <span className="text-slate-400 text-[8px] uppercase font-mono font-extrabold">Total periods</span>
              <span className="text-slate-800 font-bold mt-1 font-mono">{termsResult.totalInstallments} payments</span>
            </div>
            
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex flex-col justify-center">
              <span className="text-slate-400 text-[8px] uppercase font-mono font-extrabold">Total Interest</span>
              <span className="text-indigo-600 font-bold mt-1 font-mono">{formatKsh(termsResult.totalInterest)}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex flex-col justify-center">
              <span className="text-slate-400 text-[8px] uppercase font-mono font-extrabold">Repayable Sum</span>
              <span className="text-emerald-700 font-extrabold mt-1 font-mono">{formatKsh(termsResult.totalRepayable)}</span>
            </div>
          </div>

          {/* Visual Percentage Breakdown Bar of Principal vs Interest */}
          {parsedAmount > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-slate-500 px-1 font-sans">
                <span>Principal: {((parsedAmount / termsResult.totalRepayable) * 100).toFixed(0)}%</span>
                <span>Interest Load: {((termsResult.totalInterest / termsResult.totalRepayable) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 flex">
                <div 
                  style={{ width: `${(parsedAmount / termsResult.totalRepayable) * 100}%` }}
                  className="bg-emerald-500 h-full"
                />
                <div 
                  style={{ width: `${(termsResult.totalInterest / termsResult.totalRepayable) * 100}%` }}
                  className="bg-indigo-500 h-full"
                />
              </div>
            </div>
          )}

          {/* Detailed Repayment Schedule table list */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-extrabold uppercase">
              <CalendarDays className="w-3.5 h-3.5 text-slate-550" />
              <span>Projected Repayment Schedule List</span>
            </div>

            {parsedAmount <= 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 italic text-[11px]">
                Enter a positive capital amount to view schedule intervals.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-xl border border-slate-150 p-2.5 custom-scrollbar">
                <table className="w-full text-left text-[10px] font-medium leading-relaxed font-mono">
                  <thead>
                    <tr className="text-slate-400 uppercase border-b border-slate-200/80">
                      <th className="pb-1.5 font-bold">Due Step</th>
                      <th className="pb-1.5 font-bold">Due Date</th>
                      <th className="pb-1.5 font-bold">Principal Repay</th>
                      <th className="pb-1.5 font-bold text-right">Payment Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {termsResult.schedule.map((sc) => (
                      <tr key={sc.index} className="text-slate-700 hover:bg-slate-100/50 transition">
                        <td className="py-2.5 font-bold text-slate-900">#{sc.index}</td>
                        <td className="py-2.5 text-slate-550 font-sans">{sc.dueDate}</td>
                        <td className="py-2.5">Ksh {sc.principalRepayment.toFixed(0)}</td>
                        <td className="py-2.5 text-right font-extrabold text-emerald-700">Ksh {sc.totalPayment.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Simple explanation reminder badge */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-slate-600 leading-normal font-sans">
              <strong>Table Banking Rule</strong>: Interest returns directly to the group vault pool. At the end of the yearly rotation cycle, 100% of collected interest is paid back to members as equity dividends based on individual shares owned!
            </p>
          </div>

        </div>

      </div>

      {/* Guarantor Signature Workspace */}
      {loans.some(l => l.status === 'pending' && l.guarantors?.some(g => g.memberId === activeMember.id && g.status === 'pending')) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-extrabold text-indigo-800 flex items-center gap-1.5">
              🛡️ Active Guarantor Sign-Off Requests ({activeMember.name})
            </h3>
            <p className="text-[11px] text-slate-505">Fellow members have requested you to pledge a portion of your saving deposits as underlying trust collateral to backing their borrowing.</p>
          </div>
          <div className="space-y-3">
            {loans.filter(l => l.status === 'pending' && l.guarantors?.some(g => g.memberId === activeMember.id && g.status === 'pending')).map(l => {
              const myPledge = l.guarantors?.find(g => g.memberId === activeMember.id && g.status === 'pending');
              return (
                <div key={l.id} className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-sans">
                  <div>
                    <span className="font-extrabold text-slate-800 text-[13px]">{l.memberName}</span> has requested you to sign off a <strong className="text-indigo-650 font-mono font-extrabold">{formatKsh(myPledge?.amountPledged || 0)}</strong> collateral pledge.
                    <p className="text-[11px] text-slate-500 mt-1">Requested Loan Level: {formatKsh(l.principal)} • Installment Period: <span className="font-mono text-slate-700 capitalize font-bold">{l.installmentTrack}</span> • Purpose Given: "{l.purpose}"</p>
                  </div>
                  <button
                    onClick={() => {
                      if (onSignGuarantor) {
                        onSignGuarantor(l.id, activeMember.id);
                        alert("Pledge successfully authorized & signed!");
                      }
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-xl transition uppercase tracking-wider shadow-sm shrink-0 cursor-pointer active:scale-95"
                  >
                    Authorize Pledge Security
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Governance Approvals Consensus panel (Critical Chama compliance section) */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-xs text-slate-800">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <Users className="text-emerald-600 w-4.5 h-4.5 shrink-0" />
            Consensus and Core Voting Logs
          </h3>
          <p className="text-[11px] text-slate-500">Under standard table banking. disbursements are only unlocked once mutual board signatures are uploaded. Toggle consensus votes below to release funds.</p>
        </div>

        <div className="space-y-4">
          {loans.filter(l => l.status === 'pending').length === 0 ? (
            <div className="bg-slate-50 text-center py-10 rounded-2xl border border-slate-150 text-slate-400 italic text-xs">
              No pending loan requests in progress. Formulate a request above to initialize the consensus round.
            </div>
          ) : (
            loans.filter(l => l.status === 'pending').map((loan) => {
              const eligibleVoters = members.filter(m => m.id !== loan.memberId); // voter cannot be the borrower
              const approvedCount = getApprovalCount(loan);
              const allGuarantorsSigned = !loan.guarantors || loan.guarantors.every(g => g.status === 'signed');
              const isDisbursable = approvedCount >= 2 && allGuarantorsSigned;

              return (
                <div key={loan.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4 text-xs">
                  
                  {/* Ledger header summary */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200/50 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-800 text-sm">{loan.memberName}</span>
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-lg font-mono font-extrabold uppercase">
                          Awaiting Sign-offs
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        Principal requested: <strong className="text-slate-800">{formatKsh(loan.amountApplied)}</strong> • Formula: <span className="text-slate-700 uppercase font-extrabold font-mono text-[10px]">{loan.interestType}</span> • Frequency: <span className="text-indigo-600 font-extrabold uppercase text-[9px]">{loan.installmentTrack}</span>
                        <br />
                        <span className="italic text-slate-550 font-medium">Applied for: "{loan.purpose}"</span>
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Consensus progress tracker</span>
                      <span className="text-xs font-mono text-slate-700 font-extrabold block mt-0.5">{approvedCount} of 2 votes secured</span>
                    </div>
                  </div>

                  {/* Guarantor Status Tracker list inside each loan */}
                  {loan.guarantors && loan.guarantors.length > 0 && (
                    <div className="bg-white p-3.5 rounded-xl border border-slate-150 space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Security Guarantors Pledge Tracker ({loan.guarantors.filter(g => g.status === 'signed').length} of {loan.guarantors.length} Signed)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {loan.guarantors.map((g, gi) => (
                          <div key={gi} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg text-[11px] border border-slate-100">
                            <span className="font-medium text-slate-750">👤 {g.memberName}</span>
                            <span className={`font-mono text-[10px] font-bold ${g.status === 'signed' ? 'text-emerald-700' : 'text-amber-600'}`}>
                              {g.status === 'signed' ? `Signed (${formatKsh(g.amountPledged)})` : `Pending Sign (${formatKsh(g.amountPledged)})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                   {/* Circle layout signature toggle buttons */}
                  <div className="flex flex-col items-stretch gap-4 pt-1">
                    <div className="space-y-1 w-full text-left">
                      <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold tracking-wider">BOARD EXECUTIVE ASSESSMENT PANELS (CHAIRPERSON & TREASURER ONLY)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                        {members.filter(m => m.role === 'chairperson' || m.role === 'treasurer' || m.id === 'mem_1' || m.id === 'mem_2').map((cm) => {
                          const currentVoteObj = loan.votesWithReason?.[cm.id] || { status: loan.votes[cm.id], reason: '' };
                          const vote = currentVoteObj.status;
                          const hasVoted = !!vote;
                          
                          // Check if active user is exactly this committee member to let them click the buttons and type reasons
                          const isSelf = activeMember.id === cm.id;

                          return (
                            <div key={cm.id} className="bg-white p-3 rounded-xl border border-slate-150 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide flex items-center gap-1">
                                  👤 {cm.name} 
                                  <span className="text-[9px] bg-indigo-50 text-indigo-600 rounded px-1.5 py-0.5 lowercase">({cm.role || 'board member'})</span>
                                </span>
                                
                                {vote ? (
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                    vote === 'approve' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    {vote === 'approve' ? 'Approved ✓' : 'Denied ✗'}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 italic">No decision logged</span>
                                )}
                              </div>

                              {/* Display existing reasons */}
                              {currentVoteObj.reason ? (
                                <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 border border-slate-100 italic">
                                  "{currentVoteObj.reason}"
                                </div>
                              ) : null}

                              {/* Casting options for authorized person */}
                              {isSelf ? (
                                <div className="space-y-2 pt-1 border-t border-slate-100">
                                  <label className="text-[10px] text-zinc-400 font-semibold block">State your assessment rationale (Required to vote):</label>
                                  <input
                                    type="text"
                                    id={`reason-input-${loan.id}-${cm.id}`}
                                    placeholder="Enter decision notes..."
                                    defaultValue={currentVoteObj.reason || ''}
                                    className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded focus:border-indigo-500 focus:outline-none text-slate-800"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const el = document.getElementById(`reason-input-${loan.id}-${cm.id}`) as HTMLInputElement;
                                        const rText = el?.value || '';
                                        if (!rText.trim()) {
                                          alert("You must provide a shared reason to approve this loan.");
                                          return;
                                        }
                                        onVoteLoan(loan.id, cm.id, 'approve', cm.name, rText.trim());
                                      }}
                                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-[10px] uppercase rounded transition"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const el = document.getElementById(`reason-input-${loan.id}-${cm.id}`) as HTMLInputElement;
                                        const rText = el?.value || '';
                                        if (!rText.trim()) {
                                          alert("You must provide a shared reason to deny this loan.");
                                          return;
                                        }
                                        onVoteLoan(loan.id, cm.id, 'reject', cm.name, rText.trim());
                                      }}
                                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase rounded transition"
                                    >
                                      Deny
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                !hasVoted && (
                                  <p className="text-[10px] text-slate-400 italic">Awaiting active login session of {cm.name} to cast vote.</p>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Disbursement mechanism trigger */}
                    <div className="flex justify-end pt-2 border-t border-slate-150/50">
                      {isDisbursable ? (
                        <button
                          onClick={() => {
                            onDisburseLoan(loan.id);
                            alert("Safaricom M-Pesa automated transaction successfully completed! Principal cash disbursed to client.");
                          }}
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-black font-extrabold py-2.5 px-5 rounded-xl border border-emerald-500 shadow-sm transition text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                          Simulate M-Pesa Disbursement
                        </button>
                      ) : (
                        <div className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-slate-500 text-[11px] flex gap-2 items-start leading-tight">
                          <XCircle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                          <span>
                            {!allGuarantorsSigned 
                              ? 'Waiting for all requested guarantors to authorize their savings pledge.' 
                              : `Requires approvals from both Chairperson and Treasurer (Current approvals: ${approvedCount}/2).`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
