# Recommendations — Sprint 6

Precise, file-level guidance. **Do not implement in this verification pass.**

---

## B1 — Playwright in CI

**File:** `.github/workflows/ci.yml`

Add job `e2e-smoke`:
- Run `npx playwright install --with-deps chromium`
- Run `npm run test:e2e -- tests/e2e/health-insights.smoke.spec.ts tests/e2e/home-dashboard.smoke.spec.ts` (expand gradually)
- Provide `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` via GitHub secrets; keep skip behavior when absent
- Fail job only when secrets present and tests fail (or require secrets on main — product choice)

**Reference spec:** `tests/e2e/health-insights.smoke.spec.ts` already asserts `health-insight-ai_guardrail`.

---

## B2 — Health integration test

**New file:** `tests/unit/get-health-detail.integration.test.ts` (or `tests/integration/health-detail.test.ts`)

Pattern:
- Mock `@/modules/ledger/application`, `@/modules/plan/application`, `@/modules/inbox/application` read functions
- Call `getHealthDetail()`
- Assert returned counts match mocks; `insights` includes `InsightKind.AI_GUARDRAIL`
- Assert no import path to commands (optional static assert)

**File under test:** `modules/health/application/get-health-detail.ts`

---

## B3 — Wire audit logger

**File:** `modules/health/application/build-health-insights.ts`

When `assertAiSuggestionGrounded` returns `!gate.ok`:
- Import `recordAiAuditEvent` from `@/modules/platform/application/ai-audit` **only in server path** — consider thin wrapper in health that calls audit via callback injection to keep health free of Supabase

Alternative (cleaner architecture):
- **New file:** `modules/platform/application/ai-policy-with-audit.ts` (server-only)
- Wrap guards; on block call `recordAiAuditEvent({ kind: AiAuditEventKind.POLICY_BLOCK, surface: "health.insights", payload: { code: gate.code } })`
- Call wrapper from `buildHealthInsights` via optional `onPolicyBlock` hook for testability

**Migration already applied:** `supabase/migrations/20260804160000_sprint6_ai_audit_logs.sql`

**Test:** Extend `tests/unit/ai-policy.test.ts` or add integration test mocking Supabase insert.

---

## ST-E06-001 — Optional hardening

**File:** `modules/platform/supabase/server.ts` (or read factory)

If any read helper is shared with Health in future, wrap with `asReadOnlySupabaseClient` when `context === 'health'`.

**Document:** `modules/health/README.md` — clarify proxy is for platform read factories, not Health direct use.

---

## ST-E06-003 — Additional GA gates (post-B1)

| Task | File / action |
|------|----------------|
| a11y | Add `@axe-core/playwright` to health-insights smoke |
| bundle | Add `size-limit` or `next build` + budget check in CI |
| migration validate | Script comparing `supabase/migrations` vs remote `list_migrations` in CI |

---

## Documentation fixes (non-blocking)

**File:** `artifacts/implementation-planning/CURRENT/story-catalog.md`

Correct ST-E06-002 mapping from REQ-HLT-01 / AC-HLT-01 to **BR-14 / REQ-017**.

---

## Process

1. Close B1–B3 on a fix branch
2. Re-run full gate: lint, typecheck, test, test:constitution, new e2e job
3. Request Sprint Verification Board re-audit for `v2.1-GA` sign-off
4. Optionally re-verify Sprint 5 fixes-applied in same pass
