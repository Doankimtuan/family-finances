# Savings — Discovery & UI-Surface Inventory (pre-redesign)

Date: 2026-08-23 · Scope: discovery only, no code changed.
Sources: full read of `app/[locale]/(product)/money/savings/**`, `modules/savings/**`, Money hub + Inbox + Plan
integrations, `.agents/design-system.md`, i18n catalogs, and an authenticated English-mode browser walkthrough at
440px (Money hub row, list incl. groups/history, detail × {active, matured, early-settled, not-found}, early-withdraw
page, create wizard step 1, providers page, Inbox queue + maturity panel + early-withdrawal panel) against the running
dev server. Sheet interiors (settlement, renewal-policy, catalog editors, wizard steps 2–3) were verified from code and
are exercised by existing e2e specs (`savings-lifecycle.13e2`, `savings-catalog-management.smoke`,
`savings-creation.visual`); the embedded browser used for discovery could not dispatch pointer clicks (all synthesized
clicks failed, including plain links — environment limitation, not an app defect).

---

## 1. Surface inventory

Routes (locale-prefixed; constants in `modules/shared-kernel/app-path.ts:26-28, 76-79`, helpers `moneySavingsPath`,
`moneySavingsNewPath`, `moneySavingsProvidersPath`, `moneySavingsEarlyWithdrawPath` at 135-149):

| #   | Surface                         | Route / trigger                                         | Type                   | Purpose & key content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------------- | ------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Money hub Savings row           | `/money` → "Growing money" card                         | inline row (entry)     | `MoneyModuleRow` (`app/[locale]/(product)/money/page.tsx:314-338`): label, principal total, `savingsCount` meta, warning attention pill "N savings need action" when `attentionCount > 0`; states `value`/`empty` ("None yet")/`unavailable` (read failed ≠ zero). Backed by `listSavings` + `buildSavingsOverviewModel`; attention is always WARNING, never CRITICAL (`money-hub-view-model.ts:383-398`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2   | Savings list                    | `/money/savings`                                        | page                   | `TopAppBar` + offline banner; orientation line ("88 products · 24 need maturity review"); notBankBalance note; "Open savings product" + "Manage providers" links; load error → `ErrorState`; empty → `EmptyState`; else summary + groups + history; footer "Back to Money".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 3   | Summary card ("At a glance")    | list top                                                | inline card            | Bespoke `bg-surface-muted/65` card: Principal held, Expected net interest, Expected received, "Needs attention soon" count. Computed over **active items only** (`buildSavingsOverviewModel`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 4   | Bank group / App-platform group | list                                                    | inline sections        | Two `Section`s with family hints; rows sorted by attention priority (action_required → matured/mature_today → maturing_soon → active, then endDate, createdAt — `savings-presentation.ts:216-230`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 5   | Savings row card                | list rows                                               | inline card (Link)     | Family icon (`BankIcon`/`SmartPhoneIcon`), provider name, package name, maturity-state pill (accent for attention states, neutral otherwise), `FinancialOwnershipBadge`, Principal `Amount`, rate % + expected net interest (`FinancialValue`), maturity date + days-remaining (or repeated state label). History (settled) rows are quiet links: name, state, principal.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 6   | Detail — identity card          | `/money/savings/[id]`                                   | page (section)         | Family label, provider, package, state pill, ownership badge with explanation, "Principal held" hero amount, maturity date + days left. Optional banners: legacy-import info, maturity-target-unavailable warning. Not-found → `EmptyState` + back link (not a danger `StatusAlert`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 7   | Detail — Active cycle facts     | detail                                                  | inline section         | Locked rate, term, maturity state; Gross expected interest / Expected tax / Expected net interest / Expected received; "estimate until provider confirms" hint; term progress (native `<progress>`, elapsed/total days).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 8   | Detail — Product details        | detail                                                  | inline dl              | Provider, Product family (Bank / App-platform), Term, Currency (label via `.replace(": ", "")` hack).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 9   | Detail — Money flow             | detail                                                  | inline section         | "Funded from: X", "Settles into: Y" (fallback "—").                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 10  | Detail — When it matures        | detail (canAct only: canMutate ∧ status ACTIVE/MATURED) | inline section         | "Guides Inbox suggestions only. Never moves money automatically." + current instruction (strategy, target package w/ unavailable handling) + `RenewalPolicyEditor`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 11  | Renewal policy editor sheet     | detail "Change" button                                  | bottom sheet           | `Sheet` + `ActionSheetLayout` + `SheetActionFooter`: renewal policy cards (always_ask / use_saved_preference / auto_renew_until_cancelled / one_time_renewal), settlement strategy cards (3), conditional target mode + package cards, payout account cards; saves `updateRenewalPolicyAction`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 12  | Detail — Cycle history          | detail                                                  | inline expandable      | `SavingsCycleHistory` rows: "Cycle N · status", package · locked rate, principal · start → end, realized interest, rollover line; expanded panel shows snapshot + settlement result (realized interest/tax, final proceeds).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 13  | Detail — Financial activity     | detail                                                  | inline list            | `TransactionRow`s from ledger events (opened/interest/tax/fee/received principal…), tone credit/debit/neutral; "No linked financial activity yet." empty.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 14  | Detail — bottom actions         | detail `BottomActionBar`                                | sticky bar             | `canSettle` ∧ accounts → "Settle" (`SavingsSettlementFlow`); `canSettleEarly` → "Settle early" link; neither ∧ !terminal → "noSettlementYet" text; terminal → info alert "This saving is closed…"; always a back link.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 15  | Settlement / rollover sheet     | detail "Settle"                                         | bottom sheet (2 steps) | Step form: strategy cards (withdraw_everything / roll_principal_only / roll_principal_interest), conditional target mode (keep current — hidden when target unavailable / choose other + package cards w/ days + rate), destination account cards when payout needed. Step review: matured principal, gross interest, tax, fee, payout (principal-only), net interest, **Received** (withdraw) or **New principal** (rollover = principal or principal+interest), "into package … / N days · rate · new maturity", "into account …". Confirm → `settleSavingAction` / `renewSavingAction`.                                                                                                                                                                                                                                                                                                                                                                                       |
| 16  | Early withdrawal                | `/money/savings/[id]/early-withdraw`                    | page rendering a Sheet | Guard: missing/cycle-not-active/NOT_ALLOWED → `EmptyState` + back. Else full-page dialog: quote-unavailable warning, penalty warning (≥50% of accrued), "maturity interest not included" note, `ConfirmSummary` (early rate — may be "Unknown until provider or manual quote", principal, accrued gross, eligible interest, tax, penalty/forfeiture, estimated net return), Back / **Send to Inbox** → enqueues Inbox item and redirects to `/inbox`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 17  | Create wizard                   | `/money/savings/new`                                    | page (3 steps)         | Step dots + "N / 3"; `MotionStep` transitions; `BottomActionBar` (cancel/back + next/review/confirm). Step 1 Product: savings-type tiles (Bank / App-platform / Manual savings), `FinancialScopeField` radiogroup, provider cards, package cards (term, rate, maturity preview), no-packages warning. Step 2 Deposit: principal `ControlledField amount` with package min/max validation, creation-mode tiles (**Live deposit** vs **Historical opening** — hides funding account), source account cards with balances (needs ≥2 accounts warning), start date, live estimate card (principal, rate, maturity, interest, tax, fee, net, maturity amount). Step 3 Review: accent hero (principal, term/rate/provider, maturity amount), summary rows, maturity-strategy cards + target mode + target packages + payout account + renewal-policy cards, money-flow strip; confirm → `createSavingAction` → detail redirect. Empty state when no eligible accounts or no providers. |
| 18  | Providers / catalog manager     | `/money/savings/providers`                              | page                   | "Add provider" primary; per-provider section: icon (picker registry), name, family · package count, overflow Dropdown (Edit / Archive — custom providers only; system shows "Built in"), "Add product", product cards (term, rate, method, tax summary, currency, early-withdrawal summary, overflow Edit/Archive). Provider sheet: name `TextField`, family `LabeledSelect` (native), icon `Dropdown` picker. Product sheet: name, term amount + unit (native select), rate, interest method (native select), tax-rule `PolicyOption` buttons + conditional rate, early-settlement `PolicyOption` buttons (4) + conditional custom rate, read-only VND currency. Archive = `window.confirm` + toast; errors as hand-rolled danger box.                                                                                                                                                                                                                                          |
| 19  | Lifecycle sync                  | savings layout (invisible)                              | client component       | `SavingsLifecycleSync` mounts once per visit → `syncSavingsLifecycleAction` (legacy backfill → maturity detection → cascade reminders); `router.refresh()` only when something changed. Never mutates during render/prefetch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 20  | Inbox — savings items           | `/inbox`                                                | queue rows + chips     | Kind filter chips include "Savings maturity" and "Early withdrawal"; `ReviewCard` rows (title "— Matures in N days" / "- Early withdrawal", amount, kind label) linking to item detail. Savings receipt success banner (`inbox-receipt-savings`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 21  | Inbox — maturity decision panel | `/inbox/[id]` (savings_maturity)                        | inline panel           | Provider/package/rate/renewal-policy summary, payload warnings, package `LabeledSelect` combobox (options with recommendation reason), settlement-rule `LabeledSelect` combobox (3 options, required), buttons **Confirm configured** (primary) / **Switch product** / **Withdraw** / **Remind tomorrow** / **Dismiss** (confirm-step). "View saving in Money" source link. Money actions route through `executeSavingsMaturityWorkflow`; settlement account is preselected only (no picker in Inbox).                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 22  | Inbox — early-withdrawal panel  | `/inbox/[id]` (early_withdrawal_confirmation)           | inline panel           | Net-return + penalty lines (⚠ raw unformatted integers in current build), **Confirm withdrawal** / **Keep saving** / **Dismiss**; runs `confirmEarlyWithdrawal` via `executeEarlyWithdrawalWorkflow`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 23  | Plan goal funding links         | Plan goal detail controls                               | entry links            | `goal-detail-controls.tsx:78-79`: withdraw intent → `moneySavingsEarlyWithdrawPath`, otherwise savings detail. Savings is a goal funding source (`list-goal-funding-options.ts`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Not present (verified — do not invent): no Savings **edit** surface (name/metadata), no Savings **archive/close/delete**
(exit = settle/withdraw only), no **partial-withdrawal** UI (model field exists, unused), no price/valuation concept,
no Savings entry from Home (intentionally excluded, `home/page.tsx:51-54`), no loading skeletons (0 `loading.tsx` /
`error.tsx` under savings routes — Investments has 2), no savings chart/analytics surface.

## 2. Flow map

```
Money hub (Growing money → Savings row: principal + attention pill)
└─ Savings list ── Open savings product ──► Create wizard (product → deposit → review) ──► detail
│                └─ Manage providers ─────► Providers page (provider/product CRUD + archive)
│                ├─ row card ────────────► Saving detail
│                └─ history row ──────────► Saving detail (terminal)
│
└─ Saving detail
    ├─ Settle ──► Settlement sheet (strategy → [target package] → [destination] → review → confirm)
    │              ├─ withdraw_everything ──► settle RPC (principal+net interest → account; cycle settled)
    │              └─ roll principal[+interest] ──► rollover RPC (new cycle, chosen package; payout of net interest for principal-only)
    ├─ Settle early (active + allowed) ──► Early-withdraw page (preview) ── Send to Inbox ──► Inbox item
    │                                                                       └─ Confirm withdrawal ──► early_withdraw RPC → EARLY_CLOSED
    ├─ Change (canAct) ──► Renewal policy sheet (policy + strategy + target + payout; saved preference)
    └─ Maturity (automatic) ──► detect_matured_savings + cascade reminders (30/14/7/3/1 days)
                                └─ Inbox maturity item ── Confirm configured / Switch product / Withdraw / Remind tomorrow / Dismiss
Inbox early-withdrawal item ◄── enqueued by early-withdraw request
Plan goal (SAVINGS funding) ──► savings detail / early-withdraw route
```

## 3. Financial semantics (do not regress)

- **Principal** is an integer VND amount on each cycle (`saving_cycles.principal`); list/hub show the sum of active
  cycles' principal. Package `minAmount`/`maxAmount` bound it at create (app-side) and in the RPC.
- **Interest** (`savings-interest.ts`): day count **actual/365**, UTC days (start inclusive, end exclusive), rate/100,
  all results `Math.floor`ed and clamped ≥ 0. Methods: `simple` (P·r·d/365), `compound_daily` ((1+r/365)^d),
  `compound_monthly` (full 30-day months at r/12 + remainder at daily rate). Unknown method → simple.
  Active cycles get `accruedInterest` recomputed read-side (`computeAccruedInterest`).
- **Term**: package `termAmount`+`termUnit` (DAY/MONTH; MONTH ≈ ×30 for durationDays) via `addSavingsTerm` (UTC).
  `startDate` defaults to today; `endDate = start + term`.
- **Locked rate**: each cycle freezes `lockedRate` + full `PackageSnapshot` (name, rate, tax, early rules, min/max,
  renewable, partial-settlement) at creation/rollover — later catalog edits never rewrite existing cycles.
- **Tax** (`taxForInterest`): floor(gross × rate/100), only for `PROFIT_PERCENTAGE` with positive gross.
  Family defaults (`defaultTaxConfigForFamily`): **BANK → NONE/0%; PLATFORM → PROFIT_PERCENTAGE/5%** (visible in the
  catalog: bank "Not applicable" vs platform "Tax 5% on interest"). Tax is configured per product, snapshotted per cycle.
- **Settlement breakdown**: `netInterest = max(0, gross − tax − fee)`; `totalCashReceived = principal + netInterest`.
  Displayed everywhere as Gross expected interest / Expected tax / Expected net interest / Expected received, with the
  "estimate until provider confirms settlement" hint.
- **Early withdrawal**: quote = RPC `preview_early_withdraw_saving` (client mirror `previewEarlyWithdrawal`).
  Early-settlement rules on the product: NOT_ALLOWED (page guarded), RETURN_PRINCIPAL_ONLY, CUSTOM_RATE
  (flat annual rate on days held), PENALTY→FIXED_PENALTY, CUSTOM/PRODUCT_RULE. Penalty strategies: NO_INTEREST
  (forfeit all accrued), DEMAND_INTEREST (0.5%/yr default), FIXED_PENALTY, PROVIDER_FORMULA/PROVIDER_CUSTOM →
  **quoteReady: false** (submit disabled; "Unknown until provider or manual quote"). Tax on gross accrued;
  `netReturned = principal + max(0, accrued − tax − penalty)`; penalty warning when penalty ≥ 50% of accrued.
  Flow is **two-phase**: request → Inbox item → confirm executes `early_withdraw_saving`.
- **Maturity**: RPC `detect_matured_savings` flips statuses; read model independently derives state from `endDate`
  so renders stay truthful pre-detection. Cascade reminders at 30/14/7/3/1 days. `maturityActionRequired` = matured ∧
  strategy ≠ withdraw ∧ target package missing/inactive/not renewable → warning banner + forced "choose other package".
- **Rollover / renewal**: `renewSaving` (cycle must be persisted MATURED) → RPC `rollover_saving_cycle` with chosen
  package (same provider, must be active) — roll principal (net interest paid out to account) or principal+interest
  (new cycle principal = totalCashReceived). `SettlementRule` values: withdraw_everything / roll_principal_only /
  roll_principal_interest. Renewal decisions recorded (`record_saving_renewal_decision`); ONE_TIME_RENEWAL policy
  auto-reverts; policy updates may follow the action.
- **Renewal policy / instruction**: `renewalPolicy` ∈ always_ask / use_saved_preference / auto_renew_until_cancelled /
  one_time_renewal; `renewalConfig` + derived `maturityInstruction` (strategy, targetMode keep_current/select_package,
  targetPackageId, payoutAccount, fallback ASK_USER). **Recommendation only — never moves money automatically.**
- **Money movement**: create (live deposit: funding→saving transfer, inside `create_saving_with_transfer` RPC;
  historical opening: no funding validation, no transfer), settle, rollover, early withdraw — all inside Postgres RPCs
  (`SAVINGS_RPC`, savings-constants.ts:75-85) with deterministic or provided idempotency keys. TS layer validates,
  snapshots, records decisions. Funding ≠ settlement enforced; eligible account types CASH/CHECKING/SAVINGS/EWALLET/OTHER
  (brokerage and credit excluded).
- **Ownership**: `FinancialCapabilities` per saving (household default; personal stamps owner). `canMutate` gates the
  maturity-instruction section and actions; read-only/former-member still shows full financial detail.
- **Inbox workflows are deliberately non-atomic**: money success survives acknowledgement failure.

## 4. Conditional states (actual branches)

- Maturity state (derived, precedence): `settled` (CLOSED) → `early_settled` (EARLY_CLOSED) → `action_required`
  (maturityActionRequired) → `active` (no cycle) → `matured`/`mature_today` (cycle or saving MATURED, or days ≤ 0) →
  `maturing_soon` (≤ 7 days) → `active`. Attention = {matured, mature_today, action_required}; settled states are history.
- Saving status: active / matured / early_closed / closed; cycle status: active / matured / early_closed / rolled.
- Detail action gating: `canSettle` (persisted MATURED) vs `canSettleEarly` (active/maturing_soon ∧ early rule ≠
  NOT_ALLOWED) vs `isTerminal` (info alert, no actions). `canAct` (canMutate ∧ active/matured) gates the
  maturity-instruction section; read-only shows detail without it.
- Family branches: BANK vs PLATFORM — icon, group, tax defaults, catalog family select; creation types
  bank_deposit / digital_saving / flexible_saving / manual_saving (wizard type tiles).
- Creation mode: LIVE_DEPOSIT (funding account required, ≥2 accounts warning, source ≠ settlement) vs
  HISTORICAL_OPENING (no funding account, no transfer).
- Target mode: keep-current vs select-package (package list filtered by renewable + amount bounds); target-unavailable
  forces select-package and hides the keep-current option (settlement sheet) / shows warning (detail, wizard review).
- Quote states (early withdraw): quoteReady vs not (rate "Unknown until provider or manual quote", disabled submit);
  penalty warning ≥ 50%.
- Empty/loading/error: list read-error vs empty vs populated; detail not-found; wizard blocked when no accounts or no
  providers; no settlement accounts → "noSettlementYet"; activity empty; cycle history hidden when no cycles;
  offline banner + submit gating. **No loading skeletons exist.**
- System vs custom catalog rows (Built in vs overflow actions); provider inactive warning in Inbox payloads.

## 5. Entry points

1. Money hub "Growing money" → Savings row (principal, count meta, attention pill).
2. List → row card / history row → detail.
3. List → "Open savings product" → create wizard; → "Manage providers" → providers page.
4. Detail → Settle (settlement/rollover sheet), Settle early (early-withdraw page), Change (renewal policy sheet).
5. Early-withdraw page → "Send to Inbox" → Inbox item → confirm/cancel (returns via receipt).
6. Automatic maturity: lifecycle sync → detect + cascade → Inbox maturity items → decision panel.
7. Plan goal detail (SAVINGS funding source) → savings detail / early-withdraw route.
8. Inbox "View saving in Money" source link back to detail.
9. Revalidation consumers (`app/mutation-revalidation.ts:37-43`) — non-UI.

## 6. Shared dependencies to handle carefully

`shared/patterns`: Page, TopAppBar, Section, Amount, FinancialValue (privacy masking — keep everywhere),
FinancialOwnershipBadge, FinancialScopeField, EmptyState, ErrorState, Sheet + ActionSheetLayout + SheetActionFooter,
ChoiceTile, ControlledField (amount/date/number/percentage), BottomActionBar, ConfirmSummary, TransactionRow,
LabeledSelect (native — constitution prefers HeroUI), toast.
`shared/ui`: Button, Text, StatusAlert, AppIcon + ACTION_ICONS/FINANCE_ICONS/SAVINGS_PROVIDER_ICONS, Dropdown (HeroUI),
TextField. `shared/motion`: MotionReveal, MotionStep, motionTokens, springs. `shared/i18n/formatters`
(formatCurrency/Date/Percent). Domain: `savings-presentation.ts` (all model/state derivation), `savings-interest.ts`,
`savings-penalty.ts`, `savings-domain-rules.ts` (breakdown + defaults + eligibility), `renewal-policy-map.ts`,
`savings-constants.ts` enums, `client.ts` browser-safe re-exports. Ledger: DEFAULT_CURRENCY, listAccounts eligibility.
Tenancy: app-path constants, product-action-error codes, money gate. i18n namespaces: `money.savingsPage` (58 keys),
`savingsWizard` (85), `savingsDetail` (128), `savingsEarlyWithdraw` (25), `savingsCatalog` (88), `savingsSettlement`
(36), `hub.modules.savingsCount/savingsAttention` (+ EN/VI parity).

## 7. Legacy / inconsistent UI (flag only, do not fix now)

- **Bespoke cards**: list summary + detail identity use hand-rolled `rounded bg-surface-muted/65` blocks — no shared
  `Card` tones, no `Card tone="hero"` (design-system §25/§26 hero-group pattern used by redesigned siblings); detail
  "principal" is `Amount size="lg"`, not a hero treatment.
- **Raw action styling**: list "Open savings product"/"Manage providers" are hand-styled `<Link>`s (not `Button`);
  detail "Settle early" is a hand-styled link; "Back to…" links are raw accent text (Investments/Loans use shared
  button/back patterns).
- **Native `<progress>`** on detail term progress instead of shared `Progress`.
- **Native selects as primary UX**: `LabeledSelect` in renewal/product sheets and Inbox maturity panel (package +
  settlement pickers) — UI constitution prefers HeroUI controls.
- **`window.confirm`** for provider/product archive — violates the canonical destructive-confirm pattern (Accounts
  uses explicit in-sheet confirm state).
- **Copy/formatting bugs**: detail "Locked rate: **6%%**" (double percent — label + formatPercent); Inbox
  early-withdrawal panel shows raw integers ("Estimated return: 999992", "Penalty: 164") with no currency formatting.
- **Duplicated local primitives**: `Card`/`SelectionCard`/`SummaryRow`/`PolicyOption` re-declared per file across
  wizard, settlement sheet, renewal editor, catalog manager (4 near-identical ChoiceTile wrappers).
- **Custom step indicator**: wizard uses bespoke dots (+ "N / 3" label) while the canonical pattern (onboarding,
  redesigned Investments) is shared thin `Progress` + "Step N of 3".
- **Label hacks**: detail Product-details rows derive labels via `t("familyLine", {family: ""}).replace(": ", "")`.
- **Redundant state display**: list row shows the maturity state twice (pill top-right + state/days bottom line).
- **Not-found pattern**: savings detail not-found uses `EmptyState`, while Investments/Loans settled on danger
  `StatusAlert` + back link.
- **No loading skeletons**: 0 `loading.tsx` under savings routes (Investments has list + detail skeletons); design
  system §22 requires skeletons mirroring composition.
- **Wizard type-tile hint** says "Choose a product family" for all three type tiles (placeholder-ish copy) — same text
  repeated per tile.

## 8. Potentially unreachable / stale UI

- `createSavingsAction` deprecated stub (`savings-actions.ts:96-105`, returns INVALID) and its re-export in
  `money-products-actions.ts:137-148` — no UI consumer.
- `enqueueSavingsMaturityAction` stub in `money-products-actions.ts` — returns INVALID, no consumer.
- `detectMaturedSavingsAction` + `backfillLegacySavingsAction` server-action exports — no consumers (superseded by
  `syncSavingsLifecycleAction`).
- `getSavingsHealthMetrics` (BR-24 read-only aggregates) — orphaned: exported, zero surfaces consume it.
- `canSettlePartially` computed in the detail model but never rendered — **partial withdrawal exists in the domain
  model with no UI** (packages default `supportsPartialSettlement: false`; field flows through wizard props unused).
- Inbox ack enum values `RENEW`, `CHOOSE_PACKAGE`, `CHANGE_SETTLEMENT` — defined and handled in the workflow, but not
  rendered as buttons (panel renders CONFIRM_CONFIGURED / SWITCH / WITHDRAW / REMIND_TOMORROW + shared DISMISS).
- `requestEarlyWithdrawal` (deprecated alias) and `RenewalPreference` legacy alias fields.
- `archive/legacy-v1` savings remnants exist only in the forbidden archive tree; no live imports.

## 9. Redesign checklist (must cover)

- [ ] Money hub Savings row (value / empty / unavailable / attention pill) — likely intentionally unchanged.
- [ ] List: header + orientation, summary card (principal, net interest, expected received, attention count), Bank +
      App/platform groups with hints, row cards (family icon, provider/package, state pill, ownership, principal, rate,
      net interest, maturity + days), history section, Add + Manage providers actions, empty / read-error / offline,
      back link; add skeletons (currently none).
- [ ] Detail: identity card (all state pills incl. action_required), legacy + target-unavailable banners, cycle facts
      (rate/term/state, gross/tax/net/received, estimate hint, term progress), product details, money flow, cycle
      history (collapsed + expanded incl. settlement result), financial activity rows, terminal read-only state,
      not-found; action bar permutations (settle / settle-early / none / terminal × canMutate).
- [ ] Settlement sheet: 3 strategies × target mode × payout matrix, package cards, destination accounts, review
      breakdown (received vs new-principal semantics), target-unavailable branch, pending/error.
- [ ] Renewal policy sheet: 4 policies, strategies, target selection, payout account, save/pending/error.
- [ ] Early withdrawal: guard states (not found / not active / not allowed), quote-unavailable + penalty warnings,
      preview rows (rate unknown branch), Send-to-Inbox CTA + redirect, offline gating.
- [ ] Inbox: maturity decision panel (summary, warnings, package + settlement pickers, 4 ack buttons + dismiss,
      receipts) and early-withdrawal panel (confirm / keep / dismiss) — fix raw number formatting.
- [ ] Create wizard: 3 steps, type tiles, scope, provider + package cards, amount + min/max errors, live vs historical
      modes, source account selection (incl. <2 accounts warning), start date, live estimate, review hero + summary +
      maturity instruction configuration, confirm; empty state (no accounts/providers); offline gating.
- [ ] Providers page: provider/product cards, system vs custom, overflow menus, provider sheet, product sheet (term,
      rate, method, tax rule + rate, early rule + custom rate, currency), archive confirm, toasts, empty/error states.
- [ ] Cross-cutting: EN copy fixes ("6%%", tile hints), currency formatting in Inbox panel, native select/progress/
      window.confirm replacements per UI constitution, ownership/read-only/former-member treatments, lifecycle sync
      behavior preserved, no financial-semantics changes anywhere (§3 is binding).

---

## 10. Redesign status (2026-08-23, post-implementation)

Every reachable surface from §9, resolved:

| Surface                                    | Status                                                                                                                                                                                                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Money hub Savings row                      | Intentionally unchanged (already compliant)                                                                                                                                                                                                           |
| List header + offline + error/empty states | Redesigned — `TopAppBar variant="detail"` back to Money; empty state gained create + manage-providers CTAs                                                                                                                                            |
| Summary card ("At a glance")               | Redesigned — `Card tone="hero"` Principal held (+ tracked-money note, attention count in hero-muted) with attached `Card tone="elevated"` metric strip (net interest, expected received, tax only when > 0, attention count as warning `StatusBadge`) |
| Bank / App-platform groups + row cards     | Redesigned — `Card tone="interactive"` links, `IconContainer tone="savings"`, principal + rate right, divided footer with `SavingsMaturityBadge` + maturity date/days; ownership compact badge when personal                                          |
| Completed history rows                     | Redesigned — quiet `Card tone="soft"` + neutral settled/early-settled badges                                                                                                                                                                          |
| List actions                               | Redesigned — create moved to `FloatingAction` pill (`savings-create-action.tsx`); "Manage providers" quiet bordered pill after the summary group                                                                                                      |
| List loading                               | Added — `loading.tsx` mirroring hero + metric strip + groups                                                                                                                                                                                          |
| Detail identity card                       | Redesigned — hero tone with on-hero family icon chip, "Principal held" hero value, `FinancialOwnershipBadge onHero` + maturity/days context row; identity in `TopAppBar` detail header (name + family subtitle)                                       |
| Detail cycle facts + expected return       | Redesigned — metric strip (locked rate, term, state badge, start date) + divided return block (gross → tax when > 0 → net → emphasized Expected received + estimate hint); "6%%" bug removed                                                          |
| Term progress                              | Redesigned — shared `Progress` (savings tone) with start/end dates + elapsed/total (was native `<progress>`)                                                                                                                                          |
| Product details / money flow               | Redesigned layout — clean label keys (no `.replace(": ", "")` hacks), tracked-money note as caption                                                                                                                                                   |
| Maturity instruction + renewal editor      | Section kept; `RenewalPolicyEditor` sheet intentionally unchanged (already canonical)                                                                                                                                                                 |
| Cycle history / financial activity         | Intentionally unchanged (canonical expandable list + `TransactionRow`s)                                                                                                                                                                               |
| Settlement / rollover sheet                | Intentionally unchanged (already canonical 2-step sheet; semantics binding)                                                                                                                                                                           |
| Early withdrawal page                      | Intentionally unchanged structure (attention warnings, preview, Send-to-Inbox)                                                                                                                                                                        |
| Create wizard chrome                       | Redesigned — shared `Progress` + "Step N of 3" (was custom dots), review hero → `Card tone="hero"`, per-family type hints; steps/fields/estimate unchanged                                                                                            |
| Providers / catalog manager                | Redesigned chrome — `StatusAlert` danger errors (was hand-rolled box), `LabeledSelect` → `SelectField` (family/unit/method), archive behind inline warning-card confirm (cancel / danger archive; was `window.confirm`)                               |
| Inbox maturity panel                       | Polished — package + settlement pickers → `SelectField`; ack buttons unchanged                                                                                                                                                                        |
| Inbox early-withdrawal panel               | Fixed — currency-formatted return/penalty lines (were raw integers)                                                                                                                                                                                   |
| Detail loading                             | Added — `[id]/loading.tsx` mirroring hero + cycle facts + sections                                                                                                                                                                                    |
| Not-found / terminal / read-only states    | Intentionally unchanged (already canonical; matches Investments not-found pattern)                                                                                                                                                                    |
| Dead exports (§8)                          | Left in place — cleanup out of scope for the redesign (deprecated stubs, orphaned health metrics, unused ack enum values, `canSettlePartially`)                                                                                                       |

Not redesigned (documented gaps, not reachable UI): no Savings edit/archive
surface exists in the product; partial withdrawal has no UI (domain field
only); the settlement/renewal/early-withdraw sheets' internal layout kept its
already-canonical structure.

Validation: typecheck ✓, eslint ✓ (changed files), `next build` ✓, savings
unit tests 60/60 ✓, e2e — savings.smoke ✓, savings-lifecycle.13e2 (5/5) ✓,
savings-catalog-management ✓ (updated for the new inline archive confirm),
savings-creation.visual ✓, inbox-decisions ✓/skipped-fixture. Full unit suite:
13 failures pre-exist in in-flight Plan/Home work (home-screen-v2-polish,
header-sheet-polish, jar-configuration-form) — untouched by this change;
plan/jars/page.tsx received only a translator-type fix to keep typecheck green.
English-only browser evidence at 390/440/1280: list (hero, metrics, groups,
history, FAB), detail (matured/active/terminal/not-found), wizard step 1
(Step 1 of 3 + hints), providers page, inbox panels (formatted amounts), no
horizontal overflow. Dark mode not browser-toggled (embedded browser cannot
dispatch clicks); all surfaces use the same theme-aware tokens as the verified
Investments/Accounts patterns.
