# ST-E06-001 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E06-001` |
| Title | Inbox queue |
| Sprint | S5 / `sprint-005` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E06-001_20260803T022100Z` |
| Date | `2026-08-03T02:21:00Z` |

## Delivered

| Task | Result |
|------|--------|
| ReviewCard pattern | PASS — `shared/patterns/review-card.tsx` |
| Queue list (`inbox.queue`) | PASS — kind filter + search + ReviewCard links |
| Open card → detail | PASS — `/inbox/[id]` with why + resolve panel |
| Partner-equal resolve (AC-020) | PASS — membership gate (any partner); UI note |
| AC-005 unmapped → resolvable | PASS — resolve to Active jar on detail |
| Offline fail-closed banner | PASS — InboxOfflineBanner |
| i18n en/vi | PASS — inbox.json expanded |
| Tests | PASS — unit + e2e smoke |

## Key paths

- `shared/patterns/review-card.tsx`
- `app/[locale]/(product)/inbox/page.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-list.tsx`
- `app/[locale]/(product)/inbox/[id]/page.tsx`
- `app/[locale]/(product)/inbox/inbox-resolve-panel.tsx`
- `modules/inbox/application/{inbox-types,review-items}.ts`
- `modules/tenancy/application/app-path.ts` (`inboxItemPath`)
- `messages/{en,vi}/inbox.json`
- `tests/unit/inbox-queue.test.ts`
- `tests/e2e/inbox-queue.smoke.spec.ts`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (149) |
| e2e inbox-queue | PASS (1 passed, 1 skipped) |
| build | PASS (`/inbox`, `/inbox/[id]`) |
