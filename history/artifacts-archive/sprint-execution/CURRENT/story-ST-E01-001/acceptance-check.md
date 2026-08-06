# ST-E01-001 — Acceptance Check

## Story acceptance (description + DoD)

| Criterion | Evidence | Status |
|-----------|----------|--------|
| next-themes wired | `providers/theme-provider.tsx` (`attribute="class"`, `defaultTheme="system"`) | PASS |
| Geist fonts | `app/layout.tsx` (`GeistSans` / `GeistMono`) | PASS |
| CSS tokens | `styles/globals.css` `:root` + `.dark` / `[data-theme="dark"]` | PASS |
| AppViewport 440px | `--app-viewport-max: 440px`; `#app-viewport-root` max-w token | PASS |
| Decorative outer canvas | `html, body` use `--color-canvas-outer` atmosphere | PASS |
| No sidebar | Product layout: AppViewport + main + BottomNav only | PASS |
| Design System / shared patterns | `shared/patterns/app-viewport.tsx` | PASS |
| No `archive/` imports | Product shell paths clean | PASS |
| Locale shell smoke | Playwright `/en/home`, `/vi/home` | PASS |

## AC-019 / REQ-019 (scoped)

| Item | Status | Notes |
|------|--------|-------|
| Shell focus / keyboard foundation | PASS (foundation) | Tokens + viewport chrome present |
| Full capture / Inbox / Month Ritual keyboard paths | N/A this story | Deferred to domain stories; AC-019 remains product-level |

## Business rules

None cited on story card (`BR` —).

## Verdict

**ACCEPTED** for ST-E01-001 verify/gap-close scope.
