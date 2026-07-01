import React, { useState, useEffect } from 'react';
import { Member, SavingTransaction, SMSMessage, USSDSession, GroupConfig } from '../types';
import { Phone, Send, Info, Smartphone, List, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface PhoneSimulatorProps {
  activeMember: Member;
  members: Member[];
  groupConfig: GroupConfig;
  allSMS: SMSMessage[];
  onAddTransaction: (tx: Omit<SavingTransaction, 'id' | 'timestamp' | 'reference' | 'status'>) => void;
  onApplyLoanUSSD: (amount: number, duration: number, purpose: string) => void;
  onRepayLoanUSSD: (loanId: string, amount: number) => void;
  activeMemberLoans: any[];
  elderlyMode?: boolean;
  swahiliMode?: boolean;
  speakPhrase?: (text: string, isSwahili: boolean) => void;
}

export default function PhoneSimulator({
  activeMember,
  members,
  groupConfig,
  allSMS,
  onAddTransaction,
  onApplyLoanUSSD,
  onRepayLoanUSSD,
  activeMemberLoans,
  elderlyMode = false,
  swahiliMode = false,
  speakPhrase
}: PhoneSimulatorProps) {
  // Mobile UI tabs: 'ussd' | 'sms' | 'mpesa'
  const [phoneTab, setPhoneTab] = useState<'ussd' | 'sms' | 'mpesa'>('ussd');
  
  // USSD state
  const [ussdSession, setUssdSession] = useState<USSDSession>({ state: 'idle' });
  const [ussdDialCode, setUssdDialCode] = useState('*384*55#');
  const [ussdInputText, setUssdInputText] = useState('');
  const [ussdLogs, setUssdLogs] = useState<string[]>([]);
  
  // M-Pesa app state
  const [mpesaMode, setMpesaMode] = useState<'home' | 'paybill' | 'stk_pin'>('home');
  const [mpesaPaybill, setMpesaPaybill] = useState(groupConfig.paybillNumber);
  const [mpesaAccount, setMpesaAccount] = useState(activeMember.phone);
  const [mpesaAmount, setMpesaAmount] = useState('1000');
  const [mpesaType, setMpesaType] = useState<'savings' | 'shares'>('savings');
  
  // PIN Entry state (common for simulated payments)
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessPopup, setPaymentSuccessPopup] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number; type: string } | null>(null);

  // Sync M-Pesa Account field when active member changes
  useEffect(() => {
    setMpesaAccount(activeMember.phone);
  }, [activeMember]);

  // Handle USSD Action/Inputs
  const handleUssdMainDial = () => {
    if (ussdDialCode === '*384*55#') {
      setUssdSession({ state: 'welcome' });
      setUssdLogs([`Dialing ${ussdDialCode} on Safaricom Network...`, 'Session established with Upendo Chama Server.']);
      
      const welcomePhrase = swahiliMode 
        ? "Karibu kwenye huduma ya simu ya Upendo. Chagua moja kuangalia salio na hisa, mbili kuweka akiba, au tatu kuomba mkopo mpya." 
        : "Welcome to Upendo USSD session. Press 1 to check balance and shares, 2 to deposit savings, or 3 to apply for a loan.";
      speakPhrase?.(welcomePhrase, swahiliMode);
    } else {
      setUssdLogs([`Dialing ${ussdDialCode}...`, 'Connection problem or invalid MMI code.']);
    }
  };

  const handleUssdSubmit = (choice: string) => {
    const cleaned = choice.trim();
    setUssdInputText('');
    
    // Welcome Menu Routing
    if (ussdSession.state === 'welcome') {
      if (cleaned === '1') {
        setUssdSession({ state: 'checking_balance' });
        const balancePhrase = swahiliMode 
          ? `Akiba yako ya sasa ni Shilingi ${activeMember.totalSavings}. Thamani ya hisa zako ni Shilingi ${activeMember.shareBalance}. Mikopo yako ya sasa ni Shilingi ${activeMember.activeLoans}.` 
          : `Your savings balance is ${activeMember.totalSavings} Shillings. Your share balance value is ${activeMember.shareBalance} Shillings. Your outstanding loan balance is ${activeMember.activeLoans} Shillings.`;
        speakPhrase?.(balancePhrase, swahiliMode);
      } else if (cleaned === '2') {
        setUssdSession({ state: 'deposit_select' });
        const depPhrase = swahiliMode 
          ? "Chagua moja kuweka akiba ya kawaida, au mbili kununua hisa za Chama." 
          : "Press 1 to deposit into regular savings or 2 to buy group shares.";
        speakPhrase?.(depPhrase, swahiliMode);
      } else if (cleaned === '3') {
        setUssdSession({ state: 'loan_apply' });
        const loanPhrase = swahiliMode 
          ? `Kikomo chako cha mkopo ni Shilingi ${activeMember.totalSavings * 3}. Tafadhali andika kiasi cha mkopo unachotaka kuomba.` 
          : `Your maximum borrowing limit is ${activeMember.totalSavings * 3} Shillings. Please type the loan amount you want to borrow.`;
        speakPhrase?.(loanPhrase, swahiliMode);
      } else if (cleaned === '4') {
        setUssdSession({ state: 'repay_loan_select' });
        const repayPhrase = swahiliMode 
          ? "Tafadhali chagua nambari ya mkopo unaotaka kulipa kwenye orodha." 
          : "Please select the loan index you want to repay from the list.";
        speakPhrase?.(repayPhrase, swahiliMode);
      } else if (cleaned === '5') {
        setUssdSession({ state: 'idle' }); // Just quick view
        const scorePhrase = swahiliMode 
          ? `Kiwango chako cha mkopo ni kizuri sana chenye alama ${activeMember.creditScore}. Kikomo chako cha mkopo ni mara tatu ya akiba yako yote.` 
          : `Your current credit profile score is ${activeMember.creditScore}, which is excellent. Limit is based on up to three times your total savings.`;
        speakPhrase?.(scorePhrase, swahiliMode);
        alert(scorePhrase);
      } else {
        // Stay and log invalid
        setUssdLogs(prev => [...prev, 'Invalid option. Choose 1 - 5.']);
      }
      return;
    }

    // Deposit Menu Routing
    if (ussdSession.state === 'deposit_select') {
      if (cleaned === '1') {
        setUssdSession({ state: 'deposit_amount', tempAmount: 0 }); // Savings
        setMpesaType('savings');
        const amtPhrase = swahiliMode 
          ? "Andika kiasi cha shilingi unachotaka kuweka akiba." 
          : "Please enter the amount of shillings you want to add to your savings.";
        speakPhrase?.(amtPhrase, swahiliMode);
      } else if (cleaned === '2') {
        setUssdSession({ state: 'deposit_amount', tempAmount: 0 }); // Shares
        setMpesaType('shares');
        const amtPhrase = swahiliMode 
          ? "Andika kiasi cha shilingi unachotaka kununulia hisa." 
          : "Please enter the amount of shillings you want to spend buying shares.";
        speakPhrase?.(amtPhrase, swahiliMode);
      } else {
        setUssdSession({ state: 'welcome' });
      }
      return;
    }

    // Deposit Amount input
    if (ussdSession.state === 'deposit_amount') {
      const amt = parseFloat(cleaned);
      if (isNaN(amt) || amt <= 0) {
        setUssdLogs(prev => [...prev, 'Invalid amount. Try again.']);
      } else {
        // Route to STK push PIN input on the phone
        setPaymentDetails({ amount: amt, type: mpesaType });
        setUssdSession({ state: 'idle' });
        setPhoneTab('mpesa');
        setMpesaMode('stk_pin');
        setPin('');
        setPinError(false);
      }
      return;
    }

    // Loan Application: Step 1 - Amount
    if (ussdSession.state === 'loan_apply') {
      const amt = parseFloat(cleaned);
      const isOverLimit = amt > activeMember.totalSavings * 3;
      if (isNaN(amt) || amt <= 0) {
        setUssdLogs(prev => [...prev, 'Invalid amount. Try again.']);
      } else if (isOverLimit) {
        setUssdLogs(prev => [
          ...prev, 
          `Denied! Applied Ksh ${amt}. Max limit is 3x Savings (Ksh ${activeMember.totalSavings * 3}).`
        ]);
      } else {
        setUssdSession({ 
          state: 'loan_confirm', 
          tempAmount: amt, 
          tempLoanDuration: 3, // Default 3 months 
          tempLoanPurpose: "Business Capital via USSD" 
        });
      }
      return;
    }

    // Loan Confirmation
    if (ussdSession.state === 'loan_confirm') {
      if (cleaned === '1') {
        // Dispatch loan application internally
        if (ussdSession.tempAmount) {
          onApplyLoanUSSD(ussdSession.tempAmount, 3, "Business expansion via USSD");
          setUssdSession({ state: 'idle' });
          alert("Loan application uploaded successfully! Awaiting Chama committee votes.");
        }
      } else {
        setUssdSession({ state: 'welcome' });
      }
      return;
    }

    // Repay selection
    if (ussdSession.state === 'repay_loan_select') {
      // Input corresponds to active loans list index
      const idx = parseInt(cleaned) - 1;
      const pendingLoans = activeMemberLoans.filter(l => l.status === 'approved' || l.status === 'overdue');
      if (idx >= 0 && idx < pendingLoans.length) {
        const selectedLoan = pendingLoans[idx];
        setUssdSession({ 
          state: 'repay_loan_amount', 
          selectedLoanId: selectedLoan.id,
          tempAmount: selectedLoan.activeLoans
        });
      } else {
        setUssdLogs(prev => [...prev, 'Invalid session index. Try again.']);
        setUssdSession({ state: 'welcome' });
      }
      return;
    }

    // Repay Amount
    if (ussdSession.state === 'repay_loan_amount') {
      const amt = parseFloat(cleaned);
      if (isNaN(amt) || amt <= 0) {
        setUssdLogs(prev => [...prev, 'Invalid repayment amount.']);
      } else if (ussdSession.selectedLoanId) {
        // Trigger payment Pin
        setPaymentDetails({ amount: amt, type: 'repayment' });
        setUssdSession({ state: 'idle' });
        setPhoneTab('mpesa');
        setMpesaMode('stk_pin');
        setPin('');
        setPinError(false);
      }
      return;
    }
  };

  // Keyboard Click for fast USSD testing
  const appendUssdNumber = (num: string) => {
    setUssdInputText(prev => prev + num);
  };

  const clearUssdField = () => {
    setUssdInputText('');
  };

  // STK PIN Confirmation Logic
  const handlePinSubmit = () => {
    if (pin.length !== 4) {
      setPinError(true);
      return;
    }

    setIsProcessingPayment(true);
    setPinError(false);

    // Simulate 1.5s mobile money prompt handshake
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccessPopup(true);

      if (paymentDetails) {
        if (paymentDetails.type === 'repayment') {
          const approvedLoan = activeMemberLoans.find(l => l.status === 'approved' || l.status === 'overdue');
          if (approvedLoan) {
            onRepayLoanUSSD(approvedLoan.id, paymentDetails.amount);
          }
        } else {
          // Add main savings or share ledger contribution
          onAddTransaction({
            memberId: activeMember.id,
            memberName: activeMember.name,
            amount: paymentDetails.amount,
            type: paymentDetails.type as any,
            paymentMethod: 'mpesa'
          });
        }
      }

      // Hide after a short period
      setTimeout(() => {
        setPaymentSuccessPopup(false);
        setMpesaMode('home');
        setPaymentDetails(null);
      }, 3000);
    }, 1500);
  };

  // Quick helper to dial options
  const quickOptionClick = (val: string) => {
    setUssdInputText(val);
    handleUssdSubmit(val);
  };

  // Filter SMS for current simulated phone screen
  const filteredSMS = allSMS
    .filter(msg => msg.phone === activeMember.phone)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div id="phone-simulator-card" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative max-w-sm mx-auto w-full flex flex-col min-h-[580px] text-white overflow-hidden">
      
      {/* Phone Camera Lens Bezel */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20 flex justify-center items-center gap-1">
        <div className="w-1.5 h-1.5 bg-neutral-800 rounded-full"></div>
        <div className="w-8 h-1 bg-neutral-900 rounded-full"></div>
      </div>

      {/* Screen Container */}
      <div className="flex-1 bg-black rounded-2xl p-3 pt-6 flex flex-col relative overflow-hidden text-xs">
        
        {/* Device Status Bar */}
        <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-2 border-b border-neutral-900 pb-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-emerald-500">Safaricom</span>
            <div className="flex gap-0.5 items-end h-2">
              <div className="w-0.5 h-1 bg-neutral-400"></div>
              <div className="w-0.5 h-1.5 bg-neutral-400"></div>
              <div className="w-0.5 h-2 bg-neutral-400"></div>
              <div className="w-0.5 h-2.5 bg-emerald-500"></div>
            </div>
          </div>
          <div className="text-[9px] font-mono tracking-wider">
            {activeMember.phone}
          </div>
          <div className="flex items-center gap-1">
            <span>98%</span>
            <div className="w-4 h-2 border border-neutral-400 rounded-sm p-0.5 flex">
              <div className="h-full w-full bg-emerald-400 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Selected Member Active Label */}
        <div className="bg-slate-950 border border-slate-800 rounded-md p-2 mb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 block">SIM Card Holder:</span>
            <span className="font-bold text-neutral-200">{activeMember.name}</span>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 select-none px-1.5 py-0.5 rounded border border-emerald-900">
            Active SIM
          </span>
        </div>

        {/* Main Phone Screens */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          
          {/* ======================= SCREEN: SMS INDBOX ======================= */}
          {phoneTab === 'sms' && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-neutral-200 text-sm">SMS Inbox (Simulated)</span>
                <span className="bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded text-[10px]">
                  {filteredSMS.length} Alerts
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredSMS.length === 0 ? (
                  <div className="text-center text-neutral-500 py-10 flex flex-col items-center">
                    <Send className="w-8 h-8 mb-2 opacity-50" />
                    <p>No messages received yet.</p>
                    <p className="text-[10px] text-neutral-600 mt-1">Make a digital deposit or trigger a date progress to receive alert alerts.</p>
                  </div>
                ) : (
                  filteredSMS.map((sms) => (
                    <div key={sms.id} className="bg-neutral-900 p-2 rounded border border-neutral-800 transition hover:border-neutral-700">
                      <div className="flex justify-between text-[9px] text-yellow-500 mb-1 font-mono font-bold">
                        <span>{sms.sender}</span>
                        <span className="text-neutral-500 font-normal">{sms.timestamp.split(' ')[1]}</span>
                      </div>
                      <p className="text-[11px] text-neutral-100 font-sans leading-snug">{sms.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================= SCREEN: USSD MENU ======================= */}
          {phoneTab === 'ussd' && (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="font-bold text-neutral-200 text-sm">USSD Micro-Ledger Engine</span>
                  <div className="px-1.5 py-0.5 bg-indigo-900 border border-indigo-700 rounded text-[9px] font-mono font-bold">
                    *384*55#
                  </div>
                </div>

                {ussdSession.state === 'idle' ? (
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-900 text-center py-8">
                    <Smartphone className="w-10 h-10 mx-auto mb-2 text-indigo-500 animate-pulse" />
                    <p className="font-semibold text-neutral-300">Simulate USSD Dialing</p>
                    <p className="text-neutral-500 text-[10px] mt-1 mb-4">Dial Upendo Chama USSD script directly to load the savings & loans manager offline menu.</p>
                    
                    <div className="flex items-center bg-black border border-neutral-800 rounded p-1 mb-2">
                      <input
                        type="text"
                        value={ussdDialCode}
                        onChange={(e) => setUssdDialCode(e.target.value)}
                        className="bg-transparent text-center font-mono text-emerald-400 font-bold w-full focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleUssdMainDial}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded transition shadow-lg shadow-emerald-950/20 text-xs"
                    >
                      Dial *384*55#
                    </button>
                  </div>
                ) : (
                  <div className="bg-neutral-950 border border-amber-900/40 p-3 rounded-lg font-mono text-zinc-100">
                    <div className="text-[10px] text-amber-500 border-b border-neutral-900 pb-1 mb-2 uppercase tracking-tight flex justify-between items-center">
                      <span>USSD Dialogue Interface</span>
                      <button 
                        onClick={() => setUssdSession({ state: 'idle' })}
                        className="text-[9px] text-neutral-500 hover:text-red-400 inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Cancel
                      </button>
                    </div>

                    {/* USSD Dynamic Text Outputs */}
                    {ussdSession.state === 'welcome' && (
                      <div className="space-y-1">
                        <p className="font-bold text-amber-200">
                          {swahiliMode ? 'Karibu kwenye Akiba ya Upendo:' : 'Welcome to Upendo Unity Chama Ledger:'}
                        </p>
                        <p>1. {swahiliMode ? 'Angalia Salio na Hisa' : 'Check My Balance & Shares'}</p>
                        <p>2. {swahiliMode ? 'Weka Akiba / Nunua Hisa' : 'Save / Deposit Money'}</p>
                        <p>3. {swahiliMode ? 'Omba Mkopo wa Chama' : 'Apply Chama Microloan'}</p>
                        <p>4. {swahiliMode ? 'Lipa Mkopo wako' : 'Pay Outstanding Repayment'}</p>
                        <p>5. {swahiliMode ? 'Kiwango/Kikomo cha Mkopo' : 'Check Credit Rating & Limit'}</p>
                        <div className="pt-2 border-t border-neutral-900 mt-2 grid grid-cols-5 gap-1">
                          <button onClick={() => quickOptionClick('1')} className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-1 px-1.5 rounded text-[10px] text-center font-bold">1</button>
                          <button onClick={() => quickOptionClick('2')} className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-1 px-1.5 rounded text-[10px] text-center font-bold">2</button>
                          <button onClick={() => quickOptionClick('3')} className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-1 px-1.5 rounded text-[10px] text-center font-bold">3</button>
                          <button onClick={() => quickOptionClick('4')} className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-1 px-1.5 rounded text-[10px] text-center font-bold">4</button>
                          <button onClick={() => quickOptionClick('5')} className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-1 px-1.5 rounded text-[10px] text-center font-bold">5</button>
                        </div>
                      </div>
                    )}

                    {ussdSession.state === 'checking_balance' && (
                      <div className="space-y-1 text-[11px]">
                        <p className="font-bold text-emerald-400">
                          {swahiliMode ? 'Kumbukumbu zako za Chama:' : 'Your Chama Ledger Record:'}
                        </p>
                        <p>• {swahiliMode ? 'Jumla ya Akiba:' : 'Total Savings:'} Ksh {activeMember.totalSavings.toLocaleString()}</p>
                        <p>• {swahiliMode ? 'Hisa zilizonunuliwa:' : 'Shares Purchased:'} {activeMember.shareBalance / 500} {swahiliMode ? 'Hisa' : 'Shares'} ({swahiliMode ? 'Thamani yake:' : 'Valued at:'} Ksh {activeMember.shareBalance.toLocaleString()})</p>
                        <p>• {swahiliMode ? 'Deni la Mkopo:' : 'Outstanding Loan:'} Ksh {activeMember.activeLoans.toLocaleString()}</p>
                        <p>• {swahiliMode ? 'Malengo ya mwezi:' : 'Paybill Target:'} Ksh {groupConfig.targetContribution.toLocaleString()}/mo</p>
                        <div className="pt-2">
                          <button 
                            onClick={() => {
                              setUssdSession({ state: 'welcome' });
                              speakPhrase?.(swahiliMode ? "Umerudi kwenye orodha kuu." : "Returned to main menu.", swahiliMode);
                            }}
                            className="text-amber-500 font-bold hover:underline"
                          >
                            0. {swahiliMode ? 'Rudi Nyuma' : 'Back'}
                          </button>
                        </div>
                      </div>
                    )}

                    {ussdSession.state === 'deposit_select' && (
                      <div className="space-y-1">
                        <p className="font-bold text-amber-200">
                          {swahiliMode ? 'Chagua njia ya akiba:' : 'Select deposit asset ledger:'}
                        </p>
                        <p>1. {swahiliMode ? 'Akiba ya Kawaida' : 'Savings Vault Portfolio'}</p>
                        <p>2. {swahiliMode ? 'Nunua Hisa Mpya za Chama' : 'Buy Chama Equity Shares'}</p>
                        <p>0. {swahiliMode ? 'Rudi Nyuma' : 'Back to Main'}</p>
                        <div className="pt-2 border-t border-neutral-900 mt-2 flex gap-2">
                          <button onClick={() => quickOptionClick('1')} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-1 rounded text-center text-[10px]">1 ({swahiliMode ? 'Akiba' : 'Savings'})</button>
                          <button onClick={() => quickOptionClick('2')} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-1 rounded text-center text-[10px]">2 ({swahiliMode ? 'Hisa' : 'Shares'})</button>
                        </div>
                      </div>
                    )}

                    {ussdSession.state === 'deposit_amount' && (
                      <div className="space-y-1">
                        <p className="font-bold text-amber-200">
                          {swahiliMode ? 'Ingiza kiasi (Ksh) kutuma kupitia M-Pesa:' : 'Enter payment amount (Ksh) to send via simulated STK Push trigger:'}
                        </p>
                        <div className="flex gap-2 pt-1.5">
                          <button onClick={() => setUssdInputText('500')} className="bg-neutral-900 hover:bg-neutral-800 py-0.5 px-2 rounded">500</button>
                          <button onClick={() => setUssdInputText('1000')} className="bg-neutral-900 hover:bg-neutral-800 py-0.5 px-2 rounded">1,000</button>
                          <button onClick={() => setUssdInputText('2500')} className="bg-neutral-900 hover:bg-neutral-800 py-0.5 px-2 rounded">2,500</button>
                          <button onClick={() => setUssdInputText('5000')} className="bg-neutral-900 hover:bg-neutral-800 py-0.5 px-2 rounded">5,000</button>
                        </div>
                      </div>
                    )}

                    {ussdSession.state === 'loan_apply' && (
                      <div className="space-y-1">
                        <p className="font-bold text-rose-300">
                          {swahiliMode ? 'Omba Mkopo wa Papo Hapo:' : 'Apply Instant Micro-credit:'}
                        </p>
                        <p>• {swahiliMode ? 'Kikomo cha juu:' : 'Max Limit:'} Ksh {(activeMember.totalSavings * 3).toLocaleString()} ({swahiliMode ? 'mara 3 ya akiba' : '3x of savings'})</p>
                        <p>• {swahiliMode ? 'Riba:' : 'Base Rate:'} 5% flat</p>
                        <p className="text-neutral-400 mt-1">
                          {swahiliMode ? 'Andika kiasi unachotaka kuomba hapa chini (mfano 5000):' : 'Type loan principal amount in box below (e.g. 5000):'}
                        </p>
                      </div>
                    )}

                    {ussdSession.state === 'loan_confirm' && (
                      <div className="space-y-1 font-sans text-xs">
                        <p className="font-bold text-amber-200 font-mono">
                          {swahiliMode ? 'Thibitisha Masharti ya Mkopo:' : 'Confirm Loan terms:'}
                        </p>
                        <p>• {swahiliMode ? 'Kiasi ulichoomba:' : 'Applied Principal:'} Ksh {ussdSession.tempAmount?.toLocaleString()}</p>
                        <p>• {swahiliMode ? 'Riba (5%):' : 'Interest Cost (5%):'} Ksh {((ussdSession.tempAmount || 0) * 0.05).toLocaleString()}</p>
                        <p>• {swahiliMode ? 'Jumla ya kulipa:' : 'Total Due:'} Ksh {((ussdSession.tempAmount || 0) * 1.05).toLocaleString()}</p>
                        <p>• {swahiliMode ? 'Muda:' : 'Period:'} 3 months amortization</p>
                        <p className="mt-2 font-mono">1. {swahiliMode ? 'Thibitisha na Tuma Ombi' : 'Confirm & Submit to Committee'}</p>
                        <p className="font-mono">2. {swahiliMode ? 'Ghairi / Futa' : 'Cancel'}</p>
                        <div className="flex gap-2 pt-1 font-mono">
                          <button onClick={() => quickOptionClick('1')} className="flex-1 bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 py-1 rounded text-center">{swahiliMode ? '1. Thibitisha' : '1. Apply'}</button>
                          <button onClick={() => quickOptionClick('2')} className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-1 rounded text-center">{swahiliMode ? '2. Ghairi' : '2. Cancel'}</button>
                        </div>
                      </div>
                    )}

                    {ussdSession.state === 'repay_loan_select' && (
                      <div className="space-y-1">
                        <p className="font-bold text-amber-200">
                          {swahiliMode ? 'Chagua mkopo wa kulipa sasa:' : 'Select Loan to Pay Repayment:'}
                        </p>
                        {activeMemberLoans.filter(l => l.status === 'approved' || l.status === 'overdue').length === 0 ? (
                          <p className="text-neutral-500 italic text-[11px]">
                            {swahiliMode ? 'Huna mkopo wowote unaotakiwa kulipwa kwa sasa.' : 'No active loans found matching outstanding balances.'}
                          </p>
                        ) : (
                          activeMemberLoans.filter(l => l.status === 'approved' || l.status === 'overdue').map((loan, idx) => (
                            <p key={loan.id}>{idx + 1}. Ksh {loan.activeLoans.toLocaleString()} ({loan.purpose.substring(0, 15)}...)</p>
                          ))
                        )}
                        <p className="text-neutral-500 mt-1">
                          {swahiliMode ? 'Chagua nambari ya mkopo kuendelea (mfano 1):' : 'Select index option to continue (e.g. 1):'}
                        </p>
                      </div>
                    )}

                    {ussdSession.state === 'repay_loan_amount' && (
                      <div className="space-y-1">
                        <p className="font-bold text-amber-200">
                          {swahiliMode ? 'Weka kiasi cha kulipa:' : 'Specify repayment amount:'}
                        </p>
                        <p>• {swahiliMode ? 'Salio la deni zima:' : 'Outstanding loan level:'} Ksh {ussdSession.tempAmount?.toLocaleString()}</p>
                        <p className="text-neutral-400">
                          {swahiliMode ? 'Andika kiasi chini au bofya:' : 'Type amount below or choose:'}
                        </p>
                        <div className="flex gap-1 pt-1">
                          <button onClick={() => setUssdInputText((ussdSession.tempAmount || 0).toString())} className="bg-neutral-900 hover:bg-neutral-800 px-1.5 py-0.5 rounded text-[9px]">{swahiliMode ? 'Lipa Yote' : 'Full Payment'} (Ksh {ussdSession.tempAmount})</button>
                        </div>
                      </div>
                    )}

                    {/* USSD input controls */}
                    {ussdSession.state !== 'checking_balance' && ussdSession.state !== 'welcome' && ussdSession.state !== 'deposit_select' && ussdSession.state !== 'loan_confirm' && (
                      <div className="mt-4 pt-2 border-t border-neutral-900 flex gap-2">
                        <input
                          type="text"
                          value={ussdInputText}
                          onChange={(e) => setUssdInputText(e.target.value)}
                          placeholder="Type option value..."
                          className="bg-black border border-neutral-800 rounded px-2 py-1 text-white w-full text-xs font-mono focus:outline-none focus:border-amber-600"
                        />
                        <button
                          onClick={() => handleUssdSubmit(ussdInputText)}
                          className="bg-amber-600 hover:bg-amber-700 text-black font-bold px-3 py-1 rounded text-xs font-mono"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Simulation USSD status log */}
              <div className="mt-2 bg-neutral-950 p-2 rounded max-h-24 overflow-y-auto text-[9px] font-mono text-zinc-500 border border-neutral-950">
                {ussdLogs.map((log, i) => (
                  <div key={i}>&gt; {log}</div>
                ))}
              </div>
            </div>
          )}

          {/* ======================= SCREEN: M-PESA MOCK WALLET ======================= */}
          {phoneTab === 'mpesa' && (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* STK Pin Overlay mock inside M-Pesa workspace */}
              {mpesaMode === 'stk_pin' ? (
                <div className="bg-neutral-950 p-4 rounded-xl border-2 border-emerald-500/50 my-auto text-center space-y-4">
                  <div className="w-10 h-10 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-900 animate-pulse">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-100 text-[13px] leading-tight">SIM Toolkit PIN Prompt</h4>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Authorize payment to Chama Paybill <span className="text-emerald-400 font-bold">{groupConfig.paybillNumber}</span>:
                    </p>
                    <p className="text-emerald-400 font-bold font-mono text-sm mt-2">
                      Ksh {paymentDetails?.amount.toLocaleString()} ({paymentDetails?.type === 'repayment' ? 'Loan Repayment' : `Buy ${paymentDetails?.type}`})
                    </p>
                  </div>

                  {/* Pin Dot Indicators */}
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4].map((dot) => (
                      <div
                        key={dot}
                        className={`w-3.5 h-3.5 rounded-full border border-neutral-800 flex items-center justify-center ${
                          pin.length >= dot ? 'bg-emerald-500 text-black font-extrabold text-[10px]' : 'bg-neutral-900'
                        }`}
                      >
                        {pin.length >= dot ? '•' : ''}
                      </div>
                    ))}
                  </div>

                  {pinError && (
                    <p className="text-red-500 text-[9px] font-bold">PIN must be 4 digits. Use PIN 4321 for demo!</p>
                  )}

                  {isProcessingPayment ? (
                    <div className="text-neutral-400 text-[10px] animate-pulse flex items-center justify-center gap-1.5 py-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      Validating secure mobile handshake...
                    </div>
                  ) : paymentSuccessPopup ? (
                    <div className="bg-emerald-900/30 text-emerald-400 p-2 rounded text-[10px] font-bold border border-emerald-800 transition">
                      ✔ Paybill Transaction Confirmed! Logs & SMS delivered.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 pt-2 max-w-[200px] mx-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            if (pin.length < 4) {
                              setPin(prev => prev + num);
                              setPinError(false);
                            }
                          }}
                          className="bg-neutral-900 hover:bg-neutral-800 text-neutral-200 py-1.5 rounded text-xs select-none active:scale-95 transition"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => setPin('')}
                        className="bg-rose-950 text-rose-400 p-1.5 rounded text-[9px] font-bold"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          if (pin.length < 4) setPin(prev => prev + '0');
                        }}
                        className="bg-neutral-900 hover:bg-neutral-800 py-1.5 rounded text-xs select-none"
                      >
                        0
                      </button>
                      <button
                        onClick={handlePinSubmit}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded text-[10px]"
                      >
                        OK
                      </button>
                    </div>
                  )}

                  <p className="text-[9px] text-neutral-500 italic">This demo accepts any 4-digit PIN (e.g., 4321) to authorize deposits.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Simulated M-Pesa interface */}
                    <div className="bg-emerald-600 p-3 rounded-xl mb-4 text-white">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-extrabold text-[13px] tracking-wide">M-PESA WALLET</span>
                        <span className="text-[9px] bg-emerald-800 p-1 rounded font-bold">Simulated App</span>
                      </div>
                      <p className="text-[10px] opacity-90">Personal Mobile Balance:</p>
                      <p className="text-lg font-bold">Ksh {(24520).toLocaleString()}</p>
                    </div>

                    <p className="font-bold text-neutral-200 mb-2">Simulate Paybill Deposit</p>
                    
                    <div className="space-y-2 text-[11px] bg-neutral-950 p-3 rounded-lg border border-neutral-900">
                      <div>
                        <label className="text-zinc-400 block text-[9px] mb-0.5">Enter paybill Number:</label>
                        <input
                          type="text"
                          value={mpesaPaybill}
                          onChange={(e) => setMpesaPaybill(e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 rounded p-1 text-white w-full"
                          placeholder="e.g. 882882"
                        />
                      </div>

                      <div>
                        <label className="text-zinc-400 block text-[9px] mb-0.5">Member SIM Reference (Phone Number):</label>
                        <input
                          type="text"
                          value={mpesaAccount}
                          onChange={(e) => setMpesaAccount(e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 rounded p-1 text-white w-full font-mono"
                          placeholder="07xxxxxxxx"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-zinc-400 block text-[9px] mb-0.5">Amount (Ksh):</label>
                          <input
                            type="number"
                            value={mpesaAmount}
                            onChange={(e) => setMpesaAmount(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 rounded p-1 text-white w-full"
                          />
                        </div>

                        <div>
                          <label className="text-zinc-400 block text-[9px] mb-0.5">Record Asset:</label>
                          <select
                            value={mpesaType}
                            onChange={(e: any) => setMpesaType(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 rounded p-1 text-white w-full text-xs"
                          >
                            <option value="savings">Savings Vault</option>
                            <option value="shares">Buy Equity Shares</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const amt = parseFloat(mpesaAmount);
                          if (isNaN(amt) || amt <= 0) {
                            alert("Please enter a valid amount.");
                            return;
                          }
                          setPaymentDetails({ amount: amt, type: mpesaType });
                          setMpesaMode('stk_pin');
                          setPin('');
                          setPinError(false);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded mt-2 transition"
                      >
                        Trigger Paybill (STK Push)
                      </button>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded text-[10px] text-zinc-400 flex items-start gap-1.5 leading-normal">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      This mimics mobile money chamas. Instead of taking actual bills, this sends secure callbacks, maintaining an error-free financial chain.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lower Simulated Device Home Button */}
        <div className="mt-2 pt-1 border-t border-neutral-900 flex justify-around">
          <button
            onClick={() => {
              setPhoneTab('ussd');
              setUssdSession({ state: 'idle' });
              setMpesaMode('home');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded transition ${phoneTab === 'ussd' ? 'text-indigo-400 bg-indigo-950/40' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[8px] font-bold">USSD Sim</span>
          </button>
          
          <button
            onClick={() => {
              setPhoneTab('mpesa');
              setMpesaMode('home');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded transition ${phoneTab === 'mpesa' ? 'text-emerald-400 bg-emerald-950/40' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-[8px] font-bold">M-Pesa Sim</span>
          </button>

          <button
            onClick={() => {
              setPhoneTab('sms');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded transition ${phoneTab === 'sms' ? 'text-amber-400 bg-amber-950/40' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <span className="relative">
              <Send className="w-4 h-4" />
              {filteredSMS.some(m => !m.isRead) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
              )}
            </span>
            <span className="text-[8px] font-bold">SMS Feed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
