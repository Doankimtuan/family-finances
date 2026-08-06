# Test Report — Sprint 6

| Gate | Result |
|------|--------|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:constitution` | **18** passed |
| `npm test` | **244** passed |

## Focused coverage

- `tests/unit/health-readonly-shield.test.ts` — Proxy + source scan + no commands dir
- `tests/unit/ai-policy.test.ts` — grounding + autonomous move guards
- `tests/unit/health-insights.test.ts` / `health-pulse.test.ts` — existing Health compute paths
