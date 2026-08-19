# Family Finance — V1 Release Readiness Audit (15A)

Date: 2026-08-18

Audit target: configured Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`), repository `main` at commit `404a064`.

## 1. Executive summary

The repository builds and its unit suite is green, and the configured remote database is migration-aligned with local migration files. The ownership/Together reports remain useful for the certified paths, and the clean integrity queries returned zero impossible-state rows.

The release is not ready. The live Supabase security advisor reports 58 `SECURITY DEFINER` functions executable by `anon`; several exposed functions are privileged helpers/workers with no `auth.uid()` or `auth.jwt()` check. Examples include loan schedule writers, savings-product account creation, and month-ritual autolock workers. This is a release-blocking authorization/data-integrity exposure.

The authenticated browser smoke suite is also not release-ready. The configured generic E2E identity returns `invalid_credentials`; the full suite had 54 passed, 45 failed, and 2 not run. A rerun with the valid isolated ownership fixture passed core Home, Plan, and Money capture paths but still had 8 failures, including a missing Savings RPC, duplicate test IDs, missing expected controls/copy, and a transfer route mismatch.

## 2. Release decision

**V1 RELEASE BLOCKED**

Blocking reason: P0-001, unintended anonymous execution of privileged `SECURITY DEFINER` functions, including unguarded functions that can mutate financial or household state.

## 3. Current V1 product inventory

| Feature                   | Main route                                                            | Primary mutation path                                                         | Current status                                                                                   | Evidence                               |
| ------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Authentication/onboarding | `/[locale]/login`, `/[locale]/register`, `/[locale]/together/onboard` | Supabase Auth; `create_household_with_essentials`                             | Implemented; public/auth-shell tests pass; generic E2E identity is invalid                       | App routes, auth tests, Playwright     |
| Household setup           | `/[locale]/together/onboard`                                          | `create_household_with_essentials`                                            | Implemented; seeds account, jars, categories, Plan configuration                                 | `create-household.ts`, onboarding flow |
| Together                  | `/[locale]/together/*`                                                | invitation, role, leave, remove RPCs                                          | Certified 14F/14G; current lifecycle browser assertion still fails after role transfer           | 14F/14G reports; E2E                   |
| Money/accounts            | `/[locale]/money`, `/money/accounts`                                  | trusted account command/direct insert                                         | Implemented; ownership model present; authenticated browser coverage partial                     | 14E report, unit tests                 |
| Transactions/transfers    | `/money/transactions`                                                 | `record_transaction`, `record_owned_account_transfer`, refund/correction RPCs | Ledger model and idempotent transfer path present; browser smoke incomplete                      | ledger tests, migrations, E2E          |
| Credit cards              | `/money/cards`, account detail                                        | card settlement/installment RPCs                                              | Implemented in current routes and migrations; browser auth gating prevented full validation      | route inventory, card tests            |
| Savings                   | `/money/savings`                                                      | savings lifecycle RPCs and Inbox workflows                                    | Implemented, but current page calls missing `backfill_legacy_savings_accounts` and logs PGRST202 | savings code, live server log          |
| Investments               | `/money/investments/*`                                                | investment lifecycle RPCs                                                     | Per-unit quantity/price model implemented; browser mutation path not fully validated             | investment modules/tests               |
| Loans                     | `/money/loans/*`                                                      | loan creation/payment/status RPCs                                             | Implemented with schedule and payment safety; exposed helper ACL remains blocking                | loan migrations/tests                  |
| Liabilities/debts         | `/money/debts/*`                                                      | debt/liability payment RPCs                                                   | Implemented with ownership/read-only behavior                                                    | ledger modules/tests                   |
| Goals                     | `/plan/goals/*`                                                       | goal actions and funding links                                                | Household-only V1; funded value is derived from supported sources                                | Plan modules/tests                     |
| Plan                      | `/plan/*`                                                             | jar, review, movement, goal funding RPCs                                      | Household-only behavior implemented; live Plan hub smoke passed with isolated fixture            | Plan modules/tests/E2E                 |
| Health                    | `/health/*`                                                           | read-only aggregation                                                         | Read-only contract preserved; no Health writes                                                   | Health tests/code                      |
| Inbox                     | `/inbox`, `/inbox/[id]`                                               | producer gateway and decision RPCs                                            | Canonical six-kind taxonomy present; authenticated browser coverage incomplete                   | 13A–13D reports, Inbox tests           |
| Settings/preferences      | `/together/settings`, `/together/preferences`                         | preference/policy RPCs                                                        | Implemented; authenticated smoke not fully green                                                 | route inventory/tests                  |

No current Money, Plan, Health, Goals, Savings, Investments, Loans, or architecture-specific report exists under `.agents/reports`; current code, migrations, tests, live DB, and the latest ownership/Inbox/Together reports were used instead of inventing stale report names.

## 4. Critical user journeys

| Journey                 | Current evidence                                                                                                               | Status    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| A. First-time household | Onboarding route and household RPC exist; public shell passes; authenticated generic user is invalid                           | PARTIAL   |
| B. Household money      | Unit/ledger tests pass; Money capture passes with isolated fixture; full browser account/transfer flow incomplete              | PARTIAL   |
| C. Personal money       | 14E live A/B checks and ownership harness pass; Together fixture cleanup pass                                                  | READY     |
| D. Transfer             | RPC is idempotent and atomic by code; current browser transfer smoke fails at account route rendering                          | NOT READY |
| E. Savings              | Domain tests pass; live page logs missing backfill RPC; full lifecycle browser path not green                                  | NOT READY |
| F. Investment           | Quantity/unit-price model and unit tests pass; authenticated browser buy path fails before expected opening-position assertion | PARTIAL   |
| G. Loan/debt            | Unit and ownership reports cover payment safety; current complete browser path not green                                       | PARTIAL   |
| H. Goal                 | Goal source/link unit tests and ownership validation pass; full browser path not green                                         | PARTIAL   |
| I. Plan                 | Unit suite and isolated Plan hub smoke pass; full household/personal exclusion browser run not green                           | PARTIAL   |
| J. Health               | Read-only tests pass; authenticated Health smoke hit a duplicate `ledger-balance` test ID                                      | PARTIAL   |
| K. Inbox                | Canonical producer/decision tests pass; authenticated queue smoke did not find expected decision copy                          | PARTIAL   |
| L. Together             | 14F/14G certification exists; current authenticated lifecycle failed at leave control after role transfer                      | NOT READY |

## 5. Financial correctness audit

The canonical ledger remains the financial source of truth for account cash movement. Transactions carry explicit type, status, reversal/correction links, transfer group, and idempotency keys. Savings and investment flows project through transactions/RPCs rather than inventing independent cash balances. Goals own links and derived progress rather than a new financial source.

Positive evidence:

- Unit suite: 119 files, 898 tests passed.
- Clean live integrity query returned zero violations for ownership scope, cross-household owners, membership capacity/admin continuity, loan bounds, active goal links, dangling Inbox sources, saving cycle dates, and goal legacy mismatch.
- Transfer RPC source/destination legs and replay behavior are explicit in the deployed function definition.
- Investment quantity is stored as a decimal string and operation schemas distinguish quantity, unit price, and executed value.
- V1 currency policy is intentionally VND-only at household boundaries: onboarding defaults VND, household preference schema accepts only VND, and investment reporting uses VND. No FX engine is implied by this audit.

Financial correctness is **NOT READY** because P0-001 exposes privileged financial/household mutation helpers to `anon` without authentication checks. No observed production data corruption was found in the integrity snapshot, but the callable surface can create or rewrite state outside the intended authenticated path.

## 6. Domain-by-domain readiness

Accounts, transactions, transfers, cards, savings, investments, loans, liabilities, goals, Plan, Health, and Inbox have current application modules, migrations, and unit coverage. The strongest remaining gaps are not missing domain foundations; they are live ACL hardening, Savings compatibility drift, and incomplete authenticated browser validation.

The current implementation keeps Personal resources household-visible and owner-controlled. Personal goals remain deferred. Plan excludes personal activity where certified. Health includes visible personal resources. Household deletion remains intentionally deferred.

## 7. Inbox/Together/ownership readiness

The 13A–13D reports establish the canonical Inbox kinds:

`unmapped_expense`, `income_suggest`, `savings_maturity`, `early_withdrawal_confirmation`, `emi_complete`, and `emergency_declaration`.

The 14E–14G reports establish the ownership and lifecycle contract: two active adults, Admin/Partner roles, personal resources remain visible, former-member resources remain read-only, and no ownership transfer or hidden finance was added. Those contracts are consistent with current code and live integrity checks.

The current Together lifecycle smoke did not reproduce the full final path: after role transfer, `together-leave-member` was not visible. Treat this as P1 until the fixture and current role/leave UI are reconciled.

## 8. Security/RLS/RPC audit

Live security advisor result: 140 notices total:

- 58 `anon_security_definer_function_executable` warnings;
- 80 `authenticated_security_definer_function_executable` warnings;
- 1 mutable `search_path` warning;
- 1 leaked-password-protection informational warning.

The database has RLS enabled on all 47 inspected public tables. Anonymous table grants exist for the exposed Data API surface, but RLS is enabled; the more serious issue is the function ACL surface.

The deployed SECURITY DEFINER inventory contains 84 functions. 58 are executable by `anon`; 80 are executable by `authenticated`. Most functions pin `search_path=public`, but current metadata and definitions show unguarded anonymous-callable functions including:

- `_loan_insert_rate_periods` — deletes/inserts loan rate periods from caller-supplied IDs;
- `_loan_insert_schedule_entries` — deletes/inserts loan schedule entries;
- `_loan_replace_upcoming_schedule` — deletes/replaces upcoming loan schedule entries;
- `get_or_create_savings_product_account` — can create a savings-product account for a supplied household ID;
- `run_month_ritual_autolock_for_household` and `run_month_ritual_autolock_worker_all` — mutate month ritual/autolock state without an auth check;
- `can_mutate_financial_resource` — privileged helper exposed to `anon`, though it fail-closes for anonymous `auth.uid()`.

`record_transaction` and `record_owned_account_transfer` do contain authentication checks and idempotency logic. The finding is specifically the unintended public callable surface and unguarded helpers, not a claim that every listed RPC bypasses authorization.

## 9. Supabase advisor findings

P0-001 is the security advisor result above. The old report assumptions were verified rather than reused: `transactions_set_is_reversal` still has a mutable role search path, but it is a non-SECURITY-DEFINER trigger function that only sets a reversal flag. It remains P1 hardening, not a second P0.

Performance advisors reported 119 notices: 90 unindexed foreign keys, 28 unused indexes, and 1 RLS init-plan warning. These are P2 scale debt for current V1 usage, not release blockers.

## 10. Migration/replay readiness

Migration alignment is READY:

- Local migration files: 88.
- Remote migration history: 88.
- Local and remote versions: exact match.
- `supabase migration list`: aligned.
- `supabase db push --linked --dry-run`: remote database is up to date.

A true clean local-schema replay was not executed. This checkout has migrations and Supabase temporary link metadata but no `supabase/config.toml` or verified disposable local database. Fresh-DB replay remains P2 verification debt; the remote deployment path itself is aligned.

## 11. Data integrity

The bounded live integrity query returned zero rows for all inspected checks:

- ownership scope/owner contract;
- cross-household owner membership;
- active household capacity and Admin continuity;
- duplicate active user membership;
- loan remaining-principal bounds;
- invalid active goal funding links;
- dangling pending Inbox transaction/saving/loan sources;
- invalid saving cycle dates;
- goal legacy funded-value mismatch.

No data mutation was performed by the integrity audit. The isolated ownership harness was set up for browser validation and then cleaned successfully; its auth identities were retained, but its controlled household was removed.

## 12. Auth/session readiness

Public auth screens, redirect guards, CSRF sign-out behavior, OAuth entry, and invalid-credential error UI passed their available browser tests. The configured `E2E_USER_EMAIL`/`E2E_USER_PASSWORD` pair returns HTTP 400 `invalid_credentials`; this caused the majority of authenticated full-suite failures. The dedicated ownership A/B identities return HTTP 200 and were used for the bounded rerun.

The code paths for former-member leave/remove/rejoin are present, but the final authenticated role/leave browser assertion is not green.

## 13. UX/empty/loading/error states

Shared empty, loading, error, shell, form, and offline patterns exist. Unit tests cover typed error mapping and the public system shells. The live browser pass found no evidence of raw SQL text being rendered to users, but server logs exposed the expected diagnostic PGRST202 for the missing Savings RPC.

The browser pass also found duplicate DOM test IDs on several authenticated pages (`ledger-balance`, `money-transactions`, and `money-savings`) and missing expected controls/copy in current smoke contracts. These are release-hardening issues because they prevent reliable verification of critical paths, even where the underlying route renders.

## 14. Responsive/localization/accessibility

Public/login visual evidence passed at 390px, 440px, 768px, and 1280px. Existing 14E/14G evidence covers ownership and Together surfaces at the required widths. Authenticated current-route evidence is incomplete because the generic identity was invalid and the isolated rerun had the failures above.

English/Vietnamese route and key coverage exists in the current code and tests. Current browser failures do not establish a broad localization regression. Accessibility primitives, labels, focus behavior, and non-color ownership states are covered by existing reports/tests; a complete authenticated dialog/keyboard pass remains unverified.

## 15. E2E/release smoke coverage

The repository contains 42 E2E spec files. The full configured run executed 101 tests: 54 passed, 45 failed, and 2 did not run. The failures were predominantly authenticated tests stopping at `/en/login` because the configured generic identity is invalid.

A bounded rerun with an isolated valid A/B fixture executed 22 tests: 13 passed, 8 failed, and 1 skipped. Passing coverage included Home, Plan hub, Money capture, public auth redirects, and the isolated fixture setup/cleanup. Failing coverage included Health, Inbox, Investments, account creation, products, transactions, Savings, and transfer.

Critical E2E is **NOT READY**.

## 16. Performance/index sanity

No obvious N+1 or unbounded-list failure was established by the bounded code/live review. The performance advisor's 90 unindexed foreign-key notices and 28 unused indexes should be reviewed after release hardening, using actual query plans and usage rather than blindly adding indexes.

## 17. Configuration/secrets

Required runtime configuration is represented by `.env.local` and `.env.local.example`. Public browser configuration uses `NEXT_PUBLIC_SUPABASE_URL` and a publishable/anon key. Server-only code reads `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`; the repository scan did not find a privileged key under `NEXT_PUBLIC_*` or in app code. E2E and ownership identities are explicitly development/test configuration.

No secret values are reproduced in this report.

## 18. Repository hygiene

Initial worktree was clean. The audit generated/updated tracked Playwright evidence under `output/playwright/` and ignored test-results artifacts. No `.env` file is tracked by the current status output, and no secret was added.

`npm run format:check` fails on the repository baseline with 2,205 files, including archived artifacts and unrelated modules. `git diff --check` passes. This formatting backlog is reported separately and is not itself a release blocker.

## 19. P0 findings

### P0-001 — Anonymous execution of unguarded SECURITY DEFINER financial helpers

- Severity: P0
- Domain: Security, database, financial correctness
- Evidence: live Supabase security advisor reports 58 anonymous-executable SECURITY DEFINER functions; live `pg_proc` inventory reports 84 SECURITY DEFINER functions and identifies unguarded loan schedule writers, savings-product account creation, and month-ritual workers.
- Impact: an unauthenticated caller who knows or obtains IDs can invoke privileged functions outside the intended authenticated ownership boundary, potentially creating or rewriting financial/household state.
- Recommended action: revoke `EXECUTE` from `anon` and `PUBLIC` for internal helpers/workers; add explicit authenticated/role checks where the function is a real public RPC; keep pinned `search_path`; rerun the protected RPC manifest and live negative/positive authorization matrix.
- Release blocking: yes.

## 20. P1 findings

### P1-001 — `transactions_set_is_reversal` has mutable search_path

- Severity: P1
- Domain: Security/RPC hardening
- Evidence: current security advisor; deployed function is `SECURITY INVOKER` but has no pinned search path.
- Impact: security hardening gap in a public-schema function.
- Recommended action: pin the function search path in a narrow migration and rerun advisors.
- Release blocking: no, unless the function is later made SECURITY DEFINER.

### P1-002 — Savings calls a missing deployed RPC

- Severity: P1
- Domain: Savings/deployment drift
- Evidence: isolated authenticated browser run logged PGRST202 for `public.backfill_legacy_savings_accounts(p_household_id)`; the application constant and command still call this RPC, but no deployed function exists.
- Impact: every Savings lifecycle sync produces a server error and the legacy compatibility step never completes. Current code intentionally continues to maturity detection, so this is not currently proven to corrupt cash.
- Recommended action: either deploy the intended compatibility RPC or remove the stale call and its compatibility path after confirming no supported data requires it.
- Release blocking: no, but fix before broad V1 release hardening.

### P1-003 — Default E2E identity is invalid

- Severity: P1
- Domain: Release verification/auth test infrastructure
- Evidence: direct Supabase password check returned HTTP 400 `invalid_credentials` for `E2E_USER`; 45 of 101 full-suite tests failed at `/en/login`.
- Impact: the configured critical browser gate cannot exercise authenticated V1 paths.
- Recommended action: provision/reset a dedicated deterministic E2E household identity and keep production/test credentials separate.
- Release blocking: no by itself; critical E2E remains NOT READY until fixed.

### P1-004 — Valid-fixture authenticated smoke still has 8 failures

- Severity: P1
- Domain: Browser critical paths
- Evidence: 22-test isolated rerun had 13 passed, 8 failed, 1 skipped. Failures include duplicate test IDs, missing Inbox copy, missing account control, missing product copy, missing Savings compatibility RPC, and transfer route rendering.
- Impact: critical Money, Savings, Investments, Health, Inbox, and Transfer journeys cannot be certified in the real browser.
- Recommended action: stabilize one bounded smoke suite against the isolated fixture; fix product regressions and update brittle selectors only where the current UI contract intentionally changed.
- Release blocking: no by itself; combined with P0-001 it contributes to the blocked verdict.

### P1-005 — Together role-transfer/leave browser contract is not green

- Severity: P1
- Domain: Together lifecycle
- Evidence: `together-lifecycle.authenticated.spec.ts` failed after role transfer because `together-leave-member` was not visible.
- Impact: the Admin continuity and leave/rejoin journey is not currently proven in the final implementation.
- Recommended action: reconcile the current role-transfer state machine, UI affordance, and authenticated fixture; rerun the complete lifecycle.
- Release blocking: no, pending a reproducible product regression.

### P1-006 — Four high dependency audit findings

- Severity: P1
- Domain: Release/security supply chain
- Evidence: `npm audit --omit=dev --audit-level=high` reports high issues in `nanoid`, Next.js 16.1.6 dependency graph, PostCSS, and sharp. The suggested Next fix is outside the declared range and was not applied during 15A.
- Impact: known high-severity vulnerabilities remain in the production dependency graph.
- Recommended action: run a separately bounded dependency upgrade, validate Next build/E2E, and review whether the advisory exposure applies to deployed routes.
- Release blocking: no automatic P0 classification; security owner must accept or remediate before production release.

## 21. P2 debt

### P2-001 — Performance advisor backlog

119 current performance notices: 90 unindexed foreign keys, 28 unused indexes, and 1 RLS init-plan warning. Review with query plans and real usage.

### P2-002 — Repository-wide formatting backlog

`npm run format:check` reports 2,205 files, much of it archived or unrelated baseline content. Do not mix this into the release-hardening change.

### P2-003 — Clean local replay evidence is unavailable

Remote/local migration history aligns exactly and `db push --dry-run` is clean, but no disposable local Supabase config/database exists in this checkout for a zero-to-current replay.

### P2-004 — Conditional E2E coverage remains data/fixture gated

Many product specs use `test.skip` when credentials, household data, jars, or source resources are unavailable. Keep the skip policy for genuinely unavailable fixtures, but make the release smoke suite deterministic and report skipped critical flows explicitly.

## 22. Final release matrix

| Area                | Functional                                         | Financial correctness                                      | Security                          | Browser                               | Release status               |
| ------------------- | -------------------------------------------------- | ---------------------------------------------------------- | --------------------------------- | ------------------------------------- | ---------------------------- |
| Auth/onboarding     | PASS for public/auth shells                        | PASS                                                       | PASS for tested guards            | Authenticated generic fixture invalid | READY WITH NON-BLOCKING DEBT |
| Money               | Partial                                            | Partial; ledger unit tests pass                            | Blocked by P0 RPC ACL             | Authenticated coverage incomplete     | BLOCKED                      |
| Cards               | Implemented                                        | Unit/domain coverage present                               | P0 RPC ACL applies                | Authenticated coverage incomplete     | READY WITH NON-BLOCKING DEBT |
| Savings             | Partial; missing backfill RPC                      | No corruption observed; lifecycle compatibility incomplete | P0 RPC ACL applies                | Smoke fails                           | BLOCKED                      |
| Investments         | Implemented                                        | Quantity/unit-price tests pass                             | P0 RPC ACL applies                | Buy path fails                        | READY WITH NON-BLOCKING DEBT |
| Loans               | Implemented                                        | Payment/schedule tests and ownership evidence              | Exposed unguarded helper is P0    | Full browser path incomplete          | BLOCKED                      |
| Liabilities         | Implemented                                        | Ownership/payment tests pass                               | P0 RPC ACL applies                | Browser incomplete                    | READY WITH NON-BLOCKING DEBT |
| Goals               | Implemented, household-only                        | Source-link tests pass                                     | P0 RPC ACL applies                | Browser incomplete                    | READY WITH NON-BLOCKING DEBT |
| Plan                | Implemented, household-only                        | Unit tests and isolated hub pass                           | P0 RPC ACL applies                | Full browser incomplete               | READY WITH NON-BLOCKING DEBT |
| Health              | Read-only implemented                              | Aggregation tests pass                                     | P0 RPC ACL applies to shared data | Duplicate-ID smoke failure            | READY WITH NON-BLOCKING DEBT |
| Inbox               | Canonical taxonomy/gateway implemented             | Source-domain tests pass                                   | P0 RPC ACL applies                | Authenticated queue incomplete        | READY WITH NON-BLOCKING DEBT |
| Together            | 14F/14G certified contract                         | Ownership integrity checks pass                            | P0 RPC ACL applies                | Leave flow assertion fails            | BLOCKED                      |
| Ownership           | Certified A/B live matrix and integrity query pass | Scope/owner data clean                                     | P0 broader RPC surface remains    | Fixture setup/cleanup pass            | BLOCKED                      |
| Database/migrations | 88/88 aligned; dry-run clean                       | Integrity query clean                                      | Advisors blocked                  | Clean local replay unavailable        | READY WITH NON-BLOCKING DEBT |

## 23. Required fixes before release

1. Close P0-001: revoke anonymous/Public execution for internal SECURITY DEFINER functions, add explicit auth/role checks to any intentionally callable RPC, and rerun the security advisor plus protected RPC manifest.
2. Resolve the Savings missing-RPC drift.
3. Provision a deterministic valid E2E household identity and make the bounded critical smoke suite green.
4. Reconcile the Together role-transfer/leave lifecycle assertion.
5. Review and remediate or explicitly accept the four high dependency advisories.

## 24. Recommended next prompt

**Prompt 15B — RPC ACL & SECURITY DEFINER Hardening**, followed by a bounded **V1 Critical Flow Stabilization** prompt for the Savings/browser failures.

## 25. Final verdict

PROMPT 15A COMPLETE

V1 release: **BLOCKED**

P0 blockers: **1**

P1 findings: **6**

P2 findings: **4**

Financial correctness: **NOT READY**

Security: **NOT READY**

Migrations: **READY**

Critical E2E: **NOT READY**

Money: **NOT READY**

Savings: **NOT READY**

Investments: **NOT READY**

Loans/Liabilities: **NOT READY**

Goals: **READY**

Plan: **READY**

Health: **READY**

Inbox: **NOT READY**

Together: **NOT READY**

Ownership: **NOT READY**

Required fixes before release: close P0-001, resolve Savings RPC drift, restore deterministic authenticated smoke coverage, reconcile Together leave flow, and review high dependency advisories.

Recommended next prompt: Prompt 15B — RPC ACL & SECURITY DEFINER Hardening.
