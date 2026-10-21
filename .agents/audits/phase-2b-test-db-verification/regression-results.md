# Phase 2B — Regression Results

## Automated checks

| Check                                                                                        | Result                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full unit suite, `npm run test`                                                              | PASS — 270 files, 1,860 tests. This run included the Phase 2B migration contract test before the final small set of SQL-date/static-assertion expectations was added.              |
| Latest RPC ACL/migration contract suite                                                      | PASS — 5 tests after the JSON scalar-type and whole-number-sequence contract checks were added.                                                                                    |
| Focused investment/loan/RPC regression set                                                   | PASS — 82 tests across 11 files in the recorded focused run.                                                                                                                       |
| Previously failing regression tests                                                          | PASS — 22 tests across i18n message parity, money IA/privacy, and account presentation; fixes cover the missing Vietnamese caption, title wrapping, and test translation context.  |
| `npm run lint`                                                                               | PASS.                                                                                                                                                                              |
| `npm run typecheck`                                                                          | PASS after removing stale Next dev route types and rebuilding.                                                                                                                     |
| `npm run build`                                                                              | PASS — Next.js 16.3.1 production build and 111 static page generation steps. Temporary visual harness route was absent from the final build.                                       |
| `npm run migrations:validate`                                                                | PASS — frozen baseline and forward migrations validated.                                                                                                                           |
| Prettier on changed application/test files, Phase 2B reports, manifest, and browser snapshot | PASS.                                                                                                                                                                              |
| Repository-wide `npm run format:check`                                                       | FAIL — Prettier reports 198 files outside this Phase 2B changed-file set. The scoped files above pass; unrelated audit/skill assets and existing source files were left untouched. |
| Playwright authenticated F3/F4 E2E suites                                                    | BLOCKED — global setup/teardown provisions and removes auth users and household fixtures in the unresolved hosted target.                                                          |
| PostgreSQL integration cases                                                                 | BLOCKED — no positively identified disposable database.                                                                                                                            |

The full unit run predates only the final test-only SQL contract assertions; the updated RPC contract suite passed afterward. No financial database writes or schema changes were made.

## Fixes covered

- The shared investment valuation resolver now derives manual unit-price value from remaining quantity. Lifecycle and portfolio tests cover partial sales, another partial sale, and liquidation.
- Vietnamese savings summary key parity and credit-card title wrapping failures are fixed.
- The accounts presentation tests now provide the translation hook they require.
- The loan helper's static migration contract and ACL are checked locally.

Unit tests and source contracts do not replace the blocked browser/database verification. F3 remains partial and F4 remains blocked.
