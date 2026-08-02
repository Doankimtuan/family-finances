---
document: README
theme_system: v1.0.0
status: OFFICIAL_THEME_SYSTEM_SOURCE_OF_TRUTH
run_id: run_theme_system_20260802T140000Z
created_at: 2026-08-02T07:00:00Z
board: Theme System Team
frozen: true
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
branding_sot: artifacts/branding/CURRENT
---

# Theme System `v1.0.0`

**Status:** `OFFICIAL_THEME_SYSTEM_SOURCE_OF_TRUTH`
**Scope:** Complete Light + Dark design-token theming. No business logic, IA, or product redesign.

## Documents

1. [theme-architecture.md](./theme-architecture.md)
2. [design-tokens.md](./design-tokens.md)
3. [theme-provider.md](./theme-provider.md)
4. [component-theme-matrix.md](./component-theme-matrix.md)
5. [light-theme-preview.md](./light-theme-preview.md)
6. [dark-theme-preview.md](./dark-theme-preview.md)
7. [migration-summary.md](./migration-summary.md)
8. [validation-report.md](./validation-report.md)

## Runtime source of truth

| Layer | Path |
|-------|------|
| CSS variables (light + dark) | [`styles/globals.css`](../../../styles/globals.css) |
| ThemeProvider | [`providers/theme-provider.tsx`](../../../providers/theme-provider.tsx) |
| Theme toggle UI | [`shared/patterns/theme-toggle.tsx`](../../../shared/patterns/theme-toggle.tsx) |
| Token TS helpers | [`shared/theme/`](../../../shared/theme/) |
| Chart color bridge | [`shared/theme/chart-colors.ts`](../../../shared/theme/chart-colors.ts) |

## Modes

`system` · `light` · `dark` via `next-themes` (`storageKey=vinha-theme`, `attribute=class`).
