---
document: README
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
engineering_patterns_sot: artifacts/engineering-review/CURRENT
implementation_governance_sot: artifacts/implementation-governance/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
design_system_sot: artifacts/design-system/CURRENT
---

# Coding Standards `v1.0.0`

**Status:** `OFFICIAL_CODING_STANDARDS` — **frozen**.

Mandatory Staff-Engineer implementation detail law for every Sprint, engineer, and AI agent. This pack **tightens** how code is written; it does not redesign Product, Architecture, or Design System decisions, and it does not change business logic.

## Precedence

```text
Product / Architecture / Technical / Design SoTs   (what + why — untouched)
        v
Developer Constitution                              (implementation law)
        v
Coding Standards  <- this pack                       (detailed style + smell law)
        v
Implementation Governance                            (process + review gates)
        v
Engineering Review                                   (reuse inventory)
```

If a rule here ever appears to conflict with a stack lock, folder/import graph, or Design System token in the Developer Constitution, **the Constitution wins** — stop and clarify, do not guess.

## Start here

1. [magic-string-policy.md](./magic-string-policy.md) — the single most common AI code smell in this codebase
2. [constants-policy.md](./constants-policy.md) — where the strings above must live
3. [review-checklist.md](./review-checklist.md) — what makes a PR **fail**

## Documents

- [constants-policy.md](./constants-policy.md)
- [enums-policy.md](./enums-policy.md)
- [magic-string-policy.md](./magic-string-policy.md)
- [tailwind-policy.md](./tailwind-policy.md)
- [import-policy.md](./import-policy.md)
- [typescript-policy.md](./typescript-policy.md)
- [naming-policy.md](./naming-policy.md)
- [folder-policy.md](./folder-policy.md)
- [react-patterns.md](./react-patterns.md)
- [review-checklist.md](./review-checklist.md)
- [audit-report.md](./audit-report.md) — repo audit at freeze time; manual-review debt
- [safe-refactor-log.md](./safe-refactor-log.md) — mechanical fixes applied at freeze time
- [validation.json](./validation.json)
- [FREEZE.json](./FREEZE.json)

Docs + mechanical refactors only. No business logic changed, no architecture redesigned in this board run.
