---
document: Official Acceptance Criteria
product_definition: v2.1.0
status: OFFICIAL_SOURCE_OF_TRUTH
run_id: run_sot_auth_v2_adoption_20260802T014716Z
created_at: 2026-08-02T01:47:16Z
supersedes_candidate: ai-os/artifacts/product-strategy/runs/run_product_strategy_20260801T140000Z/
does_not_overwrite_spec_v1: true
---

# Official Acceptance Criteria

| AC | Requirement | Criterion |
|----|-------------|-----------|
| `AC-001` | `REQ-001` | Given relevant household state, when the user exercises `F-Home` via `WF-Daily`, then: Home presents real position, plan pulse, and Inbox CTA; jar totals must not be labeled as bank balance. Verified in UI and domain checks; API `API-Dashboard`; data `DB-Accounts+Jars`. |
| `AC-002` | `REQ-002` | Given relevant household state, when the user exercises `F-Auth` via `WF-Auth`, then: Authenticated active household membership is required for money actions. Verified in UI and domain checks; API `API-Session`; data `DB-Members`. |
| `AC-002a` | `REQ-002a` | Given an unauthenticated user on Login, when they Continue with Google, Apple, or Email, then: a Supabase Auth session is established without guest mode; Login priority is Google → Apple → divider → Email. Verified in UI; API `API-Session`. |
| `AC-002b` | `REQ-002a` | Given two provider sign-ins with the same verified email and linking supported, when either path succeeds, then: both resolve to the same `auth.users.id` (no duplicate profiles) per `BR-02b`. Verified via Auth identities + domain checks; API `API-Session`. |
| `AC-003` | `REQ-003` | Given relevant household state, when the user exercises `F-Plan` via `WF-Capture-Place`, then: Allocations target only Active jars; Paused/Archived are non-targets. Verified in UI and domain checks; API `API-Jars`; data `DB-Jars`. |
| `AC-004` | `REQ-004` | Given relevant household state, when the user exercises `F-Plan` via `WF-Capture-Place`, then: Income placement uses percent|fixed plans with Off|Suggest|Auto; new households default Suggest. Verified in UI and domain checks; API `API-Jars`; data `DB-JarPlans`. |
| `AC-005` | `REQ-005` | Given relevant household state, when the user exercises `F-Inbox` via `WF-Capture-Place`, then: Unmapped expenses create Inbox ReviewItems resolvable to an Active jar. Verified in UI and domain checks; API `API-Jars-Review`; data `DB-ReviewQueue`. |
| `AC-006` | `REQ-006` | Given relevant household state, when the user exercises `F-Plan` via `WF-Capture-Place`, then: Movement magnitudes are positive with explicit direction in UX. Verified in UI and domain checks; API `API-Jars`; data `DB-Movements`. |
| `AC-007` | `REQ-007` | Given relevant household state, when the user exercises `F-Together` via `WF-Together-Policy`, then: Overspend policy Warn|Block|Allow negative; new households default Warn. Verified in UI and domain checks; API `API-Household`; data `DB-Households`. |
| `AC-008` | `REQ-008` | Given relevant household state, when the user exercises `F-Plan` via `WF-Month-Ritual`, then: Approved Month Ritual locks normal plan movements; corrections use explicit path. Verified in UI and domain checks; API `API-MonthClose`; data `DB-CloseRuns`. |
| `AC-009` | `REQ-009` | Given relevant household state, when the user exercises `F-Plan` via `WF-Month-Ritual`, then: Month Ritual mode defaults to Assisted for new households. Verified in UI and domain checks; API `API-MonthClose`; data `DB-Households`. |
| `AC-010` | `REQ-010` | Given relevant household state, when the user exercises `F-Money` via `WF-Savings-Maturity`, then: Savings maturity actions renew/switch/withdraw appear as Inbox-guided flows. Verified in UI and domain checks; API `API-Savings`; data `DB-Savings`. |
| `AC-011` | `REQ-011` | Given relevant household state, when the user exercises `F-Money` via `WF-EMI`, then: Installment completes when paid_installments >= num_installments. Verified in UI and domain checks; API `API-Accounts-Card`; data `DB-Installments`. |
| `AC-012` | `REQ-012` | Given relevant household state, when the user exercises `F-Together` via `WF-Onboard`, then: One active household per user in v2 Now. Verified in UI and domain checks; API `API-Household`; data `DB-Members`. |
| `AC-013` | `REQ-013` | Given relevant household state, when the user exercises `F-Together` via `WF-Together-Policy`, then: Material assumption/policy changes are partner-visible via audit/notification. Verified in UI and domain checks; API `API-Settings`; data `DB-Audit`. |
| `AC-014` | `REQ-014` | Given relevant household state, when the user exercises `F-Onboard` via `WF-Onboard`, then: Onboarding essentials complete in ≤3 mandatory steps before Home. Verified in UI and domain checks; API `API-Household`; data `DB-Accounts+Jars`. |
| `AC-015` | `REQ-015` | Given relevant household state, when the user exercises `F-Health` via `WF-Weekly`, then: Financial Health is visible without a dead-end feature flag. Verified in UI and domain checks; API `API-Insights`; data `DB-Health`. |
| `AC-016` | `REQ-016` | Given relevant household state, when the user exercises `F-Money` via `WF-Capture-Place`, then: Categories exist as tags/rules inside Money/Plan; no standalone primary nav item. Verified in UI and domain checks; API `API-Categories`; data `DB-Categories`. |
| `AC-017` | `REQ-017` | Given relevant household state, when the user exercises `F-AI-Assist` via `WF-Assist`, then: AI must not invent balances or mutate money without explicit path (Phase 2). Verified in UI and domain checks; API `API-Insights`; data `DB-Insights`. |
| `AC-018` | `REQ-018` | Given relevant household state, when the user exercises `F-Money` via `WF-Daily`, then: Money mutations require online connectivity; offline writes forbidden. Verified in UI and domain checks; API `API-All-Mutating`; data `DB-Ledger`. |
| `AC-019` | `REQ-019` | Given relevant household state, when the user exercises `F-Home` via `WF-Daily`, then: Primary capture, Inbox resolve, and Month Ritual paths are keyboard accessible. Verified in UI and domain checks; API `API-N/A-UI`; data `DB-N/A`. |
| `AC-020` | `REQ-020` | Given relevant household state, when the user exercises `F-Together` via `WF-Together-Policy`, then: Partners share daily Money/Plan/Inbox rights; admin elevation limited per permission matrix. Verified in UI and domain checks; API `API-Settings`; data `DB-Members`. |
