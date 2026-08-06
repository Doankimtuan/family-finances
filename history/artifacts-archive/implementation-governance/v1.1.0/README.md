---
document: README
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
coding_standards_sot: artifacts/coding-standards/CURRENT
---

# Implementation Governance `v1.1.0`

**Status:** `OFFICIAL_IMPLEMENTATION_GOVERNANCE`  
**Mandatory** for every future Story, engineer, and AI agent.

This pack is the Staff-Engineer quality framework. It does not redesign Product or Architecture. It enforces consistent implementation.

## v1.1.0 change summary

Engineering Standards Board freeze — inserted [Coding Standards](../../coding-standards/CURRENT/README.md) into the mandatory read order, added constants/magic-string/Tailwind/TypeScript/enum/import-depth gates to `anti-patterns.md`, `implementation-checklist.md`, `code-review-guide.md`, `pull-request-template.md`, and `definition-of-done.md`. No process gate was loosened; only new gates were added.

## Start here

1. [engineering-playbook.md](./engineering-playbook.md) — mandatory read order (pipeline)
2. [implementation-checklist.md](./implementation-checklist.md) — pre-story STOP gate
3. [definition-of-ready.md](./definition-of-ready.md) / [definition-of-done.md](./definition-of-done.md)

## Authority

| Layer | Pack |
|-------|------|
| What / why | Product, Architecture, Tech Spec, Design, Screen Blueprints |
| How (law) | [Developer Constitution](../../developer-constitution/CURRENT/constitution.md) |
| Implementation detail | [Coding Standards](../../coding-standards/CURRENT/README.md) |
| Reuse inventory | [Engineering Review](../../engineering-review/CURRENT/) (`ENGINEERING_PATTERN_V1`) |
| i18n | [Localization](../../localization/CURRENT/) (`LOCALIZATION_READY`) |
| Process / gates | **This Governance** |

Conflict rule: Constitution and frozen SoT decisions win. Governance may tighten process; it must not loosen stack, folder, or import law.

## Documents

- [implementation-checklist.md](./implementation-checklist.md)
- [decision-matrix.md](./decision-matrix.md)
- [engineering-playbook.md](./engineering-playbook.md)
- [definition-of-ready.md](./definition-of-ready.md)
- [definition-of-done.md](./definition-of-done.md)
- [code-review-guide.md](./code-review-guide.md)
- [architecture-review-guide.md](./architecture-review-guide.md)
- [business-review-guide.md](./business-review-guide.md)
- [ui-review-guide.md](./ui-review-guide.md)
- [accessibility-review.md](./accessibility-review.md)
- [localization-review.md](./localization-review.md)
- [security-review.md](./security-review.md)
- [performance-review.md](./performance-review.md)
- [regression-checklist.md](./regression-checklist.md)
- [pull-request-template.md](./pull-request-template.md)
- [implementation-rules.md](./implementation-rules.md)
- [anti-patterns.md](./anti-patterns.md)
- [abstraction-policy.md](./abstraction-policy.md)
- [component-policy.md](./component-policy.md)
- [hooks-policy.md](./hooks-policy.md)
- [forms-policy.md](./forms-policy.md)
- [api-policy.md](./api-policy.md)
- [state-management-policy.md](./state-management-policy.md)
- [testing-policy.md](./testing-policy.md)
- [naming-policy.md](./naming-policy.md)
- [folder-policy.md](./folder-policy.md)
- [dependency-policy.md](./dependency-policy.md)
- [release-checklist.md](./release-checklist.md)
- Companion pack: [Coding Standards](../../coding-standards/CURRENT/README.md)

Docs only. No application coding in this board.
