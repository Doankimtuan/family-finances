# Phase 2 — Regression Results

## Executed checks

| Check                                                                                                                                                                                                                                                                                             | Result                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Focused investment/loan regression: `npm run test -- tests/unit/market-valuation.test.ts tests/unit/investment-lifecycle.test.ts tests/unit/investment-portfolio-view-model.test.ts tests/unit/rpc-acl-hardening.test.ts tests/unit/loan-amortization.test.ts tests/unit/loans-integrity.test.ts` | PASS — 6 files, 43 tests                                                                                                      |
| Full unit suite: `npm run test`                                                                                                                                                                                                                                                                   | FAIL — 267/270 files passed; 1,854/1,859 tests passed. Five failures are in three files outside the Phase 2 changed-file set. |
| `npm run lint`                                                                                                                                                                                                                                                                                    | PASS                                                                                                                          |
| `npm run typecheck`                                                                                                                                                                                                                                                                               | PASS                                                                                                                          |
| `npm run migrations:validate`                                                                                                                                                                                                                                                                     | PASS — frozen baseline and 31 forward migrations validated                                                                    |
| Prettier on changed TypeScript files                                                                                                                                                                                                                                                              | PASS                                                                                                                          |
| `npm run build`                                                                                                                                                                                                                                                                                   | PASS — optimized production build compiled; TypeScript and all 111 static-page generation steps completed.                    |

After the final migration adjustment to rely on the table's existing schedule-status default, the three loan/RPC suites were rerun: PASS, 21 tests across 3 files.

Full-suite failures:

1. `tests/unit/i18n-messages.test.ts`: English/Vietnamese `money` namespace key parity is off by `savingsPage.summaryCaption`.
2. `tests/unit/money-ia-privacy.test.tsx`: account-card test expected `break-words`, received a `truncate` presentation.
3. `tests/unit/phase-6-accounts-presentation.test.tsx`: three tests render `InlineAlert` without the required `NextIntlClientProvider` context.

These failures do not touch the F3/F4 changed modules. I did not change unrelated tests or product code.

## Not executed — isolated browser/database gate

No authenticated Playwright workflow was run. The current configured target is the only active hosted database and contains non-fixture financial data; E2E global setup uses a service-role key and creates/updates household fixtures. The repository has no running local Supabase stack. Running those workflows against the hosted target would risk writes to live household data.

Accordingly, Phase 2 did not verify in a real browser:

- F3 value after refresh on holding detail, investment overview, and Home; cash proceeds credited exactly once; duplicate sale submission; or real household net worth.
- F4 loan creation, persisted schedule rows, rollback after helper failure, duplicate submission, loan detail, or household/cross-account visibility.
- The changed behavior at the audit viewport sizes.

The focused tests exercise domain calculations and migration text contracts, not PostgreSQL or a browser. Source inspection confirms the Home investment summary also calls the corrected resolver and totals its results, but the browser value was not observed. Passing unit tests are not used to claim F3 or F4 fully fixed.

## Build

`npm run build` completed successfully with the repository's local `.env.local` loaded. Routes compiled; no authenticated browser flow was exercised by the build.
