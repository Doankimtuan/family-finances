# Vercel Singapore Region Migration

## 1. Executive Summary

**Status: PARTIAL.** The project’s single Vercel Function region was moved from `iad1` to `sin1`, and the new production deployment is Ready. Vercel’s deployment Resources page lists all 88 functions in `SIN1`, including Home and Inbox. All five authenticated routes loaded on the production alias after the move.

The five-sample client-observed UI-ready median across all routes improved from 1,551 ms to 1,233 ms (−318 ms, −21%). Three route medians improved and two increased by about 0.4 seconds. This supports a **SMALL WIN**, but is not a TTFB/FCP measurement. Vercel’s TTFB and function-duration panels showed demo data, and its Supabase latency column was unavailable, so cross-region Supabase impact is not quantified. No rollback was indicated by the route smoke results.

Status remains partial because request-level TTFB, function duration, Supabase RTT, and a safe Server Action check were unavailable. No Server Action was submitted because the available actions write household or financial state.

## 2. Previous Vercel Region

- **Region:** `iad1` — Washington, D.C., USA (East).
- **Plan:** Hobby, limited to one Function region.
- **Previous production deployment:** `dpl_3mLLGXWQmYVV1Lm8sqsHvcEhWEXt`, Ready, commit `b4b1fbfe99deb11599f8828616c5291434ac42e5`.
- Evidence: [previous deployment Resources](https://vercel.com/doankimtuans-projects/family-finances/3mLLGXWQmYVV1Lm8sqsHvcEhWEXt/resources) and the Functions setting before the change.

## 3. Configuration Source

The canonical source was Vercel Project Settings → Functions → Function Region. The repository has no `vercel.json`; `next.config.ts` has no region setting; a source search found no `preferredRegion`, `regions`, or `functionFailoverRegions` route overrides. No conflicting configuration was present.

The project was configured for one region only. No failover or multi-region setting was enabled. Vercel’s [Function region documentation](https://vercel.com/docs/functions/configuring-functions/region) describes the project-level region setting.

## 4. Supabase Region

- **Supabase project:** `family-finances-2` (`bbzffxvgocjwsdbujvgn`), `ACTIVE_HEALTHY`.
- **Region:** `ap-southeast-2` (Sydney).
- Read from Supabase project metadata. No Supabase settings, database, Auth, RLS, or credentials were changed.

## 5. US Baseline

Five authenticated production loads were captured per route on the previous deployment. “UI ready” is the wall-clock time from browser navigation/reload until the accessibility snapshot exposed the authenticated app shell and route content. It is a client-observed readiness proxy that includes browser automation overhead; it is **not** TTFB or First Contentful Paint.

| Route    |       US TTFB | US UI-ready median | Route content visible |
| -------- | ------------: | -----------------: | --------------------: |
| Home     | Not available |           1,795 ms |           4/5 samples |
| Money    | Not available |           1,872 ms |                   5/5 |
| Plan     | Not available |           1,051 ms |                   5/5 |
| Inbox    | Not available |           1,002 ms |                   5/5 |
| Together | Not available |           2,115 ms |                   5/5 |

Vercel’s route compute Duration chart was labeled **Demo Data**. Its External APIs table showed the Supabase hostname and 623 API calls in the selected 12-hour window, but latency and error-rate fields were `—`. The dashboard did not provide per-request server or Supabase timings for the benchmark.

## 6. Singapore Configuration

In Project Settings → Functions, `sin1` (Singapore, `ap-southeast-1`) was selected as the only region and saved. `iad1` was deselected. The saved setting remained `sin1` after reloading the settings page. The Hobby plan allowed one region and exposed Singapore as an available choice.

No `vercel.json`, Next.js route, environment variable, runtime, cache, CDN, or application setting was changed.

## 7. Deployment

- **Environment:** Production.
- **Source:** existing `main` commit `b4b1fbfe99deb11599f8828616c5291434ac42e5` (“Improve UX bottom navigation”).
- **Deployment:** `dpl_7tHupzC6Hh9PurmnU6GjKwUGi2Jc`.
- **Status:** Ready; Vercel reported a 2m 15s build.
- **Production alias:** `family-finances-iota.vercel.app` remained assigned.
- Evidence: [Singapore deployment](https://vercel.com/doankimtuans-projects/family-finances/7tHupzC6Hh9PurmnU6GjKwUGi2Jc).

## 8. Runtime Region Verification

**Expected:** `sin1`  
**Observed:** `SIN1` — pass.

The new deployment’s Resources table listed 88 Functions, all in `SIN1`, including `/[locale]/home` and `/[locale]/inbox`, with Node.js 24.x. Authenticated production requests to the five routes then loaded against the new deployment. This is Vercel deployment-resource evidence; the project did not expose a per-invocation region header or usable runtime trace.

## 9. Functional Validation

- **Home, Money, Plan, Inbox, Together:** each loaded five times through the production alias after the change.
- **Session:** all 25 after-move samples stayed on the authenticated app shell; none redirected to login.
- **Route content:** present in 24/25 samples. One Home snapshot showed the shell before the Home heading became visible.
- **Hydration/runtime errors:** no error UI appeared; the browser console returned zero recent error, hydration, or Supabase/RLS entries.
- **Supabase reads:** the authenticated routes rendered. Vercel’s 12-hour External APIs count for the Supabase host increased from 623 before the smoke run to 914 afterward; this is an aggregate count, not a latency or error measurement for the sampled requests.
- **Server Actions:** not exercised. No read-only Server Action was identified; submitting an available action could change household or financial data.
- **Financial mutations:** none.

## 10. US vs Singapore Benchmark

TTFB could not be read in the available browser/Vercel tooling, so the table reports the same UI-ready proxy used for both runs. Deltas are Singapore minus US; negative values are faster.

| Route    | US TTFB | Singapore TTFB | TTFB delta | US UI ready | SG UI ready |   UI-ready delta |
| -------- | ------: | -------------: | ---------: | ----------: | ----------: | ---------------: |
| Home     |       — |              — |          — |    1,795 ms |    1,284 ms |   −511 ms (−28%) |
| Money    |       — |              — |          — |    1,872 ms |      947 ms |   −925 ms (−49%) |
| Plan     |       — |              — |          — |    1,051 ms |    1,454 ms |   +403 ms (+38%) |
| Inbox    |       — |              — |          — |    1,002 ms |    1,388 ms |   +386 ms (+39%) |
| Together |       — |              — |          — |    2,115 ms |      984 ms | −1,131 ms (−53%) |

Across all 25 samples, the median UI-ready time changed from 1,551 ms to 1,233 ms (−318 ms, −21%). Vercel’s Speed Insights was not enabled, and its TTFB chart showed demo data, so a true navigation/TTFB comparison was unavailable.

## 11. Supabase Latency Impact

**Before:** not available. **After:** not available. Vercel showed the Supabase host and aggregate calls, but no latency or error-rate values (`—`) in the available Hobby observability view. The route smoke showed successful authenticated rendering, but it cannot establish Vercel-to-Supabase RTT. Supabase remains in Sydney; it was not moved.

## 12. Final Decision

**Classification: SMALL WIN.** The client-observed UI-ready median improved overall, with Home, Money, and Together faster; Plan and Inbox were each about 0.4 seconds slower in this sample. All five routes remained available and no client-side runtime errors were observed. Keep `sin1`; rollback was not indicated. This decision is based on the comparable UI-ready proxy, not measured TTFB or Supabase latency.

- Database changes: none.
- RLS/Auth changes: none.
- Financial data mutations: none.
- Rollback: not required.

## 13. Raw Evidence

### Raw UI-ready samples (milliseconds)

| Route    | US (`iad1`)                  | Singapore (`sin1`)          |
| -------- | ---------------------------- | --------------------------- |
| Home     | 1795, 2294, 2351, 1447, 1653 | 5114, 1233, 1320, 987, 1284 |
| Money    | 1872, 1721, 1551, 1911, 1955 | 1046, 947, 924, 991, 766    |
| Plan     | 2009, 1352, 1051, 1050, 1016 | 941, 1506, 1664, 1431, 1454 |
| Inbox    | 1206, 1076, 812, 1002, 780   | 856, 806, 1388, 1567, 1428  |
| Together | 1490, 1225, 2217, 2415, 2115 | 983, 733, 984, 1610, 1501   |

### Configuration and deployment evidence

- Repository search: no `vercel.json`, `preferredRegion`, route `regions`, or `functionFailoverRegions`; `next.config.ts` contains no deployment region setting.
- Vercel Functions settings showed Hobby’s one-region limit, `iad1` before the change, and Singapore `sin1` available. After save/reload, the only selected region was `sin1`.
- Previous deployment Resources showed `IAD1`; new deployment Resources showed `SIN1` for all 88 Functions.
- Vercel Observability’s route Duration/TTFB panels showed demo data. External APIs showed the Supabase hostname and aggregate counts, but latency was `—`.
- Browser verification used the authenticated production session. It only loaded routes and read accessibility state; no forms or financial actions were submitted.
- Vercel connector API access returned 403 for project/log metadata. The authenticated Vercel dashboard provided the project and deployment evidence above.
- Repository checks after writing the report: `npm run typecheck` passed. `npm run format:check` reports 197 repository files needing formatting; this report passes a targeted Prettier check. `npm run lint` reports 14 existing `no-console` errors under `output/` scripts. `npm run test` reports 3 failing tests in 231 files (228 passed): `market-valuation-query.test.ts`, `transaction-pagination-query-shape.test.ts`, and `phase-15-auth-onboarding.test.tsx`. No application code was changed in this task.
