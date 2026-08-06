---
document: Component Policy
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

# Component Policy

| Level | Location | Owns |
|-------|----------|------|
| Shared UI (Primitive) | `shared/ui` | HeroUI wrappers, tokens, generic primitives only |
| Shared Patterns | `shared/patterns` | Cross-feature composites (AppViewport, BottomNav, AmountField, …) |
| Feature Components | `features/*` | Feature UI composition |
| Module Components | `modules/*/…` | Only if Architecture places UI adapters there; prefer `features` for product UI |
| Page Components | `app/**` | Thin route composition + data loading |

## Rules

- Only `shared/ui` may contain reusable UI primitives.
- Do not skip layers (Page must not re-implement Pattern internals).
- Do not grow root `components/`.
- Match Design System IDs / Screen Blueprints.
- Composition, small/pure/single-responsibility components; avoid nested ternaries, repeated inline objects/functions, and duplicated Tailwind class blobs — see [Coding Standards / react-patterns.md](../../coding-standards/CURRENT/react-patterns.md).
