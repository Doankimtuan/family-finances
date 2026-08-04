# Sprint 2 Verification Fixes — Applied

| Field | Value |
|-------|--------|
| Date | 2026-08-04 |
| Target | Closing Verification Board blockers B1–B3 |
| Remote | `family-finances-2` (`bbzffxvgocjwsdbujvgn`) |

## Closed

| ID | Fix |
|----|-----|
| **B1** | Command↔RPC mapping tests for zero-ledger success + partner notify count; AC contracts for bank-unchanged helper + capacity math |
| **B2** | Per-partner `inbox_items.assigned_to_user_id`; emergency inserts one high-priority item per other member; Plan banner filters to viewer assignee (`partner_inbox` channel) |
| **B3** | `isCapacityMoveBlocked` + command pre-check + RPC `ERR_CAPACITY_BLOCKED` when `overspend_policy = block` and source `capacity_delta < amount` |

## Migrations applied remotely

- `sprint2_block_partner_notify` (assigned_to + unique index)
- `sprint2_reallocate_block_partner_rpc` (RPC body)

Local SoT file: `supabase/migrations/20260804090000_sprint2_block_partner_notify.sql`

## Gates

- Unit: **210 / 210** pass
- Typecheck / lint: pass (session gate)

## Residual (non-blocking)

- OS push notifications still out of scope; partner “device” = assignee Inbox + Plan banner on their session
- Playwright reallocate smoke still optional
