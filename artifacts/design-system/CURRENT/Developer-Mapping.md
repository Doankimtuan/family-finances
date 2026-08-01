---
document: Developer Mapping
design_system: v1.0.0
status: OFFICIAL_DESIGN_SYSTEM_SOURCE_OF_TRUTH
run_id: run_design_system_20260801T190000Z
created_at: 2026-08-01T16:12:23Z
board: Design System Generator
design_foundation: v1.1.0
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Developer Mapping

| Spec tier | Implement in | Notes |
|-----------|--------------|-------|
| primitive / foundation / most feedback | `shared/ui` | Wrap `@heroui/react` + tokens |
| Toast host, containers, nav, financial, composite | `shared/patterns` | Compose shared/ui |
| Feature-specific | `modules/<bc>/` UI | Call application services only |
| Screens | `app/(product)/*` | Compose patterns + feature |

CSS bootstrap intent:

```css
@import "tailwindcss";
@import "@heroui/styles";
/* ViNha semantic overrides from tokens.json */
```

Variants: `tailwind-variants`. Forms: RHF + Zod. Theme: `next-themes`.
