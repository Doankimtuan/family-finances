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

# API

## API Specifications

- **spec-api-01**: API route handler exists and is in-scope for implementation maintenance: app/api/cash-flow/forecast/route.ts
- **spec-api-02**: API route handler exists and is in-scope for implementation maintenance: app/api/dashboard/activity/route.ts
- **spec-api-03**: API route handler exists and is in-scope for implementation maintenance: app/api/dashboard/core/route.ts
- **spec-api-04**: API route handler exists and is in-scope for implementation maintenance: app/api/dashboard/goals/route.ts
- **spec-api-05**: API route handler exists and is in-scope for implementation maintenance: app/api/dashboard/summary/route.ts
- **spec-api-06**: API route handler exists and is in-scope for implementation maintenance: app/api/jars/spending/categories/route.ts
- **spec-api-07**: API route handler exists and is in-scope for implementation maintenance: app/api/jars/spending/history/route.ts
- **spec-api-08**: API route handler exists and is in-scope for implementation maintenance: app/api/jars/spending/map-category/route.ts
- **spec-api-09**: API route handler exists and is in-scope for implementation maintenance: app/api/jars/spending/summary/route.ts
- **spec-api-10**: API route handler exists and is in-scope for implementation maintenance: app/api/jars/spending/transactions/route.ts
- **spec-api-11**: API route handler exists and is in-scope for implementation maintenance: app/api/savings/[id]/mature/route.ts
- **spec-api-12**: API route handler exists and is in-scope for implementation maintenance: app/api/savings/[id]/projection/route.ts
- **spec-api-13**: API route handler exists and is in-scope for implementation maintenance: app/api/savings/[id]/route.ts
- **spec-api-14**: API route handler exists and is in-scope for implementation maintenance: app/api/savings/[id]/withdraw/route.ts
- **spec-api-15**: API route handler exists and is in-scope for implementation maintenance: app/api/savings/route.ts
- **spec-api-16**: API route handler exists and is in-scope for implementation maintenance: app/api/savings/summary/route.ts
- **spec-api-17**: API route handler exists and is in-scope for implementation maintenance: app/api/transactions/route.ts
- **spec-api-server-actions**: Mutation surface includes discovered app/**/actions.ts and *-actions.ts modules (household-scoped via resolveActionContext).

## Notes

- Each entry is reverse-engineered from existing `app/api/**/route.ts` handlers and BD packs.
- No new endpoints are invented in Final Composition.
