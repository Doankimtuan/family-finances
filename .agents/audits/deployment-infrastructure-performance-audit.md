# Deployment & Infrastructure Performance Audit

Audit date: 2026-09-10  
Scope: Next.js 16.3.1 / React 19.2.3 / Supabase family-finance application  
Mode: read-only; no production settings, deployments, DNS, secrets, Auth, database, pooling, or regions were changed.

## 1. Executive Summary

| Question                                             | Finding                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next runtime region                                  | **`IAD1` — Washington, D.C., USA (East).** Confirmed in the authenticated Vercel project Functions settings and the active deployment Resources view.                                                                                                                     |
| Supabase region                                      | **`ap-southeast-2`**, supported by the linked-project guard, the cached pooler hostname, and the prior Home investigation. This is AWS Sydney.                                                                                                                            |
| Region alignment                                     | **Cross-continent.** Vercel runs the production functions in `IAD1`; Supabase is `ap-southeast-2` / Sydney.                                                                                                                                                               |
| Measured server → Supabase RTT                       | **Not measured from the production Next runtime.** Prior authenticated application traces measured hosted request times of approximately 253–299 ms normally, with 411–811 ms outliers. Local unauthenticated probes are shown separately and are not server-runtime RTT. |
| Cold-start impact                                    | **Observed but not dominant yet.** Vercel Observability shows 27.6% cold starts for the selected production window; no cold-vs-warm Home comparison is available.                                                                                                         |
| Primary infrastructure bottleneck                    | **Confirmed hosted request fan-out and latency variance on the Home critical path**, not PostgreSQL execution. The prior production-like profile measured 20 Supabase/Auth fetches per Home request, a 437 ms median TTFB, and a 1,576 ms median full load.               |
| Does deployment configuration materially contribute? | **Likely yes.** The deployed function region is cross-continent from Supabase, so each hosted call can pay the distance repeatedly. The exact savings from regional alignment still require a controlled preview comparison.                                              |
| Top recommended change                               | **Run a no-production-change preview in `syd1` (or `sin1`) and compare five authenticated Home requests.** Keep production unchanged until TTFB, total duration, and error behavior improve repeatably.                                                                   |

Bottom line: keep production unchanged. The highest-confidence infrastructure issue is the confirmed `IAD1` → `ap-southeast-2` cross-continent path, amplified by 20 Supabase/Auth fetches per Home request. Validate a Sydney/Singapore preview before any production region change; do not move Supabase, switch to Edge, tune pooling, or add a custom HTTP agent from this audit alone.

## 2. Deployment Topology

The observed and expected request shape is:

```text
User browser
    │
    ▼
CDN / hosting edge                         Vercel
    │
    ▼
Next.js App Router + root proxy             Node.js 24.x / IAD1 (Washington, D.C.)
    │   ├─ proxy.ts: Supabase getClaims()
    │   ├─ product layout: getUser() + membership
    │   └─ Home RSC: parallel domain reads and dependent follow-up reads
    │
    ▼
Supabase Data API / Auth                    project region: ap-southeast-2
    │   ├─ PostgREST /rest/v1
    │   ├─ Auth /auth/v1
    │   └─ RPC /rest/v1/rpc/*
    │
    ▼
PostgreSQL                                  project primary: ap-southeast-2
```

The Supabase project identity is `family-finances-2` / ref `bbzffxvgocjwsdbujvgn`. The ref and keys were not exposed in this report beyond the non-secret project ref.

## 3. Hosting Configuration

### Evidence available locally

| Setting                           | Evidence                                     | Audit result                                                                                       |
| --------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Framework                         | `next` dependency and `next.config.ts`       | Next.js 16.3.1                                                                                     |
| React                             | `react`, `react-dom` dependencies            | React 19.2.3                                                                                       |
| Build command                     | `package.json`                               | `next build` via `npm run build`                                                                   |
| Start command                     | `package.json`                               | `next start` via `npm run start`                                                                   |
| Output mode                       | `next.config.ts` has no `output`             | Default Next output; not a static export or standalone configuration in source                     |
| Framework preset                  | No deployment metadata                       | Unknown; Next is inferred from source only                                                         |
| Vercel project                    | Authenticated Vercel dashboard               | `family-finances`; project ID `prj_Xf60Is4ZNCCBw5TvI5QuLfD9xJSY`; Hobby plan                       |
| Active production deployment      | Authenticated Vercel dashboard               | Ready deployment `F5uoYujhK6X5rf51ViX9Xq189krn`; commit `e56386e46dd07aca18234494e1786fdaa338e86d` |
| Production domain                 | Authenticated Vercel dashboard               | `family-finances-iota.vercel.app`                                                                  |
| Function region(s)                | Deployment Resources / Functions settings    | `IAD1`; Hobby plan permits one function region                                                     |
| Node vs Edge                      | Deployment Resources                         | Node.js `24.x`; not Edge                                                                           |
| Memory / CPU                      | Functions settings                           | Hobby plan shows `1 GB` memory and `0.6 vCPU`; Fluid Compute enabled                               |
| Function timeout                  | Deployment Resources                         | `≤300s` displayed for the deployed functions                                                       |
| Function count / Home bundle      | Deployment Resources                         | 88 functions; Home row shows `3.47 MB`                                                             |
| CDN / HTTP/2 / HTTP/3             | No raw production response headers collected | CDN protocol details remain unknown                                                                |
| Compression                       | No raw production response headers collected | Unknown                                                                                            |
| Production environment variables  | Values intentionally not read                | Configuration names/values were not included in the report                                         |
| Preview-vs-production differences | No controlled preview experiment             | Unknown                                                                                            |
| Build / root directory            | Build and Deployment settings                | Repository build; no command/output override surfaced; root directory `./`                         |
| Node setting / deployment checks  | Build and Deployment settings                | Node `24.x`; no deployment checks configured                                                       |
| Retention / rolling releases      | Build and Deployment settings                | 30-day retention; rolling releases disabled on Hobby; production builds prioritized                |
| Product analytics                 | Project Overview                             | Speed Insights and Web Analytics not enabled                                                       |

### Source-level runtime audit

The only root request interception file is `proxy.ts`. Its matcher excludes API, `trpc`, `_next`, `_vercel`, and dotted static paths. It performs locale routing and `updateSession()`, which calls Supabase Auth `getClaims()` for matched requests.

No source file exports `runtime`, `preferredRegion`, `dynamic`, `revalidate`, `fetchCache`, or `maxDuration`. `next.config.ts` is otherwise empty apart from the `next-intl` plugin. There is no `instrumentation.ts`, `vercel.json`, Dockerfile, or alternate hosting configuration.

This means the repository does not deliberately pin a runtime or region. That is a configuration gap for auditability, not proof of a bad deployment setting.

### Build check

`npm run build` on 2026-09-10 compiled successfully in 4.4 seconds, then failed during TypeScript validation:

```text
app/[locale]/(auth)/welcome/welcome-screen.tsx(116,16): error TS2345:
Argument of type '"previewNetLabel"' is not assignable to parameter of type
'NamespacedMessageKeys<AppMessages, "auth.welcome">'.
```

The local production build is therefore not currently a valid source for production route-size, function-bundle, or cold-start conclusions. The existing `.next` files are development/Turbopack artifacts and were not treated as production bundle evidence.

## 4. Supabase Configuration

### Known project facts

| Setting                            | Finding                                                               | Confidence                                                               |
| ---------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Project name                       | `family-finances-2`                                                   | High                                                                     |
| Project ref                        | `bbzffxvgocjwsdbujvgn`                                                | High                                                                     |
| Project region                     | `ap-southeast-2`                                                      | High                                                                     |
| Database region                    | Same primary project region by Supabase project topology              | High                                                                     |
| Cached database service version    | PostgreSQL `17.6.1.155`                                               | Medium; cached local CLI metadata                                        |
| Cached REST service version        | PostgREST `v14.15`                                                    | Medium; cached local CLI metadata                                        |
| Cached Auth service version        | GoTrue `v2.194.0`                                                     | Medium; cached local CLI metadata                                        |
| Shared pooler hostname             | `aws-0-ap-southeast-2.pooler.supabase.com`                            | High; hostname redacted to omit credentials                              |
| Pooler port in cache               | `5432`                                                                | High; session-mode shared pooler shape                                   |
| Plan / tier                        | Unknown                                                               | No authenticated Management API or dashboard evidence                    |
| Compute size                       | Unknown                                                               | No authenticated Management API or dashboard evidence                    |
| Autosuspend / sleep                | Unknown                                                               | No project metrics or plan evidence                                      |
| API limits / rate limits           | Unknown                                                               | No project metrics or plan evidence                                      |
| Auth endpoint region               | Same project API service; request latency not service-region-isolated | Medium                                                                   |
| PostgREST endpoint                 | `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1`                                 | High                                                                     |
| Auth endpoint                      | `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1`                                 | High                                                                     |
| Current connection-pool saturation | Unknown                                                               | No Supabase logs/metrics access                                          |
| Current database execution         | Prior representative plans were sub-10 ms                             | Medium/high for the measured queries, not a current full-Home accounting |

The cached pooler URL is not the Home request path: the application uses `@supabase/ssr` and the Supabase Data API over HTTPS. The pooler record is still useful topology evidence, but it does not prove that the server-side REST calls use a PostgreSQL client pool.

### Access limitations

- Supabase MCP tools were not available in the session.
- `supabase projects list -o json` could not run because no Supabase Management API access token is configured.
- `psql` is not installed, so direct read-only `pg_stat_activity` / `pg_stat_statements` inspection was unavailable.
- No Supabase API/Auth/PostgREST/Pooler logs or metrics were accessible.
- No migration, project setting, Auth setting, secret, pooling setting, or database configuration was changed.

The Supabase CLI is installed at version `2.20.5`; it reports `2.117.0` as the current available release. The older CLI also predates several newer inspection commands, so its absence of a command was not treated as an absence of platform capability.

## 5. Region Analysis

`ap-southeast-2` is Supabase’s AWS Sydney region. The deployed Vercel functions run in `IAD1`, which the Vercel dashboard identifies as Washington, D.C., USA (East). The production topology is therefore cross-continent.

| Scenario                                   | Expected effect                                                                                                          | Status                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Current `IAD1` → Supabase `ap-southeast-2` | Repeats a cross-continent network leg across the authenticated Home request’s remote waves                               | **Confirmed current topology; high-impact hypothesis** |
| Vercel `syd1` → Supabase `ap-southeast-2`  | Should minimize the geographic leg; remaining cost is API gateway/Auth/PostgREST plus request fan-out                    | Best preview candidate; gain unmeasured                |
| Vercel `sin1` → Supabase `ap-southeast-2`  | Keeps execution in APAC but is farther from Sydney than `syd1`                                                           | Secondary preview candidate; gain unmeasured           |
| Edge execution near the user               | Could reduce browser-to-function latency but may place server-to-Supabase calls farther away and does not remove fan-out | Not recommended without a preview measurement          |

Geography alone is not sufficient. The correct experiment is an authenticated preview deployment pinned to `syd1` (and optionally `sin1`), using the same dataset, build, cookies, and five-load protocol. No preview deployment was created because the audit brief forbids deployment changes.

## 6. Server → Supabase Measurements

### Production-like authenticated application evidence

The prior Home investigation is the strongest available server-side evidence:

| Probe family                       | Observed timing                                                                 | Interpretation                                       |
| ---------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Normal hosted PostgREST/Auth calls | Approximately 253–299 ms                                                        | Dominant per-call wall time in the application trace |
| Auth user / membership             | Approximately 265–441 ms                                                        | Authenticated Home gate contributes directly to TTFB |
| Contention outliers                | Approximately 411–811 ms                                                        | Request-path variance; exact layer not isolated      |
| PostgreSQL execution plans         | Approximately 0.06–1.6 ms for hot reads; 4–9 ms on a 10,000-transaction fixture | Database execution is not the dominant measured cost |
| Home fetch count                   | 20 Supabase/Auth fetches per P8 request                                         | Fan-out is the dominant multiplier                   |

These are application fetch durations, not pure RTT. They include DNS, TCP/TLS, network, API gateway, Auth/PostgREST processing, database execution, and transfer.

### Vercel production observability snapshot

The authenticated Vercel dashboard showed the following for the selected **Production / last 12 hours** window at audit time:

| Metric                        |             Observed value |
| ----------------------------- | -------------------------: |
| Function invocations          |                         58 |
| Function error rate           |                         0% |
| Function TTFB P75             |                     212 ms |
| Cold-start share              |                      27.6% |
| Active CPU P75                |                     412 ms |
| Average memory                | 268 MB / 2.05 GB displayed |
| CPU throttle P75              |                       5.3% |
| `/[locale]/home` invocations  |                         17 |
| `/[locale]/home` P75 duration |                        6 s |
| `/[locale]/home` error rate   |                         0% |

These are platform aggregates, not per-request traces and not a pure server-to-Supabase RTT. The Home `6 s` P75 duration is a stronger production signal than the prior local profile, but the dashboard does not expose enough detail here to attribute that duration to cold start, Supabase waves, rendering, or client transfer. It increases the priority of a controlled preview comparison.

### Five-sample local read-only probes

These probes ran from the audit workstation, not from the deployed Next runtime. They used the public Supabase key without a user session, so every response was `401`. They measure a public-network request path and handshake variance, not an authenticated Home query.

| Probe                                     |    Run 1 |    Run 2 |      Run 3 |    Run 4 |      Run 5 |       Median |        Max |
| ----------------------------------------- | -------: | -------: | ---------: | -------: | ---------: | -----------: | ---------: |
| `GET /rest/v1/accounts?select=id&limit=1` | 945.2 ms | 854.3 ms |   952.7 ms | 555.4 ms | 1,233.8 ms | **945.2 ms** | 1,233.8 ms |
| `GET /auth/v1/user`                       | 492.3 ms | 463.0 ms | 1,000.3 ms | 459.5 ms |   526.6 ms | **492.3 ms** | 1,000.3 ms |
| `GET /rest/v1/`                           | 289.6 ms | 286.8 ms |   332.9 ms | 280.1 ms |   341.8 ms | **289.6 ms** |   341.8 ms |

Selected local timing fields:

| Probe     |  DNS range |     TCP range |      TLS range |     TTFB range | Status / size    |
| --------- | ---------: | ------------: | -------------: | -------------: | ---------------- |
| Accounts  | 2.4–3.8 ms |  75.8–98.1 ms | 165.9–206.1 ms | 555.0–952.3 ms | `401`, 186 bytes |
| Auth user | 2.7–4.3 ms | 79.1–159.4 ms | 181.3–252.4 ms | 458.8–999.9 ms | `401`, 96 bytes  |
| REST root | 2.4–3.7 ms | 68.7–145.1 ms | 145.9–229.2 ms | 279.8–341.6 ms | `401`, 98 bytes  |

The accounts result is especially unsuitable as a performance baseline because the failed unauthorized request did not reach the application’s authenticated query plan. The local result still supports a high-variance hosted request path, but it cannot answer the mandatory production-runtime RTT question.

### RPC and representative authenticated Home query

Not measured in this audit. A valid run requires a safe authenticated session from the deployed runtime or a platform trace containing the request. The existing savings RPC is not deployed to the linked database according to the prior audit; its compatibility fallback is currently expected to preserve the old two-read shape.

## 7. Auth Deployment Cost

### Source-level path

```text
Matched request
  → proxy.ts
    → updateSession()
      → auth.getClaims()

Product route
  → ProductLayout
    → requireProductSession()
      → getSessionMembership()
        → getVerifiedAuthSubject() / auth.getClaims()
        → getSessionUser() / auth.getUser()
        → resolveActiveMembership() / household_members

Home data helpers
  → assertMoneyActionAllowed()
    → request-local cached session/membership result
```

The source correctly uses `getClaims()` for the optimistic/session-refresh path and retains `getUser()` for the current-user check. React `cache()` deduplicates many helper calls inside one server render, but the root proxy is a separate request phase from the product layout and cannot be treated as the same server call.

### Evidence and verdict

- Prior P8 TTFB median: **437 ms**.
- Prior per-run auth critical-path maxima: **442 / 411 / 290 ms**, median approximately **411 ms**.
- Prior `getClaims()` warm span: approximately **1–2 ms** in the application trace.
- Prior `getUser()` and membership requests: approximately **265–441 ms**.

Classification: **CONFIRMED material auth gate**, with **HIGH confidence**. The confirmed `IAD1` → `ap-southeast-2` distance is the likely deployment multiplier; its exact platform contribution is still unmeasured.

The auth gate must not be removed or moved to the browser: it is a fail-closed household access boundary. Any optimization must preserve cookie refresh, user/membership agreement, and RLS semantics.

## 8. Cold Start Analysis

| Signal                                | Finding                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| Vercel initialization logs            | No per-request initialization trace available                                             |
| First request after idle              | Not measured                                                                              |
| Warm request comparison               | Prior P8 was warm-only; no cold/warm pair                                                 |
| Module initialization timing          | Not emitted                                                                               |
| Supabase client initialization timing | Client construction is local and request-cached; network timing dominates in prior traces |
| Middleware/proxy initialization       | Not isolated                                                                              |
| Local production build                | Compiled, then failed TypeScript validation; not evidence of function startup             |
| Vercel production cold-start share    | `27.6%` in the selected last-12-hours Functions view                                      |

Classification: **COLD START PRESENCE: CONFIRMED; COLD-START IMPACT ON HOME: INCONCLUSIVE**. The aggregate cold-start share makes cold starts worth measuring, but it does not establish that they dominate the Home `6 s` P75 duration.

Do not add an Edge runtime, keep-warm job, or bundle refactor to solve an unmeasured cold-start problem. First collect Vercel function duration/init data or a controlled cold-vs-warm trace. A serverless cold start may matter, but the current evidence does not separate it from the already-large hosted Supabase request time.

## 9. Connection Reuse Analysis

### Source evidence

- `modules/platform/supabase/server.ts` creates a request-local `@supabase/ssr` client and passes native `fetch`, wrapped only when `VINHA_PERF_TRACE=1`.
- `modules/platform/supabase/update-session.ts` does the same for proxy Auth calls.
- No custom `http.Agent`, `undici` dispatcher, keep-alive agent, DNS cache, or TLS session cache is configured.
- React `cache()` reuses the client/promise inside one render; it is not proof of socket reuse across invocations.
- The application is calling Supabase over HTTPS Data API/Auth endpoints, not a direct PostgreSQL connection.

### What can and cannot be concluded

| Item                | Result                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| HTTP keep-alive     | Native platform `fetch` is used; actual reuse is unobserved                |
| Connection churn    | Unknown                                                                    |
| TLS repetition      | Local one-process curl showed TLS cost, but not deployed-function behavior |
| DNS repetition      | Unknown in production                                                      |
| HTTP/1.1 vs HTTP/2  | Unknown in production; local curl has HTTP/2 support                       |
| Custom agent needed | No evidence; do not add one                                                |

Classification: **CONNECTION REUSE: INCONCLUSIVE**, with a low-risk source posture. The next measurement should inspect platform traces or per-request connection metadata before changing the fetch layer.

## 10. Supabase API / Compute Analysis

| Suspected cause                       | Evidence                                                                            | Classification                        |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------- |
| API gateway / hosted request overhead | 253–299 ms normal application fetches; local public probes also show hundreds of ms | **Likely**                            |
| Auth service latency                  | Auth gate is 265–441 ms in prior traces                                             | **Confirmed material contributor**    |
| PostgREST processing                  | REST calls are hundreds of ms while representative SQL is sub-10 ms                 | **Likely request-path contributor**   |
| PostgreSQL execution                  | Prior plans 0.06–1.6 ms; fixture 4–9 ms                                             | **Not a problem at measured sizes**   |
| Supabase compute saturation           | No metrics/logs                                                                     | **Inconclusive**                      |
| Connection-pool saturation            | No pooler/dashboard metrics                                                         | **Inconclusive**                      |
| Rate limiting                         | No 429 evidence in available traces                                                 | **Not evidenced**                     |
| Sleep/resume / autosuspend            | Plan and project settings unavailable                                               | **Inconclusive**                      |
| Request contention                    | 411–811 ms outliers                                                                 | **Confirmed variance; layer unknown** |

The 400–800 ms outliers cannot be attributed honestly to network RTT, compute contention, connection saturation, or PostgREST alone without correlated Supabase logs. The strongest safe statement is that the expensive portion is the hosted request path, multiplied by critical-path fan-out; database CPU is not the measured bottleneck.

## 11. Next.js Runtime Analysis

### Route and runtime configuration

- Home is an App Router Server Component route under `app/[locale]/(product)/home/page.tsx`.
- The product layout is an authenticated server boundary.
- Home now uses sibling `Suspense` boundaries and request-local promise reuse.
- No Home or product route exports `runtime`, `preferredRegion`, `dynamic`, `revalidate`, `fetchCache`, or `maxDuration`.
- `proxy.ts` is the Next.js 16 proxy convention and matches product/auth locale routes while excluding APIs and static files.
- The source contains no `instrumentation.ts` and no OpenTelemetry exporter.

### Middleware/proxy findings

The proxy performs a Supabase `getClaims()` call on every matched request when the Supabase environment is configured. This is an intentional session-refresh/security path. The product layout performs its own current-user and membership gate. The prior P8 traces confirm a material auth floor, but not a pathological sequential auth chain: the user and membership work overlap.

Classification:

- Runtime configuration: **CONFIRMED** for the active deployment: Vercel Node.js `24.x`, function region `IAD1`, Fluid Compute enabled, Hobby plan.
- Node vs Edge: **Node remains preferable by default** for this page because it is an authenticated, database-heavy Server Component tree and no Edge benefit has been measured.
- Region fit: **CONFIRMED cross-continent mismatch** with Supabase `ap-southeast-2`; this is the leading deployment-level hypothesis.
- Proxy cost: **CONFIRMED contributor**, but not a reason to remove the security gate.

## 12. CDN and Asset Delivery

The production domain and deployment URL are now known, but raw response headers were not collected in this audit. Vercel shows 163 static assets for the active deployment and no Speed Insights or Web Analytics are enabled. No custom cache headers, compression settings, or image loader settings are configured in source.

Local source observations:

- Geist fonts are loaded through `geist/font` and the generated production artifacts contain approximately 70 KB font files.
- Brand PNGs exist, with the largest source image approximately 967 KB; brand rendering uses `next/image` in the shared brand component.
- The prior Home document was 78,590 encoded bytes / 369,698 decoded bytes in the production-like P8 capture.
- The prior investigation found no payload growth large enough to explain the 1.2–1.8 second Home range.

Classification: **CDN/static delivery: not evidenced as the primary problem**. Do not spend the next optimization cycle on image or compression work until production headers or Real User Measurement show that static delivery is material.

## 13. Production Home Trace

The Vercel dashboard provides an aggregate production signal, but not a correlated per-request Supabase trace. The following remains the closest request-level evidence from the prior P8 authenticated profile and is labeled accordingly.

| Production platform signal          |                 Observed value |
| ----------------------------------- | -----------------------------: |
| Active deployment                   | `F5uoYujhK6X5rf51ViX9Xq189krn` |
| Function region / runtime           |        `IAD1` / Node.js `24.x` |
| Vercel production function TTFB P75 |                         212 ms |
| `/[locale]/home` invocations        |                             17 |
| `/[locale]/home` P75 duration       |                            6 s |
| `/[locale]/home` errors             |                             0% |
| Selected aggregate cold-start share |                          27.6% |

| Sample | Full load |   TTFB | Supabase/Auth fetches | Slow/critical evidence                                                                |
| ------ | --------: | -----: | --------------------: | ------------------------------------------------------------------------------------- |
| Fast   |  1,247 ms | 309 ms |                    20 | Quiet dependent wave approximately 256–269 ms                                         |
| Median |  1,576 ms | 437 ms |                    20 | Normal hosted reads approximately 253–299 ms; auth critical max approximately 411 ms  |
| Slow   |  1,830 ms | 481 ms |                    20 | Outliers included inbox HEAD 811 ms, FX 791 ms, accounts 722 ms, saving cycles 664 ms |

Reconstructed path:

```text
Browser
  → local Next production-like server / RSC document
  → proxy auth claims
  → product layout auth + membership
  → Home first parallel wave
  → ID-dependent account/savings/investment follow-up wave
  → streamed/document response
```

This evidence proves the request shape and dominant fan-out. The Vercel dashboard separately confirms the production region and aggregate function metrics, but does not provide a correlated per-request Supabase trace.

## 14. Infrastructure Latency Budget

This is a causal budget, not an additive sum. Overlapping requests must not be double-counted.

| Component                   | Evidence                                                          |           Approximate impact |
| --------------------------- | ----------------------------------------------------------------- | ---------------------------: |
| Browser/CDN/network to Next | Production headers unavailable                                    |                   Unmeasured |
| Next runtime startup        | Vercel cold-start share 27.6%; no per-request init trace          |        Present, not isolated |
| Proxy/auth gate             | TTFB median 437 ms; auth critical max median approximately 411 ms |               Material floor |
| First parallel Home wave    | Most reads 253–299 ms; outliers 540–722 ms                        |              One hosted wave |
| ID-dependent second wave    | Quiet 256–269 ms; dependent outliers up to 630–664 ms             |              One hosted wave |
| PostgreSQL execution        | 0.06–1.6 ms hot reads; 4–9 ms fixture                             |      Minor at measured sizes |
| RSC/render/transfer         | Encoded document 78.6 KB; not separately isolated                 |    Not indicated as dominant |
| Hosted contention           | 411–811 ms individual calls                                       | Main source of tail variance |

The credible current budget statement is: Auth consumes the first-byte floor; one first data wave and one dependent wave consume the remaining critical path; 20 remote fetches multiply the opportunity for variance; SQL execution is orders of magnitude smaller than hosted request elapsed time; the deployed `IAD1` placement likely adds avoidable distance to each hosted wave. Vercel’s aggregate Home `6 s` P75 duration warrants a preview experiment, but does not identify the exact share attributable to region versus cold start or request contention.

## 15. Root Causes

### P0 — Cross-continent Vercel-to-Supabase placement

Evidence:

- Production Vercel functions run in `IAD1` / Washington, D.C.
- Supabase primary region is `ap-southeast-2` / Sydney.
- Home performs 20 Supabase/Auth fetches per request, so the distance is paid across multiple request waves.

Measured impact: exact region delta is not isolated; Vercel reports `/[locale]/home` at `6 s` P75 in the selected production window.  
Why: a cross-continent server-to-API path can add network latency and variance to every remote call, including the authenticated gate and dependent data waves.  
Confidence: **High for topology; medium for exact latency impact**.

### P0 — Hosted Supabase/Auth round-trip fan-out

Evidence:

- Prior P8 measured 20 fetches per Home request.
- Normal hosted calls were approximately 253–299 ms.
- The Home graph contains an auth gate, a broad first wave, and ID-dependent follow-up reads.
- PostgreSQL execution was sub-10 ms for representative plans.

Measured impact: 1,576 ms median Home load and 437 ms median TTFB in the prior production-like profile.  
Why: the server-rendered page makes many remote Data API/Auth calls, and some follow-up calls cannot begin until parent IDs return.  
Confidence: **High**.

### P1 — ID-dependent follow-up waves

Evidence: account IDs precede ledger balances, saving IDs precede current cycles, and holding IDs precede instruments/prices/FX/summary inputs.  
Measured impact: approximately 256–269 ms in the quiet sample, with dependent request outliers up to approximately 630–664 ms.  
Why: genuine data dependencies in the current domain APIs.  
Confidence: **High**.

### P1 — Authenticated gate before Home render

Evidence: product layout waits for user/membership validity; prior auth critical maxima were 442 / 411 / 290 ms.  
Measured impact: approximately 411 ms median-of-per-run-max; TTFB median 437 ms.  
Why: fail-closed cookie/session/household security boundary.  
Confidence: **High**.

### P2 — Cold-start contribution

Evidence: Vercel reports a 27.6% aggregate cold-start share, but no Home-specific cold/warm pair.  
Measured impact: unavailable.  
Why: cold starts may contribute to the Home `6 s` P75, but the dashboard does not correlate startup with Supabase request waves.  
Confidence: **Medium that it exists; low for its share of Home latency**.

### P2 — Historical authenticated prefetch contention

Evidence: the prior investigation found this historically, while P8 observed no current Home prefetch stampede.  
Measured impact: historical contributor; not current Home evidence.  
Confidence: **High historically, low currently**.

## 16. Optimization Options

| Option                                                                          | Expected improvement                                                                        | Effort      | Risk        | Confidence                    | Financial correctness risk                               | Downtime                              | Redeploy          | DB migration          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------- | ----------- | ----------------------------- | -------------------------------------------------------- | ------------------------------------- | ----------------- | --------------------- |
| Capture correlated Vercel/Supabase observability and measure first              | Enables correct decision; no direct latency change                                          | Low         | Low         | High                          | None                                                     | No                                    | No                | No                    |
| Keep current production unchanged until the preview wins                        | Avoids unsupported change                                                                   | None        | Low         | High                          | None                                                     | No                                    | No                | No                    |
| Pin a preview Next runtime to `syd1` (then `sin1` if useful) and compare        | Potentially removes a meaningful part of each remote-call leg; exact gain unknown           | Low/medium  | Medium      | High-value experiment         | Low                                                      | No for production                     | Yes, preview only | No                    |
| Move production Next runtime if preview wins                                    | Potentially reduces every critical Supabase wave                                            | Medium      | Medium/high | Conditional                   | Low domain risk; deployment/user-latency risk            | Usually no, but verify alias behavior | Yes               | No                    |
| Move Supabase project                                                           | Could improve data proximity only if the chosen new region better matches the runtime/users | High        | High        | Low without runtime/user data | High migration/Auth/data risk                            | Possible                              | Yes               | Yes/migration project |
| Keep Node runtime and measure before considering Edge                           | Preserves full SSR/runtime compatibility and does not assume Edge removes DB latency        | None        | Low         | High                          | None                                                     | No                                    | No                | No                    |
| Deploy the already-written savings summary RPC after migration-history approval | Removes one savings read round trip when live; estimated one hosted RTT for that wave       | Medium      | Medium      | Medium                        | Medium; must prove exact aggregate equivalence           | No if migration is safe               | Yes               | Yes                   |
| Consolidate account/ledger or investment dependency waves                       | Plausible one-hosted-RTT savings per collapsed critical wave                                | High        | Medium/high | Medium                        | High; ownership and financial equivalence must be proven | No if additive                        | Yes               | Yes                   |
| Add a custom HTTP agent/dispatcher                                              | Unknown; native `fetch` already supplies platform behavior                                  | Medium      | Medium      | Low                           | None                                                     | No                                    | Yes               | No                    |
| Add cross-request financial-data caching                                        | Could reduce repeat-navigation work                                                         | High        | High        | Low                           | High stale-data/privacy/invalidation risk                | No                                    | Yes               | No                    |
| Move Home to browser REST/API fetching                                          | Does not remove Supabase work; likely adds a hop and delays meaningful content              | Medium/high | High        | High that it is not a fix     | Medium UX/freshness risk                                 | No                                    | Yes               | No                    |
| Upgrade hosting/Supabase tier without saturation evidence                       | No quantified gain                                                                          | Medium/high | Medium      | Low                           | None directly                                            | No                                    | Yes/settings      | No                    |

## 17. Region/Runtime Recommendation

### Should the Next runtime move?

**Probably, but only after a preview comparison.** The active functions are in `IAD1` while Supabase is in Sydney. Pin a preview to `syd1`, run five authenticated Home requests with the same build/data/cookies, and compare median/p95 TTFB, total duration, cold/warm behavior, and errors. Move production only if the improvement is repeatable and acceptable for the user geography.

### Should Supabase move?

**No evidence supports moving Supabase.** Keep the project in `ap-southeast-2`. Supabase region migration is a create-new-project/data-migration/Auth/DNS/secret operation with high operational risk; the cheaper, lower-risk experiment is aligning Vercel to the existing database first.

### Should both remain where they are?

**Yes for production until the preview wins.** The current placement is a credible latency problem, but an unmeasured production switch is still unnecessary risk.

### Would Edge help?

**Not on current evidence.** Edge could reduce function cold-start or user-to-function distance, but it does not remove the server-to-Supabase calls and can worsen the database leg when execution is not pinned near Sydney. The Home route is database-heavy and uses SSR cookie/session behavior; retain Node until a controlled preview proves otherwise.

### Would Node remain preferable?

**Yes.** The current Next/Supabase SSR design is compatible with the default Node path, and the measured bottleneck is remote request fan-out rather than CPU. Do not switch runtime as a speculative latency fix.

## 18. Cost / Risk Notes

- Vercel region changes can improve database proximity but may worsen browser latency for users outside the selected region; user geography was not available.
- A preview experiment should be isolated from production environment variables and data mutations. This audit did not create one.
- Supabase project moves are materially riskier than Vercel region changes because they can affect data, Auth users/sessions, API URLs, secrets, webhooks, and DNS.
- A combined read RPC has financial and tenancy correctness risk even when it is read-only. It must preserve RLS, membership filtering, numeric precision, and existing UI status behavior.
- Custom caching of household balances, transactions, savings, or investments risks stale financial state and cross-household leakage. It is not justified by this evidence.
- The current application-side performance trace is explicitly development-gated by `VINHA_PERF_TRACE=1` and logs paths/status/durations without tokens, bodies, or row data. There is no evidence that verbose tracing is enabled in production.
- No secrets were copied into this report. Local env names were inspected only; production env configuration remains unknown.

## 19. Recommended Implementation Order

1. **Capture five authenticated production Home requests.** Record deployment ID, function region, cold/warm state if visible, TTFB, total duration, Supabase request count, slowest calls, response size, and request IDs. Redact all user data and secrets.
2. **Run a preview region experiment.** Pin the same build to `syd1`; optionally compare `sin1`; use the same data path and authenticated five-load protocol. Compare median/p95 TTFB, total duration, Home section completion, cold/warm behavior, and errors.
3. **Move production only if the preview wins.** Preserve the user-region trade-off decision and verify alias behavior before promotion.
4. **Reconcile Supabase migration history before applying the existing savings RPC.** Do not push the local migration or repair history implicitly. Verify RPC/RLS equivalence with read-only authenticated, anonymous, non-member, and cross-household checks after approval.
5. **Only then benchmark one additional consolidated read wave.** Prefer the smallest candidate that removes one proven critical-path round trip; keep the existing domain API contract if possible.
6. **Re-run build and production-like measurements.** Fix the existing `previewNetLabel` type failure first so a valid production build and route-size comparison exist.

## 20. Changes NOT Recommended

- Do not convert Home to browser-side Supabase REST/API fetching.
- Do not move Supabase based on geography before the actual Next region and user distribution are known.
- Do not switch the Home route to Edge because of generic cold-start guidance.
- Do not add a custom HTTP agent or dispatcher without connection-reuse evidence.
- Do not add cross-request caching for financial data without a complete invalidation/privacy design.
- Do not increase memory/CPU, change max duration, or upgrade plans without platform saturation or CPU evidence.
- Do not remove or weaken the proxy/product Auth gate.
- Do not change Supabase pooler mode, connection limits, Auth settings, database configuration, secrets, DNS, or production deployment settings in this audit.
- Do not call local unauthenticated 401 timings production server-to-Supabase RTT.

## 21. Raw Evidence

### Repository evidence

- `package.json`: Next 16.3.1, React 19.2.3, `npm run build`, `npm run start`.
- `next.config.ts`: no output mode, region, runtime, caching, or duration configuration.
- `proxy.ts`: Next.js 16 proxy matcher and session refresh path.
- `modules/platform/supabase/server.ts`: request-local SSR client using native `fetch`.
- `modules/platform/supabase/update-session.ts`: proxy Auth `getClaims()` and gated performance wrapper.
- `modules/tenancy/application/get-session-membership.ts`: user/claims/membership overlap.
- `modules/tenancy/application/require-product-session.ts`: product route security boundary.
- `app/[locale]/(product)/layout.tsx`: authenticated layout and unread navigation count.
- `app/[locale]/(product)/home/page.tsx`: Home readiness and sibling Suspense composition.
- `app/[locale]/(product)/home/home-streaming-sections.tsx`: Home parallel promises and section boundaries.
- `modules/home/application/get-home-dashboard.ts`: readiness/period/dashboard orchestration.
- `modules/savings/application/queries/savings-home-summary.ts`: savings RPC with missing-function compatibility fallback.
- `supabase/.temp/linked-project.json`: linked project name/ref.
- `supabase/.temp/project-ref`: linked project ref.
- `supabase/.temp/pooler-url`: redacted shared pooler host and `ap-southeast-2` region marker.
- `scripts/assert-development-supabase.mjs`: repository guard naming project `family-finances-2` and region `ap-southeast-2`.

### Existing performance evidence

- `.agents/audits/home-rsc-performance-investigation.md`: P8 Home profile, 1,576 ms median load, 437 ms median TTFB, 20 Supabase/Auth fetches, hosted request timing, and sub-10 ms representative SQL evidence.
- `.agents/audits/home-section-streaming-optimization.md`: current streaming/RPC state, missing linked RPC, migration drift, and incomplete production-like verification.

### Commands and outcomes

```text
supabase --version
→ Supabase CLI 2.20.5

supabase projects list -o json
→ Access token not provided; no Management API project list

Vercel MCP list teams
→ {"teams": []}

Vercel MCP list projects
→ Failed to list projects; authenticated API calls returned 403 for scope `doankimtuans-projects`

Vercel authenticated dashboard (read-only)
→ Project `family-finances`, project ID `prj_Xf60Is4ZNCCBw5TvI5QuLfD9xJSY`, Hobby plan
→ Production domain `family-finances-iota.vercel.app`
→ Active deployment `F5uoYujhK6X5rf51ViX9Xq189krn`, commit `e56386e46dd07aca18234494e1786fdaa338e86d`
→ Functions: `IAD1`, Node.js `24.x`, Home function `3.47 MB`, max duration `≤300s`
→ Functions settings: Fluid Compute enabled; one region allowed; `IAD1` selected; `syd1` and `sin1` available
→ Production observability snapshot: TTFB P75 `212ms`, cold-start share `27.6%`, Home P75 duration `6s`, Home errors `0%`

npm run build
→ Compiled successfully in 4.4s; TypeScript failed on welcome-screen.tsx:116

psql
→ unavailable on the audit workstation
```

The local five-sample curl probes used only read-only `GET` requests and redacted credentials from output. They returned `401` and are explicitly labeled workstation-to-Supabase observations above.

### Documentation checked

- [Supabase available regions](https://supabase.com/docs/guides/platform/regions)
- [Supabase connection pooling and limits](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits)
- [Supabase logs](https://supabase.com/docs/guides/observability/logs)
- [Supabase `getClaims()` reference](https://supabase.com/docs/reference/javascript/auth-getclaims)
- [Supabase changelog](https://supabase.com/changelog.md); the current index notes the Management API `logs.all` removal scheduled for 2026-09-23, relevant to future log tooling but not used here.
- [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel Edge runtime](https://vercel.com/docs/functions/runtimes/edge)
- [Vercel runtime logs](https://vercel.com/docs/logs/runtime)
- [Next.js 16 Proxy documentation](https://nextjs.org/docs/app/getting-started/proxy)

### Final audit verdict

**The dominant measurable Home cost is remote Supabase/Auth fan-out and request-path variance, amplified by a confirmed cross-continent deployment: Vercel `IAD1` to Supabase `ap-southeast-2`. Vercel’s production view reports `/[locale]/home` at `6s` P75 with 0% errors and an aggregate cold-start share of 27.6%. Keep production and Supabase unchanged for now; run a five-request authenticated preview in `syd1` before deciding whether to promote a region change.**
