# ChamaSacco - Group Savings & Micro-credit Automation

```
 ██╗   ██╗██████╗ ███████╗███╗   ██╗██████╗  ██████╗      ██╗   ██╗███╗   ██╗██╗████████╗██╗   ██╗
 ██║   ██║██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔═══██╗     ██║   ██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝
 ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║  ██║██║   ██║     ██║   ██║██╔██╗ ██║██║   ██║    ╚████╔╝ 
 ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║  ██║██║   ██║     ██║   ██║██║╚██╗██║██║   ██║     ╚██╔╝  
 ╚██████╔╝██║     ███████╗██║ ╚████║██████╔╝╚██████╔╝     ╚██████╔╝██║ ╚████║██║   ██║      ██║   
  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═════╝  ╚═════╝       ╚═════╝ ╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝   
                                                                                                
                🌿 CHAMA LEDGER, TABLE BANKING & SACCO GOVERNANCE SANDBOX 🌿
```

Welcome to the **ChamaSacco Group Savings and Micro-credit Automation** platform. This system is a high-fidelity, full-stack table-banking simulation workspace designed specifically for unbanked and informal financial self-help groups (known as Chamas or Saccos in East Africa). 

By replacing vulnerable physical paper notebooks and locked cash boxes with **immutable digital double-entry ledgers**, the platform eliminates human math errors, prevents capital leakage, and institutes rigorous multi-authority security standards—even while operating within simple, accessible localized paradigms.

---

## 🎨 System Overview & Design Philosophy

The application features a modern, ultra-high-contrast dashboard built with a professional, desktop-first responsive design. It balances dense monetary ledger details with a friendly, accessible layout utilizing **Inter**, **Space Grotesk** display titles, and **JetBrains Mono** font arrays for system status and receipt logs.

At the heart of the system is the **Dual-Viewport Workspace**:
1. **Lefthand Control Cabin**: A fully functional management system showing real-time ledger stats, loan configuration charts, member profiles with credit scoring algorithms, bulletin announcements, document systems, and reconciliation sheets.
2. **Righthand Cellphone Interactive Console**: A hyper-realistic **Safaricom M-Pesa Smartphone Simulator** containing responsive, interactive USSD quick menus, PIN STK push prompts, and cellular SMS thread archives, allowing complete lifecycle testing from a single browser page.

---

## ⚡ Key System Features

### 1. Unified Ledger Dashboard (The Chama Treasury)
*   **Physical Vault Cash:** Monitors total liquid reserves held inside the physical treasury. Resources decrease instantly upon approved loan disbursements and increase automatically upon savings targets, share purchases, or interest-accrued loan repayments.
*   **Accrued Member Savings:** Tracks cumulative member-contributed savings ledger entries toward targets.
*   **Total Equity Shares:** Manages active equity shares purchased by members, valued at a customizable baseline rate (e.g., Ksh 500 per share unit).
*   **Outstanding Loan Book:** Monitors externalized capital in circulation and expected interest yields.
*   **Handcrafted SVG Charts:** Includes double-trend charts plotting historical vault cash balances against active risk exposures.
*   **Transaction Audit Log:** An immutable ledger showing M-Pesa tracking reference strings, payment methods, timestamps, and database sync identifiers.

### 2. Safeguarded Co-operative Credit (Amortization & Underwriting)
*   **300% Multiplier Rule:** Restricts member credit exposure. A member cannot borrow more than 300% of their actual accrued physical savings.
*   **Amortization Sandbox:** Lets users visually simulate loan structures comparing **Flat-Rate interest** (fixed cumulative rates) against **Reducing-Balance compound interest** schedules before submitting applications.
*   **Guarantor Pool Locking:** Implements structured collateral risk sharing. Members can nominate multi-guarantor circles from the roster, allocating exact Ksh pledge caps. Loans remain locked until nominated guarantors log in and digitally sign.
*   **Board Executive Assessment Panels:** For security, loans are governed by dual board checkmarks. The **Chairperson** and **Treasurer** must log in to their respective profiles and cast official votes. **To combat opaque decisions, both authorities are legally required to type a detailed assessment reason before signing.**

### 3. Dynamic Credit Scoring Engine (300 to 850 scale)
To promote high target-discipline, the platform evaluates each member's behavior and computes real-time credit score weights:
*   **Reliable Repayment:** On-time loan repayment elevates scores (+15 points up to 850).
*   **Target Contribution Discipline:** Maintaining steady monthly savings adds positive integrity weight.
*   **Overdue Fines Penalty:** Delinquent borrowers whose repayment deadlines have passed are hit with instant rating penalties (-60 points down to 300), locking them out of future high-tier USSD credit cycles.

### 4. Interactive Safaricom M-Pesa eSIM Handset
Simulates and controls cellular-dependent table-banking rotations:
*   **Numeric USSD Console (`*384*55#`):** Simulates offline mobile network environments. Dialing the codes launches live USSD text pathways where members can review savings balances, buy shares, apply for credit, or pay debts without internet connectivity.
*   **Simulated STK Push Paybill:** Prompts a secure 4-digit PIN gateway (e.g. `4321`) to send payments securely into the central group vault.
*   **Live cellular SMS Outbox:** Broadcasts carrier-style confirmation SMS receipts mapped to automated Kenyan network operators (e.g., standard M-PESA confirmations).

### 5. Sacco Bulletin News & Multi-Media Hub
*   **Governance Publication Broadcast:** Board officers (Chairperson, Treasurer, and Secretary) have exclusive credentials to publish official notices, briefs, and event summaries.
*   **Media Attachments:** Announcements support adding direct attachments—including photos, briefing videos, and official folders.
*   **Automatic Archive Synchronization:** Attaching legal compliance documents or briefs automatically isolates, classifies, and inserts those assets into the **Group Documents Cabinet** for zero-friction governance indexing.

### 6. Official Sacco Documents Archive
*   **Digital Share Capital Ledger:** Catalogs the official constitution, bylaws, and core ledgers.
*   **Secretary Upload Privileges:** The Sacco Secretary has an exclusive uploader interface to add new meeting minutes, PDFs, or spreadsheet registers.
*   **Origin Tracking:** Files are categorized based on their upload origin (Direct Secretary upload vs. automated Attachment extraction from news notices).

### 7. Time Machine Simulation & Financial Auditing
*   **Multi-Month Fast forwarding:** Allows testers to leap forward into future calendar dates. Instantly calculates interest accumulation, marks delinquent loans, activates penalties, and triggers mobile SMS collections.
*   **Consolidated Reconciliation Sheets:** Includes live print styling overrides to compile matching audit registers, officer signature sheets, and ledger-matching reports with zero system variance.

---

## 📂 Core Data Structure (Types)

The application models its table-banking systems on the following TypeScript contracts:

```typescript
export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId: string;     // Mandatory and unique account identifier
  avatarColor: string;
  totalSavings: number;
  shareBalance: number;     // Configured in Ksh value
  activeLoans: number;      // outstanding principal + remaining interest to pay
  creditScore: number;      // dynamically adjusts based on repayment behavior (300 to 850)
  joinedDate: string;
  lastContributionDate?: string;
  role?: 'chairperson' | 'secretary' | 'treasurer' | 'member';
  status?: 'approved' | 'pending' | 'rejected';
}

export interface GroupConfig {
  groupName: string;
  registrationNumber: string;
  shareRate: number;              // Ksh per share unit (e.g. 500)
  targetContribution: number;     // monthly savings target (e.g. 1000)
  paybillNumber: string;
  vaultBalance: number;
  penaltyType: 'flat_fine' | 'interest_hike' | 'both' | 'none';
  flatMeetingFine: number;        // e.g. Ksh 200
  lateInterestHikePercentage: number;
  gracePeriodDays: number;
  description?: string;          // Sacco baseline overview 
  maxMembersLimit?: number;      // Capped membership capacity limit
}

export interface VoteWithReason {
  status: 'approve' | 'reject';
  reason: string;
  name: string;
  timestamp: string;
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  amountApplied: number;
  principal: number;
  interestRate: number;
  durationMonths: number;
  interestType: 'flat' | 'reducing';
  installmentTrack: 'weekly' | 'bi-weekly' | 'monthly';
  status: 'pending' | 'approved' | 'rejected' | 'repaid' | 'overdue';
  dateApplied: string;
  dateRepayBy: string;
  purpose: string;
  votes: { [memberId: string]: 'approve' | 'reject' }; // Multi-sig status
  votesWithReason?: { [memberId: string]: VoteWithReason }; // Mandated rationale
  guarantors?: GuarantorPledge[];
  repaymentHistory: {
    amount: number;
    date: string;
    reference: string;
  }[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  postedBy: string;
  role: 'chairperson' | 'secretary' | 'treasurer' | 'member';
  timestamp: string;
  imageUrl?: string;
  fileUrl?: string;
  videoUrl?: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'document' | 'other';
  uploadedBy: string;
  role: 'chairperson' | 'secretary' | 'treasurer' | 'member';
  timestamp: string;
  url: string;
  source: 'direct' | 'announcement';
}
```

---

## 🔒 Firebase Security & Schema Architecture

The platform scales seamlessly with continuous online synchronization powered by **Google Firebase Firestore**. Our database configurations are reinforced by advanced Zero-Trust rules defined in `firestore.rules`.

### Data Relationship Model:
```
  [groups Collection] (Root Documents)
         │
         ├─── [members Sub-Collection]
         ├─── [transactions Sub-Collection]
         ├─── [loans Sub-Collection]
         ├─── [announcements Sub-Collection]
         └─── [documents Sub-Collection]
```

### 🛡️ Core Rules Safeguards
1.  **Master Gate Pattern:** Validates all subcollection operations by looking up membership authorization from the master `/groups/{groupId}/members/{memberId}` document using the `get()` primitive.
2.  **Anti-Update-Gaps:** Updates are strictly validated through `affectedKeys().hasOnly()` gates. Users cannot escalate their own platform privileges or modify immutable ledger figures.
3.  **National ID Integrity:** Restricts profile registrations to validated identification ranges, ensuring each asset has an audit-compliant owner.
4.  **Implicit vs Explicit Checking:** All financial operations block modification of core transaction parameters (such as `reference` strings and `status`) once transactions are completed.

---

## 🛠️ Tech Stack & Workspace Config

*   **Runtime Engine:** Node.js, Vite with HMR configured behind an infrastructure reverse proxy.
*   **Client Core:** React (v18+), TypeScript, standard functional design with React context, Lucide UI icons.
*   **Styling Engine:** Tailwind CSS utilizing high-contrast borders and deep space-slate canvases.
*   **Animations:** Rich component micro-transitions powered by `motion/react`.
*   **Database Service:** Google Firebase SDK (Firestore, auth integrations, real-time snapshot event streams).

### 🖥️ Local Installation & Development

```bash
# 1. Clone the repository and navigate to the project directory
cd group-savings-microcredit-automation

# 2. Install all base node packages and system dependencies
npm install

# 3. Configure local environment paths inside your workspace .env
cp .env.example .env

# 4. Fire up the high-fidelity Vite local development server
npm run dev
```

*Note: The system binds exclusively to port `3000` inside Cloud Run containers when deployed. In local development or preview mode, check `package.json` configurations indicating `host: 0.0.0.0` and `--port 3000` bindings.*

---

## 🏆 step-by-Step Walkthrough Labs

Get started testing this sandboxed ecosystem with three illustrative exercises:

### 🧪 Exercise A: Onboard a New Sacco Member and Purchase Equity Shares
1.  Navigate to the **Members** tab on the left workspace panel.
2.  Click the **Add New Member** button.
3.  Fill in the onboarding form:
    *   *Full Name:* `Flora Mwende`
    *   *Phone Number:* `0712398456`
    *   *Email Profile:* `flora.mwende@chamasacco.org`
    *   *National National ID:* `29401822` (Mandated identifier)
4.  Submit the form. Flora joins the Sacco and is instantly selected as the **Active SIM SIM Profile** inside the cellphone interactive console on the right side.
5.  On the cellphone simulator, choose **M-Pesa Sim** -> **Buy Equity Shares**.
6.  Input amount `2500` (Flora wants to purchase 5 shares valued at Ksh 500 per unit) and click **Trigger Paybill (STK Push)**.
7.  Type any four-digit PIN (e.g., `5555`) in the handset screen dialog and approve.
8.  Observe the real-time update: flora's member record updates to show **5 Shares (Ksh 2,500)**, the central double-entry vault balance immediately scales up by `+2500`, and a standard cellular M-Pesa verification text arrives inside the phone's **SMS Feed** tab.

### 🧪 Exercise B: Underwriting Co-operative Credit and Joint Board Decision-Making
1.  While Flora Mwende's SIM profile remains active, navigate to the **Loans** tab.
2.  Flora currently has Ksh 0 in savings, so her borrowing limit is Ksh 0. First, deposit Ksh 10,000 into her savings using the cellphone Paybill Simulator (**Deposit Savings** -> STK Push PIN confirmation).
3.  Flora’s borrow limit immediately scales to **Ksh 30,000** (300% savings cap).
4.  Scroll down to **Request Microloan**. Apply for a loan of `Ksh 20000` with the reducing-interest type and weekly installments. Select `David Kamau` as Flora's physical guarantor. Input purpose: `Chama Farm Inputs purchasing`. Submit.
5.  Now Flora's application is created but marked as **Awaiting Signatures**. It needs the guarantor to pledge funds first.
6.  Go to the **Members** list and click **David Kamau** to simulate his physical profile. David's handset simulator is now activated.
7.  Go to the **Loans** dashboard. Locate Flora's pending guarantee request under David's active panel. David clicks **Sign Guarantor Pledge**.
8.  The guarantee signature is verified! Now Flora's loan requires board consensus approvals from the **Chairperson** and **Treasurer** to disburse capital.
9.  Select **Grace Mwangi** (Chairperson) from the Member list. Grace views Flora's loan, inputs her decision notes (e.g., *"Flora is a reliable grower with steady cash flow"*), and clicks **Approve**.
10. Next, select **Linet Atieno** (Treasurer) from the Member list. Linet reviews, inputs her rationales (e.g., *"Chama database confirms collateral capacity"*), and signs off.
11. With both executive assessment signatures secured and rationales permanently recorded in the transaction document, the **Simulate M-Pesa Disbursement** button unlocks.
12. Click it! The simulation auto-disburses the cash, Flora's active loan balance updates, the Sacco’s Vault Cash decreases, and Flora receives a disbursement confirmation SMS.

### 🧪 Exercise C: Time Machine Auditing & PDF Reporting
1.  With Flora’s loan active, look at the top header of the left panel containing the **Current Sim Date** (e.g., `2026-06-09`).
2.  Click **Fast Forward +1 Month**.
3.  The Sacco calendar advances 30 days!
    *   Flora's weekly loan installment schedule marks her first repayments as **Overdue**.
    *   Flora's credit rating drops by several points, and the platform sends automated SMS warnings to her phone simulator.
4.  Go to the **Financials** tab.
5.  View the automated **Monthly Audit Summary** table showing total group balances, total deposits, and projected vs. collected interest.
6.  Click the **Export/Print Reconciliation Report** button to review a perfectly formatted physical print sheet with ledger details and dedicated signature blocks for the Chairperson and Treasurer.

---

```
   MADE WITH HEART & PRISTINE CRAFTSMANSHIP FOR SACCO LEDGER ACCURACY 🌸 CHAMASACCO
```
