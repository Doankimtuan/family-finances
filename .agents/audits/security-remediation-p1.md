# ViNha P1 Security Remediation

| Field        | Value                                             |
| ------------ | ------------------------------------------------- |
| Date         | 8 Sep 2026                                        |
| Scope        | Confirmed P1 findings only (SEC-01, SEC-02)       |
| Predecessor  | `.agents/audits/security-hardening-audit.md`      |
| Code changes | Auth route boundary + create-saving key lifecycle |
| Verdict      | P1 SECURITY REMEDIATION PASS                      |

This pass does **not** declare production readiness. P2/P3 findings were left untouched by design.

## 1. Findings addressed

- **P1-01 / SEC-01** Product authentication consistency
- **P1-02 / SEC-02** Create-saving retry idempotency

## 2. Root causes

### P1-01

Authentication was implemented page-by-page. `proxy.ts` only refreshes the session. `(product)/layout.tsx` mounted product chrome with no session check. Most product pages called `getSessionUser` and redirected to login, but the investment subtree (detail, new, operation/convert) skipped that page-level gate. Household data still failed closed through `assertMoneyActionAllowed`, but unauthenticated visitors could render product chrome.

### P1-02

`create-saving-wizard.tsx` minted `crypto.randomUUID()` inside the submit handler. Every click, network retry, or recoverable error retry sent a **new** key. Server replay on `create_saving_with_transfer` only collapses duplicates when the same `p_idempotency_key` repeats, so a new key defeated it.

## 3. Files changed

| File                                                                | Why                                                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `modules/tenancy/application/require-product-session.ts`            | Canonical product session/membership redirect helper. Reuses `getSessionUser` + `resolveActiveMembership`.   |
| `modules/tenancy/application/require-together-membership.ts`        | Thin wrapper around the canonical helper so Together keeps required `nextPath` without a second auth system. |
| `app/[locale]/(product)/layout.tsx`                                 | Route-group boundary: every product route inherits the session/membership redirect before chrome renders.    |
| `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx` | One idempotency key per wizard instance; retries reuse it.                                                   |
| `tests/unit/require-product-session.test.ts`                        | Unauthenticated / onboard / authenticated / locale / Together `next` coverage.                               |
| `tests/unit/product-layout-auth.test.ts`                            | Layout calls the canonical helper before chrome.                                                             |
| `tests/unit/create-saving-wizard.test.tsx`                          | Retry, double-submit, and new-operation key lifecycle.                                                       |
| `tests/unit/savings-commands.test.ts`                               | Command still forwards the same key to the RPC; existing success/error paths unchanged.                      |
| `tests/e2e/investment-auth.smoke.spec.ts`                           | Investment unauthenticated redirects, locale, public auth routes, authenticated continue.                    |
| `.agents/audits/security-remediation-p1.md`                         | This report.                                                                                                 |

Not changed: `proxy.ts`, `get_account_ledger_balances`, RLS, RPC authorization, financial formulas, investment pages themselves, create-saving schema/RPC payload shape (except client key lifecycle).

## 4. Authentication flow

Final protection boundary: **`(product)` route-group layout**.

```text
proxy.ts          → locale + session refresh only (unchanged)
(auth)/(onboard)/(invite)/(system) → not wrapped by product layout
(product)/layout  → requireProductSession
                     unauthenticated → APP_PATH.LOGIN
                     no membership   → APP_PATH.ONBOARD
                     member          → product chrome
page-level gates  → retained (cached getSessionUser)
queries/commands  → assertMoneyActionAllowed unchanged
```

This is the smallest correct centralization:

- Public auth/onboarding/invite/system live in other route groups, so they stay public.
- Investment detail / new / buy|sell|income|valuation / convert inherit the guard without per-page `getUser()` copies.
- `requireTogetherMembership` is not a second system: it calls `requireProductSession` and still requires `nextPath` for Together resume links when that helper runs.
- Unauthenticated product visits (including Together) now redirect at the layout. Together `loginHrefWithNext` still applies when Together pages themselves invoke the helper (authenticated membership checks). Layout-level unauthenticated redirects match the majority product pattern (`APP_PATH.LOGIN` without `next`).
- `getSessionUser` remains React `cache()`; page-level checks are not duplicate network auth.

Live unauthenticated checks against the running app:

| Path                                                              | Result                                              |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| `/en/money/investments/new`                                       | 307 → `/en/login`                                   |
| `/en/money/investments/<id>`                                      | 307 → `/en/login`                                   |
| `/en/money/investments/<id>/buy`                                  | 307 → `/en/login`                                   |
| `/en/money/investments/convert`                                   | 307 → `/en/login`                                   |
| `/vi/money/investments/new`                                       | 307 → `/vi/login`                                   |
| `/en/money`, `/en/home`                                           | 307 → `/en/login` (unchanged)                       |
| `/en/login`, `/en/register`, `/en/forgot-password`, `/en/welcome` | 200                                                 |
| `/en/auth/confirm`                                                | 200                                                 |
| `/en/together/onboard`                                            | 307 → `/en/login` (existing onboard entry behavior) |

## 5. Idempotency lifecycle

| Step          | Behavior                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Where created | `useState(() => crypto.randomUUID())` when the create-saving wizard mounts                              |
| Where stored  | Component state for that wizard instance only                                                           |
| Reused        | Every submit/retry/double-click of the same mounted wizard sends the same `idempotencyKey`              |
| New key       | A new visit to the create flow mounts a new wizard and therefore a new key                              |
| Server        | Unchanged: `createSaving` still passes `p_idempotency_key`; RPC replay still depends on a repeating key |
| Not done      | No global/persisted key; no schema/RPC change; key is not minted in the Server Action                   |

```text
Create Saving (wizard mount) → key = X
submit / retry / double-click → key = X
success → navigate away (instance unmounts)
Create another Saving → new mount → key = Y
```

## 6. Security invariants preserved

Confirmed **not** weakened:

- Household isolation and membership checks (`resolveActiveMembership`, `assertMoneyActionAllowed`)
- `getUser()` session semantics (`getSessionUser` → `supabase.auth.getUser()`)
- RLS policies and SECURITY INVOKER RPC behavior
- `investment_active_household()` / `get_account_ledger_balances` (untouched)
- Service-role server-only boundary
- Server Action authorization still lives in commands
- Financial calculations and database constraints unchanged

No authorization check was loosened to make the layout or wizard change easier.

## 7. Tests

### Focused unit

| File                                         | Result                |
| -------------------------------------------- | --------------------- |
| `tests/unit/require-product-session.test.ts` | 6 passed              |
| `tests/unit/product-layout-auth.test.ts`     | 2 passed              |
| `tests/unit/create-saving-wizard.test.tsx`   | 12 passed             |
| `tests/unit/savings-commands.test.ts`        | 10 passed             |
| `tests/unit/auth-session.test.ts`            | 9 passed (regression) |
| `tests/unit/auth-csrf-redirect.test.ts`      | 6 passed (regression) |

**45 passed / 0 failed** in the focused Vitest run (30 in the later lint-gated subset after the wizard key change).

### Typecheck / lint

- `npx tsc --noEmit` — pass
- Targeted ESLint on the changed files — pass

### E2E

Playwright could not launch in this environment (Chromium headless shell missing from the local Playwright cache). Investment unauthenticated redirects and public-route reachability were verified with HTTP HEAD against the running app instead (section 4). The new spec `tests/e2e/investment-auth.smoke.spec.ts` is in place for CI / a machine with Playwright browsers installed.

## 8. Scope check

P2/P3 findings from the hardening audit were **intentionally left untouched**, including:

- SEC-03 role parse fail-open
- SEC-04 `household_base_currency` DEFINER leak
- SEC-05 raw action-error logging
- SEC-06 debt/card RPC `is_active` hygiene
- SEC-07 trigger EXECUTE grants
- SEC-08 leaked-password protection
- SEC-09 cookie flags
- SEC-10 deprecated installment action
- All P3 items

`get_account_ledger_balances` was not modified.

## 9. Final verdict

P1 SECURITY REMEDIATION PASS
