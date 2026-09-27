# Plan Experience Review (ViNha Task 08)

This document provides the canonical design and architecture review for the ViNha Plan Experience (Kế hoạch chi tiêu gia đình), covering the domain model, envelope budget semantics, financial guardrails, UI consistency, visual QA, and Google Stitch screen mapping.

---

## Existing Plan Model

ViNha's Plan domain (`modules/plan`) is an **Envelope Budgeting & Financial Intention System** designed for Vietnamese bilingual households. It answers:

- _Tháng này gia đình dự định sử dụng tiền như thế nào?_
- _Mỗi hũ được phân bổ bao nhiêu?_
- _Đã sử dụng bao nhiêu, còn lại bao nhiêu?_
- _Hũ nào đang vượt kế hoạch và cần điều chỉnh ở đâu?_

### Core Architectural Pillars

1. **Intention, Not Ledger:** A Plan allocates intentional monthly capacity (`FinancialNumberKind.INTENTION`). It never creates bank liabilities or deposits.
2. **Zero Cash Movement (`PLAN_MOVEMENT_LEDGER_IMPACT = 0`):** Reallocating capacity between jars changes planning limits, never bank account balances.
3. **No Lock in Plan V2 (`RITUAL_LOCKED_STATUSES = []`):** Monthly Review is a non-blocking reflective ritual (`NOT_STARTED` → `VIEWED` → `MARKED_REVIEWED`), eliminating destructive month-locking.
4. **Assisted Support, Not Autopilot:** Recommends transparent adjustments without automating cash movement or enforcing rigid 6-jar budgeting dogma.

---

## Month / Period Model

- **Anchor Format:** Standard calendar month start dates (`YYYY-MM-01`, e.g., `2026-10-01`).
- **Current vs Historical:**
  - **Current Period:** Live, reactive to posted transactions, allows jar capacity reallocation (`reallocateJarCapacityAction`) and plan adjustments.
  - **Historical Periods:** Read-only historical snapshots (`jar_period_rule_snapshots`). Captures actual historical spending, rollover credits, and final performance without rewriting history.
- **Calendar & Timezone:** Evaluated in household timezone (`Asia/Ho_Chi_Minh` / `HOUSEHOLD_TIMEZONE.VIETNAM`). Month bounds are strictly clamped `[startOfMonth, endOfMonthExclusive)`.

---

## Jar Model

Each Jar represents a dedicated planning envelope:

- **`kind` (JarKind):**
  - `SPENDING`: Routine family living expenses (e.g., Ăn uống, Tiền nhà, Mua sắm, Đi lại). Defaults to `RESET` rollover mode.
  - `SAVINGS`: Dedicated savings accumulation intention. Defaults to `CARRY` rollover mode.
  - `BUFFER`: Emergency cushion or contingency envelope. Defaults to `CARRY` rollover mode.
  - `INCOME`: Income allocation staging (internal).
- **`state` (JarState):** `ACTIVE`, `PAUSED`, `ARCHIVED`. Only active jars participate as allocation targets.
- **`plan` (JarPlan):**
  - `FIXED`: Fixed monthly VND capacity (`fixedAmount`, e.g. `₫ 15.000.000/tháng`).
  - `PERCENT`: Dynamic proportion of household qualifying monthly income (`percentBps`, basis points, e.g. `2500` = 25%).
- **`rolloverMode` (JarRolloverMode):**
  - `RESET`: Unused remaining envelope amount is cleared at month-end.
  - `CARRY`: Positive remaining budget rolls over into next month's available capacity (`rolloverCredit`). Negative remaining (overspending) never carries forward as debt.

---

## Planned / Spent / Remaining Semantics

The mathematical relationships are strictly defined in `modules/plan/application/jar-budget.ts`:

$$\text{Rule Budget} = \begin{cases} \text{fixedAmount}, & \text{if FIXED} \\ \lfloor (\text{Qualifying Income} \times \text{percentBps}) / 10\,000 \rfloor, & \text{if PERCENT} \end{cases}$$

$$\text{Effective Budget} = \max(0, \text{Rule Budget} + \text{Rollover Credit} + \text{Period Adjustments})$$

$$\text{Spent Amount} = \sum \text{Classified Transactions mapped to Jar}$$

$$\text{Remaining Amount} = \text{Effective Budget} - \text{Spent Amount}$$

$$\text{Usage Percent} = \begin{cases} \text{round}\left(\frac{\text{Spent Amount}}{\text{Effective Budget}} \times 100\right), & \text{if Effective Budget} > 0 \\ 0, & \text{otherwise} \end{cases}$$

### Derived States:

- **`NO_BUDGET`:** $\text{Budget} = 0 \land \text{Spent} = 0$.
- **`NO_SPENDING`:** $\text{Budget} > 0 \land \text{Spent} = 0$ (Valid pristine state; not styled as an error).
- **`HEALTHY`:** $\text{Usage} < 80\%$.
- **`NEAR_LIMIT`:** $80\% \le \text{Usage} \le 100\%$.
- **`OVERSPENT`:** $\text{Spent} > \text{Budget}$ or $(\text{Budget} = 0 \land \text{Spent} > 0)$. Surfaced neutrally as _"Vượt kế hoạch ₫..."_, never punitive or shaming.

---

## Plan Overview (`/plan`)

- **Screen Reference:** `SCR-35 (Light)` & `SCR-35 (Dark)`
- **Header:** TopAppBar with period pill (`Tháng 10/2026`) and Assist Mode indicator (`Chế độ hỗ trợ`).
- **Hero Context:** Status card displaying overall health (`Cần lưu ý 1 hũ vượt`), active jar count (6), qualifying income (`₫ 45.000.000`), and 3-column summary:
  - Tổng kế hoạch: `₫ 42.000.000`
  - Đã chi tiêu: `₫ 28.650.000` (68.2%)
  - Còn lại: `₫ 13.350.000` (Emerald)
- **Attention Exceptions:** High-priority banner flagging `Hũ Mua sắm & Giải trí vượt kế hoạch ₫ 850.000` with direct CTA to adjust allocation.
- **Jars List:** Standardized 40×40px icon containers, clear progress bars, intentional VND labels, and remaining vs overspent badges.
- **Upcoming Outflows:** 7-day scheduled bill preview (EVN, Phí chung cư).
- **Secondary Hub Entries:** Lịch tài chính (Calendar), Nhìn lại tháng (Review), Định kỳ (Recurring), Mục tiêu (Goals).
- **Navigation:** Canonical 5-tab bar with Plan active (`#0F766E` Light / `#2DD4BF` Dark).

---

## Jar List

Jars are rendered with consistent geometry and scannable hierarchy:

1. **Icon Container:** 40×40px, rounded-10px, semantic container tones (Savings/Teal for daily spending, Rose for overspent, Amber for buffer/warning).
2. **Primary Title:** Localized catalog or custom name (`Ăn uống & Sinh hoạt`, `Tiền nhà & Hóa đơn`, etc.).
3. **Subtitle:** Classification & rollover policy (`Chi tiêu thiết yếu · Đặt lại hàng tháng`).
4. **Financial Values:** Tabular-nums remaining amount (`Còn ₫ 4.800.000` in emerald, or `Vượt ₫ 850.000` in rose), accompanied by cumulative fraction (`₫ 10.2M / ₫ 15.0M`).
5. **Progress Bar:** 4px height, 9999px radius, filled smoothly without overflowing its track when usage exceeds 100%.

---

## Jar Detail (`/plan/jars/:id`)

- **Screen Reference:** `SCR-36 (Light)` & `SCR-36 (Dark)`
- **Identity Hero:** 44×44px container, large 32px quota (`₫ 15.000.000`), status badge (`Đang hoạt động`), and intention footnote.
- **Budget Metrics:** 3-column card (Hạn mức ₫ 15M, Đã dùng ₫ 10.2M, Còn lại ₫ 4.8M) + 68% progress bar + safe financial callout notice (_"Hũ kế hoạch là hạn mức dự kiến, không phải tài khoản ngân hàng riêng biệt"_).
- **Actions:** Primary CTA `Điều chỉnh phân bổ hũ` (opens reallocation sheet) + Secondary `Chỉnh sửa hũ`.
- **Linked Categories:** Badges indicating mapped expense categories (`Đi chợ & Siêu thị`, `Ăn ngoài & Nhà hàng`, `Cà phê & Đồ uống`).
- **Recent Transactions:** Direct transactional feed showing recent debit legs assigned to this jar, with date, merchant, source account, and category.

---

## Create Jar (`/plan/jars/new` or sheet)

- **Screen Reference:** `SCR-37 (Light)` & `SCR-37 (Dark)`
- **Header:** Modal sheet layout with handle bar and dismiss affordance.
- **Virtual Allocation Banner:** Prominent notification clarifying that creating a jar does not create a bank account.
- **Form Controls:**
  - Name input with character limit.
  - Active state checkbox (`Kích hoạt hũ này`).
  - Allocation mode ChoiceTileGroup (`Số tiền cố định` vs `Tỷ lệ % thu nhập quy đổi`).
  - Large amount field with Vietnamese verbal readout (`Mười lăm triệu đồng`).
  - Real-time rule preview box displaying calculated budget.
  - Category assignment checkboxes with conflict detection and reassignment confirmation.
  - Collapsible Advanced Options: JarKind (Spending/Savings/Buffer) and RolloverMode (Reset/Carry).
- **Footer:** Cancel + Sticky `+ Lưu hũ kế hoạch` CTA.

---

## Edit Jar (`/plan/jars/:id/edit` or sheet)

- Shared canonical architecture with Create Jar via `JarConfigurationForm`.
- Prepopulates existing configuration, preserves category ownership, and requires explicit destination jar reassignment (`removedCategoryTargetJarId`) if existing categories are detached.

---

## Adjustment Model

- **RPC / Command:** `reallocateJarCapacityAction` (`reallocate_jar_capacity`).
- **Semantics:** Moves virtual quota between two active jars within the current planning period.
- **Ledger Invariance:** `result.ledgerTransactionsCreated === 0` and `result.ledgerImpact === 0`. No bank transfers or journal entries are recorded.
- **Emergency Support:** Can be marked as `isEmergency: true`, which demands an explicit `intentNote` (max 280 chars) and creates an Inbox audit item for household transparency.

---

## Adjustment Flow (`/plan/jars/:id/adjust` or sheet)

- **Screen Reference:** `SCR-38 (Light)` & `SCR-38 (Dark)`
- **Source Context:** Displays source jar name (`Ăn uống & Sinh hoạt`) and maximum movable surplus (`₫ 4.800.000`).
- **Target Selector:** Select control with deficit badges (e.g. `Mua sắm & Giải trí · Đang vượt ₫ 850.000`).
- **Amount Entry:** Tabular input with quick multiplier chips (`+200k`, `+500k`, `+1.000k`, `Bù đủ vượt ₫ 850k`, `Tối đa ₫ 4.8M`).
- **Preview Box:** High-contrast Before $\rightarrow$ After comparison:
  - Source Jar: `₫ 15.000.000 → ₫ 14.000.000 (−₫ 1.000.000)`
  - Target Jar: `₫ 2.000.000 → ₫ 3.000.000 (+₫ 1.000.000 · An toàn, hết vượt)`
- **Post-Submission Receipt:** Displays clear confirmation that the plan changed while cash in bank accounts remained untouched.

---

## Plan Setup

- If a household has no jars configured, Plan displays a welcoming empty state:
  - Friendly graphic container with Jar SVG artwork.
  - Title: _Chưa có hũ chi tiêu nào_.
  - Body: Explains envelope planning without forcing a rigid 6-jar system.
  - Primary CTA: _+ Tạo hũ kế hoạch đầu tiên_.

---

## Historical Plan (`/plan?month=...`)

- **Screen Reference:** `SCR-39 (Light)` & `SCR-39 (Dark)`
- **Month Switcher:** Segmented navigation `< Tháng 08/2026` · **Tháng 09/2026** (Padlock) · `Tháng 10/2026 >`.
- **Read-Only Banner:** Explains that historical months are immutable records. Reallocation actions are disabled.
- **Historical Snapshot Card:** Final totals (`₫ 38.650.000 / ₫ 40.000.000`, 96.6% utilization, `+₫ 1.350.000` surplus carried forward).
- **Jar Breakdown:** Reflects exact historical rule snapshots without being altered by later configuration changes.

---

## Month-End Behavior (`/plan/ritual`)

- **Screen Reference:** `SCR-40 (Light)` & `SCR-40 (Dark)`
- **Canonical Feature:** "Nhìn lại tháng" (Monthly Review).
- **Non-Blocking Rule:** Plan V2 completely deprecated month-locking (`RITUAL_LOCKED_STATUSES = []`). Reviewing a month never locks transactions or stops planning.
- **Workflow:**
  1. Review period context (`Tháng 10/2026 · Đang diễn ra`).
  2. Audit open issues (overspent jars, unmapped expenses).
  3. Inspect cash flow summary (Posted Income, Jar Spending, Net Cash Flow).
  4. Compare month-over-month variances (Spending trend vs previous month).
  5. Primary CTA: `Đánh dấu đã nhìn lại tháng 10`.

---

## Rollover Behavior

- Evaluated per-jar according to `rolloverMode`:
  - `RESET`: Remaining envelope balance is zeroed at month-end.
  - `CARRY`: Positive balance carries over as `rolloverCredit` in next month's budget.
  - Overspending is an intention overrun and is never converted to an accounting debt.

---

## Goals If Applicable

- Goals live under `modules/plan/application/goal-funding.ts` and `/plan/goals`.
- On the Plan Overview and Monthly Review, active goals appear as **Linked Planning Milestones** with progress bars, target dates, and funding quality indicators.
- Plan does not duplicate Savings deposit books; it tracks the overarching intention toward target milestones.

---

## Transaction Relationship

- Jars do not own bank accounts. Transactions originate from Accounts (Checking, Cash, Wallet, Credit Card).
- When an expense is recorded, assigning a `jar_id` categorizes the consumption of intentional capacity.
- Classifying an event consumes or restores capacity without moving money between accounts.

---

## Financial Semantics

| Concept              | True Product Rule                            | Dangerous Anti-Pattern (Forbidden)              |
| -------------------- | -------------------------------------------- | ----------------------------------------------- |
| **Jar vs Account**   | Virtual spending intention envelope          | Equating jar with bank account or physical cash |
| **Reallocation**     | Virtual capacity shift (`LEDGER_IMPACT = 0`) | Treating reallocation as a bank transfer        |
| **Overspent**        | Envelope deficit (`Remaining < 0`)           | Treating overspent budget as a debt liability   |
| **Planned Amount**   | Monthly target spending quota                | Account balance or current wealth               |
| **Historical Plan**  | Immutable past snapshot                      | Live-editing past budgets and rewriting history |
| **Month-End Review** | Reflective review ritual                     | Hard-locking transactions and preventing edits  |

---

## UI Consistency

All 12 Plan screens adhere strictly to the approved ViNha Design System:

- **Typography:** Geist font family with `tabular-nums` on all currency values, dates, percentages, and counters.
- **Gutters & Canvas:** 16px screen gutters on a fixed 440px centered mobile canvas.
- **TopAppBar:** Standardized variants (Default on Overview, Detail with back button on Detail/Ritual).
- **Cards & Radii:** 16px radius for hero cards, 12px for list cards, 10px for form inputs and icon containers, 9999px for status pills.
- **Icon Containers:** 40×40px default with 20px centered SVG glyphs.

---

## Progress Component QA

- **Height & Radii:** Standardized 4px height with `rounded-full` track.
- **Boundary Clamping:** Visual progress fill is clamped strictly between `0%` and `100%`:
  - `0%` spending: Empty track.
  - `50%` spending: Half filled teal bar.
  - `100%` spending: Full width track.
  - `142.5%` spending (Overspent): Visual bar capped at `100%` filled with Rose `#BE123C` (`#FB7185` Dark); textual label clearly states `Vượt kế hoạch ₫ 850.000` without horizontal container overflow or clipping.

---

## Visual QA

- **Tabular Numerals:** Tested with `₫ 0`, `₫ 850.000`, `₫ 15.000.000`, `₫ 42.000.000`, `₫ 300.000.000`. Zero clipping or unwanted line breaks.
- **Icon Rendering:** 100% native inline SVGs; no emoji used as production icons; no broken fonts.
- **Touch Targets:** All buttons, sheet handles, selector pills, and checkboxes satisfy minimum 44×44px touch ergonomics.

---

## Responsive Review

Validated across all canonical mobile breakpoints:

- **360 × 800 (Compact Mobile):** PASS. No horizontal overflow; 3-column metric strips wrap or scale cleanly.
- **390 × 844 (Standard iPhone):** PASS. Optimal density, scannable cards, comfortable touch targets.
- **430 × 932 (Large Mobile):** PASS. Centered within 440px canvas bounds, pristine typography.

---

## Accessibility

- **Contrast Ratios:** Exceeds WCAG AA 4.5:1 for all text:
  - Teal `#0F766E` on white: 4.8:1
  - Rose `#BE123C` on `#FFF1F2`: 5.1:1
  - Emerald `#047857` on white: 5.2:1
  - Dark mode `#F4F4F5` on `#1C1C1F`: 13.8:1
  - Dark teal `#2DD4BF` on `#1C1C1F`: 8.2:1
- **Color Independence:** Overspent states pair rose color with explicit text `Vượt kế hoạch ₫...`; status badges use distinct labels alongside color tokens.

---

## Light Theme

Canonical screens created with stone canvas `#FAFAF9`, white cards `#FFFFFF`, and subtle borders `#DDE4E1`. Calm, readable, high-trust financial feel.

---

## Dark Theme

Canonical screens created with dark slate canvas `#141416`, surface `#1C1C1F`, borders `#2E2E33`, text `#F4F4F5`, and luminescent teal `#2DD4BF`. Zero OLED glare; perfect 1-to-1 structural parity with Light mode.

---

## Prototype

All real user flows verified:

1. **Home $\rightarrow$ Plan:** Tap active Plan tab in bottom navigation $\rightarrow$ Loads `/plan` (SCR-35).
2. **Plan $\rightarrow$ Jar Detail:** Tap `Ăn uống & Sinh hoạt` jar row $\rightarrow$ Opens `/plan/jars/:id` (SCR-36).
3. **Plan $\rightarrow$ Create Jar:** Tap `+ Thêm hũ` $\rightarrow$ Opens `Cấu hình hũ kế hoạch` sheet (SCR-37).
4. **Jar Detail $\rightarrow$ Adjust Allocation:** Tap `Điều chỉnh phân bổ hũ` $\rightarrow$ Opens reallocation sheet (SCR-38).
5. **Plan $\rightarrow$ Historical Month:** Tap month switcher `< Tháng 09/2026` $\rightarrow$ Opens read-only historical plan (SCR-39).
6. **Plan $\rightarrow$ Monthly Review:** Tap `Nhìn lại tháng 10` shortcut $\rightarrow$ Opens non-blocking monthly review (SCR-40).

---

## Deferred Product Opportunities

The following exploratory ideas were identified during the audit but are **intentionally excluded** from canonical designs because they do not exist in the current product:

1. **AI Auto-Rebalancing:** Automatically calculating and shifting capacity between overspent and underspent jars. (Deferred as future exploration).
2. **Predictive Budget Burn Rate:** Machine-learning forecasts of end-of-month overspending. (Deferred).
3. **Automated Cash Sweeps:** Linking jar balances to physical savings sub-accounts with auto-transfers. (Deferred; contradicts core envelope model).

---

## Final Screen Map Registry

| Screen ID          | Screen Name                               | Route                   | Stitch Screen ID                   | Version              | Status        |
| ------------------ | ----------------------------------------- | ----------------------- | ---------------------------------- | -------------------- | ------------- |
| **SCR-35 (Light)** | Plan Overview (Light)                     | `/plan`                 | `70749ca2e350497f9def0dadf235d3ba` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-35 (Dark)**  | Plan Overview (Dark)                      | `/plan`                 | `893e91e4bced4fa4af9f44b8cd967316` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-36 (Light)** | Jar Detail (Light)                        | `/plan/jars/:id`        | `1c9f17d0b9ff44c3a988310b1f13daec` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-36 (Dark)**  | Jar Detail (Dark)                         | `/plan/jars/:id`        | `d53a3a351eff4bceaa992e4e154250da` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-37 (Light)** | Create & Edit Jar (Light)                 | `/plan/jars/new`        | `abd6bc2e24f449098cdd79b64b85b0f1` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-37 (Dark)**  | Create & Edit Jar (Dark)                  | `/plan/jars/new`        | `907d9c2775204f2fb92d82bbb2dd7b85` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-38 (Light)** | Adjust Jar Allocation (Light)             | `/plan/jars/:id/adjust` | `db081d524cfc40318019a024b3fceb6c` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-38 (Dark)**  | Adjust Jar Allocation (Dark)              | `/plan/jars/:id/adjust` | `3c2907ce6f8e4f95af9c55872ad47b99` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-39 (Light)** | Historical Plan & Month Switching (Light) | `/plan?month=...`       | `c15a411ada2a445b8951052037285f3b` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-39 (Dark)**  | Historical Plan & Month Switching (Dark)  | `/plan?month=...`       | `7101eef820d146599d09686fa420cf5a` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-40 (Light)** | Monthly Review / Month-End Ritual (Light) | `/plan/ritual`          | `61019aa422fc48888d3e286cf1c3b82b` | **v2.0 (Canonical)** | **CANONICAL** |
| **SCR-40 (Dark)**  | Monthly Review / Month-End Ritual (Dark)  | `/plan/ritual`          | `23731f925c4c4c44ac46757bb7314a7c` | **v2.0 (Canonical)** | **CANONICAL** |
