# Security Specifications & Threat Vector Analysis (Zero-Trust Chama Rules)

## 1. Core Data Invariants
1. **Subcollection Encapsulation**: members, transactions, loans, and smsMessages are strictly grouped within their specific parent Group entity (`/groups/{groupId}`).
2. **Identity Integrity**: All mutations that assert identity (e.g. member or transactor IDs) must balance out with valid simulation scopes.
3. **Purity of Balance**: Individual savings balances, share rates, and outstanding liabilities cannot be set directly by malicious clients, but are driven by strict simulated business operations.

## 2. Red Team "Dirty Dozen" Threat Vectors (Simulated Payloads)
The following adversarial payloads must result in `PERMISSION_DENIED`:

1. **Mass Extraction Attack**: Attempting anonymous blanket collection list query of `/groups` without a scoping ID.
2. **Privilege Escalation**: Modifying `registrationNumber` or `groupName` rules without admin or appropriate simulation privileges.
3. **Transaction Fraud (Savings Spooting)**: Forging a completed Transaction ledger row crediting Ksh 1,000,000 without a true M-PESA payment cycle.
4. **Member Savings Alteration**: Direct write to `totalSavings` inside `Member` profile bypassing actual payment ledgers.
5. **Loan Principal Forbearance**: Overwriting active `Loan` principal balance to 0 Ksh directly from browser developer Console.
6. **Double Signature Spoofing**: Injecting multi-member approvals into votes payload using another member's simulated ID.
7. **Bypassing Grace Period limits**: Editing global `GroupConfig` gracePeriodDays directly to avoid late fee penalties.
8. **Malicious SMS Injection**: Injecting spoofed bank carrier SMS alerts notifying members with custom spam messaging.
9. **Negative Interest Injection**: Submitting a loan application with zero or negative interest rate percentages.
10. **ID Poisoning Attack**: Submitting 1.5MB junk-sequences to document ID fields.
11. **Imperfect State Overwrites**: Modifying a completed transaction record's reference code post-clearing.
12. **Delinquency Evasion**: Rewriting an `overdue` status loan back to `approved` status directly.

## 3. Test Runner Draft
Tests are designed to assert default denylist and specific schema validations inside `firestore.rules`.
