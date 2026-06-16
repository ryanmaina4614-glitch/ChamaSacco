# Biashara Boost - Group Savings & Micro-credit Automation

Welcome to the **Biashara Boost Group Savings and Micro-credit Automation** platform. This system is a high-fidelity, full-stack table-banking simulation workspace designed specifically for unbanked and informal financial self-help groups (known as Chamas or Saccos in East Africa). 

By replacing vulnerable physical paper notebooks and locked cash boxes with **immutable digital double-entry ledgers**, the platform eliminates human math errors, prevents capital leakage, and institutes rigorous multi-authority security standards—even while operating within simple, accessible localized paradigms.

---

## 🎨 System Overview & Design Philosophy

The application features a modern, ultra-high-contrast dashboard built with a professional, desktop-first responsive design. It balances dense monetary ledger details with a friendly, accessible layout utilizing **Inter**, **Space Grotesk** display titles, and **JetBrains Mono** font arrays for system status and receipt logs.

At the heart of the system is the **Dual-Viewport Workspace**:
1. **Lefthand Control Cabin**: A fully functional management system showing real-time ledger stats, loan configuration charts, member profiles with credit scoring algorithms, bulletin announcements, document systems, and reconciliation sheets.
2. **Righthand Cellphone Interactive Console**: A hyper-realistic **Safaricom M-Pesa Smartphone Simulator** containing responsive, interactive USSD quick menus, PIN STK push prompts, and cellular SMS thread archives, allowing complete lifecycle testing from a single browser page.

---

## ⚡ Key System Features

### 1. Interactive Onboarding Walkthrough Tour
*   **Stepped Overlay System:** Incorporates an elegant, semi-transparent guided tour overlay to onboard new Sacco members and testers instantly. 
*   **State-Linked Transitions:** As users proceed through the **5-Step Onboarding Roadmap**, the application dynamically swaps tabs behind the scenes and launches UI panels (e.g., opening the active mobile handset simulation container) relative to the active walkthrough step.
*   **Context Action Highlights:** Shows helpful diagnostic alerts and pro-tips customized to the active onboarding element.

### 2. Live Dynamic BarChart Ledger Selector
*   **Refined Recharts Projection:** The primary dashboard features a dual savings-vs-loan bar visualization mapping ledger monthly indicators.
*   **Interactive Month Selector:** Click directly on any monthly bar inside the Recharts container. The app instantly loads the matching calendar month's historic or projected savings deposits and microcredit disbursements into a dedicated **Dynamic Side-Panel Breakdown**.
*   **Granular Status Labels:** Displays active member profiles, transaction values, and projection markers in real-time.

### 3. Live Loan Book, Repayment Directory, & Governance Daemon
*   **7.5s Active Audit Interval:** Implements an autonomous background scheduling daemon in `LoanGovernance.tsx` that ticks every 7.5 seconds using React effect sweeps.
*   **Scheduler Signals Console:** Renders a high-density, terminal-like scheduler log showing real-time system diagnostics and deadline scan reports (e.g., counting Approaching vs. Overdue debts).
*   **Proximity Warning Highlights:** Automatically monitors individual loan maturity constraints (`dateRepayBy`) against the current simulate date:
    *   **⚠️ Nearing Deadline (<= 7 days):** Highlights loans in a distinctive **yellow/amber background** and attaches active warning alerts prompting board members to initiate callback procedures.
    *   **🚨 Overdue / Grace Period:** Highlights late loans in **rose background warnings**, describing accrued penalties and automatic credit score drops.
*   **Financial Progress Bars:** Visualizes clearance ratios for individual loans using real-time debt settlement sliders.

### 4. Unified Ledger Dashboard (The Chama Treasury)
*   **Group-Exclusive Privacy Guards:** Implements strict data isolation. Because the core engine partitions Firestore paths under isolated group documents (`groups/{groupId}`), the primary dashboard operates exclusively on that group's datasets, guarded by a dedicated visual partition verification badge. This prevents any multi-group leaks or public scraping.
*   **Physical Vault Cash:** Monitors total liquid reserves held inside the physical treasury. Resources decrease instantly upon approved loan disbursements and increase automatically upon savings targets, share purchases, or interest-accrued loan repayments.
*   **Accrued Member Savings:** Tracks cumulative member-contributed savings ledger entries toward targets.
*   **Total Equity Shares:** Manages active equity shares purchased by members, valued at a customizable baseline rate (e.g., Ksh 500 per share unit).
*   **Outstanding Loan Book:** Monitors externalized capital in circulation and expected interest yields.
*   **Transaction Audit Log:** An immutable ledger showing M-Pesa tracking reference strings, payment methods, timestamps, and database sync identifiers.

### 5. Live Push & In-App Notification Engine
*   **Dual-Frequency Synth Alerts:** Implements a professional, pleasant dual-frequency synthesizer chime using the **Web Audio API** to alert users instantly during transactions or loan changes without relying on external media assets.
*   **Interactive Toast Banners:** Mounts beautifully timed, high-visibility visual toast alerts that slide out from the upper right, ensuring critical financial status updates are never missed.
*   **Web Notification API Support:** Prompts users via an elegant bell toggle inside the application header, requesting system hardware push permission to dispatch native OS desktop alerts.
*   **Simulated Carrier SMS Sync:** Automatically alerts users of transaction receipts and overdue microloans via realistic carrier outbox synchronization.

### 6. Safeguarded Co-operative Credit (Amortization & Underwriting)
*   **300% Multiplier Rule:** Restricts member credit exposure. A member cannot borrow more than 300% of their actual accrued physical savings.
*   **Amortization Sandbox:** Lets users visually simulate loan structures comparing **Flat-Rate interest** (fixed cumulative rates) against **Reducing-Balance compound interest** schedules before submitting applications.
*   **Guarantor Pool Locking:** Implements structured collateral risk sharing. Members can nominate multi-guarantor circles from the roster, allocating exact Ksh pledge caps. Loans remain locked until nominated guarantors log in and digitally sign.
*   **Board Executive Assessment Panels:** For security, loans are governed by dual board checkmarks. The **Chairperson** and **Treasurer** must log in to their respective profiles and cast official votes. **To combat opaque decisions, both authorities are legally required to type a detailed assessment reason before signing.**

### 7. Dynamic Credit Scoring Engine (300 to 850 scale)
To promote high target-discipline, the platform evaluates each member's behavior and computes real-time credit score weights:
*   **Reliable Repayment:** On-time loan repayment elevates scores (+15 points up to 850).
*   **Target Contribution Discipline:** Maintaining steady monthly savings adds positive integrity weight.
*   **Overdue Fines Penalty:** Delinquent borrowers whose repayment deadlines have passed are hit with instant rating penalties (-60 points down to 300), locking them out of future high-tier USSD credit cycles.

### 8. Interactive Safaricom M-Pesa eSIM Handset
Simulates and controls cellular-dependent table-banking rotations:
*   **Numeric USSD Console (`*384#` / `*384*55#`):** Simulates offline mobile network environments. Dialing the codes launches live USSD text pathways where members can review savings balances, buy shares, apply for credit, or pay debts without internet connectivity.
*   **Simulated STK Push Paybill:** Prompts a secure 4-digit PIN gateway (e.g., `4321`) to send payments securely into the central group vault.
*   **Live cellular SMS Outbox:** Broadcasts carrier-style confirmation SMS receipts mapped to automated Kenyan network operators (e.g., standard M-PESA confirmations).

### 9. Sacco Bulletin News & Multi-Media Hub
*   **Governance Publication Broadcast:** Board officers (Chairperson, Treasurer, and Secretary) have exclusive credentials to publish official notices, briefs, and event summaries.
*   **Media Attachments:** Announcements support adding direct attachments—including photos, briefing videos, and official folders.
*   **Automatic Archive Synchronization:** Attaching legal compliance documents or briefs automatically isolates, classifies, and inserts those assets into the **Group Documents Cabinet** for zero-friction governance indexing.

### 10. Official Sacco Documents Archive
*   **Digital Share Capital Ledger:** Catalogs the official constitution, bylaws, and core ledgers.
*   **Secretary Upload Privileges:** The Sacco Secretary has an exclusive uploader interface to add new meeting minutes, PDFs, or spreadsheet registers.
*   **Origin Tracking:** Files are categorized based on their upload origin (Direct Secretary upload vs. automated Attachment extraction from news notices).

### 11. Time Machine Simulation & Financial Auditing
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

*   **Runtime Engine:** Node.js, Vite setup behind an infrastructure reverse proxy.
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

### 🧪 Exercise A: Interactive Guided Tour & Dashboard Months Inspection
1.  On first load, click the **Walkthrough Onboarding** button inside the main header row.
2.  The guided tour modal triggers, introducing you to the digital ledger. Proceed through the steps:
    *   Observe how step transitions automatically set active dashboards and reveal hidden simulator frames.
3.  Navigate to the **Dashboard** tab. Locate the Recharts trend bar chart at the bottom left.
4.  Click directly on the **June** monthly container bar.
5.  Observe how the right-hand **Ledger Breakdown Side-Panel** updates instantly to load specialized double-entry transaction assets for June 2026!

### 🧪 Exercise B: Underwriting Co-operative Credit and Joint Board Decision-Making
1.  Navigate to the **Members** tab on the left workspace panel. Activate a member profile such as **Flora Mwende** or **David Kamau**.
2.  Flora/David's profile instantly configures the handset eSIM card simulator on the right.
3.  Go to the cellphone simulator, choose **M-Pesa Sim** -> **Deposit Savings**.
4.  Input amount `10000` and click **Trigger Paybill (STK Push)**. Confirm with any 4-digit PIN.
5.  With savings recorded, David/Flora’s borrowing limit increases to **Ksh 30,000** (300% savings multiplier rule).
6.  Go to the matching member's **Loans** Dashboard tab. Click **Request Microloan** and apply for `Ksh 20000` with Weekly installments. Select a physical guarantor and submit.
7.  Swap simulated SIM profiles by selecting the physical guarantor from the list. The guarantor clicks **Sign Guarantor Pledge** to lock collateral risk.
8.  Select **Grace Mwangi** (Chairperson) from the Member list. Grace views the loan, types her assessment notes, and approves.
9.  Select **Linet Atieno** (Treasurer). Linet reviews, inputs her treasurer rationale, and approves.
10. Click the unlocked **Simulate M-Pesa Disbursement Now** button! The cash is transferred, Sacco vaults decrease, and M-Pesa sends automated SMS receipt strings.

### 🧪 Exercise C: Time Machine & Governance Daemon Overdue Auditing
1.  Navigate to the **Loans** management tab on the left panel. Scroll down to notice the **Live Chama Loan Book & Repayment Directory**.
2.  Look at the black terminal screen displaying real-time **Background Audit Signals**. The daemon ticks autonomously every 7.5 seconds, running active compliance scans!
3.  Locate the current sim date in the header and click **Fast Forward +1 Month**.
4.  The system time cycles 30 days ahead. Inspect the **Live Chama Loan Book** below:
    *   The active loan is evaluated as over its `dateRepayBy` maturity constraint.
    *   The background daemon instantly flags this loan. The loan item flashes in a **warning rose background** card.
    *   A high-visibility overdue alert appears advising immediately calling the client to initiate fallback collection proceedings.
    *   The member's credit score falls by -60 points.
5.  Verify the ledger updates by navigating to the **Financials** tab, and click **Export/Print Reconciliation Report** to compile a pristine physical balance sheet.

---

```
   MADE WITH HEART & PRISTINE CRAFTSMANSHIP FOR SACCO LEDGER ACCURACY 🌸 BIASHARA BOOST
```
