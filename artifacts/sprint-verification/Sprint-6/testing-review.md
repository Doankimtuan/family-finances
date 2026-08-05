# Testing Review — Sprint 6

## Gates executed (verified locally)

| Gate | Result | Count |
|------|--------|-------|
| `npm run lint` | PASS | — |
| `npm run typecheck` | PASS | — |
| `npm test` | PASS | **244** tests |
| `npm run test:constitution` | PASS | **18** tests |

## Sprint 6 focused tests

| File | Coverage focus | Tier |
|------|----------------|------|
| `tests/unit/health-readonly-shield.test.ts` | Proxy throws; source scan; no commands dir | Tier 4 Constitutional |
| `tests/unit/ai-policy.test.ts` | Grounding + autonomous move + audit schema | Tier 1 + policy |
| `tests/unit/health-insights.test.ts` | Counts-only insights; AI guardrail last | Tier 1 |
| `tests/unit/health-pulse.test.ts` | Score from counts | Tier 1 |

## vs `testing-strategy.md` pyramid

| Tier | Required for GA (plan) | Sprint 6 |
|------|------------------------|----------|
| Tier 1 Unit | ≥90% coverage target | Many unit tests; **coverage % not measured in CI** |
| Tier 2 Integration | DB/repos/events 100% pass | **Missing** — no `getHealthDetail` integration test |
| Tier 3 E2E Playwright | 100% pass on journeys | **27 specs exist; not in CI** |
| Tier 4 Constitutional | BR-01/BR-24 zero exceptions | **Partial** — BR-24/BR-14 slices only |
| Tier 5 Accessibility | Zero WCAG violations | **Not run** |
| Tier 6 Security/Load | Zero vulnerabilities | **Not run** |

## vs Story DoD (`definition-of-done.md`)

| DoD item | ST-E06-001 | ST-E06-002 | ST-E06-003 |
|----------|------------|------------|------------|
| AC verified via integration/E2E | Partial (unit scan) | Partial (unit) | **No** |
| BR-24 check | **Yes** | N/A | Not full-system |
| a11y audit | N/A | N/A | **No** |
| 100% sprint stories satisfy DoD | — | — | **No** |

## E2E inventory (not gated)

`tests/e2e/health-insights.smoke.spec.ts` validates:
- Auth redirect
- Health overview → insights navigation
- `health-insight-ai_guardrail` visible
- BR-14 copy present (EN/VI)

**This spec is valuable for GA but excluded from `.github/workflows/ci.yml`.**

## Failure / edge cases

| Scenario | Tested? |
|----------|---------|
| Proxy write rejection | Yes |
| Ungrounded AI params | Yes |
| Health load failure (null gate) | UI only — no automated test |
| Audit insert failure | No |
| RLS on `ai_audit_logs` | No automated test |

## Regression

244 unit tests provide broad regression for prior sprints at unit level. **No proof** Sprint 6 changes did not regress Tier 2–3 behaviors.

## Testing score contribution

**5.8 / 10** — Strong constitutional unit slice; GA pyramid tiers 2–6 largely absent from CI.
