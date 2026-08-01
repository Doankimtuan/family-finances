---
generated_by: Architecture Decision Board
run_id: run_architecture_decision_20260801T151000Z
created_at: 2026-08-01T14:53:32Z
status: FROZEN
architecture_decision: LOCKED
selected: Candidate-B-Balanced-Modified
product_sot: artifacts/product-definition/CURRENT
strategy_run: run_architecture_strategy_20260801T150000Z
---

# Migration Decision

## Binding migration approach

**Strangler aligned to Architecture Strategy M0–M3; M4 (service split) unauthorized.**

### Ordered work

1. **M0 IA** — Navigate to Home/Money/Plan/Inbox/Together; Inbox over review queue  
2. **M1 packages** — Extract `tenancy`, `ledger`, `plan`, `inbox`, `health` with public APIs  
3. **M2 contracts** — Zod DTOs; error envelope; Actions call services; introduce `/api/v1` for read models  
4. **M3 async (when needed)** — Outbox + managed worker for Health/notifications  

### Guardrails

- Preserve BR-01 real≠virtual and RLS membership on every step  
- Feature-flag IA; keep redirects from legacy hubs  
- No Candidate C cutover without a new Architecture Decision Board  

### Rollback

- Flags off for new IA  
- Services remain callable from legacy adapters during coexistence window  
