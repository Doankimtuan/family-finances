# Home Household Read Consolidation

## 1. Executive Summary

The Home route had three distinct `public.households` projections: ledger
currency, Plan settings, and HomeTopBar preferences. They were all authorized
by the same active household but used different helper functions, so React
`cache()` did not merge them.

The safe application-layer consolidation is implemented:

| Metric             |    Before |    After |
| ------------------ | --------: | -------: |
| Household reads    |         3 |        1 |
| Total Home fetches |        20 |       18 |
| Home median        | ~1,390 ms | 915.5 ms |
| TTFB               |   ~384 ms | 306.8 ms |

The 3→1 and 20→18 reductions are deterministic. The wall-time improvement is
directionally favorable but hosted Supabase latency is noisy: the same local
before/after trace group produced 1,365 ms before and 915.5 ms after, while the
after five-load section trace produced a 1,666 ms median. The result is
classified as a **SMALL WIN**, not a claim that two overlapping reads save two
full round trips.

Functional equivalence: **PASS**. RLS / tenancy: **PASS**. Request-local cache:
**PASS**. Savings, Investment, account-ledger calculations, infrastructure,
and database schema were not changed.

Recommendation: keep the request-local consolidation and next prototype the
Investment one-wave raw-input RPC only if lower Home latency is still required.

## 2. Current Household Read Map

The Home request starts `getHomeReadiness()` and `HomeTopBar` under separate
Suspense branches. Before this change, the reads were:

| Read | Caller                                                                                    | Fields                                                      | Consumers                                         | Timing                                                            | Blocking?            | Duplicate overlap?                            | Can share? |
| ---- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- | -------------------- | --------------------------------------------- | ---------- |
| 1    | `getRealPosition()` in `modules/ledger/application/queries/get-real-position.ts`          | `base_currency`                                             | Overview currency and ledger balance display      | ~283–290 ms in the quiet baseline group; first wave, offset ~0 ms | Readiness / Overview | Yes; overlaps Plan and TopBar household reads | Yes        |
| 2    | `getPlanPulse()` in `modules/plan/application/queries/get-plan-pulse.ts`                  | `base_currency`, `month_close_mode`, `income_allocate_mode` | Home readiness and Plan pulse allocation mode     | ~280 ms in the quiet baseline group; first wave, offset ~0 ms     | Readiness / Plan     | Yes; overlaps ledger and TopBar reads         | Yes        |
| 3    | `getHouseholdPreferences()` in `modules/tenancy/application/get-household-preferences.ts` | `name`, `locale`, `timezone`, `base_currency`               | HomeTopBar household name and preference contract | ~283–428 ms in baseline observations; first wave, offset ~0 ms    | TopBar branch        | Yes; overlaps the two readiness reads         | Yes        |

The reads were not identical queries. They were three different projections
against the same `membership.householdId`. The first two were request-memoized
at their own public helper boundaries; the preferences function was not
memoized. The old request therefore performed three remote household reads.

Other `households` references found by repository search belong to non-Home
routes or mutations and were left unchanged.

## 3. Field Union

The exact Home household field union is:

| Field                  | Home consumer                                        | Sensitivity                     | Change frequency               | Stale acceptance                                                    | Available elsewhere before              |
| ---------------------- | ---------------------------------------------------- | ------------------------------- | ------------------------------ | ------------------------------------------------------------------- | --------------------------------------- |
| `name`                 | HomeTopBar eyebrow                                   | Household identity              | Low                            | No cross-request stale data; current-request snapshot is sufficient | No                                      |
| `locale`               | `HouseholdPreferences` mapping                       | Household display preference    | Low                            | Same as above                                                       | No                                      |
| `timezone`             | `HouseholdPreferences` mapping                       | Household display preference    | Low                            | Same as above                                                       | No                                      |
| `base_currency`        | Overview, Plan pulse, `HouseholdPreferences` mapping | Financial display configuration | Low, but correctness-sensitive | No cross-request stale data; fallback semantics preserved           | Duplicated by all three old projections |
| `month_close_mode`     | Plan pulse                                           | Plan configuration              | Low                            | Same as above                                                       | No                                      |
| `income_allocate_mode` | Plan pulse                                           | Plan configuration              | Low                            | Same as above                                                       | No                                      |

`householdId` is derived from the active membership and used as the filter; it
is not fetched as an additional selected field. `canEdit` is derived from the
membership role; it is not a household column. No unused columns and no
`select("*")` were introduced.

The shared projection is:

```text
name, locale, timezone, base_currency, month_close_mode, income_allocate_mode
```

## 4. Cache / Request-Reuse Analysis

Before the change:

- `createSupabaseServerClient()` used React `cache()`, so parallel consumers
  reused one request-local client.
- `assertMoneyActionAllowed()`, `getSessionMembership()`,
  `getRealPosition()`, and `getPlanPulse()` used request-local React caches.
- `getHouseholdPreferences()` called session, membership, and its own
  household projection directly.
- React cache keys include the function and arguments. Different functions or
  projections were not deduplicated merely because they filtered the same
  household.
- No `unstable_cache`, `cacheLife`, `cacheTag`, or cross-request cache exists
  on this path.

After the change, `getHomeHouseholdContext()` is a no-argument React-cached
promise. It resolves the canonical `getSessionMembership()` result, filters
the household query by that active membership's `householdId`, and returns the
exact field union. `getRealPosition()`, `getPlanPulse()`, and
`getHouseholdPreferences()` reuse that result.

The account and jar queries still start in parallel with the shared household
promise. No new household→account or household→jar waterfall was introduced.
The after trace observed one household request per Home render.

## 5. Consolidation Options

| Option                                    | Remote calls before/after | Fields                                                  | Coupling                                                | Cache/security                                                       | Latency expectation                                          | Decision                                             |
| ----------------------------------------- | ------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| A. Reuse one existing projection          | 3→2 at best               | Existing projection misses either TopBar or Plan fields | Leaves one consumer coupled to an unrelated projection  | Safe if request-local; incomplete field coverage                     | Small or zero because reads overlap                          | Rejected                                             |
| B. Home-specific request-local projection | 3→1                       | Exact six-field union                                   | One small tenancy adapter; public domain helpers remain | React request-local cache; active membership filter; same RLS client | Removes two overlapping requests; wall gain must be measured | **Selected**                                         |
| C. Keep two projections                   | 3→2                       | Separate preferences and plan/ledger settings           | Preserves stronger separation                           | Safe, but leaves one redundant base-currency read                    | Likely negligible wall gain                                  | Rejected because the union is small and stable       |
| D. Do nothing                             | 3→3                       | No change                                               | No new coupling                                         | Lowest implementation risk                                           | No latency or fetch improvement                              | Rejected because the safe 3→1 reduction was measured |

No SQL/RPC or database view was justified. The application-layer option is
smaller and keeps financial formulas and domain mappings in their existing
modules.

## 6. Selected Implementation

Added `modules/tenancy/application/get-home-household-context.ts` with:

- the exact six-field projection;
- a validated row mapper for the external Supabase response;
- active-session and active-membership authorization through
  `getSessionMembership()`;
- request-local React promise reuse only;
- existing tenancy failure logging.

Updated the three consumers:

- `getHouseholdPreferences()` maps the shared row to the same locale, timezone,
  currency, and admin-editability contract as before;
- `getRealPosition()` reads currency from the shared context while leaving the
  accounts query, owner-membership check, ledger RPC, balance application, and
  totals unchanged;
- `getPlanPulse()` reads its three household settings from the shared context
  while leaving the jars query and mapping unchanged; a failed settings read
  still uses the existing default mapping behavior.

Home page composition, Suspense boundaries, section promises, Savings, and
Investment code were not changed.

## 7. Security / Tenancy

The shared read remains request-local and user-scoped:

1. `getSessionMembership()` validates the current authenticated user against
   the verified auth subject and active membership.
2. The query filters by that active membership's `householdId`.
3. The normal cookie-bound Supabase server client is used; no service-role
   credential is involved.
4. The existing `households_select_member` RLS policy remains unchanged.
5. React cache has no cross-request lifetime and no caller-supplied household
   key, so one request cannot reuse another request's household context.

Read-only runtime checks passed:

- authenticated Home returned HTTP 200 and rendered the gated dashboard;
- an unauthenticated Data API request to `households` returned HTTP 401;
- two existing authenticated ownership identities queried the primary
  household and received zero household rows and zero member rows;
- no migration, policy, grant, auth, or service-role change was made.

The controlled non-member fixture was not created because this phase forbids
data-mutating fixture setup. The access boundary is unchanged and is enforced
before the shared query.

## 8. Functional Equivalence

Status: **PASS**.

- HomeTopBar household name still comes from the same household row.
- Locale normalization remains `vi-VN` or the existing English fallback.
- Timezone remains the existing Vietnam timezone contract.
- Preferences currency remains the existing VND contract.
- Overview and Plan still use the stored `base_currency` with the same default
  fallback and upper-casing.
- Plan `month_close_mode` and `income_allocate_mode` use the same existing
  mappers.
- No account balances, ledger RPC input, Savings values, Investment valuation,
  P/L, stale-price, or financial formatting logic changed.

Focused regression tests passed: 38 tests across household preferences,
request-local query cache, ledger position, Plan pulse, and the jar-budget
consumer. The production build and TypeScript check also passed.

Browser checks against the authenticated Home passed at 390, 440, 768, and
1280 px: dashboard, contextual header, financial pulse, Plan pulse, period
control, and capture action were visible with no horizontal overflow.

## 9. Fetch Inventory Before vs After

Stable per-Home inventory:

| Request family         | Before |  After |  Delta |
| ---------------------- | -----: | -----: | -----: |
| Auth user              |      1 |      1 |      0 |
| `household_members`    |      2 |      2 |      0 |
| `households`           |      3 |      1 |     -2 |
| `inbox_items`          |      2 |      2 |      0 |
| Accounts               |      1 |      1 |      0 |
| Jars                   |      1 |      1 |      0 |
| Liabilities            |      1 |      1 |      0 |
| Loans                  |      1 |      1 |      0 |
| Transactions           |      1 |      1 |      0 |
| Investment reads       |      5 |      5 |      0 |
| Account ledger RPC     |      1 |      1 |      0 |
| Savings RPC            |      1 |      1 |      0 |
| **Total Home fetches** | **20** | **18** | **-2** |

The after `VINHA_PERF_TRACE=1` server log recorded one
`/rest/v1/households` request for each of ten Home renders and 18 Home data
fetches per render after excluding the login/auth warm-up requests. The exact
household request durations in the final ten-render trace were:

```text
266, 269, 252, 254, 257, 260, 254, 271, 262, 255 ms
median: 258.5 ms
```

## 10. Performance Before vs After

The required baseline is the fresh five-load current control from the prior
Home phase: 1,390 ms median and 384 ms TTFB. The final after sample used ten
warm authenticated Home document loads at 390×844:

```text
wall: 1236, 891, 898, 931, 886, 932, 900, 959, 875, 951 ms
median: 915.5 ms

TTFB: 300.5, 292, 313.1, 342.8, 284.4, 353.1, 283.9, 365.4, 290, 357.8 ms
median: 306.8 ms
```

| Metric            |   Before |    After |     Delta | Delta % |
| ----------------- | -------: | -------: | --------: | ------: |
| Home median       | 1,390 ms | 915.5 ms | -474.5 ms |  -34.1% |
| TTFB              |   384 ms | 306.8 ms |  -77.2 ms |  -20.1% |
| Total fetches     |       20 |       18 |        -2 |  -10.0% |
| Household fetches |        3 |        1 |        -2 |  -66.7% |

Section visibility was separately checked in five warm loads after the change.
These timings are indicative because streamed sections and hosted request
latency varied independently:

| Section marker               | After median |
| ---------------------------- | -----------: |
| Home shell                   |       447 ms |
| Plan pulse                   |     1,237 ms |
| Savings summary              |     1,237 ms |
| Overview / financial pulse   |     1,663 ms |
| Investment summary           |     1,663 ms |
| All required section markers |     1,663 ms |

The same local before trace had a 1,365 ms five-load median and 302.7 ms TTFB,
while one earlier after five-load trace had a 1,666 ms median. This variance is
why the deterministic fetch reduction is the primary result and the full
wall-time change is not attributed entirely to household consolidation.

## 11. Remaining Bottlenecks

- Hosted Supabase/Auth round trips remain the dominant latency multiplier.
- The authenticated product gate still sets a meaningful TTFB floor.
- Investment still has a holdings-to-market-data two-wave dependency and was
  the largest Home critical-path section in the existing measurements.
- Account IDs still precede the account-ledger RPC and owner-membership read.
- The inbox GET and navigation unread HEAD remain separate overlapping reads.

## 12. Recommended Next Step

Choose **A: prototype the Investment one-wave raw-input RPC** in a controlled,
read-only benchmark. Do not implement it in this task; require financial
equivalence, RLS evidence, and a measured one-wave median improvement first.

## 13. Raw Evidence

- Baseline source of truth: `.agents/audits/home-investment-read-model-optimization.md`,
  fresh current control of 1,390 ms median, 384 ms TTFB, and 20 fetches.
- Earlier Home source of truth: `.agents/audits/home-rsc-performance-investigation.md`,
  including the three household projections and their overlapping first-wave
  timings.
- After server trace: `VINHA_PERF_TRACE=1 npm run start -- -p 3130`, ten Home
  renders after authentication, no writes observed.
- After browser trace: headless Chromium, authenticated E2E account,
  390×844, ten warm loads for the final median.
- After responsive check: four read-only Home loads at 390, 440, 768, and
  1280 px with required section waits.
- Anonymous check: `households` Data API request returned HTTP 401.
- Ownership check: two existing authenticated non-member identities returned
  zero rows for the primary household and its members.
- Independent 2026-09-11 recapture: seven valid post-warm Home loads at
  390×844 had wall times `1174, 1157, 1637, 1054, 754, 689, 653 ms`
  (median `1054 ms`) and TTFB `299, 292, 230, 304, 294, 253, 228 ms`
  (median `292 ms`); every valid load had 18 total fetches and one
  `households` fetch. A login-adjacent first slice with 68 fetches was
  discarded from the warm sample.
- Verification: focused tests passed (38/38), `npm run typecheck` passed,
  `npm run build` passed. Full lint still reports the repository's existing
  `output/vinha-*.mjs` `no-console` errors; no new lint error remains in the
  changed application files.
- No financial data, household data, RLS policy, migration, runtime region, or
  Supabase infrastructure setting was mutated.
