# ViNha Security Hardening Audit

| Field           | Value                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Date            | 8 Sep 2026                                                                                      |
| Scope           | Read-only application-security + authorization audit                                            |
| Predecessor     | Performance Phase 2 — SQL aggregation adopted (`get_account_ledger_balances`)                   |
| Code changes    | None (report only)                                                                              |
| Linked database | Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`, `ap-southeast-2`, ACTIVE_HEALTHY) |
| Focused tests   | 13 files / 50 tests passed                                                                      |
| Live SQL checks | RPC ACL / security mode verified against hosted Postgres                                        |

## 1. Executive Summary

ViNha’s **authorization plane is sound**. Cross-household reads and writes are blocked by a consistent server-side chain:

```text
getUser() → resolveActiveMembership → assertMoneyActionAllowed
  → queries/commands scoped to gate.householdId
  → RLS / ownership triggers / household-checked RPCs
```

No **P0** was confirmed:

- No cross-household financial data access
- No service-role key in client code
- No unauthenticated mutation of household data
- The new balance RPC cannot be pointed at another household

The product is **not production-certified**. Two **P1** issues must be fixed in a focused remediation pass:

1. **Inconsistent product auth guard.** `proxy.ts` and `(product)/layout.tsx` do not redirect unauthenticated users. Most pages do. The investment detail / create / operation subtree does not, so product chrome can render without a session. Household data still fails closed.
2. **Create-saving is not retry-idempotent.** The wizard mints a new `crypto.randomUUID()` on every submit. Server replay exists, but a new key defeats it. Double-submit / retry can create duplicate savings and duplicate live transfers.

Additional **P2** items: app-layer role parse fail-opens to `admin` (database CHECK currently prevents exploitation), `household_base_currency(uuid)` is a DEFINER currency-code leak, raw action errors are logged with resource IDs, a few debt/card RPCs omit `is_active` at the entrypoint (ownership triggers still deny), and hosted Auth leaked-password protection is off.

**Gate:** READY FOR SECURITY REMEDIATION — not a production GO.

The new balance architecture was reviewed and **must not be redesigned**. It is the correct isolation model.

## 2. Threat Model

| ID  | Attacker                                      | Primary goal                                          | Residual after current controls                                                                     |
| --- | --------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| T1  | Unauthenticated visitor                       | Product routes, APIs, Server Actions, PostgREST       | Most pages redirect; investment chrome can render empty; data/mutations fail closed                 |
| T2  | Authenticated member of household A           | Read/write household B resources                      | Blocked by membership gate + household-scoped queries + RLS                                         |
| T3  | Authenticated member with forged resource IDs | `/money/investments/<other-id>` and mutation payloads | Lookup is `id` **and** `gate.householdId`; other-HH → not found / empty                             |
| T4  | Malicious client                              | Spoof `household_id`, role, ownership, RPC args       | Client `household_id` is not an authorization input; RPCs derive household from `auth.uid()`        |
| T5  | Stolen session cookie                         | Act as the victim                                     | Server still authorizes **as that user**; SameSite=Lax and Next Origin checks limit CSRF, not theft |

T5 is inherent to cookie sessions. Remaining server-side authorization still prevents **cross-household** access; it does not prevent acting as the victim.

## 3. Authentication

Session identity is server-validated.

| Step      | Implementation                                                                                   | Verdict |
| --------- | ------------------------------------------------------------------------------------------------ | ------- |
| Login     | `signInWithPassword` via Supabase Auth; fail-closed when unconfigured                            | Pass    |
| Session   | `getSessionUser` → `supabase.auth.getUser()` (not cookie-only `getSession()`), React `cache()`   | Pass    |
| Refresh   | `proxy.ts` → `updateSession` → `getClaims()`; stamps cookies; `Cache-Control: private, no-store` | Pass    |
| Logout    | POST `/auth/signout` + same-origin CSRF helper; `signOut()`                                      | Pass    |
| Confirm   | `/auth/confirm` PKCE/OTP; `isSafeInAppNextPath` rejects `//` open redirects                      | Pass    |
| Data gate | `assertMoneyActionAllowed` fail-closes `UNAUTHENTICATED` / `NO_MEMBERSHIP`                       | Pass    |

Evidence: `modules/tenancy/application/get-session-user.ts`, `assert-money-action-allowed.ts`, `modules/platform/supabase/update-session.ts`, `app/auth/signout/route.ts`, `app/auth/confirm/route.ts`.

E2E: `tests/e2e/login.smoke.spec.ts` — unauthenticated `/en/money` redirects to login.

**Not present:** proxy-level login redirect (by design; documented in `update-session.ts`). JWT expiry / refresh TTL are hosted Auth settings, not in-repo.

## 4. Product Route Protection

### 4.1 Layers

| Layer                   | Redirects unauthenticated? | Role                                                |
| ----------------------- | -------------------------- | --------------------------------------------------- |
| `proxy.ts`              | **No**                     | Locale + session refresh + maintenance              |
| `(product)/layout.tsx`  | **No**                     | Product chrome + inbox badge                        |
| Most product `page.tsx` | **Yes**                    | `getSessionUser` → login; membership → onboard      |
| Together pages          | **Yes**                    | `requireTogetherMembership` (+ `loginHrefWithNext`) |
| Queries / commands      | N/A (deny)                 | `assertMoneyActionAllowed`                          |
| RLS                     | N/A (deny)                 | Household membership                                |

### 4.2 Re-verified prior claim: “Product layout has no login redirect”

**Confirmed.** `app/[locale]/(product)/layout.tsx` mounts `ChromeShell chrome="product"` with no session check. Inbox count is gated (`countUnreadOpenInboxItems` → `null` → `0`), so the badge does not leak, but chrome still renders whenever a child page skips redirect.

### 4.3 Page-level consistency

Product pages **with** session/membership redirect include Home, Money hub, Plan, Inbox, Health, Together, savings, loans, debts, accounts detail, transactions, and the investments **overview**.

Compatibility aliases (`/money/accounts`, `/money/add`, `/money/cards`, `/money/cards/[id]`) only redirect; the **target** page owns auth.

Product pages **without** page-level `getSessionUser` / `requireTogetherMembership`:

| Route                                                  | File                                   | Unauthenticated result                     |
| ------------------------------------------------------ | -------------------------------------- | ------------------------------------------ |
| `/money/investments/new`                               | `money/investments/new/page.tsx`       | Form + empty accounts under product chrome |
| `/money/investments/[id]`                              | `money/investments/[id]/page.tsx`      | Error/empty under product chrome           |
| `/money/investments/[id]/buy\|sell\|income\|valuation` | thin pages → `InvestmentOperationPage` | EmptyState under product chrome            |
| `/money/investments/convert`                           | same                                   | EmptyState under product chrome            |

`InvestmentOperationPage` loads `listInvestmentPortfolio` / `listAccounts` / `getInvestmentHolding` with **no** page redirect. Those queries return `null` / empty via `assertMoneyActionAllowed`. **No household payload.** Chrome and form chrome still render.

Investment **overview** (`money/investments/page.tsx`) **does** redirect. The subtree is the inconsistency.

### 4.4 Recommended canonical model (do not implement in this audit)

1. Add `requireProductSession({ locale, nextPath? })` in tenancy (session → login with `loginHrefWithNext`; membership → onboard).
2. Call it once from `(product)/layout.tsx` so **all** product routes inherit the redirect, including investments.
3. **Keep** `assertMoneyActionAllowed` on every query/command — layout is UX; the gate is the data plane (and covers Server Actions invoked without a page).
4. Keep `proxy.ts` refresh-only. Do not put login redirects in the Edge proxy unless next-intl / confirm / maintenance complexity is explicitly accepted.
5. Extend ST-E02-002-style e2e to `/en/money/investments/new` and `/en/money/investments/[id]`.

## 5. Household Authorization

Canonical household source: `resolveActiveMembership(user.id)` → `gate.householdId`. No product Zod schema accepts client `householdId` as an authorization field.

| Domain       | Read guard                      | Mutation guard                              | RLS                                 | Household source         | Risk                                |
| ------------ | ------------------------------- | ------------------------------------------- | ----------------------------------- | ------------------------ | ----------------------------------- |
| Money hub    | Gate via position/summaries     | N/A (hub is read)                           | Yes                                 | `gate.householdId`       | Low                                 |
| Accounts     | Gate + `.eq("household_id", …)` | Gate + RLS `can_mutate_financial_resource`  | SELECT member; INSERT/UPDATE mutate | Gate                     | Low                                 |
| Transactions | Gate + household + id           | Gate + DEFINER RPCs                         | SELECT member; writes via RPC       | Gate                     | Low                                 |
| Plan / Jars  | Gate + household filter         | Gate + period lock                          | Member policies                     | Gate                     | Low                                 |
| Goals        | Gate + household + id           | Gate + household eq                         | Full CRUD + mutate                  | Gate                     | Low                                 |
| Recurring    | Gate                            | Gate + lock                                 | Yes                                 | Gate                     | Low                                 |
| Inbox        | Gate + household                | Gate; UPDATE privilege limited to `read_at` | Member SELECT; no INSERT privilege  | Gate                     | Low                                 |
| Investments  | Gate; holdings filtered by HH   | Gate + DEFINER RPCs                         | SELECT-only tables; RPC writes      | Gate                     | Low (page guard P1)                 |
| Savings      | Gate + household + id           | Gate + RPC                                  | Yes                                 | Gate                     | Low IDOR; **P1** client idempotency |
| Loans        | Gate + household                | Gate + account eligibility                  | Yes                                 | Gate                     | Low                                 |
| Debts        | Gate + household                | Gate + RPC                                  | Yes                                 | Gate                     | Low; RPC `is_active` hygiene P2     |
| Together     | `requireTogetherMembership`     | Admin checks + role RPC                     | Member SELECT; lifecycle via RPC    | `membership.householdId` | Role parse P2                       |
| Health       | Via gated ledger/plan/inbox     | None (BR-24)                                | No health tables                    | Via dependents           | Low                                 |

Personal-scope **reads** are household-visible by design (`accounts_select_member` = any active member). Personal **writes** require owner match via `can_mutate_financial_resource`. That is not cross-household IDOR.

## 6. RLS Audit

Source of truth: `supabase/migrations/20260825125516_v1_baseline.sql` plus later policy tweaks (`20260905173951_request_dedup_and_rls_hotpaths.sql`, inbox column ACL). Live advisors on `family-finances-2` (8 Sep 2026):

- **All public tables have RLS enabled.**
- `market_sync_locks` / `market_sync_runs`: RLS on, **no policies**, **no authenticated grants** — intentional lockout (service_role / postgres only). INFO, not a hole.
- No views found (`CREATE VIEW` / `security_invoker` absent).

### 6.1 Important tables

| Table                                       | SELECT                          | INSERT        | UPDATE                             | DELETE        | Notes                                        |
| ------------------------------------------- | ------------------------------- | ------------- | ---------------------------------- | ------------- | -------------------------------------------- |
| accounts                                    | `active_membership_id(hh)`      | `can_mutate…` | USING + WITH CHECK mutate          | none          | Ownership immutable trigger                  |
| transactions                                | member                          | policy exists | policy exists                      | policy exists | **Privilege is SELECT-only**; writes via RPC |
| jars                                        | `is_household_member`           | member        | USING + CHECK                      | none          |                                              |
| goals                                       | `active_membership_id`          | mutate        | mutate                             | mutate        |                                              |
| savings                                     | `active_membership_id`          | mutate        | mutate                             | none          |                                              |
| investment_holdings (+ lots/ops/valuations) | member                          | none          | none                               | none          | RPC-only writes                              |
| loans / liabilities                         | member                          | mutate        | mutate                             | none          |                                              |
| debt_payments                               | member                          | none          | none                               | none          |                                              |
| inbox_items                                 | member                          | none          | member (privilege: `read_at` only) | none          |                                              |
| households                                  | member                          | none          | **no UPDATE policy**               | none          | UPDATE privilege exists but RLS denies       |
| household_members                           | member                          | none          | none                               | none          | Lifecycle RPCs                               |
| household_invitations                       | member **or** JWT email match   | none          | none                               | none          | Invitee can see own invite                   |
| market_instruments                          | `USING (true)` TO authenticated | none          | none                               | none          | Shared catalog                               |
| market_sync_*                               | no policies                     | —             | —                                  | —             | Locked                                       |

JWT email on invitations uses `auth.jwt() ->> 'email'` (Auth email claim), not `user_metadata`. Acceptable for invite preview.

`user_metadata` is **not** used in RLS authorization. Pass.

UPDATE policies on financial roots include **WITH CHECK**, so ownership cannot be reassigned through a table update.

Health has **no tables**. Read-only is enforced in `modules/health` (`HEALTH_BC_CONTRACT` + `health-readonly-shield.test.ts`).

## 7. RPC Security

Architecture: revoke-all then grant. Mutations are mostly **SECURITY DEFINER** with `auth.uid()` + household membership / `investment_active_household()` / ownership triggers. Reads that must honor RLS use **INVOKER**.

Hosted advisors flag **74** `authenticated` DEFINER functions. That lint is **expected** for this product’s write model. It is not 74 vulnerabilities. Residual is the subset that should **not** be a public RPC (helpers, unscoped lookups).

### 7.1 High-interest RPCs

| RPC                                                                        | Mode        | Caller                   | Auth                                | Household                                     | RLS                                     | Risk                     |
| -------------------------------------------------------------------------- | ----------- | ------------------------ | ----------------------------------- | --------------------------------------------- | --------------------------------------- | ------------------------ |
| `get_account_ledger_balances(uuid[])`                                      | **INVOKER** | authenticated            | via `investment_active_household()` | active HH filter; no `p_household_id`         | RLS applies                             | **Low**                  |
| `get_investment_home_summary_inputs()`                                     | INVOKER     | authenticated            | active HH                           | same                                          | RLS                                     | Low                      |
| `household_base_currency(uuid)`                                            | DEFINER     | authenticated            | **none**                            | **none**                                      | bypasses                                | **P2** currency leak     |
| `get_invitation_preview(uuid)`                                             | DEFINER     | **anon** + authenticated | token                               | n/a                                           | bypasses                                | Low if token unguessable |
| `create_debt` / `record_debt_payment` / `settle_card_payment`              | DEFINER     | authenticated            | `auth.uid()`                        | membership **without `is_active`**            | ownership triggers still require active | **P2**                   |
| `create_category` (latest)                                                 | DEFINER     | authenticated            | uid + active membership             | jar scoped to HH                              | bypasses                                | Low                      |
| `delete_transaction` / `update_transaction`                                | DEFINER     | authenticated            | n/a                                 | n/a                                           | always raise immutable                  | None                     |
| `admin_archive_financial_resource`                                         | DEFINER     | authenticated            | uid                                 | `can_admin_cleanup`                           | bypasses                                | Low                      |
| `change_household_member_role`                                             | DEFINER     | authenticated            | uid + `is_household_admin`          | target must be same HH; role enum fail-closed | bypasses                                | Low                      |
| `produce_inbox_item(..., p_household_id, ...)`                             | DEFINER     | authenticated            | uid                                 | `is_household_member`                         | bypasses                                | Low (member spam)        |
| `guard_cross_resource_mutation` / `guard_loan_payment_account_eligibility` | DEFINER     | **authenticated**        | trigger-oriented                    | via `assert_financial_mutation`               | callable as RPC                         | **P2** ACL hygiene       |
| `list_active_market_price_targets`                                         | INVOKER     | **service_role**         | none                                | global catalog                                | service_role                            | OK if not auth-granted   |
| `investment_operation_receipt`                                             | DEFINER     | postgres only            | —                                   | —                                             | would leak if granted                   | OK                       |
| `run_month_ritual_autolock_worker_all`                                     | DEFINER     | postgres / cron          | —                                   | all HH                                        | intentional                             | OK                       |

Live Postgres (`family-finances-2`) confirms:

- `get_account_ledger_balances`: `security_definer = false`, `authenticated=X`, search_path pinned
- `household_base_currency`: DEFINER, authenticated EXECUTE
- Guard triggers: DEFINER, authenticated EXECUTE

DEFINER helpers reviewed pin `SET search_path TO 'public'` (role-change RPC uses empty `search_path`, which is stricter). **Exception:** `savings_simple_interest` has mutable search_path (P3; IMMUTABLE, no table access).

No dynamic SQL (`EXECUTE format`) and no session `SET ROLE` found.

`p_household_id` on authenticated RPCs is generally re-checked with `is_household_member`. **Exception:** `household_base_currency`.

## 8. Balance RPC Security

Function: `get_account_ledger_balances(p_account_ids uuid[])`  
Migration: `supabase/migrations/20260908114845_get_account_ledger_balances.sql`  
App: `loadAccountLedgerBalances` → `LedgerRpcName.GET_ACCOUNT_LEDGER_BALANCES`

| Check                           | Result                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| Security mode                   | **INVOKER** (RLS on `accounts` / `transactions` applies)                                      |
| Household argument              | **Not accepted** — cannot spoof household                                                     |
| Household filter                | `a.household_id = public.investment_active_household()`                                       |
| `investment_active_household()` | DEFINER; requires `auth.uid()`; `is_active = true`; else raise                                |
| Caller ACL                      | REVOKE ALL from PUBLIC; GRANT EXECUTE to `authenticated` only (not anon)                      |
| App wiring                      | Passes `p_account_ids` only; `householdId` is logging context                                 |
| Service-role bypass             | App uses the user server client, not admin                                                    |
| Enumeration                     | Foreign UUIDs return **no rows** (not other-household balances). UUID space is not enumerable |
| Formula                         | Credit/debit/status lists match `applyTransactionDeltas`; covered by unit test                |

`getRealPosition` / `listAccounts` / `listGoals` load accounts with `gate.householdId`, then call this RPC. Foreign IDs in the array cannot return another household’s balances.

**Do not redesign.** Isolation is correct. Residual: `LIMIT 1` on active membership if the product ever allowed multiple active households (product constraint, not IDOR).

Tests: `tests/unit/account-ledger-balance-rpc.test.ts` (ACL + formula + no `p_household_id`).

## 9. IDOR Analysis

Canonical resource URLs use path params (`/money/accounts/[id]`, `/money/investments/[id]`, `/money/savings/[id]`, …), not `?id=`.

Pattern on reads (correct):

```text
client id → assertMoneyActionAllowed → SELECT … eq(id) AND eq(household_id, gate.householdId)
```

Missing row is `null` / `NOT_FOUND` / `ERROR` — it does **not** distinguish “exists in another household.” That is the right anti-enumeration behavior.

| Resource    | Evidence                                         |
| ----------- | ------------------------------------------------ |
| Account     | `list-accounts.ts` household + id                |
| Transaction | `get-transaction.ts:88-109`                      |
| Saving      | `list-savings.ts:180-197`                        |
| Loan / debt | `list-money-products.ts`, `debt-queries.ts`      |
| Investment  | `loadHoldings` household-scoped, then find by id |
| Jar / goal  | `list-jars.ts`, `list-goals.ts`                  |

Mutations re-check household and (where relevant) account eligibility / personal ownership. Example: `create-saving.ts` funding/settlement accounts must belong to the gated household.

T3 forged IDs: **reject / not found**. No confirmed cross-household IDOR.

Within-household personal rows are readable by partners; writes are owner-gated. Product design, not BOLA.

## 10. Server Actions

`"use server"` modules live under `app/[locale]/(product)/**/actions.ts` (and money/savings/investment variants). Typical shape: Zod parse → module command → opaque status/code. Authz lives in the command (`assertMoneyActionAllowed`), not in the UI.

Together `deleteAccountAction` → `deleteAccount()`: `getSessionUser` first, then Admin API `deleteUser(user.id)` only. Cannot delete another user.

Admin HTTP routes (`app/api/admin/market-*-sync`): Bearer secret via `hasAdminSyncSecret` (`timingSafeEqual`). Not session-based. Correct for cron.

Gaps:

| Item                                               | Sev | Notes                                                                                                                                       |
| -------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `listMarketInstrumentsAction`                      | P3  | No app gate; catalog RLS `TO authenticated USING (true)`. Unauth fails RLS. Any signed-in user may search global catalog (likely intended). |
| Some actions take typed input instead of `unknown` | P3  | Command Zod still runs.                                                                                                                     |
| Deprecated `recordInstallmentPaymentAction`        | P2  | Still an exported Server Action; mints a new UUID per call. UI does not import it.                                                          |

Revalidation is present on money/savings/inbox mutations.

## 11. Role Handling

Prior claim: “Role parse can fail-open to admin.”

**Confirmed in application code:**

```ts
// resolve-active-membership.ts:46
const role = data.role === "partner" ? "partner" : "admin";
```

Same mapping in `list-household-members.ts:78`.

| Layer             | Behavior                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| App parse         | Anything ≠ `"partner"` becomes `"admin"` (**fail-open**)                                                                                          |
| DB CHECK          | `household_members_role_check` allows only `'partner' \| 'admin'`                                                                                 |
| Role-change input | `z.enum(HOUSEHOLD_ROLE_VALUES)` — fail-closed                                                                                                     |
| Role-change RPC   | `v_role not in ('partner', 'admin')` → exception; actor must be `is_household_admin` (literal `role = 'admin'`); target scoped to actor household |

**Exploitability today:** not freely exploitable while the CHECK holds. Invalid DB values cannot exist. RPC admin checks use literal `'admin'`, so a garbage role would not pass SQL even if the app thought it was admin.

**Why it is still a finding:** Together UI and `changeHouseholdRole`’s pre-RPC `membership.role !== ADMIN` trust the parsed value. Fail-open is the wrong default if the CHECK is ever relaxed or a new role is added.

**Recommended remediation (smallest):** fail closed.

```text
admin → ADMIN
partner → PARTNER
else → reject membership / treat as unauthorized
```

Use `HOUSEHOLD_ROLE` constants; do not compare raw `"partner"`.

## 12. Idempotency

### 12.1 Create-saving (prior claim, re-verified after Phase 1)

| Layer                             | Status                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| Server schema                     | `idempotencyKey: z.string().uuid().optional()`                                           |
| RPC `create_saving_with_transfer` | Advisory lock + replay on `creationIdempotencyKey` / funding tx key **when key present** |
| Wizard                            | **Still broken**                                                                         |

```ts
// create-saving-wizard.tsx:584 (inside submit)
idempotencyKey: crypto.randomUUID(),
```

Every submit, including retry after error and double-click, gets a **new** key. Server uniqueness cannot collapse duplicates.

Safer patterns already in-repo:

- Loans: `idempotencyKey ?? crypto.randomUUID()` then `setIdempotencyKey` (`create-loan-form.tsx:202-203`)
- Investment opening: state-preserved key
- Transaction capture: key in `createDefaultValues` (survives retry on the same mount)

**Production risk:** real. Live deposit can transfer twice. Historical opening can create two products.

**Smallest fix:** hoist key into React state (loan pattern); keep until success; consider making the server key required.

### 12.2 Other

- `recordInstallmentPaymentAction` (deprecated export) mints a UUID per invocation.
- Optional keys on several RPCs mean omitting the key disables replay — acceptable only if the client always sends a stable key.

## 13. CSRF / Origin Protection

| Surface               | Protection                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| POST `/auth/signout`  | `isTrustedSameOriginMutation` (Origin, else Referer must match request origin). Tested in `auth-csrf-redirect.test.ts`. |
| Other cookie adapters | Confirm is GET/callback; `next` path hardened                                                                           |
| Server Actions        | Next.js 16 built-in Origin ↔ Host (`serverActions.allowedOrigins` **not** customized; default Host check)               |
| Admin sync routes     | Shared secret, not cookies                                                                                              |

Custom CSRF helper is **sign-out only**. That is correct: do not duplicate Origin checks on every Server Action.

Assumptions: the app is same-site; reverse proxies preserve `Host`; no extra action origins needed.

Gaps: any **future** cookie-mutating Route Handler must reuse the helper. No project CSP / extra CSRF tokens. P3 documentation, not a current Server Action hole.

## 14. Service Role

Factory: `modules/platform/supabase/admin.ts` — `import "server-only"`. Keys: `SUPABASE_SECRET_KEY` (preferred) or `SUPABASE_SERVICE_ROLE_KEY`.

| Usage                          | Auth before use                         | User input     | Client-reachable?  |
| ------------------------------ | --------------------------------------- | -------------- | ------------------ |
| `deleteAccount`                | `getSessionUser`; deletes **that** user | none           | No                 |
| Market catalog/price/FX sync   | Bearer `MARKET_*_SYNC_SECRET`           | validated body | HTTP + secret only |
| `listActiveMarketPriceTargets` | called from sync                        | none           | No                 |
| Scripts / e2e fixtures         | env on operator machine                 | n/a            | Not app runtime    |

No `NEXT_PUBLIC_` service role. Browser client uses publishable/anon key only (`browser.ts`).

**Pass.** Keep admin imports out of Client Components (already enforced by `server-only`).

## 15. Environment & Secrets

| Variable                                                  | Exposure                        |
| --------------------------------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                | Public (expected)               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `ANON_KEY`       | Public; RLS-bound               |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`       | Server-only; templates warn     |
| `MARKET_CATALOG_SYNC_SECRET` / `MARKET_PRICE_SYNC_SECRET` | Server-only                     |
| `GEMINI_API_KEY` / `AI_WORKER_SECRET`                     | Server-only (optional)          |
| `OWNERSHIP_TEST_*`                                        | Local test harness placeholders |

`.gitignore`: `.env*` with exceptions for `.env.local.example` and `.env.production.example`. Placeholders only in examples. No secret values in this report.

`getSupabaseEnv` treats `your-*` placeholders as unconfigured (fail-closed).

## 16. Error / Log Leakage

```ts
// log-action-failure.ts
console.error({ operation, error, context });
```

Call sites pass **raw** Supabase/provider `error` objects plus context such as `householdId`, `userId`, `accountId`, `savingId`, `transactionId`. `resolve-active-membership` logs `userId` on membership failure. Market sync logs parse errors.

User-facing actions generally return opaque codes (`INVALID`, `UNKNOWN`, domain codes) — **good**. The leak surface is **server logs / aggregators**, not the browser.

Also: `app/auth/signout/route.ts` swallows sign-out errors (empty catch) — no leak, but no signal.

**Recommended:** structured allow-list: `operation`, stable error `code`, maybe hashed ids. Never dump provider bodies, tokens, or emails.

Hosted Auth leaked-password protection is **disabled** (advisor WARN). Enable before production; that is Auth config, not app code.

## 17. Client / Server Boundary

| Check                                    | Result                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| Service credentials in Client Components | Not found                                                              |
| Browser Supabase                         | Publishable key only                                                   |
| Authorization decisions                  | UI `canMutate` / role is cosmetic; mutations re-checked server/RLS/RPC |
| Health                                   | `server-only` contract; no Supabase/commands/`.rpc(`                   |
| Financial formulas                       | Domain modules; client renders values                                  |

Investment/savings wizards are client forms that **submit** to Server Actions; they do not authorize.

**Pass** for credential and authz bypass. Product chrome without a session is a **route** issue (section 4), not a client leaking secrets.

## 18. Input Validation

Generally solid: Zod at command boundaries, UUID ids, enums from `*_VALUES`, integer positive amounts on savings, date `YYYY-MM-DD`, catalog search query max length + limit cap.

Trust model:

| Input                                               | Trust?                                                |
| --------------------------------------------------- | ----------------------------------------------------- |
| Session user (`getUser`)                            | Yes                                                   |
| `gate.householdId`                                  | Yes                                                   |
| Client amounts / account IDs / resource IDs / scope | Revalidated against household, eligibility, ownership |
| Client role on change-role                          | `z.enum(HOUSEHOLD_ROLE_VALUES)` then RPC              |
| Client `household_id`                               | Not an authorization field                            |

Do not change financial validation semantics. Optional idempotency keys are the main validation gap (section 12).

## 19. Sensitive Data Exposure

| Item                                                     | Classification                                           |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Account / holding / transaction fields on detail screens | Required for UI; household-gated                         |
| Member emails on Together                                | Required for household admin UX                          |
| Pending invitation `token` in admin list                 | Needed for invite links; keep admin-only (**P3**)        |
| `get_invitation_preview` → household name + invite email | Intentional token UX; UUID token                         |
| Health                                                   | Derived from gated domains; no extra store               |
| Extra server fields unused by a given screen             | Not treated as vulnerabilities unless they cross tenancy |

Investment detail still over-fetches lots/valuations for the household (performance leftover). Not a cross-household leak.

## 20. Security Regression Matrix

| Attack                        | Expected        | Current                                                                                | Evidence                                                                 | Severity               |
| ----------------------------- | --------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------- |
| Unauthenticated product route | redirect/reject | **Inconsistent** — most pages redirect; investment subtree renders chrome              | layout.tsx; investment pages; e2e covers `/money` only                   | **P1**                 |
| Household A → B read          | reject          | **Reject**                                                                             | gate + `.eq(household_id)` + RLS                                         | Pass                   |
| Household A → B mutation      | reject          | **Reject**                                                                             | gate + DEFINER membership/triggers                                       | Pass                   |
| Forged account / resource ID  | reject          | **Reject** (not found)                                                                 | `getSaving`, `getTransaction`, holdings find                             | Pass                   |
| Forged household ID           | reject / ignore | **Ignored** for authz (not a client field); `household_base_currency` is the exception | no Zod householdId; currency RPC                                         | **P2** (currency only) |
| Invalid role                  | reject          | **App fail-open**; DB CHECK + RPC fail-closed                                          | `resolve-active-membership.ts:46`; CHECK; `change_household_member_role` | **P2**                 |
| Repeated saving submit        | idempotent      | **Not idempotent** on client                                                           | wizard `:584`; RPC replay exists                                         | **P1**                 |
| Direct RPC abuse              | reject / scoped | **Mostly scoped**; currency helper unscoped; guards callable                           | live `proacl`; advisors                                                  | **P2**                 |
| Service-role exposure         | impossible      | **Impossible** from client                                                             | `server-only` admin.ts                                                   | Pass                   |
| Sensitive error leakage       | sanitized       | **Raw errors + IDs in logs**; UI opaque                                                | `log-action-failure.ts`                                                  | **P2**                 |

## 21. Prioritized Findings

### P0 — none

No confirmed cross-household data access, privilege escalation to another household, exposed service credentials, or unauthenticated financial mutation.

### P1 — must fix before production

| ID     | Finding                                                                                    | Evidence                                                                                                   | Why P1                                                                   |
| ------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| SEC-01 | Product layout is not an auth boundary; investment routes skip page-level session redirect | `(product)/layout.tsx`; `investments/[id]/page.tsx`; `investments/new/page.tsx`; `InvestmentOperationPage` | Inconsistent product auth guard; unauthenticated chrome; easy to regress |
| SEC-02 | Create-saving mints a new idempotency key on every submit                                  | `create-saving-wizard.tsx:584`; RPC replay only when key repeats                                           | Non-idempotent financial mutation; duplicate live transfers              |

### P2 — important hardening

| ID     | Finding                                                                                              | Evidence                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| SEC-03 | Role parse fail-opens to admin                                                                       | `resolve-active-membership.ts:46`, `list-household-members.ts:78`         |
| SEC-04 | `household_base_currency(p_household_id)` DEFINER, no membership check                               | baseline ~2268; live ACL authenticated; advisors                          |
| SEC-05 | `logActionFailure` prints raw errors plus resource/user/household IDs                                | `log-action-failure.ts`                                                   |
| SEC-06 | `create_debt` / `record_debt_payment` / `settle_card_payment` resolve membership without `is_active` | baseline ~5904, ~3937, ~3022; mitigated by ownership triggers             |
| SEC-07 | Trigger helpers EXECUTE-granted to `authenticated`                                                   | `guard_cross_resource_mutation`, `guard_loan_payment_account_eligibility` |
| SEC-08 | Hosted Auth leaked-password protection disabled                                                      | Supabase security advisor                                                 |
| SEC-09 | Session cookies `httpOnly: false`, `SameSite=Lax`, long maxAge (Supabase SSR default)                | `@supabase/ssr` defaults; XSS raises session-theft impact                 |
| SEC-10 | Deprecated `recordInstallmentPaymentAction` still exported; new UUID per call                        | `money-products-actions.ts:197-209`                                       |

### P3 — cleanup / defense-in-depth

| ID     | Finding                                                                                                                |
| ------ | ---------------------------------------------------------------------------------------------------------------------- |
| SEC-11 | CSRF helper only on sign-out (acceptable with Next Server Action Origin checks)                                        |
| SEC-12 | Invite tokens in admin pending-invitation payload                                                                      |
| SEC-13 | Some Server Actions take typed input instead of `unknown`                                                              |
| SEC-14 | `savings_simple_interest` mutable `search_path`                                                                        |
| SEC-15 | Most product pages omit `loginHrefWithNext` (Together has it)                                                          |
| SEC-16 | No CSP / security headers in `next.config.ts`                                                                          |
| SEC-17 | `LIMIT 1` active-membership selection if multiple actives ever exist                                                   |
| SEC-18 | `ownership-rls.test.ts` early `return` after `investment_holdings` skips later roots                                   |
| SEC-19 | Sign-out empty `catch`                                                                                                 |
| SEC-20 | `listMarketInstruments` has no app-level auth (catalog RLS only)                                                       |
| SEC-21 | DEFINER helpers `is_household_member` / `active_membership_id` are authenticated-callable (membership probe of a UUID) |

## 22. Recommended Remediation Sequence

Do **not** touch balance RPC / `loadAccountLedgerBalances` / financial formulas.

1. **SEC-01** — `requireProductSession` in `(product)/layout.tsx`; add e2e for investment routes. Keep `assertMoneyActionAllowed`.
2. **SEC-02** — loan-style stable idempotency key in create-saving wizard; add a component test that retries keep the same key.
3. **SEC-03** — fail-closed role parse + unit test that unexpected role does not become `admin`.
4. **SEC-04** — gate `household_base_currency` with `is_household_member` (or revoke authenticated EXECUTE and keep postgres-only).
5. **SEC-06** — add `AND is_active = true` (prefer `investment_active_household()`) on debt/card entrypoints.
6. **SEC-07** — revoke trigger EXECUTE from `authenticated`.
7. **SEC-05** — allow-listed `logActionFailure`.
8. **SEC-08 / SEC-09** — enable leaked-password protection; document cookie/XSS assumptions; optional shorter JWT TTL in hosted Auth.
9. **SEC-10** — remove or key-stabilize the deprecated installment action.
10. P3 items as a later hardening PR (CSP, `next` resume, search_path pin, test fix).

## 23. Focused Verification

Ran (50 passed / 13 files):

- `tests/unit/account-ledger-balance-rpc.test.ts`
- `tests/unit/rpc-acl-hardening.test.ts`
- `tests/unit/health-readonly-shield.test.ts`
- `tests/unit/ownership-rls.test.ts`
- `tests/unit/ownership-rpc.test.ts`
- `tests/unit/ownership-rpc-manifest.test.ts`
- `tests/unit/household-role.test.ts`
- `tests/unit/auth-csrf-redirect.test.ts`
- `tests/unit/auth-session.test.ts`
- `tests/unit/sign-out-delete.test.ts`
- `tests/unit/supabase-admin-env.test.ts`
- `tests/unit/plan-migration-hardening.test.ts`
- `tests/unit/debt-rpc-account-guard.test.ts`

Live: security advisors + `pg_proc` ACL on `family-finances-2`.

Did **not** run the full Vitest suite or Playwright (per audit instructions). E2E login smoke was reviewed in source, not re-executed here.

### Tests to add during remediation

| Gap              | Suggested test                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| SEC-01           | E2E: unauthenticated `/en/money/investments/new` and `/en/money/investments/<id>` → login                           |
| SEC-02           | Component: create-saving retry/double-submit reuses the same `idempotencyKey`                                       |
| SEC-03           | Unit: `resolveActiveMembership` rejects / does not map unexpected `role` to admin                                   |
| SEC-04           | SQL static: `household_base_currency` body contains `is_household_member` (or grant not to authenticated)           |
| SEC-06           | SQL static: `create_debt` / `record_debt_payment` / `settle_card_payment` include `is_active = true`                |
| Cross-HH runtime | Existing `scripts/ownership-test-harness.mjs` / Together e2e — keep as the live two-user check; not duplicated here |

## 24. Gate Verdict

### READY FOR SECURITY REMEDIATION

Not a production GO.

Household isolation, RLS, the new balance RPC, service-role boundary, and Server Action mutation gates are sufficient to enter a **focused P1/P2 remediation**. They are not sufficient to skip that work.
