---
document: Component Theme Matrix
theme_system: v1.0.0
status: OFFICIAL_THEME_SYSTEM_SOURCE_OF_TRUTH
run_id: run_theme_system_20260802T140000Z
created_at: 2026-08-02T07:00:00Z
frozen: true
---

# Component Theme Matrix

Every shared component consumes semantic tokens. Light/Dark work without component-level theme forks.

| Component | Path | Token strategy | Light | Dark |
|-----------|------|----------------|-------|------|
| Button | `shared/ui/button.tsx` | HeroUI + accent/surface via CSS bridge | ✓ | ✓ |
| IconButton | `shared/ui/icon-button.tsx` | same | ✓ | ✓ |
| Input | `shared/ui/input.tsx` | field-* bridge + border-subtle | ✓ | ✓ |
| Textarea | `shared/ui/textarea.tsx` | same | ✓ | ✓ |
| Select | `shared/ui/select.tsx` | same | ✓ | ✓ |
| Checkbox | `shared/ui/form/checkbox-field.tsx` | accent / text | ✓ | ✓ |
| Text / Heading | `shared/ui/text.tsx`, `heading.tsx` | text-primary/secondary/muted | ✓ | ✓ |
| Avatar | `shared/ui/avatar.tsx` | surface / border | ✓ | ✓ |
| Badge | `shared/ui/badge.tsx` | semantic status colors | ✓ | ✓ |
| Alert / StatusAlert | `shared/ui/alert.tsx`, `status-alert.tsx` | success/warning/danger/info | ✓ | ✓ |
| Divider | `shared/ui/divider.tsx` | divider | ✓ | ✓ |
| Spinner | `shared/ui/spinner.tsx` | accent | ✓ | ✓ |
| Skeleton | `shared/ui/skeleton.tsx` | skeleton | ✓ | ✓ |
| Card | `shared/patterns/card.tsx` | surface + border-subtle + elevation | ✓ | ✓ |
| Sheet | `shared/patterns/sheet.tsx` | surface-elevated + backdrop | ✓ | ✓ |
| Dialog | `shared/patterns/dialog.tsx` | surface-elevated + backdrop | ✓ | ✓ |
| Toast | `shared/patterns/toast.tsx` | surface-elevated | ✓ | ✓ |
| Empty / Loading / Error | patterns | text + canvas | ✓ | ✓ |
| TopAppBar | `top-app-bar.tsx` | canvas / text | ✓ | ✓ |
| BottomNavigation | `bottom-navigation.tsx` | surface / accent active | ✓ | ✓ |
| Auth shell / brand | auth patterns | accent / canvas | ✓ | ✓ |
| SocialButton | `social-button.tsx` | surface/inverse (+ Google glyph brand hex) | ✓ | ✓ |
| ThemeToggle | `theme-toggle.tsx` | accent / surface-hover | ✓ | ✓ |
| LocaleSwitcher | `locale-switcher.tsx` | accent / text | ✓ | ✓ |
| Charts (future) | `shared/theme/chart-colors.ts` | chart-* tokens at runtime | ✓ | ✓ |

## Domain cards (Money / Health / Goals / Installment)

Not yet built as dedicated components in rewrite. When added, they **must** use:

- `income` / `expense` / `saving` / `installment`
- `health-excellent` … `health-critical`
- Never raw emerald/rose/amber Tailwind palette classes

## Pages verified (token consumption)

Login · Register · Forgot Password · Splash · Welcome · Home · Money · Plan · Inbox · Together (toggle) · Health · not-found

Settings is not a standalone route yet; preferences live on Together per Design Foundation.
