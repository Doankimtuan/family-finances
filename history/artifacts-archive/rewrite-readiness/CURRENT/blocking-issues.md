# Blocking Issues

## Critical blocking issues

**None.**

## Therefore

NO-GO is **not** warranted.

## Conditional blockers (must clear for healthy S1)

These are not missing decisions; they are bootstrap work items:

1. Install locked UI stack: `@heroui/react`, `@heroui/styles`, `tailwind-variants`, `@phosphor-icons/react`, `motion`, `next-themes` (per Design Foundation UI Technology Decision).
2. Scaffold `shared/{ui,patterns,hooks,lib,utils}` and implement AppViewport 440px + BottomNavigation before feature screens.
3. Import rule: prefer `shared/ui`; treat root `components/` as legacy alias only (do not grow).
4. Enforce Mobile Native desktop: centered 440px viewport; no sidebar; overlays in viewport.
5. Money mutations: online-only fail-closed; Idempotency-Key; no offline write queue (BR-15 / REQ-018 / AC-018).
6. Follow Design System component IDs and Screen Blueprints; no Categories primary nav.
7. Sprint 1 demo exit: session login works inside AppViewport with Calm Ledger tokens applied to HeroUI.
