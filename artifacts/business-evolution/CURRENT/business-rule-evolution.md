# Business Rule Evolution — ViNha Business Evolution Board

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED  

---

## 1. Governance & Evolution Policy

The **Business Evolution Board** does not silently overwrite or delete existing Business Rules. Every change to a Business Rule (BR) is explicitly classified as **NEW**, **MODIFIED**, **DISAMBIGUATED**, or **DEPRECATED**, with a clear explanation of why the change is necessary and how it impacts domain behavior.

Immutable constitutional rules (**BR-01** Real Ledger ≠ Virtual Jars) remain **UNTOUCHED and ABSOLUTE**.

---

## 2. Business Rule Inventory & Status Summary

| Rule ID | Title | Domain | Status | Impact Summary |
|---|---|---|---|---|
| **BR-01** | Real Ledger ≠ Virtual Jars | Global | **IMMUTABLE** | Real bank balances and Virtual Jar allocations must never be merged or confused. |
| **BR-02** | Transaction Immutability | Ledger | **MODIFIED** | Added formal refund reference (`reverses_transaction_id`) and status transitions (`PartiallyRefunded`, `FullyRefunded`). |
| **BR-03** | 3-Way Correction Audit Chain | Ledger | **MODIFIED** | Defined 3-way immutable link contract between Original (`Reversed`), Reversal (`reverses_transaction_id`), and Correction (`corrects_transaction_id`). |
| **BR-04** | Income Allocation & Placement Policy | Planning | **RETAINED** | Auto vs Manual income allocation rules retained. |
| **BR-05** | Unmapped Expense to Inbox | Inbox | **MODIFIED** | Enforces typed `UnmappedExpense` ReviewItem generation with pattern metadata annotation. |
| **BR-06** | Jar Balance Non-Negativity | Budgets/Jars | **RETAINED** | Jars represent allocation capacity; overspends trigger reallocation or warning. |
| **BR-07** | Mid-Month Overspend Warning | Budgets/Jars | **MODIFIED** | Reallocations declared as `EmergencyDeclaration` bypass mid-month warning modals. |
| **BR-08** | Month Lock & Plan Freeze | Month Ritual | **MODIFIED** | Added 30-day temporal Auto-Lock timeout transitioning unclosed months to `PendingReview`. |
| **BR-09** | Default Assisted Ritual Mode | Month Ritual | **RETAINED** | Assisted mode remains default; Quick Close unlocked after 6 consecutive completed rituals. |
| **BR-10** | Savings Maturity Alert Cascade | Savings | **MODIFIED** | Premature resolution of maturity ReviewItem automatically cancels remaining alert cascade. |
| **BR-11** | Installment Payoff Notification | Debt/Installments | **RETAINED** | Triggers typed `InstallmentComplete` ReviewItem upon final payoff. |
| **BR-12** | Category ↔ Jar Mapping Contract | Categories | **NEW** | Categories map $N:1$ to Jars. Category creation requires Jar mapping. |
| **BR-13** | Partner Visibility of Policy Changes | Shared/Together | **RETAINED** | Policy changes and emergency reallocations are visible to all household partners. |
| **BR-14** | AI Non-Invention Policy | Global / AI | **DISAMBIGUATED** | Dedicated strictly to AI non-invention of balances and explicit authorization rules. |
| **BR-15** | Inbox Staleness & Auto-Archiving | Inbox | **NEW** | Expired alerts auto-archive; unmapped expenses > 30 days resolve to Miscellaneous Jar on month lock. |
| **BR-16** | Merchant Auto-Categorization | Categories | **RETAINED** | Merchant rule matching for auto-categorization. |
| **BR-17** | Card Payment Due Reminders | Cards | **MODIFIED** | Pushes typed `PaymentReminder` ReviewItems; integrated into Household Financial Calendar. |
| **BR-18** | Goal Single-Jar Funding Model | Goals | **RETAINED** | Multi-source funding deferred; R1 remains strictly single-jar funded. |
| **BR-19** | Jar Template Onboarding | Budgets/Jars | **MODIFIED** | Jar templates used for onboarding; template structure compared during Month Ritual divergence check. |
| **BR-20** | Installment Schedule Integration | Debt/Installments | **MODIFIED** | Installment payment dates integrated into Household Financial Calendar. |
| **BR-21** | Savings Alert Cascade Cancellation | Savings | **NEW** | Resolving a maturity decision cancels pending 30/14/7 day notification timers. |
| **BR-22** | Credit Card Interest Visibility | Cards | **RETAINED** | Surface monthly credit card interest costs explicitly. |
| **BR-23** | Quick Close Ritual Eligibility | Month Ritual | **NEW** | Requires 6 consecutive completed assisted rituals before Quick Close mode is enabled. |
| **BR-24** | Health Read-Only Policy (`Health-RO`) | Health | **NEW (DISAMBIGUATED)** | Health domain reads operational data but NEVER writes back or executes money movement. |

---

## 3. Detailed Specification of Evolved Business Rules

### [DISAMBIGUATED] BR-14: AI Non-Invention Policy
- **Original Context**: ID collision between AI policy and Health read-only constraint.
- **Evolved Statement**: "AI and automated assistant features may analyze, summarize, explain, and suggest financial actions based strictly on verified household data. AI features MUST NOT invent fake balances, extrapolate unverified transactions, or execute money movements without explicit user approval or defined policy path."

---

### [NEW] BR-24: Health Read-Only Policy (`Health-RO`)
- **Original Context**: Created to resolve documentation ID collision with BR-14.
- **Evolved Statement**: "The Health domain is strictly READ-ONLY. Health components compute financial scores, generate trend analytics, and synthesize narrative insights by reading snapshots from operational domains (Accounts, Transactions, Jars, Planning, Cards, Installments, Goals). Health MUST NEVER write to operational databases, mutate Jar allocations, modify ledger balances, or execute transactions."

---

### [NEW] BR-12: Category ↔ Jar Mapping Contract
- **Rationale**: Resolves Business Smell 5.1 & 15.1.
- **Evolved Statement**: "Every spending Category MUST map to an active Jar on an $N:1$ basis (multiple categories may map to a single Jar, but no Category may exist without a Jar mapping). Jars own the spending taxonomy. When a new Category is created, the system requires assignment to an existing Jar or creation of a new Jar. Creating a transaction with an unmapped category generates a typed `UnmappedExpense` ReviewItem in Inbox."

---

### [MODIFIED] BR-02: Transaction Immutability & Refund Linkage
- **Rationale**: Closes Lifecycle Gap 1.
- **Evolved Statement**: "Ledger transactions are strictly immutable; posted transactions cannot be edited or deleted. A refund transaction MUST carry `reverses_transaction_id` referencing the original expense transaction. Upon refund posting, the original transaction status updates to `PartiallyRefunded` or `FullyRefunded`. Refund credits restore the spending capacity of the original transaction's assigned Jar without increasing monthly income totals."

---

### [MODIFIED] BR-03: 3-Way Correction Audit Chain
- **Rationale**: Closes Lifecycle Gap 2.
- **Evolved Statement**: "Transaction corrections are executed by appending a reversal transaction and a new correction transaction. The system MUST enforce a 3-way immutable link contract: (1) Original transaction status becomes `Reversed`, (2) Reversal transaction carries `reverses_transaction_id` referencing the original, and (3) Correction transaction carries `corrects_transaction_id` referencing the original. All three records remain permanently in the ledger for audit."

---

### [MODIFIED] BR-07: Mid-Month Overspend & Emergency Declaration
- **Rationale**: Closes Lifecycle Gap 3 and resolves Business Smell 6.2.
- **Evolved Statement**: "When spending in a Category exceeds its mapped Jar balance, the user MUST reallocate virtual capacity from another Jar. If the reallocation is flagged with an `EmergencyDeclaration`, the mid-month overspend warning modal is BYPASSED. The reallocation is executed immediately, tagged as an emergency, and flagged for mandatory reflection during the Month Ritual."

---

### [MODIFIED] BR-08: Month Lock & 30-Day Auto-Lock Timeout
- **Rationale**: Closes Lifecycle Gap 5.
- **Evolved Statement**: "Completing the Month Ritual locks all Jar allocations and category mappings for that calendar month. If a Month Ritual remains unapproved 30 days post month-end, the system automatically transitions the month state to `PendingReview` and locks Jar allocations against retro-active editing. Unmapped transactions older than 30 days are automatically assigned to the Miscellaneous Jar upon month lock."

---

### [NEW] BR-15: Inbox Staleness & Auto-Archiving Rules
- **Rationale**: Closes Lifecycle Gap 7.
- **Evolved Statement**: "Inbox ReviewItems enforce expiration lifecycles based on item type. Payment reminders expire 7 days past due date. Unmapped expenses older than 30 days are auto-resolved to the Miscellaneous Jar upon Month Lock. Expired or auto-resolved items transition to `Archived` status and do not appear in the active decision queue."
