# Upendo Unity - Group Savings & Micro-credit Automation

Welcome to the **Upendo Unity Chama & Table Banking Automation** ledger coordinator. This application has been designed specifically to replace vulnerable manual physical ledgers and cash boxes with an error-free, double-entry automated mobile reconciliation workspace.

Below is an analytical overview of the software's functional layout, architectural components, and a step-by-step guide on how to test every module inside the live sandbox.

---

## 📖 Module-by-Module Breakdown

The application is structured logically to facilitate complete offline-first operational consistency:

### 1. Unified Ledger Dashboard (Chama Ledger)
- **Digital Vault Cash:** Tracks liquid cash reserves pooling inside the Chama. Funds decrease immediately upon approved loan disbursements and increase upon automated member savings, equity purchases, and loan repayment.
- **Member Savings Vault:** Monitors cumulative client balances toward monthly targets.
- **Total Equity Shares:** Tracks active investment shares issued at the designated baseline rate (Ksh 500 per unit).
- **Outstanding Loan Book:** Monitors total principal and accrued interest currently distributed to borrowing members.
- **Vault Activity Graph:** Handcrafted SVG trendline charts plotting real-time reserves versus active credit exposure across month-by-month rotations.
- **Transaction Ledger:** A fully searchable, paginated ledger showing immutable audit trails of M-Pesa references and bank mobile wallet payloads.

### 2. Interactive Handset Sandbox (Safaricom M-Pesa SIM Simulator)
Since this is a sandboxed simulation representing unbanked or mobile-money dependent community groups:
- **USSD Menu Sim (`*384*55#`):** Replicates standard offline telecom interfaces. Members use numeric dialogue trees to check savings balances, purchase shares, apply for instant credit (up to 300% of physical savings balance), and repay outstanding obligations.
- **Paybill SIM (STK Push Handshake):** Mimics the secure Safaricom PIN collection request. Inputting any four-digit PIN (e.g., `4321`) posts transactions safely to the main Chama database, triggering instant event emissions.
- **Simulated SMS Inbox:** Generates instant network confirmation statements in full compliance with Kenyan carrier patterns (e.g., standard M-PESA receipt confirmation codes).

### 3. Member Roster Center
- **Membership Administration:** Add new members by registering legal names, carrier phone numbers, and email coordinates.
- **SIM Profiling Selector:** Swap simulated physical SIM cards dynamically. Click on any member profile to instantly configure the Handset Sandbox to mimic that client's device, active balances, and SMS text log feed.
- **Credit Assessment Scoring:** A real-time scoring algorithm (from 300 to 850) that adjusts dynamically based on repayment reliability, monthly target discipline, and overdue events. Outstanding borrowers with overdue debts are heavily penalized (-60 points), whereas timely repayment increases trust caps (+15 points).

### 4. Co-operative Lending & Governance Board
- **Request Microloan Box:** Apply for collateral-free credit governed by 300% savings caps.
- **Amortization Simulator:** Sandbox tools visualizing the exact repayment cycles of **Flat Rate interest** (fixed cumulative rate) versus **Reducing Balance compound interest**.
- **Consensus Committee Approval Log:** In strict table-banking schemes, funds are only disbursed via multi-party executive signature consensus. Active committee members (excluding the active borrower) can toggle approvals. Reaching 2 executive checkmarks unlocks simulated instant M-Pesa disbursements.

### 5. Consolidated Monthly Audit Reconciliation Tool
- **Export Excel-compatible CSVs:** Download full audit ledgers directly in comma-separated value form.
- **Print Reports:** Isolates the current screen to compile professional physical paper outputs, signatures sheets for the Chama Chairperson and Treasurer, and ledger-matching reports with zero variance.

---

## 🚀 Step-by-Step Simulation Sandbox Workflows

Follow this walkthrough to witness real-time event synchronization across all integrated viewports:

### Activity A: Registering a Member and Making a Deposit
1. Select the **Member Roster** tab in the main navigation.
2. Click **Add New Member** on the top right.
3. Input:
   - *Full Name:* `Mary Wanjiku`
   - *Phone Number:* `0712345678` (Kenyan format starting with `01` or `07`)
   - *Email:* `mary.wanjiku@upendochama.org`
4. Submit the form. Mary will join the roster and instantly be selected as the **Active SIM**.
5. Locate the **Handset Interconnected Sandbox** on the right sidebar. Go to the **M-Pesa Sim** tab.
6. Check that the *Member SIM Reference* field matches Mary's phone (`0712345678`).
7. Enter Amount `1500` and select "Buy Equity Shares".
8. Click **Trigger Paybill (STK Push)**. The phone screen switches to the secure SIM toolkit PIN window.
9. Type any 4 digits (e.g., `4321`) and click **OK**.
10. Watch the real-time event chain: M-Pesa delivers a secure push -> Mary has purchased 3 Shares (Ksh 1,500) -> Chama Vault reserves increase by Ksh 1,500 -> Safaricom broadcasts a receipt SMS in the **SMS Feed** tab of the phone!

### Activity B: Applying and Governing a Table-Banking Loan
1. Under **Member Roster**, select **David Kamau** to activate his simulated SIM card profile.
2. Go to the **Lending Board** tab.
3. Scroll down to *Request Microloan*:
   - Specify Amount: `15000` (David has Ksh 35,000 in savings, meaning his max credit limit is 3x Savings = Ksh 105,000).
   - Enter a business statement (e.g., "Purchasing inventory").
   - Click **Submit Loan Application**.
4. The loan is created but marked as **Awaiting Committee Signature** under the *Consensus Committee Logs*.
5. Because David Kamau cannot vote on his own loan, signatures are required from other Chama trustees:
   - Click **Approve** under **Linet Atieno (Exec)**.
   - Click **Approve** under **Grace Mwangi (Exec)**.
6. Since David now has 2 executive approvals, the simulated disbursement triggers!
7. Click **Simulate M-Pesa Disbursement Now**.
8. David's member profile will reflect the new debt obligation, the main Group vault cash decreases by Ksh 15,000, and a payout audit reference is generated.

### Activity C: Accumulating Cycles & Penalty Auditing
1. Locate the **Current Sim Date** widget in the *Chama Ledger* header (e.g., `2026-06-09`).
2. Click **Fast Forward +1 Month**.
3. Watch as the system cycles 30 days ahead:
   - Automated monthly reminder notifications are broadcast to all members.
   - Any approved loans whose *Repay By* date is surpassed are labeled as **Overdue**.
   - Delinquents suffer a heavy credit score penalty (-60 points) and receive automated warning alerts advising immediate Paybill payment.

---

## 🛠️ Technological Architecture
- **Framework:** React with TypeScript.
- **Styling:** Tailored Tailwind CSS utility vectors and Google Inter Display font pairings for high-contrast slate layouts.
- **State Preservation:** LocalStorage persistence keeps simulated historical logs alive across page refreshes.
- **Audit Print Sheets:** Structured Media Print CSS selectors to format professional audit logs directly.
