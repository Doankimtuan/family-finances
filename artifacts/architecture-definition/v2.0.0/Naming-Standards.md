---
document: Naming Standards
architecture_version: v2.0.0
status: OFFICIAL_IMPLEMENTATION_BLUEPRINT
run_id: run_architecture_definition_20260801T152000Z
created_at: 2026-08-01T14:55:28Z
product_sot: artifacts/product-definition/CURRENT
architecture_decision: artifacts/architecture-decision/CURRENT
frozen: true
---

# Naming Standards

| Kind | Pattern |
|------|---------|
| Module folders | `modules/{bc}` |
| Commands | `verbNoun` / `recordTransaction` |
| Queries | `getRealPosition`, `listOpenInboxItems` |
| Tables | snake_case existing; new inbox abstractions prefer product names |
| API paths | `/api/v1/{resource}` |
| Events | `PascalCase` past tense |
| Product terms | Home, Money, Plan, Inbox, Together, Month Ritual |
