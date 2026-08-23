# SAVINGS 13A — Domain / Accounting / UX Audit

Date: 2026-08-22  
Scope: complete Savings module, including domain rules, RPCs/migrations, UI flows, ledger integration, ownership, privacy, i18n, tests, and responsive evidence.

## Final verdict

`SAVINGS AUDIT COMPLETE`

The audit is complete. Savings is not reference-ready: the findings below include accounting, mutation-authority, lifecycle, and core UX blockers. No fixes were implemented.

Counts:

- P0: 7
- P1: 7
- P2: 2

## Findings

### P0-01 — Latest early-withdrawal migration is malformed

- Problem: The latest authoritative `early_withdraw_saving` migration contains a corrupted SQL `VALUES` tuple. The deployed function contract cannot be trusted until this migration is corrected and applied.
- Affected flow/files: `supabase/migrations/20260815120000_savings_neutral_early_withdraw.sql:151-160`.
- Expected invariant: The authoritative RPC migration must apply cleanly and expose one valid early-settlement implementation.
- Recommended fix: Replace the malformed tuple with a valid migration, apply it in a disposable database, and add an RPC smoke test before deployment.

### P0-02 — Early settlement trusts client-supplied accounting amounts

- Problem: The application sends principal, accrued interest, eligible interest, penalty, and net payout from the client preview. The RPC validates only that principal is positive, then persists the supplied values. A caller can alter or replay the payout inputs without server-side recomputation or quote validation.
- Affected flow/files: `modules/savings/application/commands/early-withdraw.ts:154-166`; `supabase/migrations/20260815120000_savings_neutral_early_withdraw.sql:84-89,129-145`.
- Expected invariant: The server must derive or revalidate all monetary amounts from the locked savings cycle, product snapshot, and provider-confirmed settlement terms. The client should select the destination and confirm the operation, not author accounting values.
- Recommended fix: Move the calculation/revalidation into the authoritative RPC or a durable server-side quote, and accept only immutable identifiers plus the destination account from the client.

### P0-03 — Explicit early-withdrawal rate is not used

- Problem: `earlySettlementRatePercent` and the early-settlement rule are persisted and loaded, but the penalty/interest calculator uses only `penaltyRules`. The configured explicit early rate therefore does not determine the early payout.
- Affected flow/files: `modules/savings/application/savings-domain-rules.ts`; `modules/savings/application/savings-penalty.ts:150-219`; product snapshot/catalog and mapper usages of `earlySettlementRatePercent`.
- Expected invariant: The configured early-withdrawal rate must drive recalculated eligible interest and the resulting payout, or settlement must be unavailable when the provider rate is missing.
- Recommended fix: Define one authoritative early-settlement calculation that consumes the configured rate/rule and use it in both preview and server settlement.

### P0-04 — Authoritative maturity calculation always uses simple interest

- Problem: The maturity lifecycle RPC calls `savings_simple_interest` regardless of the package’s configured calculation method. The application layer supports `simple`, `compound_daily`, and `compound_monthly`, so the lifecycle state and proceeds can disagree with the product contract.
- Affected flow/files: `supabase/migrations/20260805030000_savings_renewal_policy.sql:214-219`; `modules/savings/application/savings-interest.ts:90-128`; `modules/savings/application/queries/list-savings.ts:148-160`.
- Expected invariant: Maturity proceeds must use the configured product method consistently in preview, lifecycle detection, settlement, and rollover.
- Recommended fix: Route the authoritative RPC through the same method-aware calculation contract, with regression coverage for each supported method.

### P0-05 — Rollover initializes interest before loading the cycle

- Problem: The rollover RPC initializes `v_interest` from `v_cycle.accrued_interest` before selecting the cycle into `v_cycle`. The value remains zero, so principal-plus-interest rollover loses the matured interest and derives incorrect tax/net interest/new principal.
- Affected flow/files: `supabase/migrations/20260815104814_savings_maturity_rollover.sql:197,213-215,245-249,283-289`.
- Expected invariant: `new principal = matured principal + eligible net interest` when that rollover mode is selected; the matured position and its financial history must remain immutable.
- Recommended fix: Load and lock the selected cycle before deriving interest, then persist the realized interest/tax history and calculate the new principal from those authoritative values.

### P0-06 — Tax and penalty are not consistently posted or deducted

- Problem: Maturity settlement calculates `principal + interest` without tax or penalty, and its result hardcodes `penaltyApplied: 0`. Early settlement stores a penalty amount but writes no penalty Expense and no tax transaction. If a charge is withheld from payout, the product account can retain an unrepresented balance; if tax applies, cash proceeds are overstated.
- Affected flow/files: `supabase/migrations/20260815110000_savings_neutral_settlement.sql:82-117,124-134`; `supabase/migrations/20260815120000_savings_neutral_early_withdraw.sql:95-145`.
- Expected invariant: `cash proceeds = principal + gross interest - actual tax - actual penalty/fee`; principal movement is neutral, interest is Income, and provider-confirmed tax/penalty is Expense. No synthetic Expense is created when no charge was actually applied.
- Recommended fix: Make tax/penalty policy and provider confirmation explicit in the authoritative settlement contract, post corresponding Expense entries when actually withheld/charged, and return gross/net/charge breakdowns consistently.

### P0-07 — Server account eligibility is broader than the domain contract

- Problem: The app-level allowlist excludes brokerage/investment accounts, but the final create, settlement, and rollover RPCs only exclude `credit_card` and `savings_product`. Direct RPC calls can therefore use a brokerage/investment container. The RPCs also do not reject identical funding and settlement accounts.
- Affected flow/files: `modules/savings/application/savings-domain-rules.ts`; `supabase/migrations/20260815104814_savings_maturity_rollover.sql:98-107`; `supabase/migrations/20260815110000_savings_neutral_settlement.sql:68-75`.
- Expected invariant: Source and destination must be owned, active, distinct, eligible liquid accounts only; credit cards, liabilities/debt, investment positions, savings-product accounts, and other non-liquid objects are invalid.
- Recommended fix: Enforce the same authoritative allowlist and archived/state checks in every financial RPC, including a funding-account/destination-account inequality guard.

### P1-01 — No historical/opening mode; every create is a live transfer

- Problem: The create schema always requires a funding account and the create command/RPC always writes source-account and savings-product transfer rows. There is no supported opening or historical mode for a pre-existing deposit, so importing history creates a fake source movement and synthetic transactions.
- Affected flow/files: `modules/savings/application/commands/create-saving.schema.ts:29-57`; `modules/savings/application/commands/create-saving.ts:189-245`; create RPC in `supabase/migrations/20260815104814_savings_maturity_rollover.sql`.
- Expected invariant: Historical/opening records create the savings position without fake source-account movement or synthetic transactions; live deposits require an eligible source account and create a neutral transfer.
- Recommended fix: Add the smallest explicit opening/import mode to the existing Savings contract, or a clearly separate import path, with no ledger movement for historical records.

### P1-02 — Create preview shows gross maturity proceeds despite tax policy

- Problem: The create wizard estimates maturity as principal plus interest and does not show tax, although the selected package carries `taxRule` and `taxRatePercent`. Detail/overview use tax-aware settlement breakdowns, so the same deposit can show conflicting proceeds across screens.
- Affected flow/files: `app/[locale]/(product)/money/savings/new/page.tsx:50-59`; `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx:277-288,775-789`.
- Expected invariant: Every preview must label gross/net values and apply the selected tax policy consistently with the settlement contract.
- Recommended fix: Reuse the shared Savings breakdown/presentation calculation and show principal, gross interest, tax, penalty, and expected net maturity proceeds with explicit labels.

### P1-03 — Detail maturity actions can precede lifecycle synchronization

- Problem: Presentation derives a matured state from the end date even while the persisted cycle status is still active. The overview mounts `SavingsLifecycleSync`, but the detail page does not. A deep link can therefore show a settle action that the RPC rejects because the cycle is not yet persisted as `matured`.
- Affected flow/files: `modules/savings/application/savings-presentation.ts:101-109`; `app/[locale]/(product)/money/savings/[id]/page.tsx:63-100`; overview sync at `app/[locale]/(product)/money/savings/page.tsx:212-213`.
- Expected invariant: Read-model maturity state and action availability must agree with the server’s settlement precondition, including matured, matures-today, action-required, and already-settled states.
- Recommended fix: Share lifecycle transition/read-model logic between overview and detail, or show a pending-sync state until the persisted cycle is actionable.

### P1-04 — Savings activity classification is lost for settlement and early withdrawal

- Problem: Placement transactions carry `savings_event_kind`, but the latest maturity-settlement and early-withdrawal RPCs do not. `listSavingsFinancialActivities` filters out rows without that marker, so settlement/early activity disappears from Savings history and can fall back to generic transfer/income presentation elsewhere.
- Affected flow/files: create marker in `supabase/migrations/20260815104814_savings_maturity_rollover.sql`; missing markers in `supabase/migrations/20260815110000_savings_neutral_settlement.sql:87-117` and `supabase/migrations/20260815120000_savings_neutral_early_withdraw.sql:95-127`; `modules/savings/application/queries/list-savings.ts:349-419`; `modules/ledger/application/financial-semantics.ts:314-384`.
- Expected invariant: Every Savings financial event remains linked and classified: principal movement neutral, interest Income, and tax/penalty Expense, across Savings, Transactions, and Home.
- Recommended fix: Add stable Savings event markers and linked IDs to every mutation path, then make Savings activity and global activity consume the same classification contract.

### P1-05 — Financial privacy is bypassed on core Savings screens

- Problem: Shared `Amount`/`ConfirmSummary` components use `FinancialValue`, but several Savings screens render raw `formatCurrency`/text values. The overview, create estimate/review, and settlement review expose balances and proceeds when financial privacy is enabled.
- Affected flow/files: `shared/patterns/amount.tsx`; `shared/patterns/confirm-summary.tsx`; `app/[locale]/(product)/money/savings/page.tsx:169-175,277-285,294-300,353-360`; `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx:658-660,696-722,759-789`; `app/[locale]/(product)/money/savings/[id]/settlement-flow.tsx:320-355`.
- Expected invariant: Every financial value, including previews, available balances, proceeds, tax, penalty, and account amounts, is rendered through `FinancialValue`; account labels may remain visible.
- Recommended fix: Replace raw monetary rendering with the shared privacy-aware amount/value primitives and add a screen-level privacy regression test.

### P1-06 — Account pickers expose ineligible accounts and fail later

- Problem: Create and settlement account lists filter out only `SAVINGS_PRODUCT`, while `listAccounts()` includes the broader liquid-account set, including `BROKERAGE`. The app may let a user select an invalid candidate and reject it only after submission; the server currently has a wider gap as noted in P0-07.
- Affected flow/files: `app/[locale]/(product)/money/savings/new/page.tsx:37-40`; `app/[locale]/(product)/money/savings/[id]/page.tsx:96-125`; `modules/ledger/application/queries/list-accounts.ts:33-35,92-100`.
- Expected invariant: Source/destination controls show only the same eligible account set enforced server-side, with clear empty and unavailable states.
- Recommended fix: Use the existing Savings eligibility predicate in the query/view-model and enforce the identical predicate in every RPC.

### P1-07 — Configured create flow cannot select a Savings package in E2E

- Problem: The authenticated visual creation test cannot find a `[data-testid^="savings-package-"]` element because the selected provider catalog has no matching package. The page displays “Nhà cung cấp này chưa có gói phù hợp.” and leaves Next disabled. This blocks the create flow from reaching the responsive screenshot assertions.
- Affected flow/files: `tests/e2e/savings-creation.visual.spec.ts:49`; test artifact `test-results/savings-creation.visual-Sa-3dbb2-tays-focused-and-responsive-chromium/error-context.md`; provider/package selection in `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx`.
- Expected invariant: The canonical seeded provider catalog must expose at least one valid BANK and PLATFORM package for the configured create flow, and the flow must be testable at 390, 440, 768, and 1280px.
- Recommended fix: Make the test fixture/catalog deterministic and valid, or correct the provider selection/seed contract if the current catalog is canonical. Do not treat a missing package as a user-facing dead end.

### P2-01 — Action flows use local selection-card controls instead of shared choice primitives

- Problem: Settlement and renewal define repeated raw `<button>` selection cards locally, and the create wizard defines another local `SelectionCard`. This creates card-per-field UI debt and makes focus, selected state, spacing, and accessibility harder to keep consistent.
- Affected flow/files: `app/[locale]/(product)/money/savings/[id]/settlement-flow.tsx:46-74`; `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx:183-211`.
- Expected invariant: Action flows use the canonical HeroUI/shared choice primitives, preserve ActionSheetLayout, and keep sticky safe-area footer behavior.
- Recommended fix: Consolidate on the existing shared/HeroUI choice control when the core accounting and lifecycle issues are fixed.

### P2-02 — Financial mutation integration coverage is missing

- Problem: The targeted unit suites pass, but there is no database-level regression matrix asserting exact transaction rows, tax/penalty posting, compound-interest maturity, rollover accounting, retry behavior, and personal-ownership denial for each financial mutation. Current E2E coverage does not assert these accounting invariants.
- Affected flow/files: `tests/unit/savings-domain.test.ts`; `tests/unit/savings-commands.test.ts`; `tests/unit/savings-renewal-policy.test.ts`; `tests/unit/financial-semantics.test.ts`; relevant Savings RPC migrations.
- Expected invariant: create, deposit/live placement, settle, early settle, and rollover each have an integration test proving idempotency, accounting direction, ownership, and exact ledger outcomes.
- Recommended fix: Add the smallest RPC/integration matrix after the authoritative SQL contracts are corrected; keep existing unit coverage for pure calculations.

## Contract coverage summary

| Area                | Result                          | Audit conclusion                                                                                                                                                                                                                                |
| ------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product types       | Partial pass                    | Existing `SavingsFamily.BANK` and `PLATFORM` contracts already model provider, term, rate, expected maturity, tax, early rate/rule, and maturity behavior. No new provider architecture is necessary.                                           |
| Principal placement | Partial pass                    | Current live placement uses neutral `transfer_out`/`transfer_in` entries and `SAVINGS_PRINCIPAL_PLACEMENT`; historical/opening behavior is missing.                                                                                             |
| Principal return    | Partial pass                    | Intended neutral return exists, but settlement/early paths have inconsistent markers and charge posting.                                                                                                                                        |
| Interest            | Fail                            | Maturity RPC ignores configured compound methods; early explicit rate is unused; rollover interest is lost.                                                                                                                                     |
| Tax/penalty         | Fail                            | Tax/penalty are not consistently calculated, deducted, classified, or posted as Expense.                                                                                                                                                        |
| Maturity states     | Partial pass                    | Presentation supports active, upcoming, today, matured, action-required, settled, and early-settled concepts, but detail action availability can race persisted lifecycle state.                                                                |
| Rollover            | Fail                            | Principal-only and principal-plus-interest intent exists, but the current RPC loses interest before calculating the next principal.                                                                                                             |
| Early settlement    | Fail                            | Latest migration is malformed, client amounts are trusted, and configured early rate is not applied.                                                                                                                                            |
| Account eligibility | Fail                            | App and RPC allowlists differ; direct RPC use can reach brokerage/investment containers and same-account movement is not rejected.                                                                                                              |
| Ownership/security  | Pass, pending integration proof | Ownership-aware RLS/RPC grants derive active membership and personal ownership; child mutations guard the parent. Former members lose mutation authority while active members retain household read access per contract. Add integration proof. |
| Idempotency         | Partial pass                    | Create, settle, rollover, and early-settle paths attempt replay guards/locks, but early SQL is malformed and trusted inputs prevent reference-ready confidence.                                                                                 |
| Transactions/Home   | Fail                            | Missing `savings_event_kind` on settlement/early paths removes or misclassifies Savings activity.                                                                                                                                               |
| Privacy             | Fail                            | Core Savings screens bypass `FinancialValue`.                                                                                                                                                                                                   |
| i18n                | Pass                            | Targeted EN/VI message tests pass; no concrete Savings i18n defect found.                                                                                                                                                                       |
| UI structure        | Partial pass                    | ActionSheetLayout and safe-area footers are used in action flows; local selection-card duplication remains P2.                                                                                                                                  |
| Responsive UX       | Blocked by fixture              | The create E2E flow cannot select a package, so the required 390/440/768/1280 browser evidence is incomplete.                                                                                                                                   |

## Verification performed

- Targeted unit suites: **PASS**, 11 files / 108 tests.
- `npm run typecheck`: **PASS**.
- `npm run lint`: **FAIL**, but only on unrelated existing `scripts/home-compact-cta-check.cjs` import/console rules; no Savings files were changed.
- Savings E2E command: **1 failed, 2 skipped**. The visual create test failed on the empty selected provider catalog; the Savings smoke and G1 fixture tests were skipped by their existing conditions.
- `supabase status`: **BLOCKED** because Docker is unavailable (`Cannot connect to Docker daemon at unix:///Users/doantuan/.docker/run/docker.sock`). Database migrations/RPC behavior could not be executed locally.
- No production fixes were implemented.

## Recommended implementation sequence

1. Repair and execute the authoritative Savings SQL migrations, starting with early settlement; add a disposable-database smoke test.
2. Make server-side calculations authoritative: method-aware interest, explicit early rate, tax/penalty, proceeds breakdown, account eligibility, distinct accounts, and client-input rejection.
3. Correct rollover ordering and preserve immutable matured-cycle history; verify retry/idempotency for every financial mutation.
4. Restore Savings event markers and exact accounting classification across Savings, Transactions, and Home.
5. Add explicit historical/opening semantics, then align account pickers and maturity action availability with server contracts.
6. Route all financial values through `FinancialValue`, fix the deterministic provider/package fixture, and run browser checks at 390/440/768/1280 in EN/VI, light/dark, and reduced motion.
7. Replace duplicated selection cards and add the final RPC ownership/accounting/idempotency regression matrix.
