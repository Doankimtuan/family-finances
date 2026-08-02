# Story Order — sprint-001

## Execution contract

Implement **exactly one story at a time**, in this order. Never start the next story until the current story’s quality gates and Story DoD pass.

| Seq | Story | Mode | Focus | Status |
|-----|-------|------|-------|--------|
| 1 | `ST-E01-001` | verify | Shell/tokens | **DONE** (frozen) |
| 2 | `ST-E01-003` | verify + auth primitives | shared/ui | **DONE** (frozen) |
| 3 | `ST-E01-002` | verify | Chrome; no BottomNav on auth | **DONE** (frozen) |
| 4 | `ST-E02-001` | full | Splash + Welcome | **DONE** (frozen) |
| 5 | `ST-E02-002` | full | Email login + session | **DONE** (frozen) |
| 6 | `ST-E02-003` | full | Register + forgot | **DONE** (frozen) |
| 7 | `ST-E02-004` | full | **Google Login + Apple Login** (OAuth-first) | **NEXT** |
| 8 | `ST-E02-005` | full | **Account Linking** | PENDING |
| 9 | `ST-E02-006` | full | Sign-out + delete account | PENDING |

## Forbidden

- Multi-story parallel implementation by AI agents
- Reordering to start E02 before E01 verify completes
- Skipping `ST-E02-003` silently (baseline)
- Skipping Google, Apple, or Account Linking (`ST-E02-004` / `ST-E02-005`)
- Starting S2 before S1 Auth Strategy v2 residual stories freeze

## After sprint-001

Next delivery sprint is S2 (Household / Together / Onboard) — **not** planned in this pack.
