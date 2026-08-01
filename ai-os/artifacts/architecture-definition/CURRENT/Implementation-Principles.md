---
document: Implementation Principles
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Implementation Principles

1. Product Definition + this Architecture v2 are dual blueprints.  
2. Strangler V1; don't freeze progress on perfect folders day one — but new code lands in modules.  
3. One write path per aggregate owner.  
4. Teach real≠virtual in UI contracts.  
5. Prefer clarity over cleverness.  
6. Measure Home/Inbox/Ritual paths.  
