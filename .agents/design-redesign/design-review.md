# ViNha Redesign — Phase 2 Design Review & Product Fidelity Audit

**Date**: 2026-09-26  
**Auditor**: Senior Product Designer, UX Architect & Design Systems Lead  
**Scope**: 8 Canonical Google Stitch Screens (`projects/16826760243481546078`)  
**Design System**: ViNha Warm Precision (`assets/75087efd2c3c42baa6ce67405334331b`)  
**Quality Gate Verdict**: **DESIGN FOUNDATION NEEDS REVISION**

---

## 1. Executive Summary

Phase 2 performs an unsparing quality gate audit of the 8 foundational screens generated in Google Stitch during Phase 1.

While the aesthetic direction (_ViNha Warm Precision_) successfully established a calm, financial-grade tone with excellent typography and token discipline, this audit identified **critical product fidelity discrepancies, 1 P0 financial workflow violation, 3 invented product features, and several mobile viewport ergonomics issues**.

These designs **must not be implemented into Next.js production** until all P0 and P1 issues are resolved and the canonical screens are updated to reflect the real ViNha product model.

---

## 2. Element Classification & Traceability Matrix (Phase 2B)

Every visible UI element across all 8 Stitch screens has been cataloged and classified under the strict standard:

```text
REAL PRODUCT → REAL BUSINESS LOGIC → REAL USER FLOW → DESIGN INTENT → STITCH UI
```

### Classification Key

- **EXISTING PRODUCT BEHAVIOR**: Backed directly by live commands, RPCs, or queries in the active codebase.
- **UX IMPROVEMENT**: Enhances clarity or ergonomics without altering backend contracts or domain logic.
- **DERIVED INFORMATION**: Calculated purely on the client or loader from existing data without new business rules.
- **NEW PRODUCT FEATURE**: Requires new backend endpoints, RPCs, schema migrations, permissions, or logic. **Moved out to `product-opportunities.md`**.
- **UNVERIFIED / INVENTED**: Has no source in the current domain model; violates product reality.

| Stitch Element                                   | Screen          | Stitch ID     | Classification            | Source in Current Product                 | Audit Finding / Verdict                                     |
| ------------------------------------------------ | --------------- | ------------- | ------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| **Net Assets Total (₫ 2.036B)**                  | SCR-01 Home     | `29d005b4...` | DERIVED INFORMATION       | Accounts + Savings + Investments - Debt   | Valid. Accurately reflects test household.                  |
| **Dual Liquidity Split** (Cash vs Term Savings)  | SCR-01 Home     | `29d005b4...` | DERIVED INFORMATION       | `account.type` & `savingsFamily`          | Valid. Solves UX-01 liquidity confusion.                    |
| **Attention Banner ("Cần xử lý 14")**            | SCR-01 Home     | `29d005b4...` | EXISTING PRODUCT BEHAVIOR | `listPendingInboxItems` (14 items in DB)  | Valid. Accurately reflects pending queue.                   |
| **Plan Pulse Card (34% spent)**                  | SCR-01 Home     | `29d005b4...` | EXISTING PRODUCT BEHAVIOR | `getActivePlanPeriod` & spent queries     | Valid.                                                      |
| **Quick Reallocation CTA ("Điều chuyển")**       | SCR-01 Home     | `29d005b4...` | EXISTING PRODUCT BEHAVIOR | `reallocate_jar_capacity` RPC             | Valid. Command exists in Plan module.                       |
| **Investment Metric Strip (₫ 85.4M)**            | SCR-01 Home     | `29d005b4...` | DERIVED INFORMATION       | `modules/investments/application`         | Valid domain concept, but crowded on mobile.                |
| **Recent Activity List**                         | SCR-01 Home     | `29d005b4...` | EXISTING PRODUCT BEHAVIOR | `listTransactions`                        | Valid. Matches ledger history.                              |
| **Position Hero & Product Cards**                | SCR-02 Money    | `1144c104...` | DERIVED INFORMATION       | Ledger accounts + Savings + Debt          | Valid.                                                      |
| **Account Cards with Ownership & Mask**          | SCR-02 Money    | `1144c104...` | EXISTING PRODUCT BEHAVIOR | `LedgerAccount` domain model              | Valid. Shows `ownership` and masked numbers.                |
| **Written VND Pronunciation Hint**               | SCR-03 Add Tx   | `c1d9b8ee...` | UX IMPROVEMENT            | Client-side number-to-words helper        | Valid UX enhancement. Does not alter value.                 |
| **Quick Multipliers (+50k, +100k, +500k)**       | SCR-03 Add Tx   | `c1d9b8ee...` | UX IMPROVEMENT            | Client-side amount input helper           | Valid UX enhancement. Direct numeric increment.             |
| **Real-time Jar Budget Impact Simulation**       | SCR-03 Add Tx   | `c1d9b8ee...` | **NEW PRODUCT FEATURE**   | Form only receives `{ id, name, kind }`   | **Flagged**. Capture form loader lacks capacity/spent data. |
| **Jar Over-Budget Recovery Alert**               | SCR-04 Plan     | `a4d13528...` | EXISTING PRODUCT BEHAVIOR | Plan period budget calculation            | Valid.                                                      |
| **Jar Capacity Reallocation Action**             | SCR-04 Plan     | `a4d13528...` | EXISTING PRODUCT BEHAVIOR | `reallocateJarCapacity` command           | Valid.                                                      |
| **Smart Automated Jar Rebalancing**              | SCR-04 Plan     | `a4d13528...` | **NEW PRODUCT FEATURE**   | Multi-jar optimization algorithm          | **Flagged**. Moved to opportunities.                        |
| **Month-End Closing Ritual Teaser**              | SCR-04 Plan     | `a4d13528...` | EXISTING PRODUCT BEHAVIOR | `monthCloseMode` in `household_policies`  | Valid. Matches tenancy schema.                              |
| **Decision Cards (Individual Savings/Unmapped)** | SCR-05 Inbox    | `2d6d0f90...` | EXISTING PRODUCT BEHAVIOR | `SavingsMaturityInboxItem` & review items | Valid.                                                      |
| **Smart Batch Rollover ("Tái tục nhanh 6 sổ")**  | SCR-05 Inbox    | `2d6d0f90...` | **NEW PRODUCT FEATURE**   | No batch RPC exists in `modules/inbox`    | **REJECTED FROM REDESIGN**. Must be moved to opportunities. |
| **Household Role Badges (Admin vs Partner)**     | SCR-06 Together | `1a1ad8d1...` | EXISTING PRODUCT BEHAVIOR | `HOUSEHOLD_ROLE.ADMIN / PARTNER`          | Valid. Only 2 roles exist in schema.                        |
| **Spending Review Threshold (> ₫ 1.000.000)**    | SCR-06 Together | `1a1ad8d1...` | **INVENTED FEATURE**      | Not in `household_policies` schema        | **REJECTED FROM REDESIGN**. Must be moved to opportunities. |
| **Household Savings Renewal Rules**              | SCR-06 Together | `1a1ad8d1...` | **INVENTED FEATURE**      | Renewal is per-saving, not household      | **REJECTED FROM REDESIGN**. Misplaced concept.              |
| **Stepped Account Grouping (Cash/Bank/Card)**    | SCR-07 Accounts | `8e68551c...` | EXISTING PRODUCT BEHAVIOR | `AccountType` enum                        | Valid.                                                      |
| **Savings Portfolio Total (₫ 2.023.800.000)**    | SCR-08 Savings  | `a76e070c...` | EXISTING PRODUCT BEHAVIOR | `buildSavingsOverviewModel`               | Valid. Matches 7 Tikop contracts in DB.                     |
| **Days Remaining Countdown**                     | SCR-08 Savings  | `a76e070c...` | EXISTING PRODUCT BEHAVIOR | `daysUntilMaturity` calculation           | Valid. Derived from cycle end date.                         |
| **Projected Monthly Profit (+₫ 11.24M/tháng)**   | SCR-08 Savings  | `a76e070c...` | **INVENTED PROJECTION**   | Savings are discrete term deposits        | **Flagged**. Obscures discrete maturity cashflow.           |
| **Direct Inline Settlement Buttons on Card**     | SCR-08 Savings  | `a76e070c...` | **FINANCIALLY INCORRECT** | Bypasses settlement account selection     | **P0 VIOLATION**. Bypasses required settlement RPC flow.    |

---

## 3. Deep-Dive Audit on Suspect Features

### 3.1 Home Dashboard: Liquidity Split & Reallocation

- **Spendable Cash vs Locked Savings**: CONFIRMED VALID. Can be derived cleanly by segmenting accounts (`account.type === 'checking' | 'cash' | 'e_wallet'`) from term savings (`saving.savingsFamily === 'BANK' | 'PLATFORM'`).
- **"Cần xử lý (14)"**: CONFIRMED REAL. Real test household has exactly 14 pending inbox items.
- **Quick Reallocation CTA**: CONFIRMED REAL. `reallocate_jar_capacity` exists as a production RPC in Postgres and TypeScript application layer.

### 3.2 Plan: Smart Reallocation

- **Finding**: While `reallocateJarCapacity` exists for manual 1-to-1 envelope adjustments, the Stitch design showed automated AI-driven multi-jar reallocation.
- **Verdict**: Manual reallocation is existing behavior; proactive algorithmic multi-jar rebalancing is a **NEW PRODUCT FEATURE** moved to `product-opportunities.md`.

### 3.3 Inbox: Smart Batch Assistant ("Tái tục nhanh 6 sổ")

- **Code Audit**: Inspected `modules/inbox/application/commands/savings-workflow.ts` and `modules/savings/application/commands/savings-inbox-workflow.ts`.
- **Finding**: Every savings maturity resolution requires individual execution of `executeSavingsMaturityWorkflow` with `savingId`, `cycleId`, `settlementRule`, `packageId`, and `settlementAccountId`. There is **zero batch execution infrastructure** in the backend.
- **Verdict**: **DISALLOWED IN REDESIGN**. Must be removed from canonical Stitch SCR-05 and documented as a Future Product Opportunity.

### 3.4 Together: Spending Review Threshold & Renewal Rules

- **Code Audit**: Inspected `modules/tenancy/application/household-policies.schema.ts` and `household-policy-constants.ts`.
- **Finding**: `household_policies` ONLY contains:
  1. `overspendPolicy`: `warn` | `block` | `allow_negative`
  2. `monthCloseMode`: `assisted` | `auto` | `manual` | `quick_close`
  3. `incomeAllocateMode`: `off` | `suggest` | `auto`
     There is **NO** spending threshold column, and **NO** household-level savings renewal rule.
- **Verdict**: **DISALLOWED IN REDESIGN**. The Stitch design invented a household approval system. Canonical SCR-06 must show the real policies (`overspendPolicy`, `monthCloseMode`, `incomeAllocateMode`).

### 3.5 Add Transaction: Written Pronunciation, Chips & Jar Impact

- **Pronunciation Hint**: CONFIRMED UX IMPROVEMENT. Pure client-side formatting helper that protects against zero-counting errors in VND.
- **Quick Multipliers**: CONFIRMED UX IMPROVEMENT. Pure client-side input stepper.
- **Real-Time Jar Impact Simulation**: CONFIRMED NEW FEATURE. `listCaptureJars()` only provides `{ id, name, kind }`. Form does not have period allocated/spent figures. Moved to `product-opportunities.md`.

### 3.6 Savings: Projections & Inline Actions

- **Average Yield**: CONFIRMED DERIVED INFORMATION (Weighted average across active contracts).
- **Projected Monthly Profit**: CONFIRMED INVENTED PROJECTION. Discrete term savings do not pay monthly dividends; extrapolating a monthly rate misrepresents household cashflow.
- **Direct Inline Actions ("Tái tục ngay", "Chuyển về ví")**: CONFIRMED P0 VIOLATION. Bypasses receiving bank account selection and settlement rule configuration.

---

## 4. Comprehensive Design Issue List (P0 — P3)

| Issue ID   | Screen          | Severity | Current Stitch Design                                                                                         | Real Product Behavior                                                                                     | Problem Statement                                                                                                | Required Design Change                                                                                       | Stitch Screen ID | Status |
| ---------- | --------------- | -------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------- | ------ |
| **ISS-01** | SCR-08 Savings  | **P0**   | Direct inline buttons `Tái tục ngay` & `Chuyển về ví` on contract card #3                                     | Contract settlement requires selecting settlement account (`settlementAccountId`) and renewal policy rule | Bypasses essential financial workflow. User cannot settle or roll over without designating where the money goes. | Replace direct buttons with CTA navigating to Decision Inbox or opening Settlement Sheet.                    | `a76e070c...`    | OPEN   |
| **ISS-02** | SCR-05 Inbox    | **P1**   | "Smart Batch Assistant / Tái tục nhanh 6 sổ" with 1-tap batch execution                                       | Backend only supports single-item maturity resolution                                                     | Invented product feature presented as active capability. No batch API or partial-failure logic exists.           | Remove batch card from canonical SCR-05. Move to `product-opportunities.md`. Present clean grouped list.     | `2d6d0f90...`    | OPEN   |
| **ISS-03** | SCR-06 Together | **P1**   | Shared policies section displays "Ngưỡng chi tiêu cần hỏi ý kiến (> ₫ 1M)" and "Chính sách tái tục tiết kiệm" | `household_policies` only has `overspendPolicy`, `monthCloseMode`, and `incomeAllocateMode`               | Invented product features. Misrepresents tenancy capabilities and introduces phantom approval workflows.         | Redesign policies section with actual policies: Bội chi (Warn/Block), Đóng tháng (Ritual), Phân bổ thu nhập. | `1a1ad8d1...`    | OPEN   |
| **ISS-04** | SCR-03 Add Tx   | **P1**   | Real-time jar budget impact simulation ("Đã tiêu 72% -> Sau giao dịch 74.5%")                                 | `listCaptureJars()` only provides `{ id, name, kind }` to the client                                      | The capture form has no access to period envelope capacity or ledger spent totals.                               | Keep jar selection dropdown/chips, but remove simulated live progress bar from baseline form.                | `c1d9b8ee...`    | OPEN   |
| **ISS-05** | SCR-08 Savings  | **P1**   | Top metric card displays "+₫ 11.240.000/tháng" as projected monthly profit                                    | Savings are fixed-term contracts (3M, 6M, 12M) with lump-sum maturity                                     | Misleads user into expecting monthly liquid cashflow from locked term deposits.                                  | Replace with "Lãi dự kiến toàn kỳ" (Total expected net interest: ₫ 45.2M) and "Lợi suất TB".                 | `a76e070c...`    | OPEN   |
| **ISS-06** | All Screens     | **P2**   | Screens 01-07 generated on Desktop canvas (width 2560px) with fixed `w-[440px]` inner container               | ViNha is mobile-first (390px iPhone, 360px Android) with max 440px shell                                  | On real mobile devices, fixed 440px overflows viewports < 440px. Must be `w-full max-w-[440px]`.                 | Ensure all Stitch screens are explicitly rendered at mobile viewport and responsive down to 360px.           | All Screens      | OPEN   |
| **ISS-07** | SCR-01 Home     | **P2**   | 3 mini metric cards in a row (`Hũ tiết kiệm`, `Vay & Nợ thẻ`, `Đầu tư chứng chỉ`)                             | Mobile viewport width 360px - 390px causes text truncation                                                | High card density and cramped 3-column layout causes numerical clipping on compact mobile devices.               | Convert 3-card grid into clean 2-column or list-row metrics with ample padding.                              | `29d005b4...`    | OPEN   |
| **ISS-08** | All Screens     | **P2**   | All 8 Stitch screens only exist in Light Mode                                                                 | Project requires full dark mode support                                                                   | Dark theme surfaces, borders, and contrast not validated in visual artifacts.                                    | Create canonical dark theme reference screens in Stitch.                                                     | All Screens      | OPEN   |
| **ISS-09** | SCR-06 Together | **P2**   | Member cards show detailed email and roles, but no invitation management or link-sharing status               | Tenancy has full invitation lifecycle (`pending`, `accepted`, `revoked`, `expired`)                       | Design shows static mock list without pending invitation states or invite CTA.                                   | Add "Mời người đồng hành" CTA and pending invitation state representation.                                   | `1a1ad8d1...`    | OPEN   |
| **ISS-10** | SCR-08 Savings  | **P3**   | Text says "Bảo chứng ngân hàng lưu ký Techcombank" (Tikop marketing copy)                                     | ViNha is a personal household tool, not a fintech marketing app                                           | Generic promotional fintech copy dilutes product seriousness and credibility.                                    | Replace with factual contract metadata: "Ngân hàng lưu ký / Đối tác liên kết".                               | `a76e070c...`    | OPEN   |

---

## 5. Design QA Evaluations

### 5.1 Information Architecture: PASS WITH REVISIONS

- The separation of responsibilities across Home, Money, Plan, Inbox, and Together is clear and non-overlapping.
- **Correction**: Inbox must focus strictly on actual pending decisions (savings maturities, unmapped transactions, debt reminders), removing invented batch triage.

### 5.2 Visual Hierarchy & Density: NEEDS WORK

- **Card density**: SCR-01 Home and SCR-08 Savings have too many nested visual containers.
- Systemic correction: Use typography and horizontal hairline dividers (`border-border-subtle`) instead of stacking cards inside cards.

### 5.3 Mobile Ergonomics: NEEDS WORK

- Desktop canvas sizing in Stitch must be replaced with true mobile viewport styling (`390px` reference, fully responsive to `360px`).
- Numerical values with 10 digits (e.g. `₫ 2.023.800.000`) require dedicated full-width rows rather than cramped 3-column grids.

### 5.4 Financial Semantics: NEEDS WORK (Due to P0 in Savings)

- The fundamental equations (`Available Cash ≠ Net Worth`, `Balance ≠ Income`, `Jar ≠ Bank Account`) are mostly preserved.
- **However**, direct inline rollover/withdrawal in SCR-08 violates the contract settlement boundary.

### 5.5 Content & Natural Vietnamese: PASS WITH REVISIONS

- Vietnamese diacritics and typography are well rendered.
- Replace promotional jargon ("Bảo chứng lưu ký") and invented policy titles with canonical ViNha terminology.

---

## 6. Required Stitch Screen Revisions (Phase 2R)

To pass the Design Review Gate, the following Stitch screens must have revised canonical versions generated:

1. **SCR-05-REV**: Canonical Decision Inbox without invented batch rollover; clear categorized triage.
2. **SCR-06-REV**: Canonical Together & Household with real `household_policies` (Bội chi, Nghi thức đóng tháng, Phân bổ thu nhập).
3. **SCR-08-REV**: Canonical Savings Overview without fake monthly annuities; replace direct inline action buttons with workflow-compliant CTAs.
4. **SCR-03-REV**: Canonical Add Transaction Sheet preserving written pronunciation & quick chips, but simplifying jar selection without unbacked live budget simulations.

All previous explorations will be preserved and marked `SUPERSEDED` in `stitch-screen-map.md`.
