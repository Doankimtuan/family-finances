---
document: Theme Provider
theme_system: v1.0.0
status: OFFICIAL_THEME_SYSTEM_SOURCE_OF_TRUTH
run_id: run_theme_system_20260802T140000Z
created_at: 2026-08-02T07:00:00Z
frozen: true
---

# Theme Provider

## Implementation

[`providers/theme-provider.tsx`](../../../providers/theme-provider.tsx) wraps the app inside [`AppProvider`](../../../providers/app-provider.tsx).

| Option | Value |
|--------|-------|
| `attribute` | `class` → `html.dark` |
| `defaultTheme` | `system` |
| `enableSystem` | `true` |
| `themes` | `light`, `dark`, `system` |
| `storageKey` | `vinha-theme` |
| `disableTransitionOnChange` | `true` (hydrate FOUC guard) |

## Intentional motion

`ThemeTransitionBridge` watches `resolvedTheme` / `theme`. After mount, on change it adds `html.theme-transitioning` for **200ms**, enabling calm background/color transitions defined in `globals.css`. Honors `prefers-reduced-motion`.

## Toggle UI

[`ThemeToggle`](../../../shared/patterns/theme-toggle.tsx) — System / Light / Dark segmented control.

- Mounted on Together via [`TogetherPreferences`](../../../shared/patterns/together-preferences.tsx) (Design Foundation: preferences live under Together).
- Hydration-safe: buttons disabled + `aria-busy` until client mount; default visual = System.

## Persistence

`localStorage["vinha-theme"]` = `system` | `light` | `dark`. Survives reload. System mode follows OS `prefers-color-scheme` via `next-themes`.

## No flashing / no mismatch

1. Root `<html suppressHydrationWarning>`
2. `next-themes` bootstrap script sets class before paint
3. Toggle does not render "active" from storage until mounted
4. Hydrate transitions disabled; only user-initiated switches animate
