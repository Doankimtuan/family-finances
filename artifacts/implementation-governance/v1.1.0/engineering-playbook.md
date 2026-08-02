---
document: Engineering Playbook
implementation_governance: v1.1.0
status: OFFICIAL_IMPLEMENTATION_GOVERNANCE
run_id: run_implementation_governance_20260802T153000Z
created_at: 2026-08-02T15:30:00Z
board: Implementation Governance Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
engineering_patterns_sot: artifacts/engineering-review/CURRENT
localization_sot: artifacts/localization/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
---

# Engineering Playbook

## Pipeline update (mandatory AI read order)

Before writing code for **any** Story, read in this order:

1. **Implementation Governance** — this pack (`artifacts/implementation-governance/CURRENT`)
2. **Developer Constitution** — `artifacts/developer-constitution/CURRENT`
3. **Coding Standards** — `artifacts/coding-standards/CURRENT` (constants, magic strings, Tailwind, TypeScript/enums, naming, folder, React pattern detail)
4. **Engineering Review (patterns)** — `artifacts/engineering-review/CURRENT` (reuse docs)
5. **Localization Foundation** — `artifacts/localization/CURRENT/developer-guide.md`
6. **Sprint Planning / AI contract** for the active sprint + Implementation Plan story card
7. **Screen Blueprints / Design System** as applicable to the Story

Then run [implementation-checklist.md](./implementation-checklist.md). Any fail → **STOP**.

## Story loop

```text
Select Story → DoR → Checklist STOP gate → Implement one Story
  → Self-review guides → Tests + AC mapping → DoD → PR template → Merge → Next Story
```

## Hard rules (restated)

- One Story at a time unless Sprint Planning explicitly allows otherwise
- Never redesign Product / Architecture / Design
- Never invent REQ / AC / BR
- Never grow root `components/`
- Never import `archive/legacy-v1`
- Never bypass tokens / `shared/ui`
- Never hardcode a route, storage/query/mutation key, status, role, or other magic string covered by [Coding Standards](../../coding-standards/CURRENT/magic-string-policy.md)
- Ambiguity → STOP and ask

## Quality bar

Staff Engineer quality means: correct boundaries, reuse-first, measurable reviews passed, every AC verifiable, no silent failures.
