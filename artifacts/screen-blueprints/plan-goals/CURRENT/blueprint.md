# Phase E3 — Plan + Goals Blueprint

Status: Canonical lean implementation blueprint.

Scope: Plan overview, jars/allocations used by Plan, Goals, and direct Plan↔Goals interactions. Documentation only.

Authorities: Phase B IA, Phase C UX, Phase D DS, `artifacts/current/domains/planning/`, `artifacts/current/domains/goals/`, current `app/[locale]/(product)/plan/` and `modules/plan/` surfaces. No jars domain package exists separately; jars live under Planning.

## 1. Current Surface Inspection (max 10)

1. **Hierarchy** — Plan hub teaches real≠virtual and links jars/goals/ritual, but does not surface current period, allocation progress, or divergence on the overview (divergence only inside Ritual).
2. **Duplication** — Hub entry rows are ad-hoc bordered blocks; jars/goals lists already use `JarCard`/`GoalCard`; detail/create screens repeat local `div` frames instead of calibrated `Page`/`Section`/`BottomActionBar`.
3. **Confusing interaction** — Goal contribute sits above edit with weak “progress only” emphasis; complete/cancel/pause are a free status `<select>` without required confirmations.
4. **Financial-semantic risk** — Goal “funded” + large `Amount` can read as cash; jar planned amount and `capacityDelta` can read as balances without persistent not-balance labeling on detail.
5. **Missing main state** — No calm Plan ready-state pulse for current month (period label + intention summary + ritual entry). Empty jars/goals exist; locked-period mutation blocking is only partly surfaced.
6. **Responsive** — Long jar detail (ritual lock + reallocate + allocate + lifecycle) and ritual wizard lack sticky bottom actions; 390px thumb reach is at risk.
7. **Receipt gap** — Reallocate returns `planMovementId` with `ledgerImpact === 0` but UI refreshes without a plan-changed / money-unchanged receipt.
8. **Lifecycle fidelity** — Goals statuses are `active | paused | completed | cancelled` only. Do not invent Goal archive UI. Jar archive exists via `JarState.ARCHIVED`.
9. **Funding fidelity** — Approved Goal “funding” is contribution progress (`contributeToGoal`) or optional savings **context** only. Neither writes ledger. Real funding belongs to Money/Transactions.
10. **Scope creep pressure** — Recurring and Calendar exist under `/plan` but are out of this batch except stable nav links.

## 2. Canonical UX Surfaces

### Plan Overview — `/plan`

| | |
|---|---|
| Purpose | Orient household intention for the current period; launch jars, goals, ritual. |
| Hierarchy | TopAppBar → offline/status → current-period pulse → teaching (real≠virtual) → jar preview → goals entry → ritual CTA. |
| Primary action | Open Ritual when review is due; else open Jars to allocate. |
| Secondary | Goals, Jars see-all, Money (read reality). Recurring/Calendar links allowed as existing destinations, not redesigned here. |
| Components | `Page`, `TopAppBar`, `Section`/`SectionHeader`, `StatusAlert`, `JarCard` (preview), `EmptyState`, existing emergency inbox banner. |
| Nav | Tab Plan; children via `APP_PATH.PLAN_*` / `planJarPath` / `planGoalPath`. |
| Financial consequence | **NONE** (read-only). |

### Jars list — `/plan/jars`

| | |
|---|---|
| Purpose | Browse Active allocation targets vs paused/archived non-targets. |
| Hierarchy | TopAppBar → offline → income mode (label only) → Active jars → Non-targets → create jar (and existing create-category if kept). |
| Primary | Create jar / open jar detail. |
| Secondary | Pause/archive via detail only. |
| Components | `Page`, `JarCard`, `EmptyState`, create form + `BottomActionBar` or inline submit. |
| Financial consequence | **NONE**. |

### Jar detail / allocate / reallocate — `/plan/jars/[id]`

| | |
|---|---|
| Purpose | Show planned capacity (not balance); set allocation; reallocate virtual capacity. |
| Hierarchy | Identity → planned amount (labeled intention) → capacity delta (labeled plan capacity) → state → allocate → reallocate (Active only) → lifecycle → back. |
| Primary | Save allocation or confirm reallocate. |
| Secondary | Pause / resume / archive jar; open Ritual if locked. |
| Components | `Page`, `Amount`/`MoneyField`/`AmountField`, `StatusAlert`, `Dialog` or ConfirmDialog for archive/emergency, plan-effect preview (reuse FinancialPreview pattern if introduced; else StatusAlert + Dialog). |
| Financial consequence | **NONE** — updates planning only. Reallocate must keep ledger transactions created = 0 and ledger impact = 0. |

### Month Ritual — `/plan/ritual`

| | |
|---|---|
| Purpose | Review divergence, acknowledge emergencies, approve/lock planning period. |
| Hierarchy | Period → divergence/emergencies → preview → confirm lock → locked/correct path. |
| Primary | Preview then approve/lock (preview-confirm required). |
| Secondary | Acknowledge emergencies; correct path when locked; Quick Close only when existing eligibility allows. |
| Components | Existing `RitualWizard` + `Page`/`Section`/`BottomActionBar`/`Dialog` polish. |
| Financial consequence | **NONE** — locks Planning only, never Ledger. |

### Goals list — `/plan/goals`

| | |
|---|---|
| Purpose | Browse goal intentions and create. |
| Hierarchy | TopAppBar → offline → list or empty → create → back to Plan. |
| Primary | Create goal / open detail. |
| Components | `Page`, `GoalCard`, `EmptyState`, create form. |
| Financial consequence | **NONE**. |

### Goal detail / edit / contribute / lifecycle — `/plan/goals/[id]`

| | |
|---|---|
| Purpose | Show intention progress; update allowed fields; record progress; pause/complete/cancel. |
| Hierarchy | Name/status → progress (intention) → target → contribute (progress only) → edit → lifecycle confirms → back. |
| Primary | Contribute progress or save edit. |
| Secondary | Pause / resume / complete / cancel (ConfirmDialog for complete/cancel). |
| Components | `Page`, `Progress`, `Amount` with intention labeling, `AmountField`, `GoalDetailControls` refined, ConfirmDialog. |
| Financial consequence | **NONE** for all Goals mutations. Optional savings context is read-only association only (no product write). |

## 3. Main Flows

Financial effect is mandatory: **NONE** or **REAL MONEY**.

### Plan

| Flow | Entry | Action | Financial effect | Success | Failure |
|---|---|---|---|---|---|
| View current plan | Tab `/plan` | Read pulse/jars | **NONE** | Overview ready | Empty/error/offline; no write |
| Allocate | Jar detail | `upsertJarPlan` fixed/% | **NONE** | Detail refresh; planned label updated | Prior plan kept; lock/offline/validation error |
| Reallocate | Jar detail (Active) | `reallocateJarCapacity` | **NONE** (must assert zero ledger impact) | Detail + plan receipt (plan changed, money unchanged); emergency may create Inbox item | Prior capacities kept; BLOCK/warn/same-jar/note errors |
| Review progress/divergence | Ritual (and overview callout if added) | Read divergence vs facts | **NONE** | Divergence list / Needs Review context | Missing facts → uncertainty, no invented variance |
| Complete month review | Ritual | preview → approve/lock | **NONE** | Period Reviewed/Locked; Plan mutations blocked until correction path | Unresolved divergence/emergencies; prior status kept |

### Goals

| Flow | Entry | Action | Financial effect | Success | Failure |
|---|---|---|---|---|---|
| View goals | `/plan/goals` | `listGoals` | **NONE** | List or empty | Error/offline |
| Create goal | Goals | `createGoal` | **NONE** | Goal detail (preferred) or list refresh | No row created |
| View goal | Goal detail | `getGoal` | **NONE** | Progress + target + status | Not-found → list |
| Update allowed properties | Detail edit | `updateGoal` name/target/date | **NONE** | Detail refresh | Prior values kept |
| Approved funding action | Detail contribute | `contributeToGoal` progress update | **NONE** (not a transfer) | `fundedAmount` intention updated; optional complete if rules auto-complete | Prior progress kept |
| Pause / resume | Detail | status → paused/active | **NONE** | Status refresh | Invalid transition |
| Complete / cancel | Detail | status → completed/cancelled + ConfirmDialog | **NONE** | Terminal view; mutations hidden | Prior status kept |

**REAL MONEY:** No Plan/Goals flow in this batch. If the household needs cash moved toward a goal, route to Money capture/transfer; do not invent a Plan-side ledger write.

## 4. Component Reuse

Prefer existing:

- `shared/patterns/page`, `section`, `section-header`, `bottom-action-bar`
- `empty-state`, `error-state`, `top-app-bar`, `amount`, `amount-field`, `jar-card`, `goal-card`, `dialog`
- `shared/ui/button`, `text`, `status-alert`, `progress`, form fields
- Plan-local: `PlanOfflineBanner`, `EmergencyInboxBanner`, `RitualWizard`, jar/goal forms/actions

Add only when existing cannot express cleanly:

- Plan-effect / intention preview strip (may use StatusAlert + Dialog until a shared FinancialPreview exists)
- ConfirmDialog wrapper only if `Dialog` cannot express complete/cancel/archive/ritual lock cleanly

Do not create speculative Plan/Goal shared abstractions. Do not import `archive/legacy-v1`.

## 5. Implementation Boundary

### Likely to change (UI only)

- `app/[locale]/(product)/plan/page.tsx`
- `app/[locale]/(product)/plan/jars/page.tsx`
- `app/[locale]/(product)/plan/jars/[id]/page.tsx`
- `app/[locale]/(product)/plan/jars/[id]/jar-detail-controls.tsx`
- `app/[locale]/(product)/plan/jars/reallocate-jar-form.tsx`
- `app/[locale]/(product)/plan/jars/create-jar-form.tsx`
- `app/[locale]/(product)/plan/jars/actions.ts` (wiring/receipt only)
- `app/[locale]/(product)/plan/goals/page.tsx`
- `app/[locale]/(product)/plan/goals/create-goal-form.tsx`
- `app/[locale]/(product)/plan/goals/[id]/page.tsx`
- `app/[locale]/(product)/plan/goals/[id]/goal-detail-controls.tsx`
- `app/[locale]/(product)/plan/goals/actions.ts` (wiring/receipt only)
- `app/[locale]/(product)/plan/ritual/page.tsx`
- `app/[locale]/(product)/plan/ritual/ritual-wizard.tsx`
- `messages/en/plan.json`, `messages/vi/plan.json` (and money/plan keys only if shared labels need clarity)

### Routes that must not change

- `/plan`, `/plan/jars`, `/plan/jars/[id]`, `/plan/goals`, `/plan/goals/[id]`, `/plan/ritual`
- Existing `/plan/recurring`, `/plan/calendar` remain; do not redesign in this batch
- Do not add primary tabs or move Goals under Money

### Financial / domain code that must not change

- Ledger write paths, account balances, transaction capture/correction/refund
- Plan command semantics: `reallocateJarCapacity` zero-ledger guard, `upsertJarPlan`, ritual lock = planning only
- Goal command semantics: contribute updates intention progress only
- DB RPCs / schemas unless a separate approved backend task exists
- Inbox ownership of review items (Plan may create emergency review items only via existing reallocate path)

### Untouched modules

- Money product screens, Home redesign, Inbox redesign, Together, Health, Investments, Savings product mutation UI, Recurring/Calendar deep redesign

## 6. Minimal Acceptance Criteria

### UI

- Plan overview ready state renders at 390px and 440px without critical overflow
- Goals list + detail work; create/edit paths usable
- VI and EN main flows render
- Light and dark main surfaces remain usable

### Functional

- Allocate updates jar plan per Planning contract
- Reallocate moves virtual capacity between Active jars per contract
- Create/update Goal main path works
- Contribute updates intention progress; pause/complete/cancel follow GoalStatus rules with confirms for complete/cancel

### Financial safety

- Allocate, reallocate, ritual, create/update/contribute/lifecycle Goals do **not** change account balances
- No fake income/expense/transfer created for semantic planning changes
- Reallocate success asserts `ledgerTransactionsCreated === 0` and `ledgerImpact === 0` (existing guard)
- Goal progress never presented as bank/savings balance
- Any real cash movement is out of scope and must use Money’s transaction mechanism

## 7. Minimal Test Plan

1. Typecheck
2. Lint
3. Focused Plan/Goals unit/application tests already covering zero-ledger reallocate and goal contribute (extend only if UI wiring regresses contracts)
4. Authenticated Playwright main cases:
   - Plan ready state
   - Allocate happy path
   - Reallocate happy path with **BEFORE account/plan capacity → AFTER**; expect plan capacity changed, account balances unchanged
   - Goals overview + detail
   - Create or update Goal happy path
   - Contribute (approved funding = progress): **BEFORE fundedAmount + account balances → AFTER**; expect fundedAmount up, balances unchanged

Do not exhaust edge cosmetics. Skip inventing a real-money Goal funding browser case — none is approved inside Goals.
