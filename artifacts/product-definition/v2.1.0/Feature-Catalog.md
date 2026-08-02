---
document: Feature Catalog
product_definition: v2.1.0
status: OFFICIAL_SOURCE_OF_TRUTH
run_id: run_sot_auth_v2_adoption_20260802T014716Z
created_at: 2026-08-02T01:47:16Z
supersedes_candidate: ai-os/artifacts/product-strategy/runs/run_product_strategy_20260801T140000Z/
does_not_overwrite_spec_v1: true
---

# Feature Catalog

| ID | Name | Decision | Phase | MVP | V1 lineage |
|----|------|----------|-------|-----|------------|
| `F-Auth` | Authentication (Google, Apple, email+password; no guest; OAuth-first login) | **Core** | Core | yes | `ft-auth` |
| `F-Together` | Household & partnership | **Core** | Core | yes | `ft-household`, `ft-settings` |
| `F-Onboard` | Progressive onboarding | **MVP** | Core | yes | `ft-onboarding` |
| `F-Home` | Home (three answers) | **Core** | Core | yes | `ft-dashboard` |
| `F-Money` | Money (ledger, capture, debts, savings, cards) | **Core** | Core | yes | `ft-accounts`, `ft-activity`, `ft-debts`, `ft-savings`, `ft-cards` |
| `F-Plan` | Plan (jars, goals, recurring, month ritual) | **Core** | Core | yes | `ft-jars`, `ft-goals`, `ft-recurring` |
| `F-Inbox` | Inbox (reviews, approvals, maturities) | **Core** | Core | yes | `ft-jars` |
| `F-Health` | Financial Health & Insights | **MVP** | MVP | yes | `ft-health`, `ft-insights`, `ft-decision-tools` |
| `F-Approvals` | Partner approval moments | **Phase 2** | Phase 2 | no | — |
| `F-AI-Assist` | Assistive AI explanations/suggestions | **Phase 2** | Phase 2 | no | `ft-insights` |
| `F-Wealth` | Wealth (assets/crypto depth) | **Future** | Future | no | `ft-assets` |
| `F-Offline-Read` | Offline read-only cache | **Future** | Future | no | — |
| `F-Multi-Household` | Multi-household | **Future** | Future | no | — |
| `F-Categories-Standalone` | Standalone categories app section | **Removed** | Removed | no | `ft-categories` |
| `F-Decision-Tools-Standalone` | Standalone decision-tools route | **Removed** | Removed | no | `ft-decision-tools` |

## Merge / split / remove notes

- **Merged into F-Money:** accounts, activity, debts, savings, cards  
- **Merged into F-Plan:** jars, goals, recurring  
- **Merged into F-Health:** health, insights, decision-tools scenarios  
- **Split:** jar review → F-Inbox (first-class)  
- **Removed IA:** standalone categories; standalone decision-tools  
- **Every V1 ft-* mapped** into exactly one official disposition above or via merge.

## V1 feature → official mapping

| V1 | Maps to |
|----|--------|
| `ft-auth` | F-Auth |
| `ft-household` | F-Together |
| `ft-onboarding` | F-Onboard |
| `ft-dashboard` | F-Home |
| `ft-accounts` | F-Money |
| `ft-savings` | F-Money |
| `ft-cards` | F-Money |
| `ft-assets` | F-Wealth (Future) |
| `ft-debts` | F-Money |
| `ft-activity` | F-Money |
| `ft-goals` | F-Plan |
| `ft-jars` | F-Plan + F-Inbox |
| `ft-categories` | Removed as nav; tags in F-Money/F-Plan |
| `ft-recurring` | F-Plan |
| `ft-decision-tools` | Removed standalone; into F-Health |
| `ft-settings` | F-Together |
| `ft-insights` | F-Health (+ F-AI-Assist Phase 2) |
| `ft-health` | F-Health |
