---
document: Official Requirement Specification
product_definition: v2.0.0
status: OFFICIAL_SOURCE_OF_TRUTH
run_id: run_product_definition_20260801T144500Z
created_at: 2026-08-01T14:46:45Z
supersedes_candidate: ai-os/artifacts/product-strategy/runs/run_product_strategy_20260801T140000Z/
does_not_overwrite_spec_v1: true
---

# Official Requirement Specification

| ID | Statement | Feature | Rules |
|----|-----------|---------|-------|
| `REQ-001` | Home presents real position, plan pulse, and Inbox CTA; jar totals must not be labeled as bank balance. | `F-Home` | `BR-01` |
| `REQ-002` | Authenticated active household membership is required for money actions. | `F-Auth` | `BR-02`, `BR-02a` |
| `REQ-003` | Allocations target only Active jars; Paused/Archived are non-targets. | `F-Plan` | `BR-03` |
| `REQ-004` | Income placement uses percent|fixed plans with Off|Suggest|Auto; new households default Suggest. | `F-Plan` | `BR-04` |
| `REQ-005` | Unmapped expenses create Inbox ReviewItems resolvable to an Active jar. | `F-Inbox` | `BR-05` |
| `REQ-006` | Movement magnitudes are positive with explicit direction in UX. | `F-Plan` | `BR-06` |
| `REQ-007` | Overspend policy Warn|Block|Allow negative; new households default Warn. | `F-Together` | `BR-07` |
| `REQ-008` | Approved Month Ritual locks normal plan movements; corrections use explicit path. | `F-Plan` | `BR-08` |
| `REQ-009` | Month Ritual mode defaults to Assisted for new households. | `F-Plan` | `BR-09` |
| `REQ-010` | Savings maturity actions renew/switch/withdraw appear as Inbox-guided flows. | `F-Money` | `BR-10` |
| `REQ-011` | Installment completes when paid_installments >= num_installments. | `F-Money` | `BR-11` |
| `REQ-012` | One active household per user in v2 Now. | `F-Together` | `BR-12` |
| `REQ-013` | Material assumption/policy changes are partner-visible via audit/notification. | `F-Together` | `BR-13` |
| `REQ-014` | Onboarding essentials complete in ≤3 mandatory steps before Home. | `F-Onboard` | `BR-02` |
| `REQ-015` | Financial Health is visible without a dead-end feature flag. | `F-Health` | `BR-01` |
| `REQ-016` | Categories exist as tags/rules inside Money/Plan; no standalone primary nav item. | `F-Money` | `BR-05` |
| `REQ-017` | AI must not invent balances or mutate money without explicit path (Phase 2). | `F-AI-Assist` | `BR-14` |
| `REQ-018` | Money mutations require online connectivity; offline writes forbidden. | `F-Money` | `BR-15` |
| `REQ-019` | Primary capture, Inbox resolve, and Month Ritual paths are keyboard accessible. | `F-Home` | `BR-02` |
| `REQ-020` | Partners share daily Money/Plan/Inbox rights; admin elevation limited per permission matrix. | `F-Together` | `BR-02`, `BR-13` |
