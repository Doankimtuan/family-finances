# Phase 3D — Antigravity handoff

## Remaining user-visible delay

The route shell responds quickly when its loading marker appears (usually about 45–103 ms median), but warm data-bearing content remains about 649 ms for Add Transaction, 924–963 ms for Inbox/Home/Money, and 1,207–1,225 ms for Plan. Supabase REST/RPC requests commonly take 250–350 ms each, while the Home and Money pages already issue independent domain reads in parallel. This phase found no UI rendering or navigation change that would remove the remaining server/network wait without risking misleading financial data.

## Active-state measurement follow-up

Phase 3C reported that active-state timing rose from low single-digit milliseconds to roughly 45–60 ms for several destinations. Its run used three samples and did not retain its benchmark script or raw event timestamps. The Phase 3D run did not separately measure `data-active` mutation time; its clock started before Playwright pointer movement, so it cannot validate that report's handler-level latency.

If active-state delay remains visible on device, capture `pointerdown`, `click`, the synchronous `data-active` mutation, shell marker, and first data-bearing content in one browser trace. Compare the same route, viewport, device, and warm/cold state. The current report does not support another navigation UI change.

## Product owner action

Keep the existing 3C navigation behavior. For further work, use the measured route content and server traces as a starting point, and preserve loading states that never present stale financial balances.
