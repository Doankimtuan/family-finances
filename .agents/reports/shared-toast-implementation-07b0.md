# Shared toast implementation 07B0

## Root cause

HeroUI's toast region was mounted inside `AppViewport`, but the local provider
overrode its placement with an uncentered `absolute inset-x-0` region and only
12px horizontal padding. This made the region misalign with the 440px canvas
and allowed the library's toast width/close-button defaults to cause clipping.
The default close control was an invisible hover-only button positioned outside
the toast surface.

## Implementation

- `providers/toast-provider.tsx`: keeps HeroUI's queue, three-toast stack,
  variants, indicators, actions, loading state, and timeout behavior; adds
  shell-aware bottom placement and localized dismiss labels.
- `shared/patterns/app-viewport.tsx` and `shared/patterns/chrome-shell.tsx`:
  pass whether the product shell owns bottom navigation.
- `shared/patterns/bottom-navigation.tsx` and `styles/globals.css`: define and
  reuse `--bottom-navigation-height` and the 44px `--toast-dismiss-size` token.
- `styles/globals.css`: adds the shared constrained layout, token-based surface,
  border, wrapping, internal layout, close control, focus, and reduced-motion
  rules.
- `messages/en/a11y.json` and `messages/vi/a11y.json`: add localized toast
  dismissal labels.

## Positioning

The provider is an absolute overlay inside the transformed 440px viewport, so
desktop placement stays within the product canvas. It uses the page gutter and
full available width, capped by `--app-viewport-max`. Product toasts sit above
the shared bottom-navigation height plus safe-area and visual-gap tokens;
auth/system toasts use only safe-area plus the visual gap.

## Visual changes

Toast content uses the elevated semantic surface, subtle semantic border,
existing elevation, natural wrapping, and a 16px-token internal rhythm. The
close control is in the flex layout, has a 44px target, remains attached to the
surface, and uses focus/hover tokens. Variants retain HeroUI's semantic
indicator/accent treatment without turning the whole toast into a colored block.

## Motion

HeroUI's existing queue and restrained view-transition behavior remain intact.
Reduced motion disables toast view-transition animation and close-control
transition.

## Accessibility

HeroUI/react-aria continues to provide the toast region/live-region behavior,
keyboard dismissal, stack focus handling, and status semantics. The custom
renderer preserves indicators, actions, and loading states while supplying
localized English/Vietnamese dismiss labels. The close target is 44px and no
longer overlaps message content.

## Browser verification

- Real Chromium smoke passed for the forgot-password flow in a single worker.
- Auth shell screenshots were captured at 390, 440, 768, and 1280px in light
  and dark themes using English and Vietnamese routes.
- Verified the constrained viewport remains 440px wide and centered at desktop.
- Local auth is unconfigured, so the submit flow renders its existing fallback
  alert rather than a success toast; no feature-level message was changed.

## Validation

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Focused Playwright toast-adjacent smoke passed.
- `npm run test` ran 914 tests: 912 passed, 2 failed in pre-existing
  `tests/unit/shared-visual-foundation.test.tsx` expectations for unrelated
  `rounded-[...]` class names. Those failures were not changed.

07B0 complete. Do not begin 07B automatically.
