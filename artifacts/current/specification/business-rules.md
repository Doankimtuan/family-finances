# Canonical Business Rules (BR-01 through BR-24) — ViNha

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v2.1  

---

## 1. Consolidated Business Rules Inventory

| Rule ID | Title | Domain | Status | Operational Rule Statement |
|---|---|---|---|---|
| **BR-01** | Real Ledger ≠ Virtual Jars | Global | **IMMUTABLE** | Real bank balances and Virtual Jar allocations must never be merged or confused. Plan movements touch $0.00 in physical accounts. |
| **BR-02** | Transaction Immutability & Refund Linkage | Ledger | **MODIFIED** | Transactions cannot be deleted. Refunds carry `reverses_transaction_id`, update status to `PartiallyRefunded`/`FullyRefunded`, and restore Jar capacity. |
| **BR-03** | 3-Way Correction Audit Chain | Ledger | **MODIFIED** | Corrections require a 3-way audit chain: Original (`Reversed`), Reversal (`reverses_transaction_id`), and Correction (`corrects_transaction_id`). |
| **BR-04** | Income Allocation & Placement Policy | Planning | **RETAINED** | Income is distributed into active Jars via auto-allocation rules or manual household assignment upon ingestion. |
| **BR-05** | Unmapped Expense to Inbox | Inbox | **MODIFIED** | Transactions with unmapped categories generate typed `UnmappedExpense` ReviewItems in Inbox. |
| **BR-06** | Jar Balance Non-Negativity | Budgets/Jars | **RETAINED** | Jars represent allocation capacity; overspends trigger reallocation or mid-month warning. |
| **BR-07** | Mid-Month Overspend & Emergency Bypass | Budgets/Jars | **MODIFIED** | Overspends require Jar reallocation. Reallocations declared with an `EmergencyDeclaration` bypass warning modals. |
| **BR-08** | Monthly Review (non-locking) | Plan / Monthly Review | **SUPERSEDED (Plan V2)** | Monthly Review is optional. Approved, skipped, or historical V1 ritual statuses never lock Plan or Money mutations. |
| **BR-09** | Default Assisted Planning Mode | Plan | **SUPERSEDED (Plan V2)** | Assisted mode is the default recommendation layer; it never moves money. Quick Close is deprecated. |
| **BR-10** | Savings Maturity Alert Cascade | Savings | **MODIFIED** | Savings CD maturities trigger alert cascades at 30, 14, and 7 days. |
| **BR-11** | Installment Payoff Notification | Debt/Installments | **RETAINED** | Final payoff triggers typed `InstallmentComplete` ReviewItem to reallocate freed cash flow. |
| **BR-12** | Category ↔ Jar Mapping Contract | Categories | **SYNCHRONIZED** | Categories map $N:1$ to Jars. Category creation requires Jar mapping. |
| **BR-13** | Partner Visibility of Policy Changes | Shared/Together | **RETAINED** | Policy changes and emergency declarations are visible to all household partners. |
| **BR-14** | AI Non-Invention Policy | Global / AI | **DISAMBIGUATED** | AI features may analyze/suggest, but MUST NOT invent balances or execute unauthorized transactions. |
| **BR-15** | Inbox Staleness & Auto-Archiving | Inbox | **SYNCHRONIZED** | Payment reminders expire 7 days post due date; unmapped expenses > 30 days resolve to Miscellaneous Jar on month lock. |
| **BR-16** | Merchant Auto-Categorization | Categories | **RETAINED** | Merchant rule matching for auto-categorization based on historical confirmation (3x). |
| **BR-17** | Card Payment Due Reminders | Cards | **MODIFIED** | Card due dates generate `PaymentReminder` ReviewItems and aggregate on Household Financial Calendar. |
| **BR-18** | Goal Single-Jar Funding Model | Goals | **RETAINED** | Goals are funded by a single dedicated Jar in R1. |
| **BR-19** | Jar Template Onboarding | Budgets/Jars | **MODIFIED** | Jar templates guide new user onboarding and baseline structure. |
| **BR-20** | Installment Schedule Integration | Debt/Installments | **MODIFIED** | Debt payment schedules are integrated into the Household Financial Calendar. |
| **BR-21** | Savings Alert Cascade Cancellation | Savings | **SYNCHRONIZED** | Resolving a maturity decision cancels pending 30/14/7 day notification timers. |
| **BR-22** | Credit Card Interest Visibility | Cards | **RETAINED** | Monthly credit card interest costs are explicitly surfaced to users. |
| **BR-23** | Quick Close Ritual Eligibility | Plan / Monthly Review | **DEPRECATED (Plan V2)** | Quick Close streak/autolock is removed. Skipping Monthly Review must not block Plan usage. |
| **BR-24** | Health Read-Only Policy (`Health-RO`) | Health | **SYNCHRONIZED** | Health domain reads operational data but NEVER writes back or modifies ledger/jars. |
