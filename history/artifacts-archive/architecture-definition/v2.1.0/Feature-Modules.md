---
document: Feature Modules
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Feature Modules

| Product feature | UI route module | Domain modules |
|-----------------|-----------------|----------------|
| F-Home | `app/(product)/home` | health queries + ledger/plan summaries via services |
| F-Money | `money` | ledger |
| F-Plan | `plan` | plan |
| F-Inbox | `inbox` | inbox (+ plan/ledger refs) |
| F-Together | `together` | tenancy |
| F-Health | `health` | health |
| F-Onboard | `together/onboard` | tenancy + ledger + plan bootstrap commands |
| F-Auth | `login` + auth routes | tenancy/platform |
