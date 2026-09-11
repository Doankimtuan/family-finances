# Home Savings RPC Live Verification

Status: **PARTIAL / BLOCKED**. The linked database does not expose the new RPC, and the CLI refuses to deploy it until migration history drift is explicitly repaired.

## 1. Executive Summary

| Check                             | Result                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------- |
| Savings migration deployed        | **NO**                                                                        |
| Compatibility fallback removed    | **NO — retained safely**                                                      |
| RLS / tenancy runtime matrix      | **PARTIAL**                                                                   |
| Financial equivalence             | **PARTIAL**                                                                   |
| Savings calls before              | 2: `savings` → `saving_cycles`                                                |
| Savings calls after               | Not measured live; fallback remains at 2                                      |
| Home calls before                 | 20 in the P8 trace                                                            |
| Home calls after                  | Not measured live; fallback preserves the Savings portion of the 20-call path |
| Home median before                | 1,576 ms P8 median                                                            |
| Home median after                 | Not measured                                                                  |
| Savings row timing before / after | 630 ms dependent-cycle median in P8 / not measured                            |
| Further optimization justified    | **NO DECISION YET** — deploy and measure Savings first                        |

No financial data was mutated. No production infrastructure, Auth configuration, RLS policy, or migration history was changed.

## 2. Migration State

Local and remote history were compared with `supabase migration list`.

| State            | Versions                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Local and remote | Through `20260908105528`                                                                    |
| Local only       | `20260908114845_get_account_ledger_balances.sql`, `20260910210229_home_savings_summary.sql` |
| Remote only      | `20260908115411`                                                                            |

The remote-only `20260908115411` function definition matches the local-only `20260908114845_get_account_ledger_balances.sql` definition: same signature, return shape, SQL body, `SECURITY INVOKER` semantics, `search_path = public`, and authenticated execution grant. The version stamps differ.

`supabase db push --linked --dry-run` refused to continue and reported:

```text
Remote migration versions not found in local migrations directory.
supabase migration repair --status reverted 20260908115411
```

The exact history reconciliation required before a Savings-only push is:

```text
APPROVAL REQUIRED

1. supabase migration repair 20260908115411 --status reverted --linked
2. supabase migration repair 20260908114845 --status applied --linked
3. supabase db push --linked --dry-run
4. Confirm the dry run lists only 20260910210229_home_savings_summary.sql.
```

Steps 1 and 2 update only `supabase_migrations.schema_migrations`; they do not apply or revert SQL. They must not be run without explicit approval. No repair was run.

## 3. RPC Definition

Local migration: `supabase/migrations/20260910210229_home_savings_summary.sql`.

```text
public.get_home_savings_summary()
returns table(
  active_count bigint,
  principal numeric,
  upcoming_maturity_count bigint,
  action_required_count bigint,
  nearest_maturity_date date
)
language sql
stable
security invoker
set search_path to 'public'
```

The query selects the current cycle per saving, excludes `closed` and `early_closed` savings, considers `active` and `matured` cycles, prefers active over matured, then prefers the highest cycle number. It returns zero counts, zero principal, and a null nearest date for an empty result.

Remote function exists: **NO**. Both anonymous and authenticated REST RPC probes returned `PGRST202` (`function not found`).

## 4. Security / RLS

Remote read-only catalog checks:

| Check                              | Result                                                      |
| ---------------------------------- | ----------------------------------------------------------- |
| `public.savings` RLS enabled       | **YES**                                                     |
| `public.saving_cycles` RLS enabled | **YES**                                                     |
| `savings_select_member`            | Authenticated active-membership predicate                   |
| `saving_cycles_select_member`      | Authenticated active-membership predicate through `savings` |
| New RPC grant                      | Not present because the function is not deployed            |

Runtime matrix:

| Caller / case                   | Result                                                         |
| ------------------------------- | -------------------------------------------------------------- |
| Authenticated active member     | **BLOCKED** — RPC absent; legacy reads are accessible          |
| Anonymous caller                | **BLOCKED** — received `PGRST202`, not an authorization result |
| Authenticated non-member        | **NOT RUN** — RPC absent                                       |
| Cross-household attempt         | **NOT RUN** — RPC absent                                       |
| Valid household with no savings | **NOT RUN** — RPC absent                                       |

The SQL uses `SECURITY INVOKER` and the existing table RLS assumptions remain intact in the local migration. Runtime proof must be repeated after deployment.

## 5. Financial Equivalence

The authenticated legacy path was read successfully for one representative household:

| Metric                    | Legacy result | New RPC result |
| ------------------------- | ------------: | -------------- |
| `active_count`            |            30 | Not available  |
| `principal`               |   184,253,507 | Not available  |
| `upcoming_maturity_count` |            30 | Not available  |
| `action_required_count`   |             0 | Not available  |
| `nearest_maturity_date`   |    2026-09-12 | Not available  |

The application fallback preserves the legacy result while the RPC is missing. Financial equivalence is **not passed** until the deployed RPC returns the same values and the empty/non-member/cross-household cases are checked.

## 6. EXPLAIN ANALYZE

The new RPC cannot be explained because it does not exist remotely. No new SQL plan is claimed.

Prior evidence remains the order-of-magnitude baseline: representative PostgreSQL reads execute in approximately 0.06–1.6 ms at current size and approximately 4–9 ms on the larger fixture, versus approximately 275 ms for the remote request boundary. The new RPC plan must be captured after deployment with:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.get_home_savings_summary();
```

## 7. Savings Fetch Trace

| Phase  | Remote calls                | Evidence                                                                           |
| ------ | --------------------------- | ---------------------------------------------------------------------------------- |
| Before | `savings` → `saving_cycles` | P8: savings median 271 ms; saving-cycles dependent read median 630 ms              |
| After  | Not captured                | RPC is absent, so the compatibility fallback intentionally keeps the two-read path |

The fallback is narrowly classified to `PGRST202`; other RPC errors remain unavailable rather than silently reverting to the old path.

## 8. Home Fetch Inventory

| Phase  |  Fetch count | Savings portion        | Evidence               |
| ------ | -----------: | ---------------------- | ---------------------- |
| Before |           20 | 2 reads                | P8 Home trace          |
| After  | Not measured | 2 reads under fallback | No live RPC deployment |

Accounts, investment, auth, inbox, loan, debt, and preference paths were not changed.

## 9. Browser Performance

| Metric              |                                    Before |        After | Delta | Delta % |
| ------------------- | ----------------------------------------: | -----------: | ----: | ------: |
| Home median         |                                  1,576 ms | Not measured |     — |       — |
| TTFB median         |                                    437 ms | Not measured |     — |       — |
| Home fetches        |                                        20 | Not measured |     — |       — |
| Encoded payload     |                                  78,590 B | Not measured |     — |       — |
| Savings row visible | Not measured in the P8 production profile | Not measured |     — |       — |

The required five-load authenticated production-like recapture was not run because the new RPC is not live and the known migration-history gate blocks a safe deployment.

## 10. Section Streaming Timing

Savings and Investment visibility after the live RPC are **not measured**. Existing streaming boundaries remain unchanged. The earlier implementation’s authenticated dev-server check showed the shell before later sections, but it is not a post-deployment production measurement and is not used as Savings RPC evidence.

## 11. Remaining Bottlenecks

| Classification             | Evidence                                                            | Status                               |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| Remote request floor       | Local Vietnam-to-Supabase medians around 273–283 ms                 | **CONFIRMED**                        |
| Auth gate                  | P8 critical-path max median around 411 ms; TTFB median 437 ms       | **CONFIRMED**                        |
| First Home wave            | Commonly 253–299 ms per remote read                                 | **CONFIRMED**                        |
| Savings dependency wave    | `saving_cycles` median 630 ms in P8                                 | **CONFIRMED while fallback remains** |
| Investment dependency wave | Holdings to market/summary reads                                    | **LIKELY**                           |
| Account dependency wave    | Accounts to ledger/owner-membership reads                           | **LIKELY**                           |
| Concurrency variance       | Individual calls reached 411–811 ms                                 | **CONFIRMED**                        |
| PostgreSQL execution       | Representative plans sub-10 ms                                      | **NOT A PROBLEM**                    |
| Region hypothesis          | Supabase Sydney and Vercel IAD1 known; equivalent APAC probe absent | **INCONCLUSIVE**                     |

## 12. Investment Benchmark

Not run. The Savings deployment and measurement gate was not passed, so Investment consolidation was not benchmarked or implemented.

## 13. Recommendation

**STOP HOME OPTIMIZATION** until the migration-history repair is explicitly approved, the Savings migration is deployed, and the required equivalence/RLS/performance evidence is captured. Do not optimize Investment or Accounts in this phase.

## 14. Raw Evidence

Commands and read-only checks:

```text
supabase migration list
supabase db push --linked --dry-run
node --env-file=.env.local <read-only RPC and legacy-path probe>
```

Observed remote RPC probes:

```text
anonymous: PGRST202
authenticated: PGRST202
legacy authenticated reads: 30 savings rows, 30 cycle rows
```

P8 baseline from `.agents/audits/home-rsc-performance-investigation.md`:

```text
Home loads: 1,247 / 1,576 / 1,830 ms; median 1,576 ms
TTFB: 309 / 437 / 481 ms; median 437 ms
Supabase/Auth fetches: 20 per Home request
savings: 254 / 289 / 271 ms
saving_cycles: 264 / 664 / 630 ms
```

No migration repair, migration push, SQL DDL, financial write, or infrastructure change was performed.
