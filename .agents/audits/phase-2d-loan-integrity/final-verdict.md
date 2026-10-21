# Phase 2D — Final verdict

**Status: PASS — F4 fixed and verified in the designated test project**

| Gate                                                              | Status          | Evidence                                                                                                 |
| ----------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| Reviewed remediation migration applied to authorized project      | PASS            | Remote history contains version 20261021040820; function bodies and ACLs verified.                       |
| Previously accepted zero-interest exploit                         | PASS — rejected | Authenticated RPC returns SQLSTATE 22023, `Invalid loan schedule`; atomic rollback leaves no rows.       |
| Valid amortization cases                                          | PASS            | Eleven authenticated cases match independent Decimal calculations, persisted totals, and final balances. |
| Invalid shape and manipulated summaries                           | PASS            | Rejected with rollback and no partial records.                                                           |
| Same-household roles and foreign-household isolation              | PASS            | Admin/partner visibility works within the household; foreign reads are empty and writes denied.          |
| Browser create, detail, refresh, schedule, and partner visibility | PASS            | Account A and B verified at 440 × 900; screenshots retained.                                             |
| Migration history                                                 | PASS            | Local and remote catalogs match exactly: 33 entries, 32 forward migrations, no pending versions.         |
| Cleanup                                                           | PASS            | Baseline restored: 1 household, 2 members, no loans or schedule rows; temporary identities deleted.      |
| Local regression checks                                           | PASS            | Typecheck, lint, all 270 unit files / 1,861 tests, migration validation, and production build passed.    |

F3 remains **FIXED IN TEST** based on the previously completed Phase 2C lifecycle evidence; this phase did not rerun the investment lifecycle. F4 is now **FIXED IN TEST** for the verified development/testing project. Phase 3 can begin for the test-project scope.

## Remaining risks

- No production migration, production data, or production browser session was tested or changed.
- SQL numeric and TypeScript Number calculations were independently reconciled for the supported regression cases, not exhaustively for every possible extreme value/rate combination.
- The installed Supabase CLI is 2.20.5 and should be upgraded before the next CLI migration operation. The current local and remote migration catalogs match, and this audit did not run `db push`.
- Existing Supabase security advisor notices remain outside this change: RLS-enabled tables without policies, mutable function search path, existing anon/authenticated security-definer functions, and leaked-password protection configuration. No unrelated advisor finding was changed.
- Full F3 investment lifecycle, deployment, and broader end-to-end suite were not repeated because this remediation changed only loan migration policy.
