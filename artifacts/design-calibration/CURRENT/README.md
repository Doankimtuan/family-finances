# Design Calibration - Current

Phase E0 validates the Phase D design system against three representative ViNha product surfaces.

## Selected Reference Surfaces

1. Home overview: `/home`
2. Money activity surface: `/money` and its canonical activity list `/money/transactions`
3. Daily money capture flow: `/money/transactions/new`

The Money activity surface is treated as one reference because the hub owns the summary entry point and the transactions route owns the dense list behavior.

## Phase D Conditions Checklist

- Shared primitives promoted only when needed: resolved with `Page`, `Section`, and `BottomActionBar`.
- Token aliases for debt, investment, planning: not needed for these surfaces.
- Browser verification at 440px, light/dark, English/Vietnamese: partially demonstrated through route and auth shell verification; authenticated product states remain blocked by missing E2E credentials.
- Phase B, Phase C, and frozen business rules remain higher authority: preserved.

## Implementation Summary

- Added `Page`, `Section`, and `BottomActionBar` in `shared/patterns`.
- Applied shared page rhythm to Home, Money, transactions list, and capture.
- Added a compact capture preview and sticky bottom action bar.
- Moved transaction amount prefixes to `modules/ledger/application/ledger-constants.ts`.
- Fixed Tailwind source scanning by excluding `history/` from app CSS compilation.
- Moved Money "more" row icon into a client component to avoid server/runtime icon import failure.

## Verification Summary

- `npm run typecheck`: passed.
- `npm run lint`: passed with two existing warnings unrelated to this work.
- Focused Playwright smoke specs: 6 passed, 4 skipped due missing E2E credentials.
- Playwright CLI browser snapshots confirmed protected routes redirect to login at 390px and 440px, English and Vietnamese, including dark-mode login shell.

Final verdict: `DESIGN_CALIBRATED_WITH_REMAINING_CONDITIONS`.

