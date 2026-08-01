# Sprint 1 Readiness

## Can Sprint 1 start immediately?

**Yes, with day-0 bootstrap conditions.**

## Sprint 1 committed stories

| ID | Title |
|----|-------|
| ST-E01-001 | Bootstrap AppViewport shell and theme tokens |
| ST-E01-002 | BottomNavigation and TopAppBar |
| ST-E01-003 | shared/ui HeroUI wrappers |
| ST-E02-001 | Splash and Welcome |
| ST-E02-002 | Login and session |
| ST-E02-003 | Register and forgot password |

## Unresolved decisions blocking S1?

| Domain | Unresolved? |
|--------|-------------|
| Product | No |
| Architecture | No |
| Design | No |
| API contracts | No (session/auth named) |
| Database | No for auth/session path |
| UX | No |
| Permissions | No (public→authenticated gate) |
| Acceptance | No |

## Day-0 checklist

- [ ] Install locked UI stack: `@heroui/react`, `@heroui/styles`, `tailwind-variants`, `@phosphor-icons/react`, `motion`, `next-themes` (per Design Foundation UI Technology Decision).
- [ ] Scaffold `shared/{ui,patterns,hooks,lib,utils}` and implement AppViewport 440px + BottomNavigation before feature screens.
- [ ] Import rule: prefer `shared/ui`; treat root `components/` as legacy alias only (do not grow).
- [ ] Enforce Mobile Native desktop: centered 440px viewport; no sidebar; overlays in viewport.
