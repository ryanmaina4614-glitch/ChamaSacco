import React, { useState } from 'react';
import { Member, SavingTransaction, GroupConfig } from '../types';
import { Users, UserPlus, Phone, CreditCard, Sparkles, LogIn, ArrowRight, ShieldCheck, ShieldAlert, Mail } from 'lucide-react';

interface MemberSectionProps {
  members: Member[];
  activeMember: Member;
  onSelectMember: (memberId: string) => void;
  onAddMember: (name: string, phone: string, email: string, nationalId: string) => void;
  transactions: SavingTransaction[];
  groupConfigShareRate: number;
  groupConfig: GroupConfig;
  onApproveMember?: (memberId: string) => void;
  onRejectMember?: (memberId: string) => void;
  onAssignRole?: (memberId: string, role: 'chairperson' | 'secretary' | 'treasurer' | 'member') => void;
  onUpdateMaxLimit?: (limit: number) => void;
}

export default function MemberSection({
  members,
  activeMember,
  onSelectMember,
  onAddMember,
  transactions,
  groupConfigShareRate,
  groupConfig,
  onApproveMember,
  onRejectMember,
  onAssignRole,
  onUpdateMaxLimit
}: MemberSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // State filtering & chairperson permission validations
  const approvedMembers = members.filter(m => m.status === 'approved' || !m.status);
  const pendingMembers = members.filter(m => m.status === 'pending');
  const rejectedMembers = members.filter(m => m.status === 'rejected');
  const isChairperson = activeMember.role === 'chairperson' || activeMember.id === 'mem_1';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !nationalId.trim()) {
      setErrorMsg("All fields are required, including National ID Number.");
      return;
    }
    setErrorMsg("");
    // Basic phone validator starts with 07 or 01 to keep Kenyan simulation intact
    if (!/^(07|01)\d{8}$/.test(phone)) {
      setErrorMsg("Phone number must start with 07 or 01 and have 10 digits total.");
      return;
    }

    // Capacity check
    const limit = groupConfig.maxMembersLimit ?? 10;
    if (approvedMembers.length >= limit) {
      setErrorMsg(`Chama capacity limit reached (${limit}/${limit}). Cannot register. Chairperson must increase member capacity limit first.`);
      return;
    }

    // Check National ID uniqueness
    if (members.some(m => m.nationalId === nationalId.trim())) {
      setErrorMsg("A member with this National ID already exists in this group.");
      return;
    }

    onAddMember(name.trim(), phone.trim(), email.trim(), nationalId.trim());
    setName('');
    setPhone('');
    setEmail('');
    setNationalId('');
    setShowAddForm(false);
  };

  // Get individual historic deposits
  const getMemberTransactionsCount = (memberId: string) => {
    return transactions.filter(t => t.memberId === memberId).length;
  };

  // Color selection arrays
  const scoreColor = (score: number) => {
    if (score >= 800) return 'text-emerald-400 bg-emerald-950/80 border-emerald-900';
    if (score >= 700) return 'text-indigo-400 bg-indigo-950/80 border-indigo-900';
    return 'text-amber-400 bg-amber-950/80 border-amber-900';
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="text-emerald-400 w-5 h-5" />
            Active Chama Membership
          </h2>
          <p className="text-xs text-neutral-400">Manage community members, audit their share portfolios, savings ledger levels, and credit limits.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-black font-bold py-1.5 px-3 rounded-lg text-xs transition inline-flex items-center gap-1.5 shadow-lg shadow-emerald-950/25"
        >
          <UserPlus className="w-4 h-4" />
          {showAddForm ? 'Close panel' : 'Add New Member'}
        </button>
      </div>

      {/* Member Limit Alert & Settings */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Group Capacity Status:</span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {approvedMembers.length} / {groupConfig.maxMembersLimit || 'Unlimited'} Members
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {approvedMembers.length >= (groupConfig.maxMembersLimit || 10) 
              ? "🚨 Group roster is strictly FULL. No new registration requests can be requested." 
              : `Capacity remaining: ${(groupConfig.maxMembersLimit || 10) - approvedMembers.length} slots left.`}
          </p>
        </div>
        
        {isChairperson && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-400 font-bold whitespace-nowrap">Max Capacity Casing (Chairperson Only):</label>
            <input
              type="number"
              min={approvedMembers.length}
              max={100}
              value={groupConfig.maxMembersLimit || 4}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  onUpdateMaxLimit?.(val);
                }
              }}
              className="bg-black border border-slate-800 text-xs font-bold font-mono text-amber-500 p-1 px-2 rounded-lg w-16 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}
      </div>

      {/* Slide-down manual member registration panel */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 transition text-left">
          <h3 className="text-xs uppercase font-extrabold text-amber-500 tracking-wider">Register Self-Help Group Member</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mary Wanjiku"
                className="bg-black border border-slate-800 text-xs text-white p-2 rounded-lg w-full focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Mobile Money Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0712345678"
                className="bg-black border border-slate-800 text-xs text-white p-2 rounded-lg w-full font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">National ID Number (Required)</label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="e.g. 34829103"
                className="bg-black border border-slate-800 text-xs text-white p-2 rounded-lg w-full font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Email Coordinates</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. mary@chama.org"
                className="bg-black border border-slate-800 text-xs text-white p-2 rounded-lg w-full focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-500 font-bold">{errorMsg}</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-neutral-400 hover:text-white text-xs px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-black font-semibold text-xs py-1.5 px-4 rounded-lg transition"
            >
              Confirm Registration
            </button>
          </div>
        </form>
      )}

      {/* Chairperson admin approvals banner */}
      {isChairperson && pendingMembers.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-xl space-y-4 shadow-xl mb-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="text-amber-500 w-5 h-5 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pending Membership Join Requests</h3>
              <p className="text-[11px] text-zinc-400">As Chairperson, you have sole authorization block permission to grant consensus entry.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingMembers.map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-black/40 border border-slate-850 rounded-lg gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs">
                    {m.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs">{m.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{m.phone} • {m.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
                  <button
                    onClick={() => onRejectMember?.(m.id)}
                    className="px-3 py-1 bg-rose-950/85 hover:bg-rose-900 text-rose-450 border border-rose-900 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onApproveMember?.(m.id)}
                    className="px-3 py-1 bg-emerald-950/85 hover:bg-emerald-900 text-emerald-450 border border-emerald-900 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer font-extrabold"
                  >
                    Approve Entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-chairperson overview of pending join applications */}
      {!isChairperson && pendingMembers.length > 0 && (
        <div className="bg-slate-900 border border-dashed border-slate-800 p-4 rounded-xl space-y-2 mb-4">
          <p className="text-xs text-amber-500 font-bold flex items-center gap-1.5 uppercase font-mono">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            {pendingMembers.length} Membership Join Request(s) Under Review
          </p>
          <p className="text-[11px] text-neutral-400">
            Self-help group members are awaiting administrative confirmation by Chairperson <strong className="text-white">Linet Atieno</strong>.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {pendingMembers.map(m => (
              <span key={m.id} className="text-[10px] bg-black/40 text-neutral-300 font-mono px-2 py-0.5 rounded border border-slate-800">
                ⌛ {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Members Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Members Roster (Left-Center 2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          {approvedMembers.map((member) => {
            const isSelected = member.id === activeMember.id;
            return (
              <div
                key={member.id}
                onClick={() => onSelectMember(member.id)}
                className={`bg-slate-900 border text-xs p-4 rounded-xl cursor-pointer transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isSelected 
                    ? 'border-emerald-500 bg-slate-800/40 shadow-md shadow-emerald-950/10' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Avatar and Basic Details */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow ${member.avatarColor}`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm">{member.name}</h4>
                      {member.role && member.role !== 'member' && (
                        <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase font-mono tracking-wide">
                          {member.role}
                        </span>
                      )}
                      {isSelected && (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-full px-1.5 py-0.5 text-[8px] font-bold">
                          Selected SIM
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{member.phone}</span>
                      <span>•</span>
                      <span>Joined {member.joinedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Ledger Status */}
                <div className="grid grid-cols-3 gap-3 md:gap-5 text-left md:text-right w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/50">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Savings</span>
                    <span className="font-bold text-neutral-200 mt-0.5 block font-mono">
                      Ksh {member.totalSavings.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Shares</span>
                    <span className="font-bold text-neutral-200 mt-0.5 block font-mono">
                      {member.shareBalance / groupConfigShareRate} U
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Active Loans</span>
                    <span className={`font-bold mt-0.5 block font-mono ${member.activeLoans > 0 ? 'text-rose-400' : 'text-neutral-500'}`}>
                      {member.activeLoans > 0 ? `Ksh ${member.activeLoans.toLocaleString()}` : 'None'}
                    </span>
                  </div>
                </div>

                {/* Switch / Select action Indicator & ROLE PICKER */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 justify-end md:justify-start w-full md:w-auto">
                  
                  {isChairperson && member.id !== activeMember.id && (
                    <div className="flex items-center gap-1.5 bg-black/60 border border-slate-800 p-1 px-2 rounded-lg self-stretch sm:self-auto justify-between sm:justify-start text-xs">
                      <span className="text-[9px] text-zinc-500 uppercase font-mono font-bold">Role:</span>
                      <select
                        value={member.role || 'member'}
                        onChange={(e) => onAssignRole?.(member.id, e.target.value as any)}
                        className="bg-black text-[10px] text-amber-400 border-none font-bold focus:outline-none focus:ring-0 p-0 px-1 rounded cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="member">Member</option>
                        <option value="secretary">Secretary</option>
                        <option value="treasurer">Treasurer</option>
                        <option value="chairperson">Chairperson</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className={`border rounded px-1.5 py-0.5 text-[10px] font-mono font-extrabold ${scoreColor(member.creditScore)}`}>
                      Score: {member.creditScore}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMember(member.id);
                      }}
                      className={`p-1.5 rounded-lg transition ${
                        isSelected 
                          ? 'bg-emerald-900/30 text-emerald-400' 
                          : 'bg-black text-neutral-400 hover:text-white'
                      }`}
                      title="Activate to simulate USSD Operations"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
          
          {rejectedMembers.length > 0 && (
            <div className="mt-6 border-t border-slate-800/40 pt-4">
              <h4 className="text-[10px] font-mono uppercase text-rose-500 font-extrabold tracking-wider mb-2">Declined / Rejected Applications</h4>
              <div className="space-y-1.5 opacity-60">
                {rejectedMembers.map(m => (
                  <div key={m.id} className="flex justify-between items-center text-xs text-neutral-400 bg-black/25 border border-slate-900 px-3 py-1.5 rounded-lg font-mono">
                    <span>❌ {m.name} ({m.phone})</span>
                    <span className="text-[9px] uppercase px-1.5 bg-rose-950 text-rose-400 border border-rose-900 rounded font-bold">Declined</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Member Detail Workspace (Right 1 Column) */}
        <div id="member-detail-widget" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1 text-[10px] text-amber-500 uppercase tracking-widest font-extrabold">
              <Sparkles className="w-3.5 h-3.5" /> Credit Profile
            </div>
            <h3 className="text-sm font-bold text-white mt-1">Detailed Ledger Inspect</h3>
          </div>

          <div className="text-center bg-black/50 p-4 rounded-xl border border-slate-800">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-2 shadow-lg ${activeMember.avatarColor}`}>
              {activeMember.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h4 className="font-bold text-white text-base leading-tight">{activeMember.name}</h4>
            <div className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center justify-center gap-1.5">
              <Phone className="w-3 h-3 text-emerald-400" /> {activeMember.phone}
            </div>
            <div className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1">
              <Mail className="w-3 h-3 text-neutral-500" /> {activeMember.email}
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {/* Credit Score Assessment */}
            <div className="bg-black/20 p-3 rounded-lg border border-slate-800/80">
              <div className="flex justify-between items-center mb-1">
                <span className="text-neutral-400 uppercase text-[10px]">Chama Trust Assessment</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  activeMember.creditScore >= 800 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                    : 'bg-indigo-950 text-indigo-400 border border-indigo-900'
                }`}>
                  {activeMember.creditScore >= 800 ? 'Platinum Tier' : 'Standard Tier'}
                </span>
              </div>
              
              <div className="flex justify-between items-end my-1.5">
                <span className="text-xs text-neutral-500 font-mono">Micro-Credit Rating Score</span>
                <span className="text-lg font-extrabold text-white">{activeMember.creditScore} <span className="text-[10px] text-neutral-500">/ 850</span></span>
              </div>

              {/* Dynamic credit limit bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition" 
                  style={{ width: `${((activeMember.creditScore - 300) / 550) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-2">
                <span>Credit Ceiling (3x Savings):</span>
                <span className="text-white font-bold">Ksh {(activeMember.totalSavings * 3).toLocaleString()}</span>
              </div>
            </div>

            {/* Individual Assets Ledger */}
            <div className="space-y-2">
              <h5 className="font-bold text-neutral-300 text-[11px] uppercase tracking-wider">Financial Commitments</h5>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-neutral-500 block text-[9px] uppercase">Cash Deposited</span>
                  <span className="text-xs font-bold text-white block mt-0.5 font-mono">Ksh {activeMember.totalSavings.toLocaleString()}</span>
                  <span className="text-[8px] text-emerald-400 block mt-1">{getMemberTransactionsCount(activeMember.id)} Contributions</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-neutral-500 block text-[9px] uppercase">Chama Shares</span>
                  <span className="text-xs font-bold text-white block mt-0.5 font-mono">{activeMember.shareBalance / groupConfigShareRate} Units</span>
                  <span className="text-[8px] text-zinc-500 block mt-1">Valued at Ksh {activeMember.shareBalance.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-2.5 text-[11px] text-zinc-400 flex items-start gap-1.5 leading-normal">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  This member's details are digitized and securely verified inside the ledger, eliminating any paper-logging errors.
                </div>
              </div>
            </div>

            {/* Hot Action to direct simulated mobile phone screen */}
            <div className="bg-slate-950 p-3 rounded-lg border border-dashed border-slate-700 text-center space-y-2">
              <p className="text-[10px] text-indigo-300 font-sans leading-normal">
                Trigger simulated requests or deposits on behalf of <span className="font-bold text-white">{activeMember.name}</span> using the interactive device.
              </p>
              <div className="flex justify-center">
                <a 
                  href="#phone-simulator-card"
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-xs text-white font-bold py-1 px-3 rounded inline-flex items-center gap-1 transition"
                >
                  Go to Simulated Phone
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
