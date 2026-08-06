# Success Criteria — sprint-001

## Sprint exit (SoT)

From `artifacts/implementation-plan/CURRENT/sprints/S1.md`:

**AppViewport + login session works**

## Demo script (must pass)

1. Open app (locale entry, e.g. `/en` or `/vi`)
2. Land on **Welcome** (or Splash → Welcome) — **not** a product `/home` bypass
3. Navigate to **Login**
4. Authenticate with valid credentials against Supabase Auth
5. Session established (SSR-aware; subsequent navigations see authenticated state)
6. Shell chrome visible inside **440px** AppViewport (Calm Ledger / Design System)

## Story success (summary)

| Story | Success |
|-------|---------|
| `ST-E01-001` | Shell/tokens DoD verified or gaps closed |
| `ST-E01-003` | Auth-needed primitives available via `shared/ui` |
| `ST-E01-002` | Product chrome OK; auth layout omits BottomNav |
| `ST-E02-001` | Splash + Welcome match blueprints; i18n filled |
| `ST-E02-002` | Login + confirm; session; fail-closed money gates (AC-002 scoped) |
| `ST-E02-003` | Register + forgot password usable from login links |

## Explicit non-success (do not require for S1 exit)

- Completing onboard / create household (S2)
- Money capture or ledger writes
- Plan ritual / Inbox resolve

## Pack success (this board)

- Freeze pack at `READY_FOR_IMPLEMENTATION`
- No product code in this board run
- No SoT edits outside `artifacts/sprint-planning/`
