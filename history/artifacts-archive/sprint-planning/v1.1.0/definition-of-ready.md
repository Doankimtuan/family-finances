# Definition of Ready — applied (sprint-001)

This board’s Implementation Plan pack does not ship a separate DoR file. DoR is derived from Developer Constitution + Rewrite Readiness + this Sprint Execution Board.

## Checklist (must be true for every selected story)

| # | Criterion | E01×3 | E02-001 | E02-002 | E02-003 | E02-004 | E02-005 | E02-006 |
|---|-----------|-------|---------|---------|---------|---------|---------|---------|
| 1 | Story card exists in Implementation Plan | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2 | Screen Blueprint frozen (or N/A for shell-only) | N/A / patterns SoT | ✓ | ✓ | ✓ | ✓ | ✓ | N/A adapter |
| 3 | Design System frozen | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4 | AC / BR / REQ cited where product-facing | Shell only | Blueprint | AC-002, BR-02/02a, REQ-002 | Blueprint + Auth | AC-002a, REQ-002a | AC-002b, BR-02b | AC-002a |
| 5 | Architecture placement known (app / modules / shared) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6 | i18n path known (`messages/{locale}`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 7 | No Phase 2 / wrong-sprint scope | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 8 | Dependencies earlier in chain Ready or verify-complete | ✓ | after E01 | after E02-001 | after E02-002 | after E02-003 | after E02-004 | after E02-004 |
| 9 | Env/Auth treatable: missing env = execution STOP, not deselection | n/a | n/a | ✓ | ✓ | Google/Apple | Linking | ✓ |
| 10 | DoD known (`definition-of-done/DoD.md` + story DoD) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Verdict

| Story | DoR | Notes |
|-------|-----|-------|
| `ST-E01-001` | **100% Ready** (verify) | Code exists; blueprints N/A |
| `ST-E01-002` | **100% Ready** (verify) | Patterns SoT; Design System frozen |
| `ST-E01-003` | **100% Ready** (verify) | Extend only if auth needs primitives |
| `ST-E02-001` | **100% Ready** | Blueprints frozen; no DB |
| `ST-E02-002` | **100% Ready** (scoped) | Session + fail-closed membership; onboard = S2 |
| `ST-E02-003` | **100% Ready** | Blueprints + hosted Auth recovery |
| `ST-E02-004` | **100% Ready** (env-gated) | Auth Strategy v2; B-ENV-03/04 |
| `ST-E02-005` | **100% Ready** (env-gated) | BR-02b; B-ENV-05 |
| `ST-E02-006` | **100% Ready** | Sign-out + delete adapters |

**Selected stories DoR coverage: 9/9 = 100%**

## Not DoR blockers

Missing `.env.local` / Supabase project keys are **execution setup blockers** (see [blockers.md](./blockers.md)). Stories remain selected; agents STOP until Auth can run.
