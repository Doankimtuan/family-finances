# Technical Debt Review — Sprint 6

## Debt inventory

| ID | Item | Source | Priority | Sprint 6 status |
|----|------|--------|----------|-----------------|
| TD-S6-01 | Postgres SELECT-only role for Health | execution technical-debt | Low | Open — deliberate deferral |
| TD-S6-02 | Playwright + a11y in CI | execution technical-debt | **Medium → High** | Open — **blocking for GA** |
| TD-S6-03 | Wire `recordAiAuditEvent` on assist flows | execution technical-debt | **Medium → High** | Open — audit non-operational |
| TD-S6-04 | Bundle-size budget job | execution technical-debt | Low | Open |
| TD-S6-05 | `asReadOnlySupabaseClient` unused | board finding | Low | Open |
| TD-S6-06 | `GET /api/v2/health/score` traceability drift | Spec Sync | Low | Open |
| TD-S6-07 | ST-E06-002 catalog REQ mapping error | story-catalog | Info | Open (docs) |

## Code smells

| Smell | Location | Risk |
|-------|----------|------|
| Dead audit API | `modules/platform/application/ai-audit.ts` | Compliance gap — table exists but unused |
| Overclaimed story scope | ST-E06-003 “All ACs” | Process / sign-off risk |
| ID collision awareness | Spec vs rewrite ST-E06-* | Onboarding confusion — documented in KI-S6-04 |

## Architecture erosion risks

| Risk | Likelihood | Impact |
|------|------------|--------|
| Developer adds Supabase to Health without proxy | Low (lint catches) | High |
| AI assist added without audit wiring | Medium | High |
| GA sign-off without E2E | Medium (if B1 ignored) | High |

## Over / under engineering

- **Over:** Proxy layer while Health already avoids Supabase — acceptable insurance
- **Under:** GA CI vs plan task breakdown — material under-delivery on ST-E06-003

## Technical debt score

**5.5 / 10** (lower = more debt)

Weighted by GA-blocking items TD-S6-02 and TD-S6-03.

## Carry-forward from prior sprints

| Sprint | Item | Sprint 6 impact |
|--------|------|-----------------|
| S5 | Playwright not in CI | Still open — ST-E06-003 should have closed |
| S5 | REST adapter gaps | Unchanged |
| S4 | Autolock E2E | Not in Sprint 6 regression scope |

## Recommendations priority

1. Close TD-S6-02 (CI E2E smoke)
2. Close TD-S6-03 (audit wiring minimum: policy blocks + guard failures)
3. Add integration test for Health orchestration (Tier 2)
4. Optional: TD-S6-01 Postgres RO role when ops ready
