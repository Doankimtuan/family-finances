# Prioritized Product & Engineering Roadmap: ViNha

Based on empirical findings from the Autonomous Real-User Product Audit V2, this development roadmap charts the path from current state to full production readiness.

---

## Roadmap Overview

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│        PHASE 1          │     │        PHASE 2          │     │        PHASE 3          │     │        PHASE 4          │
│   Critical Fixes &      │ ──> │   Core Usability &      │ ──> │   Advanced Household    │ ──> │   Scale, Automation &   │
│   Financial Integrity   │     │   Financial Workflow    │     │   Collaboration & Intel │     │   Open Banking          │
│   (Target: 1-2 Weeks)   │     │   (Target: 3-4 Weeks)   │     │   (Target: 1-2 Months)  │     │   (Target: Q1-Q2)       │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

---

## Phase 1: Critical Integrity & Production Blockers (Weeks 1–2)

> **Theme:** Fix broken functionality, ensure zero financial distortion, and eliminate onboarding friction.

### 1.1 Unblock Loans Module (Issue F4)

- **Problem:** Database missing RPC `_loan_insert_schedule_entries`, blocking all loan creation with 500 error.
- **Action:**
  - Create and execute Supabase database migration defining `public._loan_insert_schedule_entries(p_household_id uuid, p_loan_id uuid, p_entries jsonb)`.
  - Alternatively, refactor the Next.js server action to execute batch `insert` statements into `loan_schedules` table with transaction safety.
  - Add end-to-end regression tests verifying loan creation, amortization schedule rendering, and payment logging.
- **Impact:** Unblocks 100% of the loan tracking feature.

### 1.2 Fix Investment Partial Sale Valuation & P&L (Issue F3)

- **Problem:** Selling shares decrements quantity but retains stale pre-sale `current_valuation`, inflating portfolio value and overstating unrealized gains by 500%.
- **Action:**
  - Modify investment sale mutation to automatically recompute:
    $$\text{current\_valuation} = \text{remaining\_quantity} \times \text{latest\_unit\_price}$$
    $$\text{unrealized\_pnl} = \text{current\_valuation} - \text{remaining\_cost\_basis}$$
  - Ensure total household assets on `/en/home` and `/en/money` dynamically recalculate upon every holding update.
  - Run database patch to recompute corrupted holding rows for existing users.
- **Impact:** Restores absolute mathematical integrity to portfolio valuation and household net worth.

### 1.3 In-App Invitation Detection for Existing Logged-in Users (Issue F1)

- **Problem:** A partner who logs into the app with a pending invitation is routed to create their own household, unaware that an invite exists.
- **Action:**
  - In `onboarding/page.tsx` and auth middleware, query `household_invitations` table for `recipient_email = auth.user.email AND status = 'pending'`.
  - If found, render an **"Invitation Waiting"** banner or redirect to `/invite/[token]` with 1-click acceptance.
- **Impact:** Eliminates partner onboarding drop-off and prevents duplicate household creation.

### 1.4 Hardening Auth Session Cookies (Issue F2)

- **Problem:** `sb-*-auth-token` cookie is readable by client JavaScript.
- **Action:** Configure Supabase SSR client with `cookieOptions: { httpOnly: true, secure: true, sameSite: 'lax' }`.
- **Impact:** Protects against JWT token exfiltration via DOM XSS.

---

## Phase 2: Core Usability & Financial Workflow Polish (Weeks 3–4)

> **Theme:** Eliminate cognitive friction and guide users effortlessly through monthly household routines.

### 2.1 First-Time Jar Budgeting & Allocation Wizard (Issue F6)

- **Problem:** Jars display alarming "Unavailable" states if period targets are unset.
- **Action:**
  - When a user enters `/en/plan` for an unbudgeted month, replace "Unavailable" cards with an onboarding prompt: _"Plan your October spending: Allocate your ₫25,000,000 income across your 4 jars"_.
  - Provide a 1-click **"Auto-fill from Balanced Rule"** (50% Essentials / 30% Lifestyle / 10% Buffer / 10% Savings).
- **Impact:** Converts a confusing dead end into a satisfying core planning ritual.

### 2.2 Complete Localization Audit (Issue F5)

- **Problem:** System-generated transaction notes contain hardcoded Vietnamese strings in English mode.
- **Action:**
  - Audit all server actions (`createSavingsDeposit`, `createInvestmentOrder`, `createTransfer`) to pass localized note templates using `next-intl` messages.
- **Impact:** Professional multi-locale experience.

### 2.3 Loan Repayment Execution & Balance Sheet Integration

- **Feature:** Connect bank loan installment schedules to actual cash outflows in `/en/money`.
- **Action:**
  - Add "Pay Installment" action on loan detail page.
  - Automatically generate a double-entry payment transaction: Debit Loan Liability (principal), Debit Interest Expense, Credit Cash/Bank Account.
- **Impact:** Realizes the full vision of integrated liability and net worth tracking.

---

## Phase 3: Advanced Collaboration & Financial Intelligence (Months 2–3)

> **Theme:** Deepen two-partner collaboration and provide actionable financial clarity.

### 3.1 Personal vs. Shared Account Privacy Boundaries

- **Feature:** Allow household members to mark accounts as "Personal" vs "Shared".
- **Design:**
  - Shared accounts: Visible to both partners in full detail.
  - Personal accounts: Balances aggregated into household net worth, but itemized transaction descriptions masked or hidden unless explicitly shared.
- **Impact:** Accommodates modern couples who maintain both shared expenses and individual discretionary spending.

### 3.2 Recurring Outflows Engine & Calendar Projection

- **Feature:** Full automated detection and scheduling of recurring bills (rent, utilities, insurance, subscriptions).
- **Design:**
  - Calendar view (`/en/plan/calendar`) displays projected cash balance 30 days ahead based on expected salary and scheduled outflows.
- **Impact:** Prevents mid-month cash crunches before they happen.

### 3.3 Collaborative Monthly Ritual Closing Flow

- **Feature:** Interactive end-of-month review ritual (`/en/plan/ritual`).
- **Design:**
  - Both partners must mark "Reviewed".
  - Summarizes actual vs planned spending per jar, rollover buffer surpluses, and celebrates debt reduction or savings growth.
- **Impact:** Strengthens financial communication and habit formation between partners.

---

## Phase 4: Scale, Automation & Open Banking (Months 4–6)

> **Theme:** Frictionless data ingestion and institutional-grade wealth tracking.

### 4.1 Bank Statement Import & Transaction Parsing

- **Feature:** PDF and Excel statement parser for major Vietnamese banks (Vietcombank, Techcombank, MB Bank, VPBank, ACB).
- **Design:**
  - Client-side or secure worker parsing with rule-based merchant extraction and automatic jar mapping.
- **Impact:** Drastically reduces manual data entry fatigue.

### 4.2 Multi-Asset Class Expansion

- **Feature:** Track real estate equity, gold (SJC), and crypto assets alongside traditional stocks and savings.
- **Design:**
  - Add Asset Revaluation history with charts.
- **Impact:** Provides a complete balance sheet for affluent Vietnamese households.

### 4.3 Production Infrastructure & Enterprise Scale

- **Action:**
  - Add automated PostgreSQL partition tables for `transactions` and `audit_logs` by year.
  - Comprehensive Playwright CI regression test suite running against staging environments.
- **Impact:** Guarantees sub-second response times and rock-solid reliability for thousands of concurrent families.
