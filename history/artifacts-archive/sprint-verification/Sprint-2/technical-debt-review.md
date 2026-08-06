# Technical Debt Review — Sprint 2

## Pack debt (validated)

| ID | Pack severity | Board severity | Notes |
|----|---------------|----------------|-------|
| TD-S2-01 | Low | **Blocking** (DoD) | No Playwright / live RPC AC proof |
| TD-S2-02 | Medium | **Blocking** vs literal AC | Inbox ≠ device push |
| TD-S2-03 | Low | Low | Form schema duplication |
| TD-S2-04 | Medium | **Stale / Invalid** | `updateTransaction` already fail-closed post Sprint-1 fixes |

## Additional debt found

| ID | Item | Severity |
|----|------|----------|
| TD-V2-01 | `OverspendPolicy.BLOCK` / BR-06 capacity floor ignored | **Blocking** |
| TD-V2-02 | Plan RPC inserts Inbox rows (cross-BC) | Medium |
| TD-V2-03 | Warn checkbox / two-click ack soft semantics | Low–Med |
| TD-V2-04 | No slider (AmountField) | Low |
| TD-V2-05 | Month Ritual Step 3 emergency reflection absent | Out of sprint (S4) |
| TD-V2-06 | Ledger count race on zero-impact guard | Low |

## Debt pressure score

**6.0 / 10** (higher = more pressure)  
Maintainability score uses inverse intuition → **7.0 / 10**.

## Architecture erosion forecast

If Sprint 3 builds typed Inbox workers atop plan-RPC-written inbox rows without an event contract, emergency items may diverge from other ReviewItem creation paths.
