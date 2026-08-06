# CommandCode Handoff

## Objective

Implement the approved App Shell and Home blueprint.

## Required Inputs

Only:

- This blueprint package.
- Phase D files directly referenced by the blueprint.
- Phase E0 calibrated primitives.
- Relevant App Shell and Home source files.
- Directly relevant tests.

## Scope

- App Shell.
- Bottom navigation.
- Home.
- Home-owned lightweight interactions.
- Directly required shared primitives.
- Directly required tests.

## Prohibited Changes

- Business rules.
- Financial calculations.
- Database schema.
- Backend contracts.
- Routes.
- Five-tab IA.
- Unrelated modules.
- Money, Plan, Inbox, Together, Health, or Settings redesign.
- Package dependencies unless explicitly unavoidable.

## Implementation Sequence

1. Inspect current authenticated Home in the browser.
2. Capture baseline screenshots.
3. Read the canonical blueprint.
4. Map existing components to the blueprint.
5. Implement App Shell changes.
6. Implement Home hierarchy and states.
7. Reuse calibrated shared primitives.
8. Add only directly required components.
9. Run typecheck and lint.
10. Run focused tests.
11. Run authenticated Playwright verification.
12. Capture final screenshots.
13. Compare before and after.
14. Fix visible issues.
15. Stop.

## Required Verification

- 390px Vietnamese light.
- 390px Vietnamese dark.
- 440px English light.
- 440px English dark.
- Desktop constrained viewport.
- Empty.
- Partial.
- Ready.
- Stale.
- Loading.
- Recoverable error.
- Long text.
- Long currency.
- Keyboard.
- Focus.
- Reduced motion.

When a state cannot be safely produced, report the exact blocker.

## Credentials

Use only environment variables:

- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`

Never print, persist, document, or commit credentials.

## Completion Report

Require:

- Files changed.
- Components added.
- Components reused.
- Tests executed.
- Screenshots produced.
- Acceptance criteria status.
- Unresolved conditions.
- Prohibited areas confirmed untouched.
