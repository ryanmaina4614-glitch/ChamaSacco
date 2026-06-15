import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Member, SavingTransaction, SMSMessage } from '../types';
import { 
  Heart, 
  Coins, 
  ShieldAlert, 
  Calculator, 
  CheckCircle, 
  HelpCircle, 
  User, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { saveTransaction, saveSMSMessage, saveMember } from '../lib/chamaService';

interface ChamaPillarsProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  transactions: SavingTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<SavingTransaction[]>>;
  smsMessages: SMSMessage[];
  setSmsMessages: React.Dispatch<React.SetStateAction<SMSMessage[]>>;
  currentSimDate: string;
  welfareBalance: number;
  setWelfareBalance: React.Dispatch<React.SetStateAction<number>>;
  isOnline: boolean;
  activeGroupId: string | null;
  groupName: string;
}

export default function ChamaPillars({
  members,
  setMembers,
  transactions,
  setTransactions,
  smsMessages,
  setSmsMessages,
  currentSimDate,
  welfareBalance,
  setWelfareBalance,
  isOnline,
  activeGroupId,
  groupName
}: ChamaPillarsProps) {
  // Tabs for sub-component views
  const [pillarSubTab, setPillarSubTab] = useState<'welfare' | 'asca_shareout'>('welfare');
  const [showWelfareHelp, setShowWelfareHelp] = useState<boolean>(false);
  const [showASCAHelp, setShowASCAHelp] = useState<boolean>(false);

  // ----------------------------------------------------
  // WELFARE MODULE LOCAL STATES
  // ----------------------------------------------------
  const [welfareDepositAmount, setWelfareDepositAmount] = useState<number>(500);
  const [currentPayerId, setCurrentPayerId] = useState<string>(members[0]?.id || '');
  const [welfarePayoutRecipientId, setWelfarePayoutRecipientId] = useState<string>(members[1]?.id || '');
  const [welfarePayoutAmount, setWelfarePayoutAmount] = useState<number>(4000);
  const [welfareReason, setWelfareReason] = useState<string>('Medical Bills Relief');
  
  // Multi-signature credentials state for public emergency release
  const [chairpersonApproved, setChairpersonApproved] = useState<boolean>(false);
  const [treasurerApproved, setTreasurerApproved] = useState<boolean>(false);
  const [chairpersonRationale, setChairpersonRationale] = useState<string>('');
  const [treasurerRationale, setTreasurerRationale] = useState<string>('');
  
  const [welfareSuccessMessage, setWelfareSuccessMessage] = useState<string | null>(null);
  const [welfareError, setWelfareError] = useState<string | null>(null);

  // ----------------------------------------------------
  // ASCA SHAREOUT MODULE LOCAL STATES
  // ----------------------------------------------------
  const [customSurplusInterest, setCustomSurplusInterest] = useState<number>(18900); // Accumulated loan interest / penalties buffer
  const [shareoutSuccess, setShareoutSuccess] = useState<boolean>(false);
  const [shareoutLogs, setShareoutLogs] = useState<Array<{ name: string; savingsRefund: number; dividendValue: number; totalReceived: number }>>([]);

  const activeMembers = members.filter(m => m.status === 'approved' || !m.status);

  // Format currency helper
  const formatKsh = (amount: number) => {
    return 'Ksh ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 0 });
  };

  // 1. Process individual contribution to locked emergency welfare wallet
  const handleWelfareContribution = () => {
    const payer = members.find(m => m.id === currentPayerId);
    if (!payer) return;

    const randomRef = 'MPESA_WEL_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = currentSimDate + " " + new Date().toTimeString().split(' ')[0];
    const txId = 'tx_wel_' + Date.now().toString().slice(-6);

    const welfareTx: SavingTransaction = {
      id: txId,
      memberId: payer.id,
      memberName: payer.name,
      amount: welfareDepositAmount,
      type: 'savings', // classified as saving contribution to safety box
      paymentMethod: 'mpesa',
      reference: randomRef,
      timestamp,
      status: 'completed',
      syncStatus: isOnline ? 'firebase_synced' : 'local_only',
      notes: `Targeted Contribution to Locked Welfare Care Wallet`
    } as any;

    // Update states
    setTransactions(prev => [welfareTx, ...prev]);
    setWelfareBalance(prev => prev + welfareDepositAmount);

    // Send SMS confirmation to contributor
    const confirmSMS: SMSMessage = {
      id: 'sms_wel_' + Date.now().toString().slice(-6),
      phone: payer.phone,
      sender: "CHAMA_WELFARE",
      content: `SAFETY DEPOSIT CONFIRMED: Ksh ${welfareDepositAmount.toLocaleString()} credited to your locked Welfare Care Account. Thank you for securing our community emergency buffer. Ref: ${randomRef}.`,
      timestamp,
      isRead: false
    };
    setSmsMessages(prev => [confirmSMS, ...prev]);

    // Push to database if online
    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveTransaction(gId, welfareTx);
      saveSMSMessage(gId, confirmSMS);
    }

    setWelfareSuccessMessage(`Succesfully deposited ${formatKsh(welfareDepositAmount)} from ${payer.name} to the community Welfare Care buffer!`);
    setTimeout(() => setWelfareSuccessMessage(null), 4000);
  };

  // 2. Multi-sig validation & Emergency welfare payout disbursement
  const handleExecuteWelfarePayout = () => {
    setWelfareError(null);
    setWelfareSuccessMessage(null);

    if (welfarePayoutAmount > welfareBalance) {
      setWelfareError(`Error: Insufficient balance inside the Welfare Care locked box. Current balance: ${formatKsh(welfareBalance)}`);
      return;
    }

    if (!chairpersonApproved || !treasurerApproved) {
      setWelfareError("Validation Failed: Multi-sig protocol requires digital authorizations & rationales from both the Sacco Chairperson and Treasurer beforehand.");
      return;
    }

    const recipient = members.find(m => m.id === welfarePayoutRecipientId);
    if (!recipient) {
      setWelfareError("Please select a valid member beneficiary.");
      return;
    }

    const randomRef = 'MPESA_EMR_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = currentSimDate + " " + new Date().toTimeString().split(' ')[0];
    const txId = 'tx_wel_pay_' + Date.now().toString().slice(-6);

    const welfareDisburseTx: SavingTransaction = {
      id: txId,
      memberId: recipient.id,
      memberName: recipient.name,
      amount: welfarePayoutAmount,
      type: 'repayment', // outbound payout
      paymentMethod: 'mpesa',
      reference: randomRef,
      timestamp,
      status: 'completed',
      syncStatus: isOnline ? 'firebase_synced' : 'local_only',
      notes: `EMERGENCY DISBURSEMENT: Approved welfare relief for: ${welfareReason}`
    } as any;

    // Deduct from locked pool, update transactions
    setTransactions(prev => [welfareDisburseTx, ...prev]);
    setWelfareBalance(prev => Math.max(0, prev - welfarePayoutAmount));

    // Increase member simulated phone balance as direct cash received
    setMembers(prev => prev.map(m => {
      if (m.id === recipient.id) {
        return {
          ...m,
          phoneSimBalance: (m as any).phoneSimBalance ? (m as any).phoneSimBalance + welfarePayoutAmount : 15000 + welfarePayoutAmount
        };
      }
      return m;
    }));

    // Generate SMS receipts
    const directSMS: SMSMessage = {
      id: 'sms_wel_rec_' + Date.now().toString().slice(-6),
      phone: recipient.phone,
      sender: "MPESA_CARE",
      content: `M-PESA EMERGENCY DISBURSEMENT: Board approved relief payout of ${formatKsh(welfarePayoutAmount)} credited to your phone wallet for ${welfareReason}. Ref: ${randomRef}. Chama Care stands with you.`,
      timestamp,
      isRead: false
    };

    const auditSMS: SMSMessage = {
      id: 'sms_wel_rec_aud_' + Date.now().toString().slice(-6),
      phone: "0722000000",
      sender: "CHAMA_BOARD",
      content: `WELFARE FUND RELEASE: Ksh ${welfarePayoutAmount.toLocaleString()} disbursed to ${recipient.name} (${welfareReason}). Authorized via multi-sig by Chairperson (${chairpersonRationale.substring(0, 15)}...) & Treasurer (${treasurerRationale.substring(0, 15)}...).`,
      timestamp,
      isRead: false
    };

    setSmsMessages(prev => [directSMS, auditSMS, ...prev]);

    // Push to database if online
    if (isOnline) {
      const gId = activeGroupId || 'upendo_unity';
      saveTransaction(gId, welfareDisburseTx);
      saveSMSMessage(gId, directSMS);
      saveSMSMessage(gId, auditSMS);
    }

    setWelfareSuccessMessage(`Emergency payout of ${formatKsh(welfarePayoutAmount)} successfully disbursed to ${recipient.name}'s M-Pesa account! Audit and signatures safely logged.`);
    
    // Reset signatures after processing
    setChairpersonApproved(false);
    setTreasurerApproved(false);
    setChairpersonRationale('');
    setTreasurerRationale('');
  };

  // ----------------------------------------------------
  // ASCA YEAR-END SHAREOUT CALCULATIONS
  // ----------------------------------------------------
  // Compute totals
  const totalGroupShares = activeMembers.reduce((sum, m) => sum + m.shareBalance, 0);
  const totalGroupSavings = activeMembers.reduce((sum, m) => sum + m.totalSavings, 0);

  // Individual projected payout itemizer
  const simulatedPayouts = activeMembers.map(m => {
    const shareWeight = totalGroupShares > 0 ? m.shareBalance / totalGroupShares : 0;
    const individualDividend = Math.round(customSurplusInterest * shareWeight);
    return {
      memberId: m.id,
      name: m.name,
      savingsRefund: m.totalSavings,
      shareBalance: m.shareBalance,
      dividendValue: individualDividend,
      sharePercentage: shareWeight * 100,
      totalReceived: m.totalSavings + individualDividend
    };
  });

  const totalProjectedShareoutCash = totalGroupSavings + customSurplusInterest;

  // Execute actual ledger shareout payout
  const handleExecuteASCAYearEndShareout = () => {
    const timestamp = currentSimDate + " " + new Date().toTimeString().split(' ')[0];
    const localLogs: typeof shareoutLogs = [];

    // Map through payments and send dividend payouts SMS
    simulatedPayouts.forEach(item => {
      const targetMember = members.find(m => m.id === item.memberId);
      if (!targetMember) return;

      const randomRef = 'MPESA_DIV_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const divPayoutSMS: SMSMessage = {
        id: 'sms_div_' + Date.now().toString().slice(-6),
        phone: targetMember.phone,
        sender: "CHAMA_DIVIDEND",
        content: `BIASHARA BOOST YEAR-END SHARE-OUT: M-Pesa payout of ${formatKsh(item.totalReceived)} has been compiled & disbursed. Refunded Savings: ${formatKsh(item.savingsRefund)}, Earned Dividends: ${formatKsh(item.dividendValue)} based on your ${item.sharePercentage.toFixed(1)}% Share Weight. Ledger cycle closed!`,
        timestamp,
        isRead: false
      };

      setSmsMessages(prev => [divPayoutSMS, ...prev]);
      if (isOnline) {
        saveSMSMessage(activeGroupId || 'upendo_unity', divPayoutSMS);
      }

      localLogs.push({
        name: item.name,
        savingsRefund: item.savingsRefund,
        dividendValue: item.dividendValue,
        totalReceived: item.totalReceived
      });
    });

    // Zero out outstanding saving & share counts for a fresh annual ledger spin!
    setMembers(prev => prev.map(m => ({
      ...m,
      totalSavings: 0,
      shareBalance: 0,
      phoneSimBalance: (m as any).phoneSimBalance ? (m as any).phoneSimBalance + (simulatedPayouts.find(p => p.memberId === m.id)?.totalReceived || 0) : 15000
    })));

    setShareoutLogs(localLogs);
    setShareoutSuccess(true);
    setTimeout(() => setShareoutSuccess(false), 8000);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Sub-tab Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setPillarSubTab('welfare')}
          className={`px-4 py-2 text-xs font-extrabold uppercase transition border-b-2 flex items-center gap-2 cursor-pointer ${
            pillarSubTab === 'welfare' 
              ? 'border-emerald-600 text-emerald-800' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          Welfare Emergency buffer Locked box
        </button>
        <button
          onClick={() => setPillarSubTab('asca_shareout')}
          className={`px-4 py-2 text-xs font-extrabold uppercase transition border-b-2 flex items-center gap-2 cursor-pointer ${
            pillarSubTab === 'asca_shareout' 
              ? 'border-emerald-600 text-emerald-800' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-600" />
          ASCA Year-End Share-out dividends
        </button>
      </div>

      {welfareSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{welfareSuccessMessage}</span>
        </div>
      )}

      {welfareError && (
        <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{welfareError}</span>
        </div>
      )}

      {/* VIEW A: WELFARE EMERGENCY LOCKED BOX */}
      {pillarSubTab === 'welfare' && (
        <div className="space-y-6">
          
          {/* Section Summary Card */}
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-20px] opacity-15">
              <Heart style={{ width: '120px', height: '120px' }} />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-widest uppercase">
                  Community Locked buffer Wallet
                </span>
                <h4 className="text-xl font-extrabold font-sans">Welfare Emergency Rescue Vault</h4>
                <p className="text-xs text-rose-100 max-w-lg">
                  A locked care fund designed for mutual support in difficult times like medical emergencies or bereavement. Holds non-refundable community contributions separate from active loan-yielding savings.
                </p>
              </div>

              <div className="bg-white/10 border border-white/20 p-3.5 rounded-xl text-center self-stretch sm:self-auto flex flex-col justify-center">
                <span className="text-[10px] text-rose-100 uppercase font-mono font-bold">LOCKED POOL RESERVES</span>
                <span className="text-2xl font-extrabold font-mono mt-1">{formatKsh(welfareBalance)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-rose-455 mt-4 flex flex-wrap gap-2 justify-between items-center text-[10.5px]">
              <span className="text-rose-100">✔ Separate Lockbox • Direct M-Pesa Disburse • Strict Multi-Sig Control</span>
              <button
                onClick={() => setShowWelfareHelp(!showWelfareHelp)}
                className="bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-[9px] uppercase px-2.5 py-1 rounded transition max-h-[25px]"
              >
                {showWelfareHelp ? "Hide Policies" : "Explain Welfare Rulebook"}
              </button>
            </div>
          </div>

          {showWelfareHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 space-y-2 leading-relaxed text-left"
            >
              <p className="font-bold text-slate-800">Welfare Care Fund Bylaws:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Contributions are <strong>strictly non-refundable</strong> and do not earn dividends; they are registered as welfare protection credits.</li>
                <li>Each member must maintain a minimum compliance of Ksh 500 contributed to the safety fund per cycle.</li>
                <li>Disbursement requests require consensus and digital authorization (multi-sig keys) from both the <strong>Chairperson</strong> and <strong>Treasurer</strong> of Biashara Boost.</li>
              </ul>
            </motion.div>
          )}

          {/* Interactive Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Act C1: Contribute to Welfare Box */}
            <div className="border border-slate-200 p-5 rounded-2xl bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Coins className="text-rose-500 w-4 h-4 shrink-0" />
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Deposit individual protection contribution</h5>
              </div>

              <div className="space-y-3 font-sans">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mb-1">Select Member Depositing</label>
                  <select
                    value={currentPayerId}
                    onChange={(e) => setCurrentPayerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 rounded-lg focus:outline-none focus:border-rose-500"
                  >
                    {activeMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} (Simulated Balance: {formatKsh((m as any).phoneSimBalance || 15000)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mb-1">Protection Contribution Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-mono font-bold">Ksh</span>
                    <input
                      type="number"
                      value={welfareDepositAmount}
                      onChange={(e) => setWelfareDepositAmount(Math.max(100, Number(e.target.value)))}
                      className="w-full bg-slate-50 border border-slate-200 pl-10 pr-3 py-2 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-rose-500 font-mono font-extrabold"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Recommend amount: Ksh 500 standard care premium</span>
                </div>

                <button
                  onClick={handleWelfareContribution}
                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition active:scale-97 cursor-pointer"
                >
                  Authorize Welfare M-Pesa Deposit
                </button>
              </div>
            </div>

            {/* Act C2: Multi-Sig Emergency Disburser request */}
            <div className="border border-slate-205 p-5 rounded-2xl bg-slate-50/50 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <ShieldAlert className="text-slate-800 w-4 h-4 shrink-0" />
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Multi-Sig Emergency Relief disburser</h5>
              </div>

              <div className="space-y-3 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mb-1">Beneficiary Member</label>
                    <select
                      value={welfarePayoutRecipientId}
                      onChange={(e) => setWelfarePayoutRecipientId(e.target.value)}
                      className="w-full bg-white border border-slate-205 p-2 text-xs text-slate-700 rounded-lg focus:outline-none focus:border-rose-500"
                    >
                      {activeMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mb-1">Requested Payout (Ksh)</label>
                    <input
                      type="number"
                      value={welfarePayoutAmount}
                      onChange={(e) => setWelfarePayoutAmount(Math.max(500, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-205 p-2 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-rose-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-extrabold mb-1">Emergency Category / Medical Reason</label>
                  <input
                    type="text"
                    value={welfareReason}
                    onChange={(e) => setWelfareReason(e.target.value)}
                    className="w-full bg-white border border-slate-205 p-2 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-rose-500"
                    placeholder="e.g. Hospital bill clearance, Bereavement benefit"
                  />
                </div>

                {/* BOARD MULTI-SIG APPROVALS PANEL */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="text-[9px] font-mono font-extrabold text-slate-400 tracking-wider uppercase block">
                    BIASHARA BOOST EXECUTIVES MULTI-SIG SIGN-OFF
                  </span>

                  <div className="space-y-3">
                    {/* Sign-1: Chairperson */}
                    <div className="border border-slate-100 p-2.5 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-slate-705 flex items-center gap-1">
                          👤 Sacco Chairperson (Grace Wood)
                        </span>
                        <button
                          onClick={() => setChairpersonApproved(!chairpersonApproved)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                            chairpersonApproved 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:text-slate-800'
                          }`}
                        >
                          {chairpersonApproved ? 'Signed ✓' : 'Approve'}
                        </button>
                      </div>
                      {chairpersonApproved && (
                        <input
                          type="text"
                          required
                          value={chairpersonRationale}
                          onChange={(e) => setChairpersonRationale(e.target.value)}
                          placeholder="Provide Chairperson rationale (required)..."
                          className="w-full bg-slate-50 border border-slate-200 p-1.5 text-[10px] rounded focus:outline-none italic"
                        />
                      )}
                    </div>

                    {/* Sign-2: Treasurer */}
                    <div className="border border-slate-100 p-2.5 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-slate-705 flex items-center gap-1">
                          💰 Sacco Treasurer (Ezra Korir)
                        </span>
                        <button
                          onClick={() => setTreasurerApproved(!treasurerApproved)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                            treasurerApproved 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:text-slate-800'
                          }`}
                        >
                          {treasurerApproved ? 'Signed ✓' : 'Approve'}
                        </button>
                      </div>
                      {treasurerApproved && (
                        <input
                          type="text"
                          required
                          value={treasurerRationale}
                          onChange={(e) => setTreasurerRationale(e.target.value)}
                          placeholder="Provide Treasurer rationale (required)..."
                          className="w-full bg-slate-50 border border-slate-200 p-1.5 text-[10px] rounded focus:outline-none italic"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExecuteWelfarePayout}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Disburse Approved Emergency Funds</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW B: ASCA YEAR-END SHAREOUT SOLVER */}
      {pillarSubTab === 'asca_shareout' && (
        <div className="space-y-6">
          
          {/* Section Summary Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-indigo-700 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute right-[-10px] bottom-[-20px] opacity-15">
              <Calculator style={{ width: '120px', height: '120px' }} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-widest uppercase border border-sky-500/30">
                  Annual Cycle Wind-up Ledger
                </span>
                <h4 className="text-xl font-extrabold font-sans">ASCA Year-End Share-out Dividends</h4>
                <p className="text-xs text-sky-100 max-w-lg">
                  Accumulating Savings (ASCA) pools savings, purchases shares, and distributes loans. At cycle wind-up, members receive 100% of savings back + proportional dividends from loan interest yield.
                </p>
              </div>

              <div className="bg-white/10 border border-white/20 p-3.5 rounded-xl text-center self-stretch sm:self-auto flex flex-col justify-center font-mono">
                <span className="text-[10px] text-sky-200 uppercase font-bold">TOTAL PORTFOLIO SAVINGS</span>
                <span className="text-xl font-extrabold mt-1">{formatKsh(totalGroupSavings)}</span>
                <span className="text-[9px] text-sky-300 mt-1 uppercase font-bold">({totalGroupShares / 1000}k Share Units)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-sky-500/30 mt-4 flex flex-wrap gap-2 justify-between items-center text-[10.5px]">
              <span className="text-sky-100">✔ Proportional Yield Calculation • Automated Audited Dividends • Multi-User Payout</span>
              <button
                onClick={() => setShowASCAHelp(!showASCAHelp)}
                className="bg-white text-indigo-700 hover:bg-slate-55 font-extrabold text-[9px] uppercase px-2.5 py-1 rounded transition max-h-[25px]"
              >
                {showASCAHelp ? "Hide Formula" : "Explain Mathematics"}
              </button>
            </div>
          </div>

          {showASCAHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-sky-50/50 border border-sky-100 p-4 rounded-xl text-xs text-slate-655 space-y-2 leading-relaxed text-left"
            >
              <p className="font-extrabold text-slate-805">Dividend Weighting Formula:</p>
              <p>
                Each member’s dividend payout is determined by their share weight inside the Sacco:
              </p>
              <div className="p-3 bg-white border border-slate-150 rounded font-mono text-[10.5px] font-semibold text-center text-indigo-800">
                Member Share Weight (%) = (Individual Share Balance / Collective Sacco Shares) * 100
                <br />
                Earned Yield Dividend (Ksh) = Total Accumulated Group surplus * Member Share Weight (%)
              </div>
              <p>
                At Year-End payout, each member receives: <strong>Original Savings Refund + Calculated Share Dividend</strong>.
              </p>
            </motion.div>
          )}

          {/* ASCA Parameters Customization */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-1">
                Accumulated Group Surplus (Interests & Fines)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-mono font-bold">Ksh</span>
                <input
                  type="number"
                  value={customSurplusInterest}
                  onChange={(e) => setCustomSurplusInterest(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-slate-205 pl-10 pr-3 py-2 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Accrued loan interests & fines pool</span>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-1">
                Collective Group Assets
              </label>
              <p className="text-xs text-slate-800 font-bold mt-2 font-mono">
                {formatKsh(totalProjectedShareoutCash)}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">Savings + Accumulated Group Surplus</span>
            </div>

            <div className="text-right">
              <button
                onClick={handleExecuteASCAYearEndShareout}
                disabled={totalGroupSavings === 0}
                className={`py-2 px-4 rounded-lg uppercase tracking-wider text-xs font-extrabold w-full ${
                  totalGroupSavings === 0 
                    ? 'bg-slate-200 text-slate-550 border border-slate-300' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-97 transition'
                }`}
              >
                Execute Collective Share-out
              </button>
            </div>
          </div>

          {shareoutSuccess && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-indigo-50 border border-indigo-150 rounded-xl space-y-2 text-left"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Audited Year-End ASCA Share-out successfully processed!</span>
              </div>
              <p className="text-xs text-slate-600">
                Zeroed out the community Sacco savings ledger and disbursed the entire compiled fund of {formatKsh(totalProjectedShareoutCash)} proportionally via M-Pesa. Individual text receipts dispatched to all contributors.
              </p>
            </motion.div>
          )}

          {/* Simulated share-out individual lookup matrix */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <p className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider block p-4 bg-slate-50 border-b border-slate-200">
              PROPORTIONAL INDIVIDUAL YEAR-END TRANSFER SIMULATION MATRIX
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 font-bold font-mono text-[9px] uppercase text-slate-400 bg-slate-50/50">
                    <th className="p-3">Member Name</th>
                    <th className="p-3 text-right">Shares Owned</th>
                    <th className="p-3 text-right">Share Weight (%)</th>
                    <th className="p-3 text-right">Savings Refund</th>
                    <th className="p-3 text-right text-indigo-600">Dividend Yield</th>
                    <th className="p-3 text-right text-emerald-600">Total pay-out Transfer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {simulatedPayouts.map(m => (
                    <tr key={m.memberId} className="hover:bg-slate-50/30 transition">
                      <td className="p-3 font-bold text-slate-800">{m.name}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{(m.shareBalance / 100).toFixed(0)} units</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-700">{m.sharePercentage.toFixed(1)}%</td>
                      <td className="p-3 text-right font-mono text-slate-700">{formatKsh(m.savingsRefund)}</td>
                      <td className="p-3 text-right font-mono text-indigo-600 font-bold">+{formatKsh(m.dividendValue)}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-emerald-600">{formatKsh(m.totalReceived)}</td>
                    </tr>
                  ))}
                  {simulatedPayouts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center italic text-slate-400">
                        Add active members inside the membership ledger to simulate custom ASCA weight dividends.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
