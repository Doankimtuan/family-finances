# Money → Savings navigation — Phase 7.1

Date: 3 October 2026. Scope: read-only attribution of the current Phase 7 Savings request. No application, schema, index, auth, region, or deployment changes.

## Environment matrix

| Environment           | Next/runtime region                                                               | Supabase region         | Query                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local Mac             | Node.js 24.18.0 standalone profiling process (not a Next server)                  | ap-southeast-2 (Sydney) | Exact authenticated Savings + cycles + active-owner PostgREST read                                                                                  |
| Current Vercel        | Prior read-only evidence identifies SIN1; no current same-source request captured | ap-southeast-2 (Sydney) | Not measured: the Vercel connector exposed no accessible team/project. The earlier audited production deployment predates this working-tree source. |
| Nearby Sydney runtime | Not available; no disposable preview was provisioned                              | ap-southeast-2 (Sydney) | Not measured                                                                                                                                        |

The local samples isolate the project’s installed Supabase JS client and exact authenticated HTTP read; they do not include a Next page/RSC request or the application’s cookie-backed SSR client. The machine was authenticated once with the configured E2E account. The temporary session was revoked after the read-only run. Sign-in and sign-out were excluded from samples; no saved browser state was touched.

## Same-query results

The exact current projection returned 34 Savings and 50 cycles. One first request and ten warm exact reads ran in a fresh Node process; three additional new processes each made the same read as their first Supabase HTTP request. Warm samples were collected in the same process/client, alternating the current projection with a control that adds only the six Phase 6 cycle fields removed in Phase 7. Each session gate performed the current-user check and active-membership read before its paired list reads.

| Environment / arm                    |   n |                 Headers min / median / p75 / max |   Body complete min / median / p75 / max | Notes                                                                            |
| ------------------------------------ | --: | -----------------------------------------------: | ---------------------------------------: | -------------------------------------------------------------------------------- |
| Local, current projection, warm      |  10 |         331.41 / **357.10** / 429.47 / 515.80 ms | 334.26 / **362.31** / 432.05 / 518.14 ms | 122,661 decoded bytes; 34 / 50 rows / cycles                                     |
| Local, full-projection control, warm |  10 |         308.12 / **363.96** / 397.39 / 608.94 ms | 316.96 / **368.23** / 400.29 / 613.02 ms | 151,285 decoded bytes; 34 / 50 rows / cycles                                     |
| Local, first read per fresh process  |   4 | 1,014.09 / **1,016.50** / 1,017.33 / 1,090.96 ms |                      See sample evidence | Four first reads total: one followed by ten warm pairs, plus three new processes |

For the current projection, request-to-parse-complete was min 336.21, median **364.18**, p75 434.08, max 520.16 ms. After the body was complete, the SDK parse/return tail was min 1.23, median **1.47**, p75 1.54, max 2.30 ms. Actual row/cycle mapping plus current-cycle selection and interest calculation was min 0.25, median **0.47**, p75 0.52, max 0.57 ms warm. The first request's mapping was 1.71 ms. No Savings required the conditional matured-package follow-up.

The fresh-process first-read median was 659.40 ms above the reused-process warm header median. That is a large first-use/process effect, but Node's Resource Timing API returned no DNS, connect, or TLS entries; this does not prove which part of first use accounts for the gap. The response header itself remains the dominant warm stage.

## Small-read and session controls

The small authenticated control was the actual active-membership query used by the Money gate, not `select 1`. Warm medians were **301.89 ms** for `getUser`, **315.74 ms** for active membership, and **349.24 ms** for the complete parallel session gate. Their maxima were 703.16, 775.21, and 997.99 ms respectively; p75 values were 342.89, 688.07, and 703.19 ms. The large upper tail and overlap mean these stage medians must not be summed. Verified-claims work was 1.83 ms median after the first key lookup; one first lookup took 274.16 ms.

The small reads and Savings read therefore share a substantial remote wait. The warm Savings headers median was 41 ms above active membership's end-to-end median in this local sample. That gap is small beside the common request floor and the observed variance.

## Connection reuse and timing decomposition

Repeated Savings requests through one Supabase JS client and one Node process settled near 357 ms to headers. First exact requests from fresh processes clustered around 1.02 seconds. This supports a material first-use/reuse effect, but the experiment cannot isolate DNS, TCP, or TLS because Node/undici resource timing was unavailable. It also does not establish how a Vercel isolate reuses connections between invocations.

For the current projection, headers-to-body-complete was min 1.29, median **2.24**, p75 2.58, max 11.45 ms. Body-complete-to-SDK-parse-complete was median 1.47 ms, and mapping was median 0.47 ms. Thus payload transfer, JSON parse, and mapping cannot explain the several-hundred-millisecond warm header wait.

## Database execution

A read-only `EXPLAIN (ANALYZE, BUFFERS)` ran under the `authenticated` role with the temporary test subject set in transaction-local JWT claims, then rolled back. The relational approximation joined the Savings, accounts, provider, active owner-membership, and cycle tables with the existing RLS predicates.

Planning took **13.890 ms** and execution **8.519 ms**; the cycle-expanded plan returned 50 rows for 34 Savings, with 432 shared-buffer hits during execution. The plan used the household Savings index and cycle index; RLS checks were present. This is not the generated PostgREST statement: its embedded JSON aggregation and relationship-filter rewriting differ. It bounds a representative SQL shape but is not the exact API's database duration.

## Supabase service observability

Response request IDs correlated all 10 current-projection reads, all 10 full-projection controls, the four first-process reads, and all 10 Auth `/user` reads with Supabase logs. Every correlated edge row was HTTP 200 and reported Cloudflare colo `SIN`; that is the API edge ingress, not the Next runtime or database location. The edge rows had a numeric `response.origin_time` and an `x-envoy-upstream-service-time` header. Their raw medians were 222.5 and 30 for current warm, 219.5 and 34.5 for the full projection, and 726.5 and 27.5 for fresh first reads. Supabase's current field reference types `response.origin_time` as a number but does not specify its unit or precise timing boundary; `clientTcpRtt` was absent. These raw fields are not subtracted from client timings or treated as database milliseconds. Ten Auth reads also appeared in `auth_logs`.

No request-correlated PostgREST or PostgreSQL timing was available. The PostgREST entries in the measurement window lacked request IDs, and hosted Postgres logs do not expose internal Supabase service-connection events. Supabase's [log field reference](https://supabase.com/docs/guides/observability/log-field-reference) documents the available edge fields and this logging limit.

## Payload control

Alternating same-process comparisons returned 151,285 bytes for the full projection versus 122,661 bytes for the current projection, a reduction of 28,624 bytes (18.9%). The paired median current-minus-full header delta was **+16.37 ms** (current slower), while the paired median headers-to-body delta was **−2.53 ms** (current faster). The paired request-to-parse delta was **+11.61 ms** (current slower); pair-to-pair header differences ranged from −199.77 to +166.47 ms. The smaller response shortened the body tail by a few milliseconds, but showed no repeatable end-to-end latency improvement.

## Attribution and Phase 8 recommendation

**Attribution: MIXED.** A fresh-process first-use effect is large and warm local Savings requests remain around 357 ms to headers. The authenticated membership and Auth controls show a similar fixed remote floor, while the representative SQL plan, body transfer, parse, and mapping are small. The evidence points to both process/connection first-use and a persistent API/network/service-path envelope. It does not separate those layers or prove that region dominates: no same-code Vercel or Sydney-runtime comparison was safely available, and exact DNS/TLS/database timings are missing.

**Phase 8 recommendation: connection/runtime configuration optimization.** First repeat the same request from the actual Vercel runtime and a disposable Sydney-near preview with the same source/config, capturing Undici DNS/TCP/TLS/keep-alive spans and correlated Supabase request IDs. Use those results to determine whether a connection setting or region experiment is justified. Do not change production infrastructure based on the local comparison alone.

Evidence: [money-savings-navigation-phase-7-1-evidence.json](money-savings-navigation-phase-7-1-evidence.json). It includes all timings and payload samples with credentials, cookies, user/household IDs, raw financial rows, and request IDs removed.

**PHASE 7.1 COMPLETE — PROCEED TO PHASE 8**
