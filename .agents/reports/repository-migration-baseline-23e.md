# REPO 23E — V1 migration baseline

Date: 2026-08-25  
Development project: family-finances-2 (bbzffxvgocjwsdbujvgn, ap-southeast-2)

## Result

Completed. The development database was reset and replayed from one canonical migration:

supabase/migrations/20260825125516_v1_baseline.sql

The migration ledger now contains exactly one applied migration, and the freeze validator reports zero forward migrations.

## Safety and reconciliation

- Created checkpoint tag and branch: repo-23e-pre-migration-squash-20260825.
- Confirmed the linked project with the development Supabase guard before destructive or data-writing operations.
- Captured the pre-reset schema/security snapshot during the migration checkpoint; the canonical repository retains the resulting baseline and freeze manifest only.
- Reconciled the legitimate forward migration 20260825072351_optional_onboarding_setup.sql before baseline generation.
- Reset only the development project; production was not touched.

Pre-reset metadata was 132 applied migrations, 58 tables, 117 public functions, 119 policies, and 42 triggers. The post-reset baseline has the same structural counts and passed the exact baseline replay transaction.

## Security

Post-reset checks passed:

- 58/58 public tables have RLS enabled.
- All 117 SECURITY DEFINER functions have a pinned search_path.
- No anonymous table mutation privileges remain.
- No unexpected anonymous RPC execution remains; get_invitation_preview is the intentional anonymous preview RPC.
- The only policyless tables are service-only market_sync_runs and market_sync_locks.

## Bootstrap

Current reference state was restored without synthetic financial history:

- 3,672 market instruments and 3,672 source mappings through the existing catalog sync flow.
- 1 Manual Saving provider and 4 default packages (30/90/180/365 days), restored idempotently for savings fixtures.
- 1 current USD/VND Frankfurter FX rate.
- 0 market price rows and 0 runtime financial rows.

## Validation

- Migration freeze validator: pass.
- Focused migration tests: 17/17 pass.
- Full unit suite: 977/977 pass.
- Lint: pass.
- Typecheck: pass.
- git diff --check: pass.
- Home product summary rerun: 6/6 pass.
- Money product summary rerun: 5/5 pass.
- Release smoke rerun: 7/8 executed; the remaining failure is the existing health-insights route assertion.

The broad browser run exposed three non-baseline issues after the missing savings seed was corrected: inbox read-state permission/test contract, duplicate privacy-toggle strictness, and the health-insights route assertion. These remain outside the migration baseline change.

## REPO 23E.1 follow-up

The post-baseline browser regressions were closed without changing the frozen
baseline. One real baseline ACL omission was corrected by the single forward
migration `supabase/migrations/20260825143000_inbox_read_state_acl_23e1.sql`.
The migration ledger is now baseline plus that forward migration.

- Inbox read-state: `REAL_BASELINE_DEFECT` / `AUTH/RLS`; restored the certified
  `UPDATE (read_at)` grant for `authenticated`. The existing member policy
  continues to prevent cross-household updates; anon has no mutation grant.
- Privacy toggle: `LOCATOR` / `TEST_CONTRACT`; scoped the test to the canonical
  `#app-viewport-root`.
- Health insights: `LOCATOR` / `ROUTE_CONTRACT`; the current `/health/insights`
  route and IDs are valid. The stale assertions were scoped to the canonical
  viewport; no product route was restored or redesigned.
- Release smoke: `FIXTURE_STATE` plus the stale Health locator; the isolated
  release flow is green at 11/11.

The full canonical non-release run was re-executed; it exposed and then closed
one additional duplicate `home-capture` locator in the same class. The affected
Home rerun passed 6/6, and the required immediate release rerun passed 11/11.
The broad run's one Together harness cleanup failure was reproduced as
fixture-state ordering and passed on standalone rerun.

Final 23E.1 verdict: `V1 MIGRATION BASELINE NOT READY`.

## REPO 23E.2 final certification

The remaining transfer failure was closed as `STALE_LOCATOR` with an
order-sensitive `MISSING_ACCOUNT_STATE` risk. The transfer test asserted the
page-wide `money-hub` test ID while the app shell contained hidden and visible
copies, and it selected whichever accounts happened to be first. The shared
run-scoped E2E fixture now owns two named cash accounts with deterministic
opening balances; the test scopes assertions to `#app-viewport-root` and
selects source/destination by their named labels. The fixture remains owned by
the disposable E2E household and is removed by the existing cleanup path.

The Money Hub prerequisite had the same stale page-wide `money-hub` locator;
its test assertion was scoped to the canonical viewport. No production
application code changed, financial semantics remained unchanged, and no DB
or schema change was needed in 23E.2.

- Transfer standalone: 1/1 pass.
- Money Hub + Money Transactions + Transfer ordered run: 6/6 pass.
- Full canonical non-release E2E: 146 passed, 6 intentional skips, 0 failed.
- Release E2E immediately afterward: 11/11 passed, 0 failed.
- Unit suite: 977/977 passed (157 files).
- Lint, typecheck, production build, `git diff --check`, and changed-file
  formatting: pass.
- Migration freeze guard: pass.
- Linked migrations: `20260825125516_v1_baseline.sql` and
  `20260825143000_inbox_read_state_acl_23e1.sql`; local and remote match.
- Linked dry-run: remote database is up to date.

Final 23E.2 verdict: `V1 MIGRATION BASELINE READY`.
