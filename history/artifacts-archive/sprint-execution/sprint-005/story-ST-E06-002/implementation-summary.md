# ST-E06-002 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E06-002` |
| Title | Review item resolve dismiss acknowledge |
| Sprint | S5 / `sprint-005` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E06-002_20260803T024400Z` |
| Date | `2026-08-03T02:44:00Z` |

## Delivered

| Task | Result |
|------|--------|
| Resolve to Active jar (AC-003/005) | PASS — RPC enforces Active; UI Active-only select |
| Dismiss with confirm | PASS — `dismiss_inbox_item` + confirm UI |
| Savings maturity ack (AC-010/BR-10) | PASS — renew/switch/withdraw → `acknowledged` |
| EMI complete ack (AC-011/BR-11) | PASS — celebrate/later → `acknowledged` |
| Offline fail-closed (AC-018) | PASS — banner + disabled mutations |
| Partner-equal (AC-020) | PASS — membership gate on all RPCs |
| Keyboard / touch (AC-019) | PASS — min-h-11 controls |
| Migration applied remotely | PASS |

## Key paths

- `supabase/migrations/20260803100000_inbox_dismiss_ack_kinds.sql`
- `modules/inbox/application/{inbox-constants,review-items}.ts`
- `app/[locale]/(product)/inbox/inbox-decision-panel.tsx`
- `app/[locale]/(product)/inbox/[id]/page.tsx`
- `messages/{en,vi}/inbox.json`
- `tests/unit/inbox-decisions.test.ts`
- `tests/e2e/inbox-decisions.smoke.spec.ts`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (152) |
| e2e inbox-decisions | PASS (1 passed, 1 skipped) |
| build | PASS |
