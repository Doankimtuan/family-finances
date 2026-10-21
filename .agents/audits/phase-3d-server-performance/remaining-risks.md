# Phase 3D — remaining risks and limits

- The authenticated browser used one small synthetic household. The database has too few rows to predict index choice or latency at real household scale.
- The browser benchmark ran at 440 × 900 only, without network throttling or a physical-device run. It targeted server data performance and did not change UI.
- Five cold and ten warm samples per route still produce unstable p95 estimates. Supabase/network tails varied materially between requests.
- Final shell-marker times are conditional on the route loading marker being observed; prefetch or streaming sometimes bypassed it. See observation counts in [the benchmark](before-after-benchmark.md).
- Supabase trace times include API/network latency. Only the Plan RPC and Inbox scan received database-side measurements; no server render/serialization span was instrumented.
- The Plan RPC measurement and Inbox plan used privileged SQL. They establish query execution/index behavior for the test data, not RLS behavior.
- No new two-user cross-household browser scenario ran in Phase 3D. No access path or RLS policy changed; existing ownership/RPC tests and Phase 2D runtime evidence remain applicable.
- Phase 3C retained three-sample summaries in `phase-3c-navigation-performance/baseline-data.json` and `final-data.json`, but not the benchmark runner or raw pointer-event timestamps. The reported active-state values cannot be directly re-measured or compared to this run.
- The Plan optimization showed a lower warm content median, but this run does not isolate the request removal from network and cache variance. Its verified benefit is one fewer successful-path `jars` request.

No production behavior, production database, or production-scale performance was verified.
