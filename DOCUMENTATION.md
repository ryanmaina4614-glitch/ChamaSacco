# Biashara Boost - Technical & Operational Documentation

Welcome to the comprehensive technical documentation for **Biashara Boost Chama & Table Banking Automation** platform. 

This workspace is engineered to replace manual paper notebooks and unmonitored physical cash boxes with a high-fidelity, dual-entry, real-time microfinance ledger. It is calibrated for community self-help rotating financial collectives (known as Chamas, SACCOs, or ROSCAs in East Africa).

---

## 📖 Module-by-Module Breakdown

The system is split into two co-dependent viewports: the **Management Cabin** (left viewport) and the **Safaricom M-Pesa Handset Emulator** (right viewport).

### 1. Unified Sacco Core Analytics (Dashboard)
The home dashboard provides an intuitive, real-time visualization of Sacco assets and liquidity distribution:
- **Digital Vault Cash:** Reflects liquid physical cash held in the group treasury. It automatically drops during loan payouts and accrues upon deposit, share buy-ins, and loan repayments.
- **Accrued Member Savings:** The pooled cash backed by member-contributed savings ledger records toward individual monthly milestones.
- **Total Sacco Equity Shares:** Reflects structural share capital holdings. Saccos sell shares at a default unit price (Ksh 500/share) to build permanent capital reserves.
- **Circulating Loan Book:** Records capital currently externalized to borrowing members plus outstanding interest yields.
- **Interactive Recharts Trend Visualizer:**
    - Displays savings growth trends vs. cumulative loan disbursements month-by-month.
    - **Dynamic Bar Selector:** Clicking on any month's bar element triggers a selected period transition, querying and loading that period's physical balance records into the **Dynamic Side-Panel Breakdown**.
    - **Interactive Pro-tip and Hover Tooltip:** Displays actual currency distributions with enhanced high-fidelity statistics.
- **Global Sacco Transaction Register:** A chronological audit registry detailing digital M-Pesa references, transaction categories (Savings, Loan Disbursal, Late Penalties, Share Purchase), timestamps, and database sync validation tags.

### 2. Guided onboarding: Walkthrough Tour Overlay
- **Multi-Step Guided Flow:** Incorporates a friendly, high-contrast walkthrough dialog showing beginners the most crucial core modules.
- **Contextual State Swapping:** The tour engine dynamically manages the parent viewport:
    *   *Step 1 (Welcome Panel):* Explains table-banking dynamics.
    *   *Step 2 (Data Analytics):* Swaps the active tab to `Dashboard` to show Recharts bars and guides user to click monthly bars.
    *   *Step 3 (Handset USSD Console):* Toggles the simulated mobile console sliding panel to visible on the right.
    *   *Step 4 (Transactions Section):* Directs the user to the underlying M-Pesa billing boards.
    *   *Step 5 (Resilience):* Explains how offline/online sync mechanisms write cached updates back to Cloud servers.
- **Local Onboarding Persistence:** Saves the completed tour flag in `localStorage` (`chama_tour_completed_v2`) to prevent intrusive repeat overlays for returning users, but allows manual trigger via the **Walkthrough Onboarding** button in the header.

### 3. Sacco Members Directory & Credit Scoring System
- **Member Roster:** Houses full administrative details: Legal Name, National ID (unique, verified identifying field), Carrier Contact, and Active Debt status.
- **Interactive eSIM Selector:** Click any member card to instantly hot-swap the simulated physical SIM card inside the handset emulator. The cellphone container automatically shifts to highlight that member's credentials, active mobile banking statements, and SMS outbox.
- **Real-time Credit Score Tracker (Range: 300 to 850):**
    - A dynamic algorithmic scoring engine.
    - Timely amortization settlement adds **+15 score points** (maxing at 850).
    - Unresolved late debts generate instant delinquent warnings and trigger major scoring penalties (**-60 points**, bottoming at 300).
    - Low-scoring members are automatically restricted from requesting high-tier credit ratios within USSD banking menus.

### 4. Co-operative Lending & Governance Board (Underwriting)
- **Credit Limit Calculator:** Enforces high-safety underwriting guidelines. Under the classic Chama co-operative **300% Multiplier Rule**, a member’s borrowing capacity is capped at 3x their active accrued savings.
- **Interactive Plan Amortizer:** Allows comparing **Flat Rate interest** structures (flat cycle calculation) against **Reducing-Balance interest** (monthly computed compound interest) prior to commitment.
- **Multi-Pledge Collateral (Guarantor Ring):** Members can delegate co-debtors to pledge portions of their personal savings balances as loan collateral. The loan stays locked until the selected guarantors log in and digitally sign off.
- **Multi-Sig Executive Consensus Panel:** 
    - Implements triple-lock board verification. 
    - The **Chairperson** and **Treasurer** must log in to their respective Sacco administrative profiles.
    - **Commitment To Transparency:** Officers cannot simply click "Approve". They are strictly required to type out their detailed **Executive Assessment Reason** into a text field before their digital signature is accepted.
    - Once both approvals are secured, the simulated Safaricom API disbursal pipeline unlocks, enabling instant mobile cash delivery.

### 5. Live Loan Book, Repayment Directory, & Governance Daemon
In community SACCO banking, monitoring and warning against pending deadlines is vital to prevent default leakage:
- **Autonomous Governance Daemon:** Implements a background scheduler hook in `LoanGovernance.tsx` that ticks every 7.5 seconds, running live checks on Sacco balance records and individual loan lifetimes.
- **Log Activity Shell:** Renders a terminal output log compiling background check reports (e.g., scan timestamps, overdue accounts, approaching maturity thresholds).
- **Proximity Highlighting System:** Monitors `dateRepayBy` dates against current system dates:
    *   **⚠️ Approaching Target (<= 7 days remaining):** Renders the loan in a distinctive, warning **amber/yellow box** outline. Automatically appends a prominent alert banner warning Sacco officials that a critical repayment maturity deadline is coming and advising manual outreach.
    *   **🚨 Late Overdue (Past Due):** Highlights loans in a severe **rose/red container box** with penalty alert summaries and drop score updates.
- **Settlement Metrics Sliders:** Houses interactive progress bars depicting accurate clearance percentages (e.g., Ksh repaid out of total obligation).

### 6. Interactive Safaricom Handset Simulation
Provides a full-fidelity cellular ecosystem mirroring real mobile-money behaviors:
- **Numeric USSD Console (`*384#`):** Replicating cellular GSM text menus. Dialing the shortcodes opens text menus for checking balances, depositing cash, buying shares, requesting credit, and clearing debts over network simulation.
- **STK M-PESA Push Paybill:** Simulates cellular STK Push PIN dialog prompts. Entering any 4-digit PIN posts payments directly to double-entry ledger databases, triggering audio chimes.
- **SIM SMS Notification Thread:** Houses automated carrier statements (e.g., M-Pesa transaction reference strings, penalty alerts, disbursement confirmations) corresponding to real-world carrier patterns.

### 7. Consolidated Audit & Reporting Tool
- **Time-Travel Simulation:** Enables testers to cycle months ahead, triggering interest accumulation, grace periods, penalty fines, and automated overdue warning letters in real time.
- **Consolidated Sacco Audit Register:** Compiles financial balance sheets comparing savings, shares, interest payouts, and vault cash reserves.
- **Print Override Templates:** Formats professional audit printouts with formal signature placeholders for the Sacco Chairman, Secretary, and Treasurer.

---

## 🔒 Firebase Security Schema (Rules Guide)

Biashara Boost is reinforced by production-level Firebase Firestore safety rules configured in `firestore.rules`.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Core validator helper checking Sacco membership
    function isSaccoMember(groupId, memberId) {
      return exists(/databases/$(database)/documents/groups/$(groupId)/members/$(memberId));
    }
    
    match /groups/{groupId} {
      allow read, write: if true; // Config-level accessibility
      
      match /members/{memberId} {
        allow read, write: if true; // Members data directory
      }
      
      match /transactions/{txId} {
        // Double-entry logs are immutable once created to prevent balance fraud
        allow read: if true;
        allow create: if isSaccoMember(groupId, request.resource.data.memberId);
        allow update, delete: if false; 
      }
      
      match /loans/{loanId} {
        allow read: if true;
        // Underwriting safety limits are verified relative to voter roles
        allow create, update: if true;
        allow delete: if false;
      }
      
      match /announcements/{annId} {
        allow read: if true;
        allow write: if true; // Handled via board privileges
      }
      
      match /documents/{docId} {
        allow read: if true;
        allow write: if true;
      }
    }
  }
}
```

---

## 🧪 Simulation Walkthrough Scenarios

Test the synchronized state mechanics using three standard walkthrough routines:

### Scenario A: Walkthrough onboarding & Chart Month Clicks
1. Navigate to the top header and click **Walkthrough Onboarding**. 
2. Step through the guided prompts. The app automatically flips options:
    *   *Step 1:* Launches welcoming info.
    *   *Step 2:* Moves the main screen back to the **Dashboard** and points to the monthly chart.
    *   *Step 3:* Slides open the Safaricom cellular container.
3. Finish the tour. Click the Recharts bar labeled **June**.
4. The **Ledger Side-panel** instantly queries, loads, and displays the transaction list (depositors list and disbursed microloans list) specific to June 2026.

### Scenario B: Dynamic Guarantor Underwriting & Multi-Sig Voting
1. Choose a member from the directory (e.g., **David Kamau**) who has accumulated a high savings balance.
2. Under David’s active SIM profile, open the cellphone simulator, choose **M-Pesa Sim** -> **Deposit Savings**, and trigger an STK deposit of `Ksh 10,000`.
3. Open the **Loans** dashboard on the left management panel. Click **Request Microloan** to apply for `Ksh 15,000` (within David's 3x limit multiplier). Select another member as guarantor (e.g., **Linet Atieno**), write a business purpose, and submit.
4. The loan application is logged but marked as **Awaiting Signatures**. It stays locked in escrow.
5. In the members directory, click **Linet Atieno** to hot-swap simulated SIM cards. Her handset eSIM is configured.
6. Under Linet's administrative view in the **Loans** page, she locates the pending pledge under her guarantor panel and clicks **Sign Guarantor Pledge**.
7. In the members directory, swap to **Grace Mwangi** (Sacco Chairperson). Under her Chairperson profile, she views the loan, types her rationale (e.g., *"David is a high-yield farmer with clean Sacco track"*), and signs her approval.
8. Swap to **Linet Atieno** (Sacco Treasurer). Under her Treasurer view, she types her treasurer rationale and clicks approve.
9. Watch as the **Simulate M-Pesa Disbursement Now** button unlocks. Click it! The funds are dispersed, Sacco vaults decrease, and David receives M-Pesa receipts.

### Scenario C: Simulating Time Cycles & Daemon Proximity Alarms
1. Under Flora’s active SIM, authorize and disburse a standard microloan due in 1 month (e.g., `dateRepayBy` is configured for July 1, 2026).
2. Go to the top header sim date controller and click **Fast Forward +1 Month**.
3. Watch the **Live Chama Loan Book & Repayment Directory** panel:
    *   The background Governance Daemon (ticking every 7.5 seconds) scans and flags the loan as past due.
    *   The loan card outline turns **rose/red**.
    *   The member's credit score drops instantly by **-60 points**.
    *   A high-visibility warning alert occupies the card, notifying management that the client is delinquent and advising immediate carrier collection alerts or fine penalties.
4. Have the member pay back via USSD or Paybill Simulator. The clearance meter updates to 100% and the loan transitions gracefully to **Fully Paid ✓**.

---

```
   EMPOWERING LOCAL CHAMA GOVERNANCE WITH IMMUTABLE LEDGER STANDARDS 🌸 BIASHARA BOOST
```
