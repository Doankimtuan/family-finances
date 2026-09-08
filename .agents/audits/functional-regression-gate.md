# ViNha Functional Regression Gate

| Field           | Value                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| Date            | 8 Sep 2026                                                                              |
| Scope           | Read-only functional regression after Performance Phase 1–2 and P1 security remediation |
| Predecessor     | P1 SECURITY REMEDIATION PASS (`.agents/audits/security-remediation-p1.md`)              |
| Code changes    | None (report only)                                                                      |
| Local app       | Next.js on `http://127.0.0.1:3000`                                                      |
| Linked database | Not mutated. Prior audits used hosted `family-finances-2` (`bbzffxvgocjwsdbujvgn`)      |
| Focused tests   | 52 files / 368 passed / 0 failed                                                        |
| Typecheck       | `npx tsc --noEmit` — pass                                                               |
| Targeted lint   | ESLint on auth, saving, ledger-balance, and Plan touch files — pass                     |

## 1. Executive Summary

This gate asked whether the recent performance and security work changed **user-visible behavior or financial contracts**.

It did not. The P1 auth boundary and create-saving key lifecycle behave as designed. Balance, Plan, transaction, Inbox, Together, and Health contracts that those changes touch still match the existing tests.

**Scope.** Authentication and product routing, create-saving, Money balances and products, Plan hub/jars/budgets, transactions, Inbox, Together, Health, EN/VI locale, and the financial invariants listed below.

**Environment.** Read-only. No application, schema, RLS, RPC, or business-rule edits. Focused Vitest, typecheck, targeted lint, HTTP against the running app, and browser checks of public / unauthenticated routes. The architecture-engineering audit file named in the brief was not present under `.agents/audits/`.

**What was tested**

- Product vs public route-group wiring and `requireProductSession`
- Create-saving wizard key lifecycle, validation, and command replay
- `get_account_ledger_balances` formula parity with `applyTransactionDeltas`
- Request-local `getPlanPulse` / `getRealPosition` cache (not cross-request)
- Pure-read jar budgets plus snapshot writes on jar/ritual mutations
- Transaction entry → confirmation → result, refund/correct, optional category jar
- Inbox review contracts, Together membership helper, Health read-only shield
- Unauthenticated HTTP redirects and locale preservation
- Browser: public login/register/welcome/confirm; unauthenticated investment and product redirects

**What could not be tested**

- Authenticated browser walks of Home / Money / Plan / create-saving submit. Existing `.env.local` E2E credentials were present, but automation browsers received `403` on `/_next/static/chunks` (the same chunks return `200` via HTTP from this machine), so the login client never hydrated. Completing login in that environment was not possible.
- Live create-saving submit, double-submit, and retry against the hosted household. That would insert savings and transfers. This gate is read-only; those paths are covered by unit tests.
- Project Playwright (`npm run test:e2e`). Config `globalSetup` creates disposable hosted users. That is a write and was not run.
- Local Supabase / SQL replay of household balances. No local stack was used.
- Architecture & Engineering Quality Audit file (path not in `.agents/audits/`). Performance and security audits were read.

No P0 or P1 functional regression was confirmed.

This gate does **not** declare production readiness.

## 2. Regression Matrix

| Area         | Flow           | Result | Evidence                                                                                                                                                                                                                                                                                 | Severity    |
| ------------ | -------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Auth         | Product routes | PASS   | Layout calls `requireProductSession`. HTTP 307 → locale login for Home/Money/Plan/Inbox/Together/Health/investments/savings/loans/debts/transactions. Public `(auth)/(onboard)/(invite)/(system)` stay off that boundary. Unit: `require-product-session`, `product-layout-auth`.        | —           |
| Auth         | Public entry   | PASS   | `/en/login`, `/en/register`, `/en/welcome`, `/en/forgot-password`, `/en/auth/confirm`, `/en/invite/:token` return 200. Browser: login, register, welcome, confirm (“Link not valid”). Vietnamese login copy on `/vi/login`.                                                              | —           |
| Saving       | Create         | PASS   | Wizard mounts one `useState(() => crypto.randomUUID())` key; retries/double-submit reuse it; new instance gets a new key. Command still forwards `p_idempotency_key`. Tests: `create-saving-wizard` (12), `savings-commands` replay. Live submit not executed.                           | —           |
| Money        | Accounts       | PASS   | `listAccounts` / `getAccount` / `getRealPosition` use `loadAccountLedgerBalances`. RPC error fails closed (`null`). Formula test matches `applyTransactionDeltas`. Account create/edit schemas still pass.                                                                               | —           |
| Money        | Investments    | PASS   | Unauthenticated new/detail/buy/convert → login, no product chrome. Investment command and lifecycle tests unchanged. Authenticated investment UI not walked in the browser.                                                                                                              | —           |
| Plan         | Hub            | PASS   | Hub still renders hero, jars, goals, upcoming, recommendations. Upcoming is a 7-day preview (`listPlanHubUpcomingEvents`), not the full calendar graph — same painted contract as before. Pulse is request-local `cache()`.                                                              | —           |
| Plan         | Jars           | PASS   | Current-period budgets compute in memory without GET writes. Snapshots persist from configure/upsert/set-state/month-ritual. Jar state matrix and budget math tests pass. Historical months without a stored snapshot omit that jar from the read model (FR-01).                         | P2 residual |
| Transactions | Add            | PASS   | Capture confirmation sheet still opens without mutating; confirm sends the payload once. Refund/correct contracts unchanged. Categories may omit jar (covered tests, not a perf/security regression).                                                                                    | —           |
| Inbox        | Review         | PASS   | Unread badge remains a `head: true` count of unread pending items. List/decision/integration/producer tests pass. Layout still gates the count behind product session.                                                                                                                   | —           |
| Together     | Membership     | PASS   | `requireTogetherMembership` wraps `requireProductSession` and keeps `nextPath` when the helper itself runs. Product Together URLs 307 to login unauthenticated. Policies/admin tests pass. Layout unauthenticated Together has no `next` (FR-02).                                        | P3 residual |
| Health       | Read-only      | PASS   | BR-24 shield: no Supabase client, commands, or persistence in Health. `getHealthDetail` only aggregates gated reads. Unauthenticated `/en/health` and `/vi/health` → login.                                                                                                              | —           |
| Locale       | EN/VI          | PASS   | Unauthenticated `/vi/money`, `/vi/plan`, `/vi/home`, `/vi/inbox`, `/vi/together`, `/vi/health`, `/vi/money/investments/new` → `/vi/login`. Public `/vi/login`, `/vi/register`, `/vi/welcome`, `/vi/auth/confirm` 200. Browser showed Vietnamese login after `/vi/money/investments/new`. | —           |

## 3. Recent Change Regression

### `requireProductSession`

Canonical product gate: locale normalize → `getSessionUser` → `resolveActiveMembership`. Unauthenticated → `APP_PATH.LOGIN`. No household → `APP_PATH.ONBOARD` (`/together/onboard`, outside the product layout). Members receive chrome.

`(product)/layout.tsx` awaits it before `ChromeShell chrome="product"`. Redirect throws before chrome. Investment subtree no longer renders empty product chrome.

Public groups are unchanged: `(auth)`, `(onboard)`, `(invite)`, `(system)`.

Page-level `getSessionUser` remains. It is React `cache()`, so it is not a second network auth. Queries/commands still use `assertMoneyActionAllowed`.

Together reuses the same helper. Unauthenticated Together is stopped at the layout without `next` (see FR-02). Authenticated Together pages still pass `nextPath`.

**Verdict:** no authenticated-product regression; the P1 hole is closed.

### Create-saving idempotency lifecycle

```text
wizard mount → key X
submit / retry / double-click → key X
success → navigate to saving detail (instance unmounts)
new wizard visit → key Y
```

Server `createSaving` still passes `p_idempotency_key`. RPC replay is unchanged. Tests prove one key per instance and a new key on remount.

Live duplicate-suppression against the hosted RPC was not re-executed (read-only).

**Verdict:** client lifecycle matches the remediation; no functional regression in the covered contract.

### `get_account_ledger_balances`

SQL still implements `opening_balance + Σ(credit − debit)` over `TRANSACTION_BALANCE_STATUS_VALUES`, credit/debit type lists identical to `applyTransactionDeltas`, `SECURITY INVOKER`, household from `investment_active_household()`, no `p_household_id`.

Callers: `getRealPosition` (cached), `listAccounts` / capture list, `getAccount`, goal-linked account balances. RPC failure → `null` (fail closed). Mixed credit/debit isolation is asserted in unit tests.

Credit cards remain excluded from real position (liquid types only). The RPC itself is not liquid-constrained so `getAccount` can reuse it.

**Verdict:** displayed formula is unchanged. No UI formula rewrite.

### Cached `getPlanPulse`

`export const getPlanPulse = cache(loadPlanPulse)`. Request-local only. Tests: same request dedupes; next request does not reuse; not `unstable_cache`. Active-jar preview and paused/archived counts unchanged.

**Verdict:** no cross-user or cross-request stale Plan pulse.

### Cached `getRealPosition`

Same request-local `cache()`. Does not download transaction rows. Household id and currency are not shared across mocked requests. Total is still `sum(account.balance)` after RPC apply.

**Verdict:** no silent stale position across requests.

### Pure-read jar budget calculation

`getCurrentJarBudgets` / `getJarBudgetsForPeriod` do not `insert`/`upsert`. Missing **current-period** snapshots are synthesized in memory (`snapshotsForRead` ← `missingCurrentPeriodSnapshotRows`) so hub numbers remain available. Current period still uses the live plan.

**Verdict:** current-period semantics preserved.

### Jar snapshot persistence

`ensureJarPeriodRuleSnapshots` upserts `ON CONFLICT (jar_id, period_month) DO NOTHING`, treats unique races as success, and is called from `configure-jar`, `upsert-jar-plan`, `set-jar-state`, and `month-ritual` — not from GET.

Historical months without a stored snapshot skip that jar in the summary (`if (!snapshot) continue`). Before Phase 1, visiting Plan wrote the current-period snapshot on GET. After Phase 1, a month with **no** jar/ritual mutation may have no row for later historical review (FR-01). That is a persistence-timing change, not a current-period math change.

**Verdict:** intended mutation-path persistence works; historical coverage for view-only months is weaker (P2 residual).

## 4. Financial Invariants

| Invariant                         | Verified? | How                                                                                                                             |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Account balance = opening ± txs   | Yes*      | RPC SQL lists match `applyTransactionDeltas`; unit mixed credit/debit; fail-closed on RPC error. *Not re-summed on hosted rows. |
| Negative / debit txs              | Yes       | Debit types subtract in SQL and in `applyTransactionDeltas`.                                                                    |
| Liquid accounts isolated          | Yes       | Deltas keyed by `account_id`; missing account id ignored; `GROUP BY a.id`.                                                      |
| Position totals                   | Yes       | `totalBalance` is the sum of applied liquid balances. Savings products excluded from position.                                  |
| Saving create → record + transfer | Partial   | Command still forwards one key and returns the same result on replay. Live insert not run.                                      |
| Investment calculations           | Yes       | Lifecycle and command tests (buy/sell/fees/FIFO/gold/crypto) unchanged.                                                         |
| Household isolation               | Yes       | Gate + RPC `investment_active_household()`; no client `household_id`. Ownership/RLS tests pass.                                 |
| Health cannot mutate finance      | Yes       | Health-RO shield + `getHealthDetail` read aggregation.                                                                          |
| Plan current-period budgets       | Yes       | In-memory current snapshot + live plan; GET does not write.                                                                     |
| Request cache isolation           | Yes       | Pulse/position not reused across requests or households.                                                                        |

`applyLedgerBalances` keeps `mapAccountRow`’s opening balance when the RPC map omits an id. RPC error still returns `null`. A successful empty map for a selected account would understate (opening only). `investment_active_household()` raises if there is no membership, so that path errors closed. Residual only if gate household and SQL household ever diverged (not observed; typical one active membership). Recorded as FR-03, not a confirmed failure.

## 5. Test Results

Exact unique focused Vitest run:

```text
Test Files  52 passed (52)
     Tests  368 passed (368)
```

| Cluster                 | Files (representative)                                                                                                            | Result |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Auth / product boundary | `require-product-session`, `product-layout-auth`, `auth-session`, `auth-csrf-redirect`, `register-forgot`, `i18n-routing`         | pass   |
| Create-saving           | `create-saving-wizard` (12), `savings-commands` (incl. replay), `savings-domain`, `savings-renewal-policy`, savings render purity | pass   |
| Ledger balances         | `account-ledger-balance-rpc`, `ledger-accounts`, `request-local-query-cache`                                                      | pass   |
| Plan                    | pulse, jar-budget, pure-read GET, snapshots, hub query shape, calendar, goals, ritual, allocation, monthly review, movements      | pass   |
| Transactions            | contracts, command integration, policy, capture, confirmation sheet, category form                                                | pass   |
| Inbox                   | decisions, contracts, queue, integration, producer boundary                                                                       | pass   |
| Together / household    | `household-policies`, `together-ui-polish`, `ownership-rls`                                                                       | pass   |
| Health                  | readonly shield, pulse, detail integration, secondary shell                                                                       | pass   |
| Money products          | investment commands/lifecycle, loans integrity, debt domain, money schemas, account forms, money summary shape                    | pass   |

Also:

- `npx tsc --noEmit` — pass
- Targeted ESLint on layout, `require-product-session`, Together helper, create-saving wizard, real-position, list-accounts, balance loader, plan pulse, jar budgets, snapshot command, hub upcoming, Plan page — pass

Full Vitest suite was not run (focused surface was sufficient; no cross-module failure appeared).

`npm run test:e2e` was not run (hosted fixture writes).

## 6. Browser Results

### Verified

| Check                                             | Result                                                                                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Unauthenticated `/en/money/investments/new`       | Lands on `/en/login`. `data-chrome="auth"`. No product chrome. No primary nav. `data-testid="auth-login"`. |
| Unauthenticated investment detail                 | `/en/login`                                                                                                |
| Unauthenticated `/vi/money/investments/new`       | `/vi/login` with Vietnamese copy                                                                           |
| Public `/en/login`, `/en/register`, `/en/welcome` | 200, auth/welcome chrome, no product nav                                                                   |
| Public `/en/auth/confirm`                         | Reachable; bare confirm shows “Link not valid” + Continue                                                  |
| HTTP matrix (no cookies)                          | All listed product URLs 307 to same-locale login; public URLs 200                                          |

HTTP (no follow), `127.0.0.1:3000`:

| Path                                                                                                                                                                        | Status | Location    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------- |
| `/en/login` `/en/register` `/en/welcome` `/en/forgot-password` `/en/auth/confirm` `/vi/login` `/vi/register` `/vi/welcome` `/vi/auth/confirm` `/en/invite/not-a-real-token` | 200    | —           |
| `/en/home` `/en/money` `/en/plan` `/en/inbox` `/en/together` `/en/health`                                                                                                   | 307    | `/en/login` |
| `/en/money/investments/new` `/en/money/investments/:id` `/en/money/investments/:id/buy` `/en/money/investments/convert` `/en/money/savings/new`                             | 307    | `/en/login` |
| `/en/money/accounts` `/en/money/savings` `/en/money/loans` `/en/money/debts` `/en/money/investments` `/en/money/transactions` `/en/money/transactions/new`                  | 307    | `/en/login` |
| `/en/plan/jars` `/en/plan/goals` `/en/plan/calendar` `/en/plan/recurring`                                                                                                   | 307    | `/en/login` |
| `/en/together/onboard`                                                                                                                                                      | 307    | `/en/login` |
| `/vi/money` `/vi/plan` `/vi/home` `/vi/inbox` `/vi/together` `/vi/health` `/vi/money/investments/new`                                                                       | 307    | `/vi/login` |

### Unavailable

- Authenticated Home / Money / Plan / savings wizard / investment detail **in a hydrated browser**. Automation browsers got `403` on `/_next/static/chunks/*`; those files return `200` to a normal HTTP client. Login stayed `isDisabled` because `hydrated` never flipped. This is an automation-runtime limitation, not a product-route finding.
- Playwright project run (would write hosted E2E users via `scripts/e2e-auth-fixture.mjs`).
- Chromium via `npx playwright test` against a dedicated `E2E_PORT` was not started for the same reason.

### Not tested

- Create-saving fill → submit → success against the hosted household (would mutate savings + transfer).
- Double-submit / retry on the live RPC (unit-tested only).
- Authenticated Plan month/calendar click paths.
- Inbox approve/dismiss in the browser.
- Together invite accept/reject/revoke in the browser.
- Account/investment detail numbers vs a live SQL sum.

Existing E2E credentials in `.env.local` were **not invented**. They were not used to finish an authenticated session because the automation browser could not hydrate the login client.

## 7. Findings

### FR-01 — Historical jar snapshots no longer persist on Plan GET

| Field                        | Value                                                                                                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Severity                     | P2                                                                                                                                                                                                                                                                                   |
| Affected flow                | Plan historical / Monthly Review for a period that had no jar or ritual mutation                                                                                                                                                                                                     |
| Root cause                   | Phase 1 moved `jar_period_rule_snapshots` writes off GET. Current period is computed in memory. Persistence is mutation-owned.                                                                                                                                                       |
| Evidence                     | `get-current-jar-budgets.ts` `snapshotsForRead` only synthesizes **current** missing rows. `summaryFromContext` skips jars with no snapshot. Writers: configure-jar, upsert-jar-plan, set-jar-state, month-ritual. Tests: `jar-budget-get-pure-read`, `ensure-jar-period-snapshots`. |
| Blocks release of this gate? | No. Current-period hub numbers remain; this is deferred persistence, not wrong live math.                                                                                                                                                                                            |

### FR-02 — Layout unauthenticated Together redirect omits `next`

| Field                        | Value                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Severity                     | P3                                                                                                                                                                       |
| Affected flow                | Signed-out visit to `/together/*`                                                                                                                                        |
| Root cause                   | Product layout calls `requireProductSession({ localeParam })` without `nextPath`. Together pages still pass `nextPath` when they run.                                    |
| Evidence                     | `app/[locale]/(product)/layout.tsx`; P1 remediation already documented this as matching majority product login. HTTP 307 `/en/together` → `/en/login` (no `next` query). |
| Blocks release of this gate? | No. Login still works; resume deep-link is lost only for that unauthenticated Together entry.                                                                            |

### FR-03 — Opening-balance fallback if RPC omits an account id

| Field                        | Value                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Severity                     | P3 residual (not confirmed in runtime)                                                                                 |
| Affected flow                | Account / position display                                                                                             |
| Root cause                   | `applyLedgerBalances` leaves `mapAccountRow` opening balance when the map has no id. RPC **error** still fails closed. |
| Evidence                     | `load-account-ledger-balances.ts`. Left join + `GROUP BY a.id` should return a row per requested in-household account. |
| Blocks release of this gate? | No. Not observed.                                                                                                      |

No P0 (data corruption, duplicate live mutation, household leak, unrecoverable inconsistency) was confirmed.

No P1 (broken auth, saving/transfer inconsistency, major Money/Plan mutation failure) was confirmed in the evidence above.

P2/P3 security items from the hardening audit remain out of scope, as required.

## 8. Final Verdict

FUNCTIONAL REGRESSION PASS

The implementation is functionally stable enough to proceed to the production-operations gate. This is not a production GO.
