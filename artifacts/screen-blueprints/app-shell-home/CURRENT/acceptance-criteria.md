# Acceptance Criteria

## Rendering And Shell

- Authenticated Home renders the approved hierarchy inside the product shell.
- Bottom navigation remains exactly five tabs: Home, Money, Plan, Inbox, Together.
- Health and Settings remain secondary surfaces and do not appear as bottom tabs.
- Active tab state is correct for `/home`, `/money/*`, `/plan/*`, `/inbox/*`, and `/together/*`.
- Desktop renders the constrained 440px app viewport, not a desktop dashboard layout.

## Responsive Verification

- Home passes browser verification at 390px.
- Home passes browser verification at 440px.
- Bottom navigation and fixed regions respect safe-area padding.
- Long household names wrap or move to supporting context without hiding financial meaning.
- Long monetary values remain understandable, do not overlap controls, and expose exact accessible labels.

## Theme And Localization

- Home and App Shell pass browser verification in light mode.
- Home and App Shell pass browser verification in dark mode.
- Home and App Shell pass browser verification in Vietnamese.
- Home and App Shell pass browser verification in English.
- No hardcoded user-facing strings are introduced.

## Home States

- Empty/day-zero state shows the approved three essentials with one visually primary action.
- Partial-data state labels missing facts and routes to owner recovery.
- Ready state shows real position, capture, plan pulse, Inbox, Health, and recent activity only when available.
- Stale state preserves cached facts with freshness/source labels and a recovery action.
- Loading state uses reserved skeleton or placeholder shapes and does not imply success.
- Recoverable-error state shows retry or safe route without blanking the shell.
- Unsupported or unsafe-to-produce states are reported with the exact blocker.

## Interaction And Accessibility

- Home quick actions navigate only to owner routes and perform no writes directly.
- Keyboard order follows the visible Home order.
- Focus is visible on all interactive elements.
- Sheet/dialog interactions trap focus and restore focus to the invoking control.
- Route changes focus the new screen heading or preserve the origin context where supported.
- Reduced motion removes nonessential transitions and animated skeleton shimmer.
- All interactive controls meet the 44px touch target minimum.
- Status, stale, error, disabled, and badge meanings are not color-only.
- Inbox badge exposes an accessible pending-count announcement when visible.
- Monetary values include accessible labels with currency and financial meaning.
- WCAG AA contrast expectations are met in light and dark themes.

## Authenticated Playwright Verification

- Use authenticated Playwright verification for Home and App Shell.
- Required screenshots: 390px Vietnamese light, 390px Vietnamese dark, 440px English light, 440px English dark, and desktop constrained viewport.
- Required scenarios: empty, partial, ready, stale, loading, recoverable error, long text, long currency, keyboard, focus, and reduced motion.
- Use only `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` for credentials.
- Never print, persist, document, or commit credentials.

## Regression Protection

- `npm run typecheck` passes.
- `npm run lint` passes without new warnings.
- Focused Home/App Shell tests pass.
- No business rules, financial calculations, database schema, backend contracts, or routes are changed.
- No imports from retired legacy code are added.
- No package dependency is added unless explicitly unavoidable and documented.
