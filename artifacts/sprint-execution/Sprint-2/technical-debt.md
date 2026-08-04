# Technical Debt — Sprint 2

| ID | Item | Severity | Notes |
|----|------|----------|-------|
| TD-S2-01 | No dedicated Playwright E2E for reallocate / emergency | Low | Covered by unit AC contracts; E2E optional when credentials available |
| TD-S2-02 | Emergency partner alert is Inbox-only (no push) | Medium (by design for now) | Spec BR-13 device language deferred until notification infra exists |
| TD-S2-03 | Form schema duplicates command Zod refine | Low | Client form omits `.default()` for RHF typing; shared policy helpers still reused |
| TD-S2-04 | Carry-forward TD-S1-01 `updateTransaction` legacy path | Medium | Unchanged; fail-closed delete remains |

## Intentionally not debt

- Using `capacity_delta` instead of inventing bank-like jar balances (BR-01 compliance).
