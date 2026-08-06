# Story Order — sprint-001

## Execution contract

Implement **exactly one story at a time**, in this order. Never start the next story until the current story’s quality gates and Story DoD pass.

| Seq | Story | Mode | Rationale |
|-----|-------|------|-----------|
| 1 | `ST-E01-001` | verify | Shell/tokens baseline before any auth chrome assumptions |
| 2 | `ST-E01-003` | verify + auth primitives | Forms need `shared/ui` before auth screens |
| 3 | `ST-E01-002` | verify | Chrome patterns; auth layout must omit BottomNav |
| 4 | `ST-E02-001` | full | Splash + Welcome entry before login |
| 5 | `ST-E02-002` | full | Session + gates; core exit criteria |
| 6 | `ST-E02-003` | full | Register/forgot after login path works |
| 7 | `ST-E02-004` | full | OAuth-first Login (Google + Apple) |
| 8 | `ST-E02-005` | full | Identity linking after OAuth |
| 9 | `ST-E02-006` | full | Sign-out + delete after OAuth path |

## Forbidden

- Multi-story parallel implementation by AI agents
- Reordering to start E02 before E01 verify completes
- Skipping `ST-E02-003` silently (P1 but committed in S1)
- Skipping OAuth stories `ST-E02-004`…`006` after Authentication Strategy v2 adoption

## After sprint-001

Next delivery sprint is S2 (Household / Together / Onboard) — **not** planned in this pack.
