---
generated_by: Architecture Strategy Board
run_id: run_architecture_strategy_20260801T150000Z
created_at: 2026-08-01T14:51:36Z
product_sot: artifacts/product-definition/CURRENT
status: STRATEGY_ONLY
final_architecture_decision: false
implementation_architecture: false
---

# Migration Strategy

## Principles

1. Product SoT drives UI/IA first; storage can strangler.  
2. Never break real≠virtual or RLS tenancy during moves.  
3. No offline write paths.  
4. Prefer expand/contract over big-bang.

## Shared strangler sequence (applies to A/B; C extends)

### Phase M0 — Align to IA
- Re-route navigation to Home/Money/Plan/Inbox/Together  
- Introduce Inbox UI over existing `jar_review_queue`  
- Progressive onboarding without schema freeze

### Phase M1 — Domain packages
- Extract `tenancy`, `ledger`, `plan`, `inbox`, `health` modules with clear public APIs  
- Stop cross-importing UI into domain

### Phase M2 — Contracts
- Unify error envelopes / request ids (Decision Board IMP-002)  
- Catalog Actions vs Route Handlers; freeze DTOs in Zod

### Phase M3 — Async (Candidate B+)
- Outbox for Health/insights/notifications  
- Worker processes read models for Home/Health

### Phase M4 — Service split (Candidate C only)
- Separate deployables per BC when metrics justify (CPU/queue depth/team ownership)  
- Introduce integration events for Month Ritual & allocation outcomes  

## Data migration

- Prefer additive columns/views for Inbox/Health  
- Month Ritual is product name over month-close runs — map, don't rename recklessly mid-flight  

## Rollback

- Feature-flag IA surfaces  
- Keep legacy routes as redirects until Inbox parity  
