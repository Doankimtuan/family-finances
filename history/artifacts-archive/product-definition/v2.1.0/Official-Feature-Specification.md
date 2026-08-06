---
document: Official Feature Specification
product_definition: v2.1.0
status: OFFICIAL_SOURCE_OF_TRUTH
run_id: run_sot_auth_v2_adoption_20260802T014716Z
created_at: 2026-08-02T01:47:16Z
supersedes_candidate: ai-os/artifacts/product-strategy/runs/run_product_strategy_20260801T140000Z/
does_not_overwrite_spec_v1: true
---

# Official Feature Specification

Normative behaviors follow Feature Catalog phases.

### F-Auth
Google OAuth, Apple OAuth, and email+password via Supabase Auth. Login priority: Continue with Google → Continue with Apple → divider → Continue with Email. Guest mode forbidden. Same verified email across providers resolves to one Auth user where Supabase linking supports it (`BR-02b`). Register remains email+password; OAuth may create the Auth user on first consent. Sign-out and delete-account are account lifecycle under F-Auth. Money actions still require membership (`REQ-002`).

### F-Home
Three answers; never label jar sum as bank balance; Health chip; empty-state trio.

### F-Money
Ledger truth; capture <15s path; debts/savings/cards included; categories as tags.

### F-Plan
Jars/goals/recurring; Month Ritual; teach real≠virtual.

### F-Inbox
One card one decision; maps ReviewItems; maturity/EMI coaches.

### F-Together
Invite/members/policies; partner-visible audits for material changes.

### F-Health
Always reachable; basic score+narrative in MVP; scenarios light.

### F-Onboard
≤3 mandatory steps.

### Phase 2 / Future
Per Feature Catalog only.
