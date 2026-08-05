# Fixes Applied — Sprint 6 Verification Blockers

Board required fixes from `artifacts/sprint-verification/Sprint-6/blocking-issues.md`.

| ID | Fix |
|----|-----|
| **B1** | CI job `e2e-smoke` runs `npm run test:e2e:smoke` (auth-entry, health-insights, home-dashboard smoke specs); optional E2E secrets for authenticated paths |
| **B2** | `tests/unit/get-health-detail.integration.test.ts` — mocked ledger/plan/inbox reads prove cross-BC orchestration + AI guardrail insight |
| **B3** | `onPolicyBlock` hook on `buildHealthInsights`; `logHealthAiPolicyBlock` → `recordAiAuditEvent` wired from `getHealthDetail`; unit tests for hook + audit logger |

## Files touched

- `.github/workflows/ci.yml`
- `package.json` (`test:e2e:smoke`, expanded `test:constitution`)
- `modules/platform/application/ai-audit.schema.ts` — `AI_AUDIT_SURFACE`
- `modules/health/application/build-health-insights.ts`
- `modules/health/application/log-health-ai-policy-block.ts` (new)
- `modules/health/application/get-health-detail.ts`
- `modules/health/application/get-health-overview.ts`
- `tests/unit/get-health-detail.integration.test.ts` (new)
- `tests/unit/health-insights-policy-block.test.ts` (new)
- `tests/unit/log-health-ai-policy-block.test.ts` (new)
