# ViNha (Family Finance) — Autonomous Real-User Product Audit V2: Final Report

**Audit Conducted:** 2026-10-20  
**Auditor Roles:** Senior QA Automation Engineer, Senior Financial Systems Auditor, Senior UI/UX Researcher, Product Manager, Performance Engineer, Product Strategy Consultant  
**Target Environment:** Local Next.js 16.3.1 dev runtime (`http://localhost:3100`), Supabase Hosted PostgreSQL backend  
**Test Household:** `Tuan Audit Household` (2 active members: Admin `codex.test.1`, Partner `codex.test.2`)

---

## 1. Executive Summary

ViNha is an exceptionally thoughtful, philosophically mature family financial operating system. Unlike generic budgeting apps that treat money as individual spreadsheets or simplistic category buckets, ViNha implements a rigorous **Real Ledger vs. Virtual Intention Envelopes (Jars)** dual architecture.

During this comprehensive audit, two independent browser sessions were executed simultaneously across realistic multi-month household lifecycles: onboarding, cash account initialization, partner invitation and acceptance, multi-account income/expense tracking, immutable double-entry transaction corrections, term savings deposits, stock investment purchases/sales, loan recording, real-time shared inbox decision workflows, monthly ritual reviews, and mobile viewport audits.

### The Good:

- **Flawless Real Ledger Double-Entry Accounting:** Opening balances, internal bank transfers, and investment purchases/sales debit and credit balance sheet accounts cleanly without falsely inflating income or expense metrics.
- **Transaction Correction Purity:** Editing a past transaction creates an immutable reversal (Refund + new corrected expense) rather than destructively rewriting history.
- **Collaborative Inbox & Role Boundaries:** The shared decision queue for uncategorized expenses and incoming salary suggestions synchronizes seamlessly across both partners with clear administrative role boundaries.
- **Responsive Mobile-First Architecture:** Clean navigation on 390×844 and 360×640 viewports, sub-200ms SPA client transitions, fully bilingual English/Vietnamese localization, and flawless light/dark mode support.

### The Bad (Blockers & Integrity Defects):

- **Investments Holding Valuation Defect (Issue F3 - P1):** Executing a partial sale of stock decrements the quantity, but leaves stale pre-sale market valuation intact in the holding record, overstating portfolio valuation by +66.7%, creating a 500% distorted unrealized gain, and corrupting household total net worth.
- **Loans Module Database Blocker (Issue F4 - P1):** Attempting to save any bank loan fails with a 500 server error due to a missing PostgreSQL stored procedure (`public._loan_insert_schedule_entries`).
- **Partner Invitation Discovery Gap (Issue F1 - P2):** An authenticated partner who logs in with a pending invitation receives no in-app alert and is pushed to create their own competing household.

---

## 2. Product Scorecard (Scale: 0–10)

| Evaluation Dimension                         | Score (/10)  |              Rating              | Key Justification                                                                                                                                       |
| -------------------------------------------- | :----------: | :------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Financial Correctness & Ledger Integrity** | **7.5 / 10** |   Good / Defect in Investments   | Real Ledger cash accounting, double-entry transfers, and savings math are 10.0/10. Score dragged down by Issue F3 (stale valuation post partial sale).  |
| **Two-Account Collaboration & Permissions**  | **8.5 / 10** |            Excellent             | Immediate cross-account sync in Inbox and Jar activities; strong role boundaries (Admin vs. Partner). Slight friction in initial invite discovery (F1). |
| **Usability, Mobile UX & Design Craft**      | **8.5 / 10** |            Very High             | Excellent typography, clear financial disclosures, zero horizontal overflow on 360px/390px, fluid tab navigation, complete Vietnamese localization.     |
| **Feature Completeness**                     | **6.5 / 10** |       Incomplete / Blocked       | Core banking, savings, jars, and goals work well. Loans module is 100% blocked by missing database RPC (F4).                                            |
| **Performance & Client Reliability**         | **9.0 / 10** |           Exceptional            | Sub-200ms SPA route transitions, small transfer payloads (~40–55KB), zero fatal runtime crashes in production paths.                                    |
| **Security & Data Isolation**                | **8.0 / 10** |              Solid               | Strict tenant isolation verified across all synthetic mutations. Opportunity to enforce `HttpOnly` on Supabase auth cookies (F2).                       |
| **OVERALL AUDIT SCORE**                      | **8.0 / 10** | **High Potential / Conditional** | Outstanding conceptual and architectural core, requiring immediate remediation of 2 critical backend defects.                                           |

---

## 3. Discovered Defects & Issues Summary

Detailed reproductions, logs, and evidence links are cataloged in [`issues.md`](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/audits/full-product-audit/issues.md).

- **F1 (P2 - Together/UX):** Missing in-app invitation discovery for logged-in users.
- **F2 (P3 - Security):** Supabase auth token cookie readable via client JavaScript (`document.cookie`).
- **F3 (P1 - Critical Financial Defect):** Stale holding valuation and distorted unrealized P&L after partial share sale in Investments.
- **F4 (P1 - Critical Blocker):** Bank loan creation fails due to missing PostgreSQL stored procedure `_loan_insert_schedule_entries`.
- **F5 (P3 - Localization):** Hardcoded Vietnamese text (`Gửi tiết kiệm: Vietcombank`) in English locale transactions.
- **F6 (P2 - Plan/Jars UX):** Plan dashboard displays alarming "Unavailable" states when monthly budget allocations are uninitialized.
- **F7 (P3 - Quality):** React `PressResponder` console warning on interactive components.

---

## 4. In-Depth Answers to the 8 Required Audit Questions

### 1. Is ViNha safe to trust with real household money today?

**No, not today.**  
While ViNha's core cash ledger, savings interest calculator, and double-entry reversal mechanics are mathematically sound, it is **unsafe for general public release** for two primary reasons:

1. **Balance Sheet Distortion:** Any household that engages in investment trading will immediately suffer from corrupted net worth figures (Issue F3), where selling shares leaves phantom valuation on the balance sheet and reports wildly exaggerated gains.
2. **Feature Incompleteness:** The bank loan module is completely inoperable (Issue F4), meaning households with mortgages or vehicle loans cannot track their liabilities.
   Once Phase 1 patches for F3 and F4 are deployed, ViNha will be exceptionally safe for everyday household cash and savings management.

### 2. What is the single biggest architectural or design flaw discovered?

**The mutation de-synchronization between transaction records and cached holding state in the investment module.**  
In the core ledger, ViNha strictly adheres to event sourcing / immutable transaction logs: to change a transaction, it creates a new reversal and an offsetting transaction. However, in the investment module, a partial sale decrements the `quantity` column while leaving the derived `current_valuation` column stale. The system violated its own architectural doctrine by allowing cached derived state to survive a balance sheet mutation without recalculation.

### 3. How does the partner collaboration feel in practice?

**Intuitive, respectful, and genuinely cooperative.**  
ViNha shines brightest in its multi-user interaction model. The **Shared Inbox** solves the age-old household finance dilemma: _"Who entered this transaction, and where does it belong?"_

- When Account A logged a salary income of ₫25M, an actionable item appeared in Account B's inbox.
- Account B was able to place that income into the Savings jar.
- Both sessions instantly reflected the resolution, dropping the open item counter from 3 to 2 to 1 to 0 without conflict.
- The administrative hierarchy is clear: both partners have equal daily operational rights (spending, categorizing, reviewing), but structural decisions (inviting new partners, changing household overspend policies) remain reserved for the Admin.

### 4. Which features create the most delight vs. the most friction?

- **Most Delight:**
  - **The Monthly Review Ritual (`/en/plan/ritual`):** Presents a calm, objective, non-judgmental financial summary (Income, Expenses, Savings, Net Invested, Net Cash Flow) without aggressive gamification or guilt-inducing alerts.
  - **The Shared Inbox:** Streamlines daily expense attribution into a simple decision card queue.
  - **Clear Financial Disclosures:** Every screen features thoughtful microcopy reassuring users: _"Real money unchanged — this only updates intention envelopes."_
- **Most Friction:**
  - **The "Unavailable" Jar State on Plan (`/en/plan`):** After completing onboarding with starter jars, navigating to Plan greeted users with three red-flag "Unavailable" boxes and an alert _"Jar budgets are not available right now"_ instead of an encouraging setup prompt.
  - **Partner Onboarding Blindspot:** An invited partner who logs in before clicking their email link is greeted by a prompt to create their own household, creating accidental duplicate households.

### 5. Is the database schema and RLS robust enough for production scale?

**Yes, the foundational schema and RLS design are high quality.**

- Every table is strictly partitioned by `household_id` with foreign key relationships linked to `household_members`.
- Row-Level Security (RLS) policies successfully prevented Account B from accessing Admin-only actions like partner creation or policy saves.
- However, operational database migrations require stricter automated CI verification: the missing `_loan_insert_schedule_entries` RPC demonstrates that database migrations were not fully verified against server actions prior to deployment.

### 6. Can the application handle high transaction volume and long-term history?

**Yes, for standard household volumes (1,000–10,000 transactions/year).**

- Page load tests demonstrated compact DOM structures and efficient server rendering (~1.4s initial TTFB on dev, 120–170ms client-side SPA navigation).
- Transaction filtering (`?type=expense`, `?type=income`, `?type=transfer`) executes with instantaneous responsiveness.
- For multi-year long-term history (50,000+ entries), the current virtualized list implementation will need database-level pagination (`LIMIT`/`OFFSET` or cursor-based pagination) to prevent heavy client-side hydration payloads.

### 7. What are the top 3 high-leverage product changes needed?

1. **Fix the Investment Sale Revaluation Engine (F3) & Implement Missing Loan RPC (F4):** Immediate engineering sprint to restore 100% financial calculation accuracy and unblock the loans tab.
2. **First-Time Jar Allocation Onboarding Wizard:** Replace the dead-end "Unavailable" jars state with an automated 1-click allocation wizard based on the household's chosen preset (e.g., 50/30/10/10).
3. **In-App Pending Invitation Banner:** Automatically detect pending household invitations for authenticated users upon login, guiding partners into their shared household with zero friction.

### 8. Recommended Release Readiness Decision

**DECISION: CONDITIONAL GO (Phase 1 Fixes Required)**

ViNha should **NOT** be released to public production in its current build due to the P1 blocking error in Loans and the P1 portfolio distortion in Investments.  
However, the underlying UX, collaboration architecture, security model, and core double-entry accounting are exceptional.

**Release Condition:**  
Upon completing the targeted 1-2 week remediation outlined in [Phase 1 of the Product Roadmap](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/audits/full-product-audit/product-roadmap.md), ViNha will be **100% ready for public beta launch**.

---

## 5. Artifact Directory & Verification Evidence

All raw audit assets, screenshot proofs, and ledger files are permanently cataloged in the audit workspace:

- [`progress.json`](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/audits/full-product-audit/progress.json) — Full phase progress manifest
- [`scenario-ledger.md`](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/audits/full-product-audit/scenario-ledger.md) — Detailed scenario execution logs
- [`financial-checks.md`](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/audits/full-product-audit/financial-checks.md) — Independent financial reconciliation tables
- [`issues.md`](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/audits/full-product-audit/issues.md) — Complete issue tracker with repro steps
- [`product-roadmap.md`](file:///Users/doantuan/Desktop/Plan/family-finances/.agents/audits/full-product-audit/product-roadmap.md) — 4-phase prioritized development roadmap
- `evidence/` — Photographic proof captured during execution:
  - `phase1-b-together-members.png` (Account B joining household)
  - `phase5-mobile-home-390.png` (Home on 390×844 mobile viewport)
  - `phase5-mobile-small-360.png` (Home on 360×640 small mobile viewport)
  - `phase5-mobile-add-tx-modal.png` (Transaction capture modal on mobile)
  - `phase5-vietnamese-home.png` (Vietnamese locale rendering)
  - `phase5-dark-theme-settings.png` (Settings appearance toggle)
  - `phase5-dark-home.png` (Home dashboard in dark mode)
  - `phase5-desktop-home.png` (Home dashboard on 1280×800 desktop)
