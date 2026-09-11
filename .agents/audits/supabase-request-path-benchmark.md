# Supabase Request-Path Benchmark

**Status: PARTIAL — local Vietnam-to-Supabase benchmark and database plans complete; Vercel-region direct probes were not run.**

This is a diagnostic-only investigation of the deployed Family Finances request path. No production infrastructure, database schema/data, Auth configuration, RLS policy, or application behavior was changed.

## 1. Executive summary

- A safe `perf_ping()` RPC was not available, and this audit was not allowed to create one. The minimal successful PostgREST substitute was `GET /rest/v1/accounts?select=id&limit=1`: **274.9 ms median**, **617.1 ms p95**, 21/21 successful samples.
- `GET /auth/v1/user`: **273.0 ms median**, **401.6 ms p95**, 21/21 successful samples.
- A representative accounts projection: **276.9 ms median**, **647.8 ms p95**, 21/21 successful samples.
- Read-only PostgreSQL plans were fast: `SELECT 1` executed in **0.061 ms**; the accounts projection planned in **1.355 ms** and executed in **0.803 ms**; membership planned in **4.267 ms** and executed in **0.895 ms**.
- The measured local request floor is therefore overwhelmingly outside PostgreSQL execution: roughly **275 ms** of the accounts request is HTTP/API/authentication/network path in this test. This is an order-of-magnitude boundary, not a packet-level attribution.
- Five sequential minimal requests took **2,071.7 ms** wall time; five parallel requests took **876.6 ms**. Ten and twenty parallel requests remained below one second wall time, but per-request tails widened. This is **moderate concurrency variance**, not a linear throughput collapse.
- The strongest confirmed application-level issue remains Home fan-out and dependency waves: the existing trace recorded **20 Supabase/Auth fetches** and full-load samples of **1,247 / 1,576 / 1,830 ms**. That trace is prior evidence; this audit did not alter Home.
- Region migration is **not decision-ready** because the same direct probe was not executed from Vercel IAD1, SIN1, or SYD1. Round-trip reduction is the higher-confidence optimization direction; PostgreSQL tuning is not indicated by the measured plans.

## 2. Test environments

| Environment        | Runtime                                                          | Supabase target                                                                                    | Scope and limitation                                             |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `LOCAL_VN` direct  | Node 24 on the audit workstation in Vietnam                      | Supabase project `family-finances-2`, ref `bbzffxvgocjwsdbujvgn`, region `ap-southeast-2` (Sydney) | 21 samples per probe, authenticated dedicated E2E account        |
| `LOCAL_VN` browser | Next dev server at `http://localhost:3000`                       | Same project through the app                                                                       | Supplemental only; dev mode is not production-like               |
| `VERCEL_IAD1`      | Active Vercel production deployment, Node 24, IAD1 Washington DC | Same project through deployed app                                                                  | Direct Supabase probe not deployed or executed from this runtime |
| `SIN1` / `SYD1`    | No benchmark deployment                                          | Same project                                                                                       | Not measured; no preview deployment was created                  |

The active Vercel project is `family-finances`, deployment `F5uoYujhK6X5rf51ViX9Xq189krn`, commit `e56386e46dd07aca18234494e1786fdaa338e86d`. The production function is configured for IAD1 with Fluid Compute and one allowed region.

## 3. Harness and measurement protocol

The harness is [scripts/supabase-request-path-benchmark.mjs](/Users/doantuan/Desktop/Plan/family-finances/scripts/supabase-request-path-benchmark.mjs:1).

Run command:

```sh
VINHA_SUPABASE_BENCH=1 node scripts/supabase-request-path-benchmark.mjs
```

Protocol:

- One warm-up request, then **21 measured samples** per probe.
- Native Node `fetch`, direct to the Supabase Data API/Auth API.
- Existing Playwright auth state is reused; if expired, the dedicated E2E credentials are used to obtain a test session. Tokens and response bodies are never printed.
- GET/read-only probes only; no INSERT, UPDATE, DELETE, migration, Auth configuration, RLS, or schema operation.
- The harness records status, response bytes, elapsed wall time, and errors. It does not expose DNS/TCP/TLS/socket reuse metadata.
- The `REST root` check is retained as an unauthorized control only. It returned HTTP 401 and is not treated as a successful latency baseline.

Why no `perf_ping()` RPC: no safe trivial RPC existed in the deployed database, and creating one would violate the audit's no-production-schema-change constraint. The minimal PostgREST accounts read is the closest available successful control.

## 4. Probe inventory

| Probe                | Request                                                      | Samples | Result                                  |
| -------------------- | ------------------------------------------------------------ | ------: | --------------------------------------- |
| Unauthorized control | `GET /rest/v1/`                                              |      21 | 401; diagnostic gateway/error path only |
| Minimal PostgREST    | `GET /rest/v1/accounts?select=id&limit=1`                    |      21 | 200; 47-byte response                   |
| Auth user            | `GET /auth/v1/user`                                          |      21 | 200; 2,171-byte response                |
| Membership           | Active `household_members` lookup by authenticated `user_id` |      21 | 200; 167-byte response                  |
| Representative Home  | Active accounts projection ordered by `created_at`           |      21 | 200; 1,485-byte response                |

## 5. Minimal PostgREST control

|   n |      min |       median |      p75 |          p95 |      max |   stddev | errors |
| --: | -------: | -----------: | -------: | -----------: | -------: | -------: | -----: |
|  21 | 251.5 ms | **274.9 ms** | 303.9 ms | **617.1 ms** | 636.0 ms | 104.6 ms |      0 |

The successful control establishes a local Vietnam-to-Supabase HTTP/API floor of roughly 275 ms in this run. It is not a database-only measurement.

Raw measured durations, milliseconds:

```text
296.9, 351.8, 274.9, 276.9, 636.0, 265.6, 274.6, 369.1, 617.1, 270.1,
280.0, 271.6, 288.1, 251.5, 270.7, 257.2, 270.8, 255.8, 303.9, 332.8, 263.0
```

## 6. Auth endpoint

`GET /auth/v1/user` was measured separately so Auth overhead is not silently mixed into the PostgREST control.

|   n |      min |       median |      p75 |          p95 |      max |  stddev | errors |
| --: | -------: | -----------: | -------: | -----------: | -------: | ------: | -----: |
|  21 | 254.6 ms | **273.0 ms** | 289.1 ms | **401.6 ms** | 407.5 ms | 45.7 ms |      0 |

Raw measured durations, milliseconds:

```text
288.3, 258.0, 255.6, 289.1, 273.0, 268.1, 275.5, 401.6, 299.6, 407.5,
276.7, 346.6, 254.6, 269.9, 261.3, 268.4, 266.1, 254.7, 361.4, 258.2, 285.2
```

Auth was not materially slower than the minimal PostgREST request in this run. Its p95 was lower than the PostgREST p95, so the evidence does not support blaming Auth alone for the measured tail.

## 7. Membership lookup

Request shape: active membership lookup by the authenticated JWT subject, selecting `id`, `household_id`, `role`, and `user_id`, limited to one row.

|   n |      min |       median |      p75 |          p95 |      max |  stddev | errors |
| --: | -------: | -----------: | -------: | -----------: | -------: | ------: | -----: |
|  21 | 266.5 ms | **282.2 ms** | 305.8 ms | **380.4 ms** | 620.9 ms | 77.1 ms |      0 |

Raw measured durations, milliseconds:

```text
380.4, 267.7, 279.2, 291.4, 275.0, 296.2, 305.8, 274.3, 282.2, 347.0,
267.7, 269.7, 284.9, 275.9, 280.6, 620.9, 273.6, 348.6, 266.5, 284.5, 372.6
```

The request is slightly slower at the median than the minimal accounts read, but the difference is small relative to the shared hosted HTTP path.

## 8. Representative Home query

This is deliberately a narrow representative query, not a claim that it reproduces the whole Home page:

```text
GET /rest/v1/accounts
  ?select=id,name,type,opening_balance,is_archived
  &is_archived=eq.false
  &order=created_at.asc
```

|   n |      min |       median |      p75 |          p95 |      max |   stddev | errors |
| --: | -------: | -----------: | -------: | -----------: | -------: | -------: | -----: |
|  21 | 255.3 ms | **276.9 ms** | 314.7 ms | **647.8 ms** | 696.9 ms | 120.2 ms |      0 |

Raw measured durations, milliseconds:

```text
262.6, 276.9, 264.0, 262.9, 257.9, 275.1, 264.3, 424.7, 274.6, 647.8,
314.7, 402.0, 285.2, 361.9, 292.5, 267.0, 283.3, 271.2, 285.1, 696.9, 255.3
```

The extra projection and sort did not materially change the median, but it showed a wider tail in this sample.

## 9. PostgreSQL execution evidence

All database checks were read-only `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` statements in the Supabase SQL Editor.

| Query                                  | Planning |    Execution | Plan evidence                                                                  |
| -------------------------------------- | -------: | -----------: | ------------------------------------------------------------------------------ |
| `SELECT 1`                             | 0.044 ms | **0.061 ms** | 3 shared buffers hit                                                           |
| Representative accounts projection     | 1.355 ms | **0.803 ms** | 12 rows, sequential scan plus small sort, 1 shared buffer hit during execution |
| Active membership `LIMIT 1`            | 4.267 ms | **0.895 ms** | Sequential scan, 1 shared buffer hit during execution                          |
| Candidate `get_home_savings_summary()` |      N/A |          N/A | Function does not exist in the deployed database                               |

The accounts request's 276.9 ms median versus approximately 2.158 ms of planning plus execution for the same query shape leaves approximately 274.7 ms outside PostgreSQL planning/execution. This is a boundary estimate, not a decomposition into DNS, TCP, TLS, gateway, PostgREST, Auth, and response transfer.

The Supabase Query Performance dashboard independently showed 100% cache hit rate and low mean execution times for recent authenticated queries, with occasional database outliers. Examples included the investment summary wrapper at mean 8–10 ms with maxima of 622–887 ms, and transaction queries at mean 3–11 ms with maxima of 204–358 ms. These are historical aggregate observations, not controlled samples from this run.

## 10. Sequential versus parallel requests

The concurrency probe reused the minimal PostgREST request and measured wall time plus per-request durations.

| Pattern      | Requests | Total wall | Per-request median | Per-request p95 |  Slowest | Errors |
| ------------ | -------: | ---------: | -----------------: | --------------: | -------: | -----: |
| One parallel |        1 |   685.7 ms |           685.4 ms |        685.4 ms | 685.7 ms |      0 |
| Sequential   |        5 | 2,071.7 ms |           280.8 ms |        955.9 ms | 955.9 ms |      0 |
| Parallel     |        5 |   876.6 ms |           484.2 ms |        876.0 ms | 876.0 ms |      0 |
| Parallel     |       10 |   829.0 ms |           304.5 ms |        823.6 ms | 823.6 ms |      0 |
| Parallel     |       20 |   838.0 ms |           413.3 ms |        804.0 ms | 823.7 ms |      0 |

Parallelism avoids the sequential wall-time sum, but the per-request median and tails become noisier. There was no error-rate degradation through 20 concurrent requests.

## 11. Connection reuse and cold-start limitations

Connection reuse was **not directly measured**. Native Node `fetch` does not expose per-request DNS, TCP connect, TLS handshake, socket identity, or reuse metadata through this harness. A lower wall time after warm-up is not sufficient proof of connection reuse because the Supabase gateway and network can also vary.

Cold-start attribution was also not isolated. The first request was recorded as warm-up, but this is a shared hosted service path and the local process was not restarted between every sample.

The previous unauthenticated workstation curl check showed variable DNS/TCP/TLS/TTFB phases, but it used a different request and is not used as a numeric decomposition here.

## 12. Local Vietnam direct results

The direct Node benchmark from Vietnam is the strongest controlled result in this audit:

| Probe                   |   Median |      p95 | Status         |
| ----------------------- | -------: | -------: | -------------- |
| Minimal PostgREST       | 274.9 ms | 617.1 ms | 21/21 HTTP 200 |
| Auth user               | 273.0 ms | 401.6 ms | 21/21 HTTP 200 |
| Membership              | 282.2 ms | 380.4 ms | 21/21 HTTP 200 |
| Representative accounts | 276.9 ms | 647.8 ms | 21/21 HTTP 200 |

## 13. Vercel IAD1 evidence

The identical direct Supabase probe was not run inside the Vercel IAD1 runtime. No temporary benchmark route or production change was introduced to make that happen.

Available production aggregate evidence from the Vercel dashboard:

- Node 24, IAD1, Fluid Compute enabled, one allowed region.
- Recent function TTFB p75: **212 ms**; error rate: **0%**; cold-start share: **27.6%**.
- The `[locale]/home` function had p75 duration around **6 s** across 17 recent invocations; this is a small aggregate sample and includes full server work, not just Supabase.

Supplemental browser navigation samples were collected after a fresh authenticated login, but are not a region experiment. Production Vercel Home had response-start median **106.3 ms**, DOMContentLoaded median **2,112.4 ms**, and five-sample maximum **4,005.8 ms**. Local was a Next dev server with response-start median **517.1 ms** and DOMContentLoaded median **1,545.7 ms**. Different runtimes, caches, builds, and client conditions make this comparison non-causal.

## 14. SIN1 and SYD1 evidence

No direct probes were run from SIN1 or SYD1. No preview deployment was available for this harness, and no preview deployment was created as part of this diagnostic-only audit.

## 15. Cross-environment comparison

| Environment          | Minimal PostgREST median |  Auth median | Representative accounts median | Decision value      |
| -------------------- | -----------------------: | -----------: | -----------------------------: | ------------------- |
| `LOCAL_VN` direct    |                 274.9 ms |     273.0 ms |                       276.9 ms | Controlled baseline |
| `VERCEL_IAD1` direct |             Not measured | Not measured |                   Not measured | Cannot compare      |
| `SIN1` direct        |             Not measured | Not measured |                   Not measured | Cannot compare      |
| `SYD1` direct        |             Not measured | Not measured |                   Not measured | Cannot compare      |

The current data cannot establish whether moving Vercel from IAD1 to an APAC region improves the Supabase request path. It does establish that the Vietnam client-to-Supabase path is materially slower than local PostgreSQL execution.

## 16. Real Home fan-out trace

The existing [Home request-path investigation](/Users/doantuan/Desktop/Plan/family-finances/.agents/audits/home-rsc-performance-investigation.md:1) traced the actual Home server component graph before this benchmark:

- **20 Supabase/Auth fetches** were observed in a full Home request.
- Full-load samples were **1,247 ms**, **1,576 ms**, and **1,830 ms**; TTFB samples were **309 ms**, **437 ms**, and **481 ms**.
- The trace showed an auth gate, a first parallel wave, and dependent account/savings/investment work.
- Slow individual calls included inbox HEAD around **811 ms**, FX around **791 ms**, accounts around **722 ms**, and saving cycles around **664 ms**.
- Home already uses sibling streaming boundaries; the evidence points to dependency shape and remote call count rather than one slow SQL statement.

Those numbers are prior trace evidence, not measurements generated by the new harness, and no Home behavior was changed during this audit.

## 17. Latency breakdown

The measured boundary is:

```text
Representative accounts HTTP median       276.9 ms
- PostgreSQL planning + execution           2.158 ms
-------------------------------------------
Approximate non-DB remainder               274.7 ms
```

That remainder includes some combination of client-to-Supabase geography, DNS/TCP/TLS, gateway, JWT/API-key processing, PostgREST request handling, response transfer, and runtime scheduling. The harness does not identify each component.

Auth and PostgREST medians were effectively equal (273.0 ms versus 274.9 ms). The current evidence does not support a separate Auth bottleneck as the primary issue.

## 18. Root-cause classification

| Rank | Suspected cause                                                    | Evidence                                                                    | Confidence           |
| ---- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- | -------------------- |
| P0   | Hosted HTTP/API/service boundary dominates individual request cost | 273–283 ms median direct probes versus sub-1–2 ms DB plans                  | High                 |
| P0   | Home fan-out and dependency waves multiply remote boundaries       | Existing trace: 20 fetches, 1.247–1.830 s full load                         | High                 |
| P1   | Concurrency produces tail variance                                 | p95 and per-request medians widen at 5–20 parallel requests, with no errors | Medium               |
| P1   | Vercel-to-Supabase geography                                       | IAD1/APAC direct probes absent                                              | Inconclusive         |
| P1   | Connection setup or reuse                                          | Per-socket metadata absent                                                  | Unknown              |
| P2   | PostgreSQL execution                                               | Controlled plans are sub-millisecond execution for tested shapes            | Low as primary cause |
| P2   | Auth endpoint                                                      | Auth median matches minimal PostgREST and has lower p95 in this run         | Low as primary cause |

## 19. Optimization scenarios

These are bounded scenarios, not measured claims:

| Scenario                                              | Evidence-based input                                   | Estimate                                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Current Home path                                     | Existing full-load samples                             | 1,247–1,830 ms; median sample 1,576 ms                                                                                   |
| Remove one serial critical-path remote boundary       | Local direct request median                            | Up to roughly 275 ms saved if that boundary is fully serial and not already overlapped; this is a ceiling, not a promise |
| Collapse several dependent reads                      | Existing 20-fetch trace plus 275 ms per-boundary floor | Likely meaningful; exact saving requires a new end-to-end trace after the change                                         |
| Reduce individual request floor from 275 ms to 100 ms | Hypothetical target only                               | Not measured and should not be presented as a deployment forecast                                                        |
| Move Vercel to APAC                                   | Region effect not measured                             | No credible estimate until IAD1 versus SIN1/SYD1 direct probes exist                                                     |

Do not add these savings together: the current Home trace includes overlapping waves, so removing a request and reducing a request's latency can affect the same critical-path interval.

## 20. Decision

| Question                     | Decision                       | Reason                                                                                           |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Move Vercel region now?      | **BENCHMARK MORE**             | No equivalent Vercel IAD1 or APAC direct probe                                                   |
| Reduce Supabase round trips? | **YES**                        | 20-fetch Home trace plus roughly 275 ms per remote boundary                                      |
| Optimize PostgreSQL first?   | **NO**                         | Tested plans execute in 0.061–0.895 ms; DB is not the dominant measured boundary                 |
| Audit Auth separately?       | **YES, as a narrow follow-up** | Auth is not currently the primary bottleneck, but a Vercel-region direct probe should include it |

## 21. Recommended next step

Run the same gated harness from one non-production Vercel preview pinned to SYD1 or SIN1, using the same dedicated E2E account and the same 21-sample probe/concurrency protocol. Compare it with the existing `LOCAL_VN` results and, if available, a matching IAD1 run. Do not promote that preview until the region decision is supported by equivalent data.

The next application optimization should be a single Home flow change that reduces serial Supabase/Auth boundaries, followed by the existing real-browser verification and a new Home request trace. Do not start with indexes or SQL rewrites unless a new plan shows a materially slow database operation.

## 22. Raw evidence and reproducibility

### Benchmark source and command

- [Benchmark harness](/Users/doantuan/Desktop/Plan/family-finances/scripts/supabase-request-path-benchmark.mjs:1)
- Command: `VINHA_SUPABASE_BENCH=1 node scripts/supabase-request-path-benchmark.mjs`
- Default repeats: 21; the script rejects values below 20.
- No access tokens, credentials, response bodies, row values, or personal financial data are written to the report or console output.

### Database statements

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 1;

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, type, opening_balance, is_archived
FROM public.accounts
WHERE is_archived = false
ORDER BY created_at ASC;

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, household_id, role, user_id
FROM public.household_members
WHERE is_active = true
LIMIT 1;
```

The attempted candidate savings RPC plan was read-only and returned `function public.get_home_savings_summary() does not exist`; no RPC was created.

### Application and platform evidence

- Existing performance tracing uses `VINHA_PERF_TRACE=1` and redacts tokens/bodies.
- Supabase project region: `ap-southeast-2` (Sydney); PostgreSQL 17.6.1.155; PostgREST v14.15; GoTrue v2.194.0.
- Vercel production deployment: `F5uoYujhK6X5rf51ViX9Xq189krn`; Node 24; IAD1; Fluid Compute enabled; one region allowed.
- Existing Home trace: [home-rsc-performance-investigation.md](/Users/doantuan/Desktop/Plan/family-finances/.agents/audits/home-rsc-performance-investigation.md:1).

### Known blockers and gaps

- `npm run build` remains blocked by a pre-existing TypeScript error in `app/[locale]/(auth)/welcome/welcome-screen.tsx:116` involving `previewNetLabel`; this audit did not modify that file.
- Direct Vercel IAD1, SIN1, and SYD1 request-path probes were not measured.
- DNS/TCP/TLS/socket reuse, cold starts per request, and a true trivial RPC baseline were not directly observable under the no-change constraint.
