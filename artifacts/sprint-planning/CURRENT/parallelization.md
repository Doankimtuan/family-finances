# Parallelization — sprint-001

## Must be sequential

| Rule | Detail |
|------|--------|
| Across stories | `ST-E01-001` → `ST-E01-003` → `ST-E01-002` → `ST-E02-001` → `ST-E02-002` → `ST-E02-003` |
| AI agents | **Never** implement multiple stories in parallel (AI Implementation Contract) |

## Parallel OK (within a single story, after interfaces freeze)

| Track A | Track B |
|---------|---------|
| UI composition from blueprints | Test scaffolding (Playwright stubs, unit shells) |
| i18n catalog fill from blueprint copy | a11y checklist against REQ-019 |
| Adapter / Server Action wiring | Manual QA script prep |

## Never parallel

- E01 verify + E02 screens
- Login session + Register before login DoD
- Redesign tokens while building auth pages

## Human pair programming (optional)

A human may review blueprint fidelity while an agent implements **the same story’s** tests after the public route/API surface is frozen — still one story ownership.
