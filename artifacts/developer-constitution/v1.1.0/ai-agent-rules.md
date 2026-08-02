---
document: AI Agent Rules
developer_constitution: v1.1.0
status: OFFICIAL_IMPLEMENTATION_CONSTITUTION
run_id: run_developer_constitution_20260802T151500Z
created_at: 2026-08-02T15:15:00Z
board: Developer Constitution Board
frozen: true
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
screen_blueprints_sot: artifacts/screen-blueprints/CURRENT
implementation_plan_sot: artifacts/implementation-plan/CURRENT
rewrite_readiness_sot: artifacts/rewrite-readiness/CURRENT
---

# AI Agent Rules

Future AI agents **must**:

1. Never redesign Product.
2. Never redesign Architecture.
3. Never redesign Design System or Design Foundation.
4. Never rename Business Rules.
5. Never invent Requirements.
6. Never invent Acceptance Criteria.
7. Never introduce technologies outside the approved stack.
8. Never create duplicate components or utilities.
9. Never bypass Design Tokens.
10. Never bypass `shared/ui` for primitives.
11. Never modify frozen documentation under `artifacts/**/CURRENT` or versioned freezes (except boards explicitly authorized to produce new artifact packs).
12. Never grow root `components/`.
13. Never import from `archive/legacy-v1`.
14. Never recreate retired control-plane directories.
15. Never hardcode a route, storage/query/mutation key, status, role, permission, feature flag, cookie name, theme name, or locale name — use the constant defined in [Coding Standards / magic-string-policy.md](../../coding-standards/CURRENT/magic-string-policy.md) and [constants-policy.md](../../coding-standards/CURRENT/constants-policy.md), or add one at its documented home if it does not yet exist.
16. Never introduce a new native `enum` without a documented platform-API justification — see [Coding Standards / enums-policy.md](../../coding-standards/CURRENT/enums-policy.md).
17. Never write `rounded-[var(--radius-*)]` or another arbitrary-value bracket when a canonical Tailwind utility or existing token already covers it — see [Coding Standards / tailwind-policy.md](../../coding-standards/CURRENT/tailwind-policy.md).

If ambiguity exists: **stop and request clarification. Never guess.**
