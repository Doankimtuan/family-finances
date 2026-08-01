---
document: Accessibility Policy
developer_constitution: v1.0.0
status: OFFICIAL_IMPLEMENTATION_CONSTITUTION
run_id: run_developer_constitution_20260801T230000Z
created_at: 2026-08-01T16:38:51Z
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

# Accessibility Policy

1. **WCAG AA** minimum.
2. Keyboard support for all interactive flows; REQ-019 paths mandatory.
3. Focus visible at all times for keyboard users.
4. Respect **prefers-reduced-motion**.
5. Screen reader labels required on icon-only controls and amounts.
6. Use React Aria / HeroUI accessible primitives; do not reinvent focus traps poorly.
7. Contrast must hold in light and dark themes inside the 440px viewport.
