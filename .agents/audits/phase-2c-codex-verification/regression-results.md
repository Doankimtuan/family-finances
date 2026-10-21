# Phase 2C — Regression Results

## Checks run after local policy migration/test changes

| Check                                                                                      | Expected                                                                     | Observed                                                                                            | Result |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| `npx vitest run tests/unit/rpc-acl-hardening.test.ts tests/unit/loan-amortization.test.ts` | RPC migration contract and amortization regressions pass                     | 2 files, 19 tests passed.                                                                           | PASS   |
| `npm run migrations:validate`                                                              | Frozen baseline and forward migration ordering valid                         | Migration freeze valid; 32 forward migrations.                                                      | PASS   |
| `npm run typecheck`                                                                        | TypeScript clean                                                             | `tsc --noEmit` exited 0.                                                                            | PASS   |
| `npx eslint tests/unit/rpc-acl-hardening.test.ts`                                          | Changed test file lint clean                                                 | Exited 0.                                                                                           | PASS   |
| `npx prettier --check tests/unit/rpc-acl-hardening.test.ts`                                | Changed TypeScript file formatted                                            | Passed.                                                                                             | PASS   |
| `git diff --check`                                                                         | No whitespace errors                                                         | Passed.                                                                                             | PASS   |
| Browser/API F3 lifecycle                                                                   | Buy/sell, replay, refresh, aggregation, shared access, liquidation reconcile | Full isolated browser run and authenticated replay passed; see [investment E2E](investment-e2e.md). | PASS   |
| Browser/API F4 happy path and malformed inputs                                             | Loan creation and constraints work                                           | Valid RPC and app workflows passed; malformed inputs rolled back.                                   | PASS   |
| Manipulated amortization schedule                                                          | Reject rate-policy mismatch                                                  | Live RPC accepted zero interest for 12% annual rate.                                                | FAIL   |

The follow-up migration is only statically covered; it was not applied or executed by PostgreSQL because the brief does not authorize that additional schema change. The contract test checks that rate-derived interest and fixed-payment formulas are compared before schedule insertion and that rate periods are matched to loan terms. It does not prove the database function compiles or rejects the exploit at runtime.

## Prior results retained from Phase 2B

The prior full suite reported 270 files and 1,860 tests passing. Lint, typecheck, production build, migration validation, and scoped formatting also passed then. They were not all repeated in Phase 2C; the current TypeScript check, focused tests, migration validator, and changed-file formatting/lint were rerun after local changes. Phase 2B repository-wide `npm run format:check` reported 198 unrelated files; no repository-wide reformat was run.

No default Playwright global setup was run because it provisions and removes auth/household fixtures. The Phase 2C browser workflows used existing test users and explicit run-scoped data instead.
