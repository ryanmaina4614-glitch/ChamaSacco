import React, { useState, useEffect } from 'react';
import { GroupConfig, Member } from '../types';
import { 
  Building, 
  Search, 
  PlusCircle, 
  Users, 
  Scale, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  Coins, 
  Smartphone, 
  Check, 
  BookOpen,
  PieChart,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { 
  seedInitialDataIfNeeded, 
  fetchGroupConfig, 
  saveGroupAttributes, 
  saveMember,
  getMembersColRef 
} from '../lib/chamaService';
import { getDocs } from 'firebase/firestore';

interface LandingAndAuthProps {
  isOnline: boolean;
  onSelectGroup: (groupId: string, memberId: string) => void;
}

export default function LandingAndAuth({ isOnline, onSelectGroup }: LandingAndAuthProps) {
  // Navigation tabs: 'landing' | 'register_group' | 'auth_member'
  const [screen, setScreen] = useState<'landing' | 'register_group' | 'auth_member'>('landing');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<{ id: string; config: GroupConfig } | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Group selection
  const [selectedGroup, setSelectedGroup] = useState<{ id: string; config: GroupConfig } | null>(null);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Group registration fields
  const [newGroupName, setNewGroupName] = useState('');
  const [newRegNum, setNewRegNum] = useState('');
  const [newShareRate, setNewShareRate] = useState(500);
  const [newMonthlySavings, setNewMonthlySavings] = useState(1000);
  const [newPaybill, setNewPaybill] = useState('');
  const [newVaultBalance, setNewVaultBalance] = useState(25000);
  const [newPenaltyType, setNewPenaltyType] = useState<'flat_fine' | 'interest_hike' | 'both' | 'none'>('both');
  const [newFlatFine, setNewFlatFine] = useState(200);
  const [newGracePeriod, setNewGracePeriod] = useState(5);

  // Founder/Chairperson user details
  const [founderName, setFounderName] = useState('');
  const [founderPhone, setFounderPhone] = useState('');
  const [founderEmail, setFounderEmail] = useState('');
  const [founderNationalId, setFounderNationalId] = useState('');

  // Sacco description definition
  const [newDescription, setNewDescription] = useState('');

  // Sign Back-In Credentials Form
  const [authMode, setAuthMode] = useState<'roster' | 'credentials'>('credentials');
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // New member recruitment under active group
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberNationalId, setNewMemberNationalId] = useState('');

  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');

  // Quick select curated demo groups
  const curatedGroups = [
    {
      id: 'upendo_unity',
      name: 'Upendo Unity Chama',
      regNum: 'SHG/2024/7742',
      badge: 'Active Demo',
      description: 'The standard curated testing sandbox for Linet, David, Grace and Ezra with active interest and voting ledgers.',
      savings: 'Ksh 92,500',
      membersCount: 4
    },
    {
      id: 'mamba_sacco',
      name: 'Mamba Micro-Sacco',
      regNum: 'SACCO/2025/1109',
      badge: 'Curated Seeding',
      description: 'Alternative agricultural transport SACCO seeded with specialized baseline savings, credit scores, and repayments.',
      savings: 'Ksh 150,000',
      membersCount: 3
    }
  ];

  // Slugify helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_+|_+$)/g, '');
  };

  // Perform search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    const slug = slugify(searchTerm);
    try {
      const config = await fetchGroupConfig(slug);
      if (config) {
        setSearchResult({ id: slug, config });
      } else {
        setSearchError(`Could not find a registered SACCO or Chama with the exact unique name "${searchTerm}". You can build this group below!`);
      }
    } catch (err) {
      setSearchError('Error looking up group collection. Please check your connectivity state.');
    } finally {
      setIsSearching(false);
    }
  };

  // Switch to specific group login screen
  const selectGroupAndFetchMembers = async (groupId: string, config: GroupConfig) => {
    setSelectedGroup({ id: groupId, config });
    setIsLoadingMembers(true);
    setScreen('auth_member');
    setShowAddMemberForm(false);

    try {
      // If selected group is Upendo or Mamba, ensure they are seeded in Firebase
      if (groupId === 'upendo_unity' || groupId === 'mamba_sacco') {
        let initialMems: Member[] | undefined = undefined;
        let pRate = config.shareRate;
        if (groupId === 'mamba_sacco') {
          initialMems = [
            {
              id: "mem_m1",
              name: "Josphat Mwangi",
              phone: "0725112233",
              email: "josphat.mwangi@mamba.or.ke",
              avatarColor: "bg-purple-600",
              totalSavings: 50000,
              shareBalance: 30000,
              activeLoans: 0,
              creditScore: 820,
              joinedDate: "2025-02-12",
              role: 'chairperson',
              status: 'approved',
              nationalId: '38194819'
            },
            {
              id: "mem_m2",
              name: "Amina Abdallah",
              phone: "0711998877",
              email: "amina.abdallah@mamba.or.ke",
              avatarColor: "bg-rose-600",
              totalSavings: 65000,
              shareBalance: 40000,
              activeLoans: 5000,
              creditScore: 790,
              joinedDate: "2025-02-15",
              role: 'treasurer',
              status: 'approved',
              nationalId: '29819038'
            },
            {
              id: "mem_m3",
              name: "Peter Kipkorir",
              phone: "0788334455",
              email: "peter.kipkorir@mamba.or.ke",
              avatarColor: "bg-teal-600",
              totalSavings: 35000,
              shareBalance: 20000,
              activeLoans: 0,
              creditScore: 750,
              joinedDate: "2025-03-01",
              role: 'secretary',
              status: 'approved',
              nationalId: '34829103'
            }
          ];
        }
        await seedInitialDataIfNeeded(groupId, config, initialMems);
      }

      // Fetch from subcollection members
      const snap = await getDocs(getMembersColRef(groupId));
      const list: Member[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Member);
      });
      list.sort((a, b) => a.id.localeCompare(b.id));

      if (list.length > 0) {
        setGroupMembers(list);
      } else {
        // Fallback or let them add themselves
        setGroupMembers([]);
      }
    } catch (err) {
      console.error("Error fetching group rosters:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Build a registration transaction and save
  const handleRegisterGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newRegNum.trim() || !newPaybill.trim() || !founderName.trim() || !founderPhone.trim() || !founderNationalId.trim()) {
      setMessage('Error: Please complete all required fields including Chairperson profile & National ID.');
      return;
    }

    if (newDescription.trim().length < 50) {
      setMessage(`Error: Sacco Description must be at least 50 characters long. Current count: ${newDescription.trim().length}`);
      return;
    }

    setRegistering(true);
    setMessage('');

    const groupId = slugify(newGroupName);
    const config: GroupConfig = {
      groupName: newGroupName,
      registrationNumber: newRegNum,
      shareRate: Number(newShareRate),
      targetContribution: Number(newMonthlySavings),
      paybillNumber: newPaybill,
      vaultBalance: Number(newVaultBalance),
      penaltyType: newPenaltyType,
      flatMeetingFine: Number(newFlatFine),
      lateInterestHikePercentage: 2,
      gracePeriodDays: Number(newGracePeriod),
      description: newDescription.trim(),
      maxMembersLimit: 4 // Set default limit of 4 to demonstrate full Sacco flow easily
    };

    const chairperson: Member = {
      id: 'mem_1',
      name: founderName,
      phone: founderPhone,
      email: founderEmail || `${slugify(founderName)}@chama.or.ke`,
      nationalId: founderNationalId.trim(),
      avatarColor: 'bg-emerald-600',
      totalSavings: 5000,
      shareBalance: 2000,
      activeLoans: 0,
      creditScore: 800,
      joinedDate: new Date().toISOString().split('T')[0],
      role: 'chairperson',
      status: 'approved'
    };

    // seed 2 secondary automatic companions
    const secCompanion: Member = {
      id: 'mem_2',
      name: 'Simulated Treasurer',
      phone: '0711000222',
      email: 'treasurer.sim@chama.or.ke',
      nationalId: '28491029',
      avatarColor: 'bg-indigo-600',
      totalSavings: 15000,
      shareBalance: 10000,
      activeLoans: 0,
      creditScore: 820,
      joinedDate: new Date().toISOString().split('T')[0],
      role: 'treasurer',
      status: 'approved'
    };

    const thirdCompanion: Member = {
      id: 'mem_3',
      name: 'Simulated Secretary',
      phone: '0722333444',
      email: 'secretary.sim@chama.or.ke',
      nationalId: '34829103',
      avatarColor: 'bg-purple-600',
      totalSavings: 10000,
      shareBalance: 5000,
      activeLoans: 0,
      creditScore: 780,
      joinedDate: new Date().toISOString().split('T')[0],
      role: 'secretary',
      status: 'approved'
    };

    try {
      // Save configuration document on Firestore (and seed automatic companions)
      await seedInitialDataIfNeeded(groupId, config, [chairperson, secCompanion, thirdCompanion]);
      
      setMessage('Success! Created custom SACCO ledger database.');
      setTimeout(() => {
        // Log in right away!
        onSelectGroup(groupId, 'mem_1');
      }, 1500);
    } catch (err: any) {
      setMessage(`Server registration warning: Check connections. Error: ${err.message || err}`);
    } finally {
      setRegistering(false);
    }
  };

  // Register a new member to an existing group
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberPhone.trim() || !newMemberNationalId.trim()) {
      alert("Please provide member name, simulated phone coordinates, and National ID Number.");
      return;
    }
    if (!selectedGroup) return;

    setIsLoadingMembers(true);

    // Enforce Sacco Capping limits
    const limit = selectedGroup.config.maxMembersLimit ?? 10;
    // Count active approved or pending requests
    const activeAndPendingCount = groupMembers.filter(m => m.status !== 'rejected').length;
    if (activeAndPendingCount >= limit) {
      alert(`Registration Denied!\n\nThis group is currently FULL (Current members: ${activeAndPendingCount}/${limit}). Anyone who tries to join is notified they can't due to the group being full.`);
      setIsLoadingMembers(false);
      return;
    }

    // Enforce unique National ID
    if (groupMembers.some(m => m.nationalId === newMemberNationalId.trim())) {
      alert(`Registration Denied!\n\nA member with National ID "${newMemberNationalId}" already exists inside this group.`);
      setIsLoadingMembers(false);
      return;
    }

    const mId = 'mem_' + (groupMembers.length + 1) + '_' + Math.random().toString(36).substring(2, 5);
    const newM: Member = {
      id: mId,
      name: newMemberName,
      phone: newMemberPhone,
      email: newMemberEmail || `${slugify(newMemberName)}@chama.or.ke`,
      nationalId: newMemberNationalId.trim(),
      avatarColor: ['bg-emerald-600', 'bg-purple-600', 'bg-blue-600', 'bg-amber-600', 'bg-rose-600'][groupMembers.length % 5],
      totalSavings: 0, // Pending members start with zero balance until approved & contributed
      shareBalance: 0,
      activeLoans: 0,
      creditScore: 750, // Standard starting credit score in Kenya
      joinedDate: new Date().toISOString().split('T')[0],
      role: 'member',
      status: 'pending' // Must be approved by Chairperson
    };

    try {
      await saveMember(selectedGroup.id, newM);
      
      // refresh roster list
      const list = [...groupMembers, newM];
      setGroupMembers(list);
      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberEmail('');
      setNewMemberNationalId('');
      setShowAddMemberForm(false);
      alert(`Membership Request Submitted!\n\nYour application to join "${selectedGroup.config.groupName}" was sent successfully.\n\nStatus: Pending Chairperson Approval. Your profile will be editable once approved.`);
    } catch (err) {
      alert("Error submitting join request onto Firestore ledger.");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col justify-between font-sans relative overflow-x-hidden bg-slate-50">
      
      {/* Background Stock Photo matching the uploaded image of diverse people putting hands together in high-five/solidarity */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80')` 
        }}
      />
      {/* Frosted White Transparency overlays with enhanced visibility for the solidarity hand high-five background photo */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/50 via-white/35 to-slate-100/30 backdrop-blur-[0.5px]" />

      {/* 1. BRAND HEADER */}
      <header className="border-b border-slate-200/60 bg-white/75 backdrop-blur sticky top-0 z-50 py-4 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setScreen('landing')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/10">
              <Building className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">Biashara Boost</h1>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider font-bold">SECURE DIGITAL LEDGER ENGINE</span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600">{isOnline ? 'CLOUD COOPERATIVE COUPLING ACTIVE' : 'CLOUD CONNECTION WARNING'}</span>
          </div>
        </div>
      </header>

      {/* 2. CORE INTERACTION CENTER */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 relative">
        <div className="max-w-4xl w-full">
          
          {/* A. LANDING DISPLAY ADS & SEARCH */}
          {screen === 'landing' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Product value props */}
              <div className="lg:col-span-7 space-y-6 relative z-10">
                
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Transparent digitized table banking, <span className="text-emerald-600 font-extrabold">fully decentralized</span>.
                </h2>
                
                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
                  Biashara Boost helps microfinance coalitions, self-help groups (Chamas), and commercial SACCOs record transactions, audit credit ratings, request loans, and automate voting consensus instantly.
                </p>

                {/* Features Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="flex gap-3 bg-white/70 border border-slate-200/50 rounded-xl p-3 shadow-sm hover:shadow hover:bg-white transition-all duration-300">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">Multi-Tenant Vaults</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Every community has an isolated cloud-managed vault tracking capital holdings.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 bg-white/70 border border-slate-200/50 rounded-xl p-3 shadow-sm hover:shadow hover:bg-white transition-all duration-300">
                    <Coins className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">Smart Loan Consensus</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">No single person approves disbursements. Automated voting and guarantor pools run dynamically.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 bg-white/70 border border-slate-200/50 rounded-xl p-3 shadow-sm hover:shadow hover:bg-white transition-all duration-300">
                    <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">Cellular USSD Simulator</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Try sandboxed mobile money contributions using an integrated phone handset.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 bg-white/70 border border-slate-200/50 rounded-xl p-3 shadow-sm hover:shadow hover:bg-white transition-all duration-300">
                    <Scale className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">Dynamic Credit Scores</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Calculated behaviors (joint deadlines, repay history) adjust borrow scores in real-time.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setScreen('register_group')}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Register New Group / SACCO</span>
                  </button>
                </div>
              </div>

              {/* Search Widget & Curated Demos column */}
              <div className="lg:col-span-5 bg-white/85 border border-slate-200 p-6 rounded-2xl shadow-xl space-y-6 backdrop-blur-md relative z-10">
                <div>
                  <h3 className="text-sm uppercase tracking-wider font-extrabold text-slate-900 flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-600" />
                    Search Sacco database
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the unique registration name of any self-help group to audit ledgers.
                  </p>
                </div>

                {/* SEARCH BAR */}
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Upendo Unity"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                    />
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="absolute right-1.5 top-1.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded transition text-xs font-bold shrink-0"
                    >
                      {isSearching ? '...' : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* SUCCESS OR FAILURE MESSAGES */}
                  {searchError && (
                    <div className="text-[11px] text-rose-600 leading-normal bg-rose-50 border border-rose-200 p-2.5 rounded-lg font-medium">
                      {searchError}
                    </div>
                  )}

                  {searchResult && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-[11px] space-y-3 shadow-inner">
                      <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">{searchResult.config.groupName}</p>
                          <p className="text-slate-400 font-mono text-[9px]">ID Slug: {searchResult.id}</p>
                        </div>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-250 px-1.5 py-0.5 rounded font-mono font-bold uppercase">ACTIVE DATABASE</span>
                      </div>
                      
                      {/* Detailed SACCO Info */}
                      <div className="grid grid-cols-2 gap-2 text-slate-600 bg-white/60 p-2 rounded-lg border border-slate-150">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">Reg. Number</span>
                          <span className="font-bold font-mono text-slate-800 text-[10px] truncate block">{searchResult.config.registrationNumber || "SHG/2026/012"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">Mpesa Paybill</span>
                          <span className="font-bold font-mono text-slate-800 text-[10px]">{searchResult.config.paybillNumber || "882882"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">Monthly Savings</span>
                          <span className="font-bold font-mono text-slate-800 text-[10px]">Ksh {(searchResult.config.targetContribution || 1000).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-mono block">Share Value</span>
                          <span className="font-bold font-mono text-slate-800 text-[10px]">Ksh {(searchResult.config.shareRate || 500).toLocaleString()}/Unit</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 leading-normal italic">
                        Select "Enter Ledger Workspace" to register as a new applicant or pick an existing member profile to log in.
                      </div>

                      <button
                        type="button"
                        onClick={() => selectGroupAndFetchMembers(searchResult.id, searchResult.config)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg transition cursor-pointer shadow-md hover:shadow-lg font-mono uppercase tracking-wider"
                      >
                        Enter Ledger Workspace →
                      </button>
                    </div>
                  )}
                </form>

                {/* POPULAR CURATED SAMPLES */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">Popular Active Communities</h4>
                  
                  <div className="space-y-2.5">
                    {curatedGroups.map((group) => (
                      <div 
                        key={group.id} 
                        onClick={() => {
                          const config: GroupConfig = group.id === 'upendo_unity' ? {
                            groupName: "Upendo Unity Chama",
                            registrationNumber: "SHG/2024/7742",
                            shareRate: 500,
                            targetContribution: 1000,
                            paybillNumber: "882882",
                            vaultBalance: 84500,
                            penaltyType: "both",
                            flatMeetingFine: 200,
                            lateInterestHikePercentage: 2,
                            gracePeriodDays: 5,
                          } : {
                            groupName: "Mamba Micro-Sacco",
                            registrationNumber: "SACCO/2025/1109",
                            shareRate: 1000,
                            targetContribution: 2000,
                            paybillNumber: "910901",
                            vaultBalance: 150000,
                            penaltyType: "interest_hike",
                            flatMeetingFine: 500,
                            lateInterestHikePercentage: 3,
                            gracePeriodDays: 7,
                          };
                          selectGroupAndFetchMembers(group.id, config);
                        }}
                        className="group flex flex-col p-3 bg-white/60 border border-slate-100 rounded-xl hover:border-slate-300 hover:bg-white cursor-pointer transition text-left hover:shadow-md"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition">{group.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold text-right">{group.badge}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed font-medium">
                          {group.description}
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 font-mono pt-1.5 border-t border-slate-100">
                          <span>Holding: <strong className="text-slate-700">{group.savings}</strong></span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Users className="w-2.5 h-2.5" />
                            {group.membersCount} members
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* B. REGISTER NEW SACCO/CHAMA */}
          {screen === 'register_group' && (
            <div className="bg-white/90 border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xl max-w-2xl mx-auto backdrop-blur-md relative z-10">
              <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-emerald-600" />
                    Create New Group or SACCO
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Set customized terms, shares rates, and register founder details.
                  </p>
                </div>
                <button
                  onClick={() => setScreen('landing')}
                  className="px-2.5 py-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 hover:text-slate-800 rounded font-mono transition font-bold"
                >
                  ESC FORM
                </button>
              </div>

              {message && (
                <div className={`p-3 rounded-lg mb-4 text-xs font-bold ${
                  message.startsWith('Success') 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleRegisterGroupSubmit} className="space-y-5 text-left">
                
                {/* 1. Group General Information */}
                <div className="space-y-4">
                  <h4 className="text-[11px] uppercase tracking-widest font-extrabold text-emerald-600 font-mono">1. LEDGER DETAILS</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Group Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amani Wealth Sacco"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Registration Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MOCD/SACCO/992"
                        value={newRegNum}
                        onChange={(e) => setNewRegNum(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Sacco Description (Minimum 50 Characters) *</label>
                      <span className={`text-[10px] font-mono font-bold ${newDescription.trim().length >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {newDescription.trim().length}/50 chars
                      </span>
                    </div>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Upendo Unity is a community-driven self-help group focusing on progressive table banking, micro-loans, and mutual agricultural pooling for members."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition resize-none font-sans"
                    />
                  </div>
                </div>

                {/* 2. Monetary parameters */}
                <div>
                  <h4 className="text-[11px] uppercase tracking-widest font-extrabold text-emerald-600 font-mono mb-2">2. MONETARY PARAMETERS (KSH)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Share Valuation Rate *</label>
                      <input
                        type="number"
                        required
                        placeholder="500"
                        value={newShareRate}
                        onChange={(e) => setNewShareRate(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">Ksh value per single share unit</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Savings Target *</label>
                      <input
                        type="number"
                        required
                        placeholder="1000"
                        value={newMonthlySavings}
                        onChange={(e) => setNewMonthlySavings(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">Monthly required savings target</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Paybill / Account *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 552255"
                        value={newPaybill}
                        onChange={(e) => setNewPaybill(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">Simulated billing receiver code</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Initial Vault Deposit *</label>
                    <input
                      type="number"
                      required
                      placeholder="25000"
                      value={newVaultBalance}
                      onChange={(e) => setNewVaultBalance(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">Initial pooled funds in vault</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Late Contribution Fine</label>
                    <input
                      type="number"
                      required
                      placeholder="200"
                      value={newFlatFine}
                      onChange={(e) => setNewFlatFine(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Grace Period (Days)</label>
                    <input
                      type="number"
                      required
                      placeholder="5"
                      value={newGracePeriod}
                      onChange={(e) => setNewGracePeriod(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                    />
                  </div>
                </div>

                {/* 3. Founder Details */}
                <div>
                  <h4 className="text-[11px] uppercase tracking-widest font-extrabold text-emerald-600 font-mono mb-2">3. FOUNDER & CHAIRPERSON SIMULATOR PROFILE</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Kamau"
                        value={founderName}
                        onChange={(e) => setFounderName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0712345678"
                        value={founderPhone}
                        onChange={(e) => setFounderPhone(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Kenyan National ID *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 31829038"
                        value={founderNationalId}
                        onChange={(e) => setFounderNationalId(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="chairperson@chama.or.ke"
                        value={founderEmail}
                        onChange={(e) => setFounderEmail(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                {/* SUBMIT */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={registering}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 font-extrabold text-xs uppercase text-white tracking-wider rounded-lg shadow transition cursor-pointer"
                  >
                    {registering ? 'Deploying Firestore Ledger schemas...' : 'Register and Launch Sacco Workspace'}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* C. CHOOSE SIMULATOR PROFILE */}
          {screen === 'auth_member' && selectedGroup && (
            <div className="bg-white/90 border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xl max-w-3xl mx-auto text-center space-y-6 backdrop-blur-md relative z-10">
              
              <div className="border-b border-slate-150 pb-5">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-600 font-extrabold">WORKSPACE REDIRECT LIVE</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedGroup.config.groupName}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Registration Number: <span className="font-mono text-slate-800 font-bold">{selectedGroup.config.registrationNumber}</span> • Paybill: <span className="font-mono text-slate-800 font-bold">{selectedGroup.config.paybillNumber}</span>
                </p>
              </div>

              {/* Loader */}
              {isLoadingMembers ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-t-emerald-500 border-r-transparent border-slate-300 animate-spin"></div>
                  <span className="text-xs text-slate-500 font-mono font-bold">Syncing active member roster...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  <div className="max-w-md mx-auto bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 p-5 rounded-2xl text-left space-y-4 shadow-inner">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase font-mono">Cooperative Credential Login</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">Please supply your registered credentials (exact Name, Phone, and Email) to sign back into your cooperative ledger account.</p>

                    {loginError && (
                      <div className="p-2.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                        {loginError}
                      </div>
                    )}

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setLoginError('');
                      const nameKey = loginName.trim().toLowerCase();
                      const phoneKey = loginPhone.trim().replace(/\s+/g, '');
                      const emailKey = loginEmail.trim().toLowerCase();

                      const matched = groupMembers.find(m => {
                        const mName = m.name.trim().toLowerCase();
                        const mPhone = m.phone.trim().replace(/\s+/g, '');
                        const mEmail = (m.email || '').trim().toLowerCase();
                        return mName === nameKey && mPhone === phoneKey && mEmail === emailKey;
                      });

                      if (matched) {
                        if (matched.status === 'pending') {
                          setLoginError('Your membership application is still PENDING chairperson approval.');
                          return;
                        }
                        if (matched.status === 'rejected') {
                          setLoginError('Your membership application was DECLINED by the chairperson.');
                          return;
                        }
                        onSelectGroup(selectedGroup.id, matched.id);
                      } else {
                        setLoginError('No registered member matches those exact credentials (Name, Phone, and Email). Please verify or retry.');
                      }
                    }} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Linet Atieno"
                          value={loginName}
                          onChange={(e) => setLoginName(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Phone Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 0711223344"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 transition font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. linet.atieno@upendochama.org"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-emerald-600 transition"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition shadow-md cursor-pointer"
                      >
                        Verify Credentials & Sign In
                      </button>
                    </form>
                  </div>

                  {/* Add member card container */}
                  <div className="border-t border-slate-150 pt-6">
                    {!showAddMemberForm ? (
                      <button
                        onClick={() => setShowAddMemberForm(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 rounded-lg transition shrink-0 uppercase tracking-wider shadow-sm hover:shadow"
                      >
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                        <span>Join as a new member</span>
                      </button>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-left max-w-md mx-auto space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <UserPlus className="w-4 h-4 text-emerald-600" />
                            Enroll simulated member
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setShowAddMemberForm(false)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 font-bold"
                          >
                            Cancel
                          </button>
                        </div>

                        <form onSubmit={handleAddMemberSubmit} className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-500 uppercase mb-0.5">Full Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Kiprutoh Nelson"
                              value={newMemberName}
                              onChange={(e) => setNewMemberName(e.target.value)}
                              className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-emerald-600 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-500 uppercase mb-0.5">Phone Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="07xxxxxxxx"
                              value={newMemberPhone}
                              onChange={(e) => setNewMemberPhone(e.target.value)}
                              className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none font-mono focus:border-emerald-600 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-500 uppercase mb-0.5">Kenyan National ID *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 29482038"
                              value={newMemberNationalId}
                              onChange={(e) => setNewMemberNationalId(e.target.value)}
                              className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none font-mono focus:border-emerald-600 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-500 uppercase mb-0.5">Email Address</label>
                            <input
                              type="email"
                              placeholder="nelson@chama.or.ke"
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                              className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-emerald-600 transition"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded transition shrink-0 cursor-pointer shadow-sm"
                          >
                            Enlist Onto Cloud Ledger
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setScreen('landing')}
                      className="text-xs text-slate-500 hover:text-slate-800 transition underline underline-offset-4 font-bold"
                    >
                      ← Back to landing advertiser page
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* 3. BRAND SYSTEM FOOTER */}
      <footer className="border-t border-slate-200/60 bg-white/70 py-6 text-center text-[11px] text-slate-500 relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="font-medium">© 2026 Biashara Boost Systems • Multi-tenant audited ledgers & microbanking networks.</p>
          <div className="flex gap-4 font-mono text-[10px] font-bold">
            <span className="text-emerald-600">● V4.2 Sandbox Cloud System</span>
            <span>Digital decentralized consensus architecture</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
