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

# Trade-off Summary

## Accepted trade-offs (by selecting B-modified)

| We accept | In exchange for |
|-----------|-----------------|
| More module/service discipline than pure A | Maintainability and Phase-2 readiness |
| Temporary Actions + facade coexistence | Lower migration risk than big-bang API rewrite |
| Not having independent deployables yet | Lower ops cost and simpler Month Ritual consistency |
| Deferred C | Avoid distributed complexity before product IA lands |

## Rejected trade-offs

| Rejected path | Why |
|---------------|-----|
| Stay forever on unstructured Simple A | Sprawl + weak 5y growth |
| Jump to C now | Cost, risk, DX hit vs household scale |
