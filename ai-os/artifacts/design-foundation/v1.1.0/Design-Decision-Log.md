---
document: Design Decision Log
design_foundation: v1.1.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_mobile_design_system_20260801T180000Z
created_at: 2026-08-01T16:01:24Z
board: Mobile Experience & Design System Board
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
inherits: v1.0.0
supersedes_clauses: desktop-nav-layout-ui-kit
frozen: true
---
# Design Decision Log

| ID | Decision | Outcome | Rationale |
|----|----------|---------|-----------|
| DD-M01 | Experience model | **Mobile Native** | Primary use is smartphone |
| DD-M02 | Desktop model | Phone-in-monitor, **440px** viewport | Preserve mobile UX; no enterprise |
| DD-M03 | Navigation | Bottom nav only; **no sidebar** | Supersedes v1.0.0 side/top desktop nav |
| DD-M04 | UI kit | **HeroUI v3** + React Aria | Tailwind v4, a11y, single system |
| DD-M05 | Variants | `tailwind-variants` | Consistent variants |
| DD-M06 | Icons | Phosphor only | No mix |
| DD-M07 | Motion | `motion/react`, 150–250ms | Calm Ledger |
| DD-M08 | Shared path | `shared/{ui,patterns,hooks,lib,utils}` | Primitive→Screen |
| DD-M09 | Theme | `next-themes` + semantic tokens | Dark from day one |
| DD-M10 | Charts | Recharts minimal ink | Financial clarity |
| DD-M11 | Optional 640px | Not default | Tablet-style only if future Product asks |
| DD-M12 | vv1.0.0 | Historical; CURRENT = v1.1.0 | Controlled supersession |
