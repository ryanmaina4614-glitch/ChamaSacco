import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Member, SavingTransaction, SMSMessage } from '../types';
import { RefreshCw, Users, ArrowUpRight, CheckCircle2, AlertCircle, Sparkles, Send, Smartphone, HelpCircle } from 'lucide-react';
import { saveGroupAttributes } from '../lib/chamaService';

interface RoscaManagerProps {
  members: Member[];
  currentSimDate: string;
  roscaCurrentCycle: number;
  setRoscaCurrentCycle: (cycle: number | ((prev: number) => number)) => void;
  transactions: SavingTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<SavingTransaction[]>>;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setSmsMessages: React.Dispatch<React.SetStateAction<SMSMessage[]>>;
  isOnline: boolean;
  activeGroupId: string | null;
  saveTransaction?: any;
  saveMember?: any;
  saveSMSMessage?: any;
  groupName: string;
  vaultBalance: number;
  setVaultBalance: React.Dispatch<React.SetStateAction<number>>;
  setGroupConfig?: any;
}

export default function RoscaManager({
  members,
  currentSimDate,
  roscaCurrentCycle,
  setRoscaCurrentCycle,
  transactions,
  setTransactions,
  setMembers,
  setSmsMessages,
  isOnline,
  activeGroupId,
  saveTransaction,
  saveMember,
  saveSMSMessage,
  groupName,
  vaultBalance,
  setVaultBalance,
  setGroupConfig
}: RoscaManagerProps) {
  const [contributionInput, setContributionInput] = useState<number>(3000);
  const [customPayoutOrder, setCustomPayoutOrder] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [payoutInProgress, setPayoutInProgress] = useState<boolean>(false);
  const [payoutResult, setPayoutResult] = useState<{ recipientName: string; totalPool: number; ref: string } | null>(null);

  // Filter out pending/inactive members
  const activeMembers = members.filter(m => m.status === 'approved' || !m.status);

  // Determine current Turn Member index
  const activeCount = activeMembers.length;
  const currentTurnIdx = activeCount > 0 ? roscaCurrentCycle % activeCount : 0;
  const nextTurnIdx = activeCount > 0 ? (roscaCurrentCycle + 1) % activeCount : 0;

  const currentRecipient = activeMembers[currentTurnIdx];
  const nextRecipient = activeMembers[nextTurnIdx];

  // Calculate projected pool
  const totalPoolAmount = activeCount * contributionInput;

  // Format currency helper
  const formatKsh = (amount: number) => {
    return 'Ksh ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 0 });
  };

  // Execute ROSCA Payout
  const handleExecutePayout = async () => {
    if (!currentRecipient) return;
    setPayoutInProgress(true);
    setPayoutResult(null);

    // Simulate 1.5 seconds network validation and audit logging
    setTimeout(() => {
      const randomRef = 'MPESA_ROS_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const timestamp = currentSimDate + " " + new Date().toTimeString().split(' ')[0];
      const payoutId = 'tx_rosca_' + Date.now().toString().slice(-6);

      // Create Ledger Record for the payout
      const roscaPayoutTransaction: SavingTransaction = {
        id: payoutId,
        memberId: currentRecipient.id,
        memberName: currentRecipient.name,
        amount: totalPoolAmount,
        type: 'repayment', // designated as outbound to member
        paymentMethod: 'mpesa',
        reference: randomRef,
        timestamp,
        status: 'completed',
        syncStatus: isOnline ? 'firebase_synced' : 'local_only',
        notes: `Merry-Go-Round Rotational Payout for Round #${roscaCurrentCycle + 1} disbursed`
      } as any;

      // Update local state transactions list
      setTransactions(prev => [roscaPayoutTransaction, ...prev]);

      // Deduct/Reflect contribution from every active member’s total savings & add pool to recipient
      setMembers(prev => prev.map(m => {
        // If this member is an active ROSCA participant, we adjust their metrics.
        const isActivePart = activeMembers.some(am => am.id === m.id);
        if (!isActivePart) return m;

        let finalSavings = m.totalSavings;
        let isRecipient = m.id === currentRecipient.id;

        // Simulate savings adjustment:
        // Participating members contribute 'contributionInput'
        // Recipient receives the pool directly in their simulated mobile carrier ledger!
        if (isRecipient) {
          // Add pool cash to recipient as a special payout tracker field
          return {
            ...m,
            totalSavings: m.totalSavings + totalPoolAmount,
            lastContributionDate: currentSimDate,
            phoneSimBalance: (m as any).phoneSimBalance ? (m as any).phoneSimBalance + totalPoolAmount : 15000 + totalPoolAmount
          };
        } else {
          // Other paying members contribute their portion
          return {
            ...m,
            totalSavings: Math.max(0, m.totalSavings - contributionInput),
            lastContributionDate: currentSimDate
          };
        }
      }));

      // Send SMS reminders & confirmations
      // 1. Send SMS to recipient
      const recipientSMS: SMSMessage = {
        id: 'sms_rosca_rec_' + Date.now().toString().slice(-6),
        phone: currentRecipient.phone,
        sender: "MPESA_CHAMA",
        content: `M-PESA Confirmed! You have received ${formatKsh(totalPoolAmount)} from ${groupName} Merry-Go-Round payout (Round #${roscaCurrentCycle + 1}). Your phone wallet updated. Ref: ${randomRef}.`,
        timestamp,
        isRead: false
      };

      // 2. Broadcast general SMS to all members about successful completion
      const broadcastSMS: SMSMessage = {
        id: 'sms_rosca_brd_' + Date.now().toString().slice(-6),
        phone: "0722000000", // Broadcast marker
        sender: "CHAMA_REPLY",
        content: `CYCLE PROGRESS: Round #${roscaCurrentCycle + 1} Merry-go-round pool of ${formatKsh(totalPoolAmount)} successfully collected and paid to ${currentRecipient.name}. Next turn: ${nextRecipient?.name || 'Round ended'}. No defaults reported.`,
        timestamp,
        isRead: false
      };

      setSmsMessages(prev => [recipientSMS, broadcastSMS, ...prev]);

      // Synchronize with Firestore if active online
      if (isOnline && saveTransaction && saveSMSMessage) {
        saveTransaction(activeGroupId || 'upendo_unity', roscaPayoutTransaction);
        saveSMSMessage(activeGroupId || 'upendo_unity', recipientSMS);
        saveSMSMessage(activeGroupId || 'upendo_unity', broadcastSMS);
        
        // Update group variables if database hooks exist
        if (setGroupConfig) {
          setGroupConfig((prev: any) => {
            const updatedVault = prev.vaultBalance; // ROSCA is zero-sum, doesn't stay in vault
            saveGroupAttributes(activeGroupId || 'upendo_unity', { vaultBalance: updatedVault });
            return prev;
          });
        }
      }

      // Record payout result state
      setPayoutResult({
        recipientName: currentRecipient.name,
        totalPool: totalPoolAmount,
        ref: randomRef
      });

      // Advance Rota session cycle
      setRoscaCurrentCycle(prev => prev + 1);
      setPayoutInProgress(false);
    }, 1500);
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6 text-left">
      {/* Banner / Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold tracking-wide uppercase text-[10px]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Merry-Go-Round (ROSCA) Tracker</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-800 mt-1">Automatic Rotating Rota Manager</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect rotational savings and automate payouts to one member every period without holding collateral.
          </p>
        </div>

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded px-2.5 py-1 flex items-center gap-1 transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showExplanation ? "Hide Mechanics" : "How ROSCA Works"}</span>
        </button>
      </div>

      {/* ROSCA Mechanics Explainer card */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-sky-50 border border-sky-100 p-4 rounded-xl text-xs text-sky-900 space-y-2 leading-relaxed"
        >
          <p className="font-extrabold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-600" />
            The Classical "Merry-Go-Round" Protocol
          </p>
          <p>
            In a <strong>Rotating Savings and Credit Association (ROSCA)</strong>, members contribute a fixed sum at each meeting (the "Contribution Target"). The total collected amount forms a pooled prize that is awarded instantly and entirely to one selected member.
          </p>
          <p>
            This rota rotates sequentially. After all members have received their round payout once, the full cycle resets. Because payouts require zero collateral and net zero interest, it relies purely on <strong>Social Trust</strong>, which we secure with SMS digests and real-time ledger audit trails.
          </p>
        </motion.div>
      )}

      {/* Rota Configuration Form */}
      <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-1">
            Contribution Target / Member
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-mono font-bold">Ksh</span>
            <input
              type="number"
              value={contributionInput}
              onChange={(e) => setContributionInput(Math.max(100, Number(e.target.value)))}
              className="w-full bg-white border border-slate-205 pl-10 pr-3 py-2 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-650 font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-1">
            Active Contributors
          </label>
          <p className="text-xs text-slate-800 font-bold mt-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-500" />
            <span>{activeCount} Members participating</span>
          </p>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-1">
            Expected Pool Size
          </label>
          <p className="text-sm text-emerald-600 font-extrabold mt-1.5 font-mono">
            {formatKsh(totalPoolAmount)} <span className="text-[10px] text-slate-400 font-normal">per cycle turn</span>
          </p>
        </div>
      </div>

      {/* Rota Sequence Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active Turns Queue */}
        <div className="lg:col-span-2 border border-slate-150 rounded-xl p-4 space-y-4">
          <p className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider block">
            Rotation Rota Sequence Sheet (Round #{roscaCurrentCycle + 1})
          </p>

          <div className="space-y-2">
            {activeMembers.map((m, idx) => {
              const isCurrent = idx === currentTurnIdx;
              const isNext = idx === nextTurnIdx;
              
              // Simple ordering calculation for upcoming rounds
              let roundStatus = "Queueing";
              let badgeStyle = "bg-slate-55 text-slate-500 border-slate-200";
              
              if (isCurrent) {
                roundStatus = "ACTIVE RECIPIENT";
                badgeStyle = "bg-amber-100 text-amber-800 border-amber-200 animate-pulse";
              } else if (isNext) {
                roundStatus = "NEXT IN TURN";
                badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
              }

              return (
                <div
                  key={m.id}
                  className={`flex justify-between items-center p-3 border rounded-xl transition ${
                    isCurrent 
                      ? 'border-amber-400 bg-amber-50/40 shadow-xs' 
                      : 'border-slate-100 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-mono text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{m.name}</p>
                      <span className="text-[9px] text-slate-400 font-mono italic">{m.phone}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase border ${badgeStyle}`}>
                      {roundStatus}
                    </span>
                  </div>
                </div>
              );
            })}

            {activeMembers.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6 text-center">No approved members found to formulate a rota.</p>
            )}
          </div>
        </div>

        {/* Right Column: Execution Panel */}
        <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <p className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider block">
              Active Disbursement Board
            </p>

            {currentRecipient ? (
              <div className="bg-white border border-slate-200 p-4 rounded-xl text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white text-base font-extrabold mx-auto">
                  {currentRecipient.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{currentRecipient.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{currentRecipient.phone}</p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Expected Cash Out</span>
                  <p className="text-base font-extrabold text-emerald-600 font-mono mt-1">{formatKsh(totalPoolAmount)}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic">
                Ready to rotate after establishing group members as active participants.
              </div>
            )}
          </div>

          <div className="space-y-3.5 pt-4">
            {payoutResult && (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-[11px] text-emerald-800 space-y-1"
              >
                <div className="flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cycle turn dispersed!</span>
                </div>
                <p className="text-slate-600">
                  Transferred {formatKsh(payoutResult.totalPool)} safely to {payoutResult.recipientName}. All ledger accounts updated.
                </p>
                <span className="font-mono text-[9px] text-slate-400 block select-all">Ref: {payoutResult.ref}</span>
              </motion.div>
            )}

            <button
              onClick={handleExecutePayout}
              disabled={payoutInProgress || !currentRecipient}
              className={`w-full py-2.5 ${
                payoutInProgress ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 active:scale-97'
              } text-black font-extrabold text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm`}
            >
              {payoutInProgress ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Re-routing Ledger Cash...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-900" />
                  <span>Process Round #{roscaCurrentCycle + 1} Payout</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
