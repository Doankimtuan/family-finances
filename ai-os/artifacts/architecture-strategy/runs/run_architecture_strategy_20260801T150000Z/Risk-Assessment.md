---
generated_by: Architecture Strategy Board
run_id: run_architecture_strategy_20260801T150000Z
created_at: 2026-08-01T14:51:36Z
product_sot: artifacts/product-definition/CURRENT
status: STRATEGY_ONLY
final_architecture_decision: false
implementation_architecture: false
---

# Risk Assessment

| Risk | A | B | C | Mitigation |
|------|---|---|---|------------|
| IA rewrite stalls in hub sprawl | Med | Low | Low | Strict nav blueprint from Product SoT |
| Dual Actions/API drift | High | Med | Low | Contract catalog + one facade direction |
| Distributed Month Ritual inconsistency | N/A | Low | High | Saga/outbox; defer C until needed |
| Over-engineering delays MVP | Low | Med | High | Timebox B; forbid C cutover pre-MVP |
| Auth rewrite regression | Med | Med | High | Keep Supabase SSR; harden, don't replace |
| PII in logs/analytics | Med | Med | Med | Redaction policy + household-scoped IDs |
| AI Phase-2 couples into ledger writes | Med | Med | Med | BR-14 enforcement; no AI mutator without policy path |
| Team skill gap on events/services | Low | Med | High | Training; start with managed workers |
