# Plan 12 App Connect Supabase Validation

## Scope and target

The local application is configured for the healthy Supabase project **family-finances-2**, project ID `bbzffxvgocjwsdbujvgn`, in region `ap-southeast-2`. The validation used the enabled Supabase App Connect integration and was performed against the deployed project after explicit confirmation to apply the Plan 12 schema.

## Applied migrations

The eight Plan 12 migrations were applied successfully in sequence: Jar rollover and period adjustments; Goal funding; Review snapshots; Monthly Review metadata; qualifying monthly income; Jar category mapping; Jar budget snapshots and period-scoped reallocation; and Goal lifecycle/actions. Two corrective migrations were then applied: one corrected the Goal funding insert RLS predicate, and one explicitly revoked anonymous execution from the Plan 12 security-definer functions.

| Applied item | Result |
| --- | --- |
| Eight Plan 12 migrations | Applied successfully through App Connect |
| Goal funding RLS correction | Applied successfully |
| Plan 12 anonymous ACL correction | Applied successfully |
| Migration list refresh | All Plan 12 names present in the active project |

## Deployed schema checks

Read-only `information_schema`, `pg_constraint`, `pg_proc`, and `pg_policies` queries confirmed the presence of the Plan 12 tables and fields, including `jar_period_adjustments`, `jar_period_rule_snapshots`, `goal_funding_links`, `goal_period_funded_snapshots`, Goal lifecycle columns, qualifying income, Review metadata, and Plan movement period/reason fields. Constraints for Goal types and statuses, source shape, nonnegative values, period-month alignment, rollover mode, Review status, and historical snapshot uniqueness are present.

The six Plan 12 functions are security-definer functions with explicit search paths. Direct privilege checks now show `anon_execute=false` and `authenticated_execute=true` for `change_goal_lifecycle`, `contribute_to_goal`, `enforce_goal_funding_link_integrity`, `guard_historical_jar_period_rule_snapshot`, `reallocate_jar_capacity`, and `reassign_goal_funding_source`.

## Defect found and corrected

The first deployed version of the Goal funding insert policy contained an unqualified comparison that PostgreSQL simplified to `g.household_id = g.household_id`. This did not compare the Goal household to the funding-link household. The local migration was corrected to qualify `goal_funding_links.household_id`, and a corrective migration was applied remotely. A second read-only policy query confirmed the corrected deployed predicate.

The local Plan 10 Goal action migration also contained a malformed destination Goal type predicate. It was corrected locally before the migration was applied remotely. A deployed source assertion confirmed that `v_to.goal_type <> 'payoff'` is present in the reassignment function.

## Data invariants

| Invariant | Observed result |
| --- | ---: |
| Legacy Jars with nonzero `capacity_delta` | 2 |
| One-time migrated adjustment rows | 2 |
| Jars with duplicate migration rows | 0 |
| Current Jar rule snapshots | 0; expected before application runtime capture |
| Active Goal funding links | 0 |
| Active source kinds | 0 |

The one-time legacy conversion therefore preserved both nonzero legacy values without duplicate migration rows. No test fixtures or production financial records were created by the validation queries.

## Advisor findings and remaining risks

The Supabase security advisor still reports many pre-existing V1 warnings, including older anonymous-callable security-definer functions and one mutable search path on `transactions_set_is_reversal`. The Plan 12 functions are not included in the anonymous privilege set after the ACL correction, but the broader database is not security-clean and should not be described as fully hardened.

The performance advisor reports many pre-existing unindexed foreign keys across older tables. It also reports informational missing-covering-index findings for several new Goal funding and historical snapshot foreign keys. These are performance recommendations rather than correctness failures and should be addressed in a separate index-hardening migration if production scale requires it.

## Validation boundary

The remote database-side schema, RLS metadata, function security, migration history, invariant counts, and corrected SQL source were validated successfully through App Connect. Fresh-database and V1-upgrade simulations were not run because the local Docker-backed Supabase environment remains unavailable. Authenticated browser flows also remain outside this App Connect validation and require seeded credentials.
