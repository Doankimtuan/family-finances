# CommandCode Handoff: Savings and Investments

## Mission

Implement one coherent Savings flow at a time using the approved domain APIs and shared financial patterns. Do not implement Investments yet. Its current canonical contract says `NEEDS CLARIFICATION`, it has no current source surface, and the unresolved points affect cash classification, valuation meaning, visibility, and auditability.

Do not reread the repository broadly. Use this handoff and open only a referenced file when implementation requires its exact type or API.

## Non-negotiable financial rules

### Savings

- Savings money is Real Ledger money, not a Jar, Goal, or Plan balance.
- A create-and-fund action posts confirmed/manual principal once through the approved money mechanism.
- Expected and accrued interest never write money transactions.
- Posted/provider-confirmed interest is distinct from principal, tax, fee, penalty, and net settlement.
- Maturity detection, reminder creation, saved renewal preference, Inbox acknowledgment, and preview move no money.
- Renewal needs explicit confirmation and creates one immutable new cycle. The old cycle remains historical.
- Maturity settlement and early withdrawal post provider/manual actuals only.
- Do not implement standard partial withdrawal.
- Retried actions must be idempotent and must not duplicate cycles, settlement, or transaction postings.

### Investments

- Investments explains risk-bearing holdings. Accounts hold cash and Transactions own cash movement.
- Create/recognize holding moves no money.
- Buy, cash sell proceeds, and cash investment income are Transactions-owned real money exactly once.
- Valuation update and unrealized gain/loss never create transactions or Planning capacity.
- Contribution/cost context is not gain. Estimated value is not cash. Realized outcome requires exit facts.
- No advice, automation, market-timing, or tax-lot precision.
- Do not create Investments code until all gates below are resolved in canonical artifacts.

## First implementation sequence: Savings

### Work item 1: make settlement inputs canonical and atomic

Primary files:

- `modules/savings/application/commands/settle-saving.ts`
- `modules/savings/application/commands/early-withdraw.ts`
- `app/[locale]/(product)/money/savings/savings-actions.ts`
- A new migration created through the project migration workflow
- Focused Savings unit/integration tests

Required outcome:

1. Maturity settlement receives or resolves provider/manual actual principal, actual posted/eligible interest, tax, fee, penalty, net settlement, destination, and effective date. Unknown or estimated amounts cannot be posted as actual.
2. Early-withdrawal preview comes from approved provider/manual calculation inputs or a canonical domain result. Never add a formula. Never evaluate provider expressions in UI/application code.
3. Confirmation references a durable preview/quote identity and version/freshness. A stale or changed quote is rejected and regenerated.
4. The database validates the quote and locked cycle facts. Do not accept principal/net values merely because the client or server action supplied them.
5. Financial mutation, cycle transition, audit record, correlation/link fields, and decision resolution are atomic where the architecture allows. At minimum, never resolve Inbox before the owner-domain mutation succeeds.
6. Existing applied migrations remain unchanged. Add a new migration with RLS/authorization, explicit authenticated grants, row locks, state checks, and idempotency/correlation constraints.
7. Preserve household membership checks. A `SECURITY DEFINER` RPC must verify `auth.uid()` and household membership and must not become an unrestricted public endpoint.

Do not expand into provider integrations, tax logic, standard partial withdrawal, or pending-provider automation.

### Work item 2: Savings overview and detail clarity

Primary files:

- `app/[locale]/(product)/money/savings/page.tsx`
- `app/[locale]/(product)/money/savings/[id]/page.tsx`
- `modules/savings/application/queries/list-savings.ts`
- `messages/en/money.json`
- `messages/vi/money.json`

Page contract:

- Overview hierarchy: title, one orientation summary, attention-needed/active list, completed/history section, one create action.
- Detail hierarchy: product identity/status, provider-held principal, expected/accrued non-posted interest, maturity, provider/package terms, state-appropriate primary action, immutable cycle/activity history.
- Use `Page`, `Section`, `Amount`/`Balance`, `EmptyState`, `ErrorState`, `Skeleton`, and `TransactionRow` where their existing contracts fit.
- Add only module-local `SavingsSummary`, `MaturitySummary`, or `SavingCycleRow` if composition cannot express the domain distinction cleanly.
- Do not show raw enums, ISO dates, hardcoded fallback copy, or untranslated separators.
- Completed, Closed Early, and historical cycles remain visible and have no active money actions.

Financial effect: read-only presentation is `DERIVED_DISPLAY`.

### Work item 3: create-and-fund confirmation and receipt

Primary files:

- `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx`
- `app/[locale]/(product)/money/savings/savings-actions.ts`
- `modules/savings/application/commands/create-saving.ts`
- Shared preview/receipt patterns only if already established by prior batches

Required fields and preview:

- Funding account.
- Savings product/provider destination.
- Principal.
- Settlement account.
- Provider/package, term, start/maturity, locked rate.
- Expected interest labeled non-posted.
- Renewal preference labeled as preference only.
- Effective date and records created.

On confirm, create one saving, one immutable Active cycle, and one logical funding movement using the canonical paired postings. The result page/receipt must say real money changed, plan unchanged, and link to the saving and funding movement.

Do not present this as Draft creation. Current persistence creates a confirmed/manual Active saving. A separate Draft/fund flow requires a separate state/persistence work item.

### Work item 4: maturity and renewal UX

Primary files:

- `app/[locale]/(product)/money/savings/[id]/page.tsx`
- `app/[locale]/(product)/money/savings/[id]/renewal-policy-editor.tsx`
- `app/[locale]/(product)/money/savings/savings-actions.ts`
- Existing Inbox savings decision components only as directly required

Keep Inbox as the decision owner and Savings as the lifecycle owner.

Maturity preview shows:

- Principal.
- Provider/manual actual or explicitly unknown interest.
- Actual tax, fee, and penalty only if provider-confirmed.
- Net settlement.
- Settlement destination.
- Renewal package/rate/term and settlement rule.
- Effective date and affected records.

Supported actions:

- Renew principal and eligible interest.
- Renew principal only and pay actual interest to settlement account.
- Change package only when v1 package switching is explicitly included and the package/rate is confirmed.
- Withdraw all.
- Review later only where the domain state allows.

Saved policy may prefill, never execute. Resolve the ReviewItem only after successful mutation. On retry, do not create another cycle or settlement.

### Work item 5: early withdrawal preview and confirmation

Primary files:

- `app/[locale]/(product)/money/savings/[id]/early-withdraw/page.tsx`
- `app/[locale]/(product)/money/savings/[id]/early-withdraw/early-withdraw-form.tsx`
- `modules/savings/application/commands/early-withdraw.ts`
- `modules/savings/application/savings-penalty.ts`, but only to remove/replace non-canonical calculation behavior, never to add a formula
- `app/[locale]/(product)/money/savings/savings-actions.ts`

Preview is `DERIVED_DISPLAY` and must show separate principal, accrued estimate, eligible interest, tax, fee, penalty/forfeiture, net, destination, effective date, and quote freshness/version. Unknown remains unknown.

Confirmation is `REAL_MONEY` and must use the same valid canonical quote. Successful commit creates one logical payout, one early-withdraw audit record, one Closed Early transition, and then resolves the Inbox decision. Failure leaves the saving Active or creates a settlement review and leaves the decision recoverable.

## Investments implementation gate

Do not create routes, modules, tables, migrations, strings, or tests until canonical product artifacts approve all of the following:

1. User-facing Vietnam-first name and terminology.
2. First supported asset classes.
3. Personal versus household visibility and mutation permissions.
4. Manual valuation burden, source vocabulary, unknown/stale behavior.
5. Transactions classifications for contribution/buy, proceeds/sell, dividend/income, fee, refund, and correction.
6. Holding schema and application API for identity, state, quantity/units, contribution/cost context, valuation history, exit/realized outcome, and transaction links.
7. Route family and constants in `app-path.ts`.

Once those are approved, use these flow contracts:

| Flow | Effect | Required commit behavior |
|---|---|---|
| Create holding | `NONE` | Create Recognized/Under Review holding only; no transaction. |
| Buy | `REAL_MONEY` | One Transactions-owned cash outflow/transfer plus linked contribution context; no duplicate on retry. |
| Sell | `REAL_MONEY` when proceeds exist | One Transactions-owned proceeds receipt plus partial/full exit context and realized outcome; preserve remaining exposure/history. |
| Dividend/income | `REAL_MONEY` when cash arrived | One correctly classified receipt plus holding context; never default to salary. |
| Valuation update | `NONE` | Valuation fact/history only; account balances and transaction count unchanged. |
| Unrealized performance | `DERIVED_DISPLAY` | Derived from approved contribution/cost and latest valuation facts; never posted or spendable. |
| Realized performance | `DERIVED_DISPLAY` | Shown only from canonical exit outcome; not inferred from market value alone. |

Prospective source homes after approval:

- `app/[locale]/(product)/money/investments/page.tsx`
- `app/[locale]/(product)/money/investments/new/page.tsx`
- `app/[locale]/(product)/money/investments/[id]/page.tsx`
- `modules/investments/application/investments-constants.ts`
- `modules/investments/application/investments-types.ts`
- `modules/investments/application/commands/*`
- `modules/investments/application/queries/*`
- `modules/investments/application/index.ts`
- `modules/tenancy/application/app-path.ts`
- EN/VI investment message namespaces
- Reviewed migrations and focused tests

## Route and scope locks

Keep these runtime routes unchanged in Savings implementation:

- `/money/savings`
- `/money/savings/new`
- `/money/savings/[id]`
- `/money/savings/[id]/early-withdraw`
- `/inbox/[id]` for maturity/early-withdraw decisions

Do not migrate to `/money/products/savings*` in the same work. Do not add an Investments URL until its route decision is approved. Routes and path segments must be constants/functions in `modules/tenancy/application/app-path.ts`.

Do not touch cards, loans, debts, generic account/transaction UI, Plan, Goals, Jars, Health, Together, app shell, or retired legacy code except for a direct typed dependency that the approved flow requires.

## Component rules

- Mobile-first at 390px and 440px.
- Use semantic tokens, shared UI, and shared patterns. No hardcoded copy, colors, route strings, statuses, classifications, date formats, or currency.
- EN and VI are required for every visible state and accessible name.
- Light and dark mode are first-class and WCAG AA.
- Long financial flows use `BottomActionBar`; confirmation must keep the consequence visible and the action reachable above the keyboard/safe area.
- One dominant amount only. Every other amount states its meaning: principal, expected, accrued, eligible, posted, fee, tax, penalty, net, estimated, realized, or unrealized.
- Transaction rows are for real ledger movement only. Cycle, valuation, and holding-history facts use domain activity rows.
- Loading, error, offline, and disabled states never imply commit success.

## Required verification

Run:

1. Typecheck.
2. Lint.
3. Focused Savings tests.
4. Authenticated Playwright for the implemented Savings flow.

For every `REAL_MONEY` test:

Before:

- Read source and destination balances.
- Read saving principal/cycle or holding quantity/state.
- Count and identify related transactions and audit/decision records.

Action:

- Perform one confirmed action.
- Retry the same logical request once where safe.

After:

- Assert the expected account delta exactly once.
- Assert one expected product state delta.
- Assert required transaction links, cycle/holding links, decision state, and audit record.
- Assert no duplicate posting, cycle, income, fee, tax, penalty, or settlement.
- Assert correct classification and effective date.

A paired ledger transfer is one logical movement. Assert one source posting and one destination posting with the same business correlation.

For valuation update, assert both account balances and transaction count are unchanged. Only valuation/history and derived display may change.

Browser evidence is mandatory at 390px and 440px, EN and VI, light and dark, for the changed flow. Do not mark UI complete without that evidence.

## Acceptance stop conditions

Stop and return to the canonical domain owner if any implementation would require guessing:

- Maturity or early-withdrawal actual amount.
- Interest, tax, fee, or penalty formula/classification.
- Settlement correlation/idempotency.
- Investment contribution, proceeds, or income classification.
- Whether a valuation is cash or a transaction.
- Quantity/cost-basis or realized-outcome rules.
- Visibility/permission behavior for an investment holding.

Do not replace an unknown with zero, a default category, a local formula, or an optimistic success state.
