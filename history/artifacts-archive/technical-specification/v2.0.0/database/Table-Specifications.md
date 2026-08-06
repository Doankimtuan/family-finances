---
document: Table Specifications
technical_specification: v2.0.0
status: OFFICIAL_IMPLEMENTATION_SPEC
run_id: run_technical_specification_20260801T153000Z
created_at: 2026-08-01T15:00:41Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
redesign_product: false
redesign_architecture: false
frozen: true
---

# Table Specifications

Logical tables (map to existing Supabase where present; strangler allowed):

### tenancy
`households`, `household_members`, `invitations`, `policy_audit_log`

### ledger
`accounts`, `transactions`, `liabilities`, `savings_accounts`, `savings_withdrawals`, `installment_plans`, `billing_items`

### plan
`jars`, `jar_plans`, `jar_rules`, `jar_movements`, `jar_month_close_runs` (Month Ritual), `goals`, `recurring_rules`

### inbox
`inbox_items` (new or view over `jar_review_queue`)

### health
`health_snapshots`, `insights`, `scenarios`

### platform
`outbox_messages`

All tenant tables include `household_id` UUID NOT NULL.
