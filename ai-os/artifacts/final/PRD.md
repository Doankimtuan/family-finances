---
generated_by: AIOS Final Composition
run_id: run_final_composition_20260801T131500Z
business_discovery: run_business_discovery_20260801T122000Z
specification: run_specification_20260801T130500Z
created_at: 2026-08-01T13:12:48Z
status: FROZEN
invent_business_logic: false
redesign: false
---

# Product Requirements Document (PRD)

# Family Finances

## Overview

Family Finances is a household finance application that separates **real ledger money** from **virtual jar allocations**. Partners share a household; admins have elevated controls. This PRD is composed only from validated Business Discovery and Specification Generation artifacts.

## Product Intent

- **spec-product-identity**: Product: household-based personal finance with strict real-ledger vs virtual-jar separation.
- **spec-product-tenancy**: Tenancy model: household root; members partner|admin; invitations pending|accepted|revoked|expired.
- **spec-product-features**: Feature set locked to 18 discovered features (auth through health flags).

## Core Features

- **ft-auth**: Auth login/signup at /login.
- **ft-household**: Household create/invite/accept at /household.
- **ft-onboarding**: Eight-step onboarding wizard under /onboarding/*.
- **ft-dashboard**: Dashboard aggregates household financial overview at /dashboard.
- **ft-accounts**: Accounts hub including cash/checking and detail at /accounts and /accounts/[id].
- **ft-savings**: Fixed-term savings accounts with mature/withdraw at /accounts/savings*.
- **ft-cards**: Credit card detail with billing items and installments at /accounts/card/[id].
- **ft-assets**: Assets including crypto and investment profiles at /assets/[id].
- **ft-debts**: Debt/liability management via accounts debt actions and onboarding debts step.
- **ft-activity**: Transaction activity log at /activity.
- **ft-goals**: Goals with contributions/status at /goals.
- **ft-jars**: Virtual jars: list, detail, history, setup, review queue.
- **ft-categories**: Category management at /categories and settings/categories.
- **ft-recurring**: Recurring rules at /recurring.
- **ft-decision-tools**: Decision tools / scenarios at /decision-tools.
- **ft-settings**: Settings: profile, household, members, assumptions, cash-flow, categories.
- **ft-insights**: AI insights foundation (flagged) with migrations and lib/insights.
- **ft-health**: Health scoring surface behind feature flag.

## Primary User Journeys

- **uj-daily-partner**: Daily partner: login → dashboard/accounts/activity/goals → log cashflows → clear jar review → manage savings/card/goals.
- **uj-new-household**: New household: signup → create household → invite partner → onboarding 8 steps → first insight.
- **uj-jar-setup-review**: Jar journey: setup presets/plans/rules → cashflows enqueue/auto → resolve review → optional month close.
- **uj-savings-maturity**: Savings journey: open fixed-term → track status → mature/withdraw/renew via savings APIs/UI.
- **uj-card-installment**: Card journey: view billing → convert to EMI → settle until completed.
- **uj-settings-admin**: Admin settings journey: household settings + assumptions (admin-gated).

## Key Workflows

- **wf-onboarding**: Onboarding: welcome→members→money→assets→debts→income/expenses→first-goal→first-insight (8 steps).
- **wf-household-bootstrap**: Household lifecycle: auth → create household RPC → optional invite → accept as partner.
- **wf-jar-sync**: Transaction/savings event → syncTransactionToJarIntent → auto-resolve or jar_review_queue pending.
- **wf-jar-review**: User resolves /jars/review items → resolveJarReviewItemAction → resolveReviewToMovements.
- **wf-month-close**: Month close: preview → approve → overspend cover + rollover → snapshots (draft→processing→approved|failed).
- **wf-activity**: Activity: create income/expense/transfer → may trigger jar sync.
- **wf-savings**: Savings: create → active lifecycle → mature/withdraw via API/UI forms.
- **wf-card-emi**: Card: billing item → convert to installment → settle payments until completed/cancelled.

## Constraints (No Invention)

- Source of truth: Business Discovery `run_business_discovery_20260801T122000Z` + Specification `run_specification_20260801T130500Z`
- No redesign and no invented business logic in this composition
- Framework Phase 1 discovery HOLD is noted separately and does not alter product requirements

## Traceability

- Features pack: `ai-os/artifacts/features/runs/run_business_discovery_20260801T122000Z/payload.json`
- Requirements pack: `ai-os/artifacts/requirements/runs/run_specification_20260801T130500Z/payload.json`
- Specifications pack: `ai-os/artifacts/specifications/runs/run_specification_20260801T130500Z/payload.json`
