# Transactions Phase 8.1 — Authenticated One-Wave Transfer Detail

## Harness

Control and candidate ran from disposable copies on ports 3002 and 3003. Both used the same byte-identical environment file, Next 16.3.1, local Supabase backend, Vietnamese locale, authenticated browser session, and transfer. The benchmark used one agent-created tab; the existing user tab was left untouched.

Both fresh copies needed the same temporary cn import shim to compile: the current shared helper imports HeroUI's client-only entry from the global not-found server component. The shim used the already-installed tailwind-variants export and was removed with the copies. No main-worktree source was changed for this phase.

## Candidate contract and RLS

The temporary function was public.transaction_detail_transfer_pair_phase8_1(p_transaction_id uuid, p_household_id uuid) RETURNS SETOF public.transactions. It is STABLE, SECURITY INVOKER, and has an empty search_path. Execution was granted to authenticated; anon and PUBLIC could not execute it. Transactions RLS remained enabled.

The server called it through the normal createSupabaseServerClient, passing the selected transaction ID and assertMoneyActionAllowed() household ID. The function anchored on the selected ID and household, derived the transfer group from that visible row, and accepted no caller-supplied group ID. It returned the selected row alone for non-transfer rows. TX_SELECT retained the existing joined fields, mapping, isCompleteTransferGroup() validation, and createTransactionActivities() projection. The candidate ordered the two mapped legs source-first so both selected orientations preserved the same audit-ID presentation.

Authenticated evidence:

- Positive call: success; two visible rows; selected row included; active-household predicate used; validator accepted the pair; the complete two-sided hero rendered.
- Wrong household: the same authenticated session queried the selected row with a random different household; zero rows returned, with no RPC error.
- Unauthenticated: the earlier direct anonymous RPC request was denied with HTTP 401 / SQLSTATE 42501.
- An inactive-membership session was unavailable, so that case was not tested. No membership or RLS policy was changed.

## Correctness

The same transfer was opened through both legs in control and candidate. Full rendered detail text matched exactly in both orientations, including source and destination, amount/date presentation, note-presence behavior, and both audit IDs. The pair's ID set was unchanged. Source-note preference and destination-note fallback were also exercised for both selected legs in temporary focused tests.

The candidate reused the existing validator and rejected all 11 malformed cases: missing leg, three rows, duplicate type, amount mismatch, currency mismatch, date mismatch, savings-kind mismatch, non-posted leg, same account, same transaction row, and selected row absent.

The harness enabled the one-wave query only on transfer links. Ordinary detail keeps the standard read strategy; the Phase 7 session gate and audit/tag behavior were not changed. Using the app Back control restored the filtered transfer list with zero new List RSC requests.

## Request topology and timing

The browser milestone was click to a readable two-sided hero. Ten warm samples per arm were interleaved C, N, N, C…; one separate first click after server restart was recorded as cold-ish. P50 is the median; p75 uses nearest rank.

| Metric                             | Control p50 / p75 | Candidate p50 / p75 |  Candidate delta |
| ---------------------------------- | ----------------: | ------------------: | ---------------: |
| Session-gate spans*                |      300 / 447 ms |        338 / 543 ms |     +38 / +96 ms |
| First transaction response headers |    251.5 / 254 ms |      258.5 / 279 ms |      +7 / +25 ms |
| Activity / hero ready (server)     |    524.5 / 604 ms |        271 / 290 ms | −253.5 / −314 ms |
| Route return (server)              |    803.5 / 883 ms |      580.5 / 628 ms |   −223 / −255 ms |
| Click → complete hero (browser)    |      896 / 959 ms |        664 / 699 ms |   −232 / −260 ms |

*Session-gate values are all logged gate invocations during 11 detail opens (including the cold-ish sample), not one paired span per route; counts were 19 control and 18 candidate. The gate code was identical. These spans were noisy and do not explain the repeatable browser improvement.

The separate cold-ish click samples were 1,359 ms control and 1,035 ms candidate. Warm browser samples were 10/10 successful per arm, with both account sides present.

The trace proved the topology change on all ten warm routes: control made two transaction GETs (selected row, then pair); candidate made one transaction RPC POST. Control returned one row then two rows (three appearances, 1,968 decoded response bytes total). Candidate returned the two rows once (1,317 bytes).

Per-request p50/p75 details:

- Control selected-row read: 263 / 308 ms span; 651 bytes; headers 251.5 / 254 ms; body after headers 3 / 3 ms.
- Control pair read: 262.5 / 278 ms span; 1,317 bytes; headers 253.5 / 271 ms; body after headers 3.5 / 4 ms.
- Candidate one-wave read: 265.5 / 285 ms span; 1,317 bytes; headers 258.5 / 279 ms; body after headers 4 / 4 ms.

Wait-to-headers dominated; mapping and validation rounded to 0 ms in the trace. Supabase SDK JSON decoding was not separately instrumented.

## SQL and validation

Existing indexes covered transaction ID and household/transfer-group lookup; no index was added. EXPLAIN (ANALYZE, BUFFERS) was not run because the available SQL admin context would not represent the authenticated RLS execution; the brief says this is not a blocker.

The focused regression run passed 72 tests across eight files, including transfer activity/detail validation, all malformed pair cases, RLS/policy contracts, session/product gates, and transaction Back navigation. Lint passed. Typecheck remains blocked by two unrelated translator type errors in the untouched home-streaming-sections.tsx at lines 99 and 340; build was therefore not run.

## Cleanup and recommendation

The temporary function was dropped and its absence verified. Disposable servers were stopped, the benchmark tab was closed, and temporary source copies and logs were removed. Port 3000 remained running. The benchmark made no financial writes.

The authenticated one-wave read is safe under the tested RLS context, preserves the paired detail, reduces transaction HTTP requests from 2 to 1, and improves warm click-to-hero p50/p75 by 232/260 ms. Recommend a separate Phase 9 implementation task; Phase 9 was not started here.

TRANSACTIONS PHASE 8.1 COMPLETE — ONE-WAVE TRANSFER DETAIL VERIFIED BENEFICIAL
