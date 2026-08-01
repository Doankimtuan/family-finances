---
document: Bounded Context Diagram
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Bounded Context Diagram

```mermaid
flowchart LR
  subgraph Tenancy
    T[tenancy]
  end
  subgraph RealLedger
    L[ledger]
  end
  subgraph Intention
    P[plan]
    I[inbox]
  end
  subgraph Insight
    H[health]
  end
  SK[shared-kernel]
  T --> SK
  L --> T
  L --> SK
  P --> L
  P --> T
  I --> P
  I --> L
  H --> L
  H --> P
  H --> I
```

## Context map

| Upstream | Downstream | Relation |
|----------|------------|----------|
| tenancy | ledger, plan, inbox, health | Customer/Supplier — membership required |
| ledger | plan, inbox, health | Conformist on Account/Transaction IDs; plan must not write ledger balances via jar math |
| plan | inbox | Publisher of ReviewItems |
| ledger+plan+inbox | health | Open-host service queries / read models |

## Invariant

**BR-01:** Plan/Inbox never present jar totals as ledger balances.
