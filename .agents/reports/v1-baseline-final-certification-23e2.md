# REPO 23E.2 — V1 baseline final certification

Date: 2026-08-26  
Development project: family-finances-2 (`bbzffxvgocjwsdbujvgn`,
`ap-southeast-2`)

## Scope and verdict

The final `transfer.smoke` environment/fixture-state failure was closed. The
frozen V1 baseline remains immutable. No historical migrations were restored,
no production application code changed, no financial semantics changed, and
no DB/schema change was needed in 23E.2.

Final verdict: `V1 MIGRATION BASELINE READY`

## Transfer root cause and fix

Classification: `STALE_LOCATOR`, with a secondary `MISSING_ACCOUNT_STATE` risk.

The standalone failure reproduced at the initial Money Hub assertion because
the test used a page-wide `money-hub` locator that resolved to both hidden and
visible shell nodes. The test also selected source and destination by ordinal
position, making it dependent on unrelated shared-household mutations.

The existing run-scoped E2E household fixture now creates or repairs two
owned cash accounts:

- `E2E 23D1 transfer source`, opening balance 5,000,000 VND.
- `E2E 23D1 transfer destination`, opening balance 0 VND.

The test scopes UI assertions to `#app-viewport-root` and selects the named
source/destination labels with their corresponding radio names. Existing
household cleanup removes only the disposable run-scoped household, including
the fixture rows. The transfer behavior remains unchanged and verifies a
neutral receipt; the source/destination direction and no Income/Expense
classification remain covered by the canonical release flow.

The prerequisite Money Hub test had the same duplicate page-wide locator and
was repaired with the canonical viewport scope.

## Validation

- Transfer standalone: 1/1 passed.
- Money Hub + Money Transactions + Transfer ordered run: 6/6 passed.
- Full canonical non-release E2E: 146 passed, 6 intentional environment
  skips, 0 failed.
- Release E2E immediately afterward: 11/11 passed.
- Unit suite: 977/977 passed across 157 files.
- Repository lint: passed.
- Typecheck: passed.
- Production build: passed; 96 static pages generated.
- `git diff --check`: passed.
- Changed-file formatting: passed for the changed JavaScript/TypeScript files.
  Repository-wide formatting was not run.

## Migration integrity

- Production code changed: No.
- Database/schema changed in 23E.2: No.
- Migration count: 2 total — one frozen baseline and one approved forward ACL
  migration.
- Frozen baseline: `supabase/migrations/20260825125516_v1_baseline.sql`.
- Forward migration: `supabase/migrations/20260825143000_inbox_read_state_acl_23e1.sql`.
- Migration freeze guard: passed.
- `supabase migration list --linked`: local and remote match for both
  migrations.
- `supabase db push --linked --dry-run`: `Remote database is up to date.`

V1 MIGRATION BASELINE READY
