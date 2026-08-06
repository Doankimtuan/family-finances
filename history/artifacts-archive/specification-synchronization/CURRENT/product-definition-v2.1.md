# Product Definition v2.1 — ViNha Household Money Operating System

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Version:** v2.1  

---

## 1. Product Identity & Vision

**ViNha is NOT an Expense Tracker. ViNha is a Household Money Operating System.**

Traditional expense trackers act as passive historical logs that record spending after it occurs in isolated silos. ViNha operates as a proactive, household-first operating system that bridges real-world banking transactions with virtual planning intentions, structured partner collaboration, and monthly reflection.

ViNha is structured around **5 Core Operational Pillars**:

```
+-------------------------------------------------------------------------+
|                              VINHA SYSTEM                               |
+-------------------------------------------------------------------------+
|  HOME      · Reflection, Financial Health Scoring, Actionable Insights   |
|  MONEY     · Real Accounts, Immutable Ledger, Bank Reconciliation        |
|  PLAN      · Virtual Jars, Recurring Patterns, Household Allocations     |
|  INBOX     · Typed Triage Queue, Decision Engine, Policy Auto-Resolution |
|  TOGETHER  · Shared Household Policies, Partner Visibility, Rituals     |
+-------------------------------------------------------------------------+
```

---

## 2. Core Product Constitution (Immutable Principles)

1. **BR-01 (Real Ledger ≠ Virtual Jars)**: Real money in bank accounts is strictly separated from virtual plan allocations in jars. Jars track intentions; Accounts track physical ledger balances.
2. **BR-14 (AI Non-Invention Policy)**: AI and automated assistants may analyze, explain, and suggest, but MUST NOT invent balances or execute unauthorized transactions.
3. **BR-24 (`Health-RO`) (Health Read-Only Policy)**: The Health domain reads operational data, calculates scores and insights, but NEVER writes back or executes money movement.
4. **Household-First Architecture**: Built from the ground up for multi-member collaboration, privacy boundaries, and shared decision-making.
5. **Progressive Disclosure**: Keep simple daily triage simple (1-tap triage); reveal deeper controls only on demand.
6. **Mobile-First Simplicity**: Optimized for quick touch interactions, high responsiveness, and clear visual feedback.
7. **Clear Bounded Contexts**: No duplicated ownership; every business concept has exactly one primary domain.

---

## 3. Synchronized Business Rules Inventory (BR-01 through BR-24)

- **BR-01 (Real Ledger ≠ Virtual Jars)**: Bank money and virtual plan allocations must never be merged or confused.
- **BR-02 (Transaction Immutability & Refund Linkage)**: Ledger transactions cannot be deleted. Refunds carry `reverses_transaction_id` and update status to `PartiallyRefunded`/`FullyRefunded`.
- **BR-03 (3-Way Correction Audit Chain)**: Corrections create a 3-way immutable audit chain: Original (`Reversed`), Reversal (`reverses_transaction_id`), and Correction (`corrects_transaction_id`).
- **BR-04 (Income Allocation & Placement Policy)**: Income is auto-allocated or manually assigned to Jars upon ingestion.
- **BR-05 (Unmapped Expense to Inbox)**: Transactions with unmapped categories generate typed `UnmappedExpense` ReviewItems.
- **BR-06 (Jar Balance Non-Negativity)**: Jars track allocation capacity; overspends trigger reallocation or warning.
- **BR-07 (Mid-Month Overspend & Emergency Bypass)**: Mid-month overspends require reallocation. Declaring an `EmergencyDeclaration` bypasses warning modals.
- **BR-08 (Month Lock & 30-Day Auto-Lock)**: Ritual locks month plan allocations. Unapproved rituals auto-lock after 30 days as `PendingReview`.
- **BR-09 (Default Assisted Ritual Mode)**: Assisted mode is the default; Quick Close unlocks after 6 consecutive completed rituals.
- **BR-10 (Savings Maturity Alert Cascade)**: Savings CD maturities trigger alert cascades at 30, 14, and 7 days.
- **BR-11 (Installment Payoff Notification)**: Final payoff triggers typed `InstallmentComplete` ReviewItem.
- **BR-12 (Category ↔ Jar Mapping Contract)**: Categories map $N:1$ to Jars. Category creation requires Jar mapping.
- **BR-13 (Partner Visibility of Policy Changes)**: Policy modifications and emergency declarations are visible to all household partners.
- **BR-14 (AI Non-Invention Policy)**: AI features MUST NOT invent balances or execute unauthorized transactions.
- **BR-15 (Inbox Staleness & Auto-Archiving)**: Payment reminders expire 7 days post due date; unmapped expenses > 30 days resolve to Miscellaneous Jar on month lock.
- **BR-16 (Merchant Auto-Categorization)**: Merchant rule matching for auto-categorization based on historical confirmation (3x).
- **BR-17 (Card Payment Due Reminders)**: Card due dates generate `PaymentReminder` ReviewItems and aggregate on Household Financial Calendar.
- **BR-18 (Goal Single-Jar Funding Model)**: Goals are funded by a single dedicated Jar in R1.
- **BR-19 (Jar Template Onboarding)**: Jar templates guide new user onboarding and baseline structure.
- **BR-20 (Installment Schedule Integration)**: Debt payment schedules are integrated into the Household Financial Calendar.
- **BR-21 (Savings Alert Cascade Cancellation)**: Resolving a maturity decision cancels pending 30/14/7 day notification timers.
- **BR-22 (Credit Card Interest Visibility)**: Monthly credit card interest costs are explicitly surfaced to users.
- **BR-23 (Quick Close Ritual Eligibility)**: Requires 6 consecutive completed assisted rituals before Quick Close mode is enabled.
- **BR-24 (Health Read-Only Policy / `Health-RO`)**: Health domain reads operational data but NEVER writes back or modifies ledger/jars.
