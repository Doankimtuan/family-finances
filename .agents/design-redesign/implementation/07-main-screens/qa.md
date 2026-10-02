# QA Report: Implementation 07 — Main App Shell Screens

## Summary of Test & Verification Results

- **TypeScript**: `npm run typecheck` passed with 0 errors.
- **ESLint**: `npm run lint` passed with 0 errors.
- **Unit & Integration Tests**:
  - `home-*`: 13/13 PASS.
  - `money-*`: 18/18 PASS.
  - `plan-*` & `phase-9-plan-*`: 13/13 PASS.
  - `inbox-*` & `phase-12-inbox-*`: 113/113 PASS.
  - `together-*` & `phase-13-together-*`: 47/47 PASS.
  - **Total Target Unit Test Suite**: 58 test files, 427 tests, 100% PASS (0 failures).
- **Next.js Production Build**: `npm run build` compiled 103 routes with Turbopack, 100% SUCCESS.

## Regression Checks

1. **Financial Semantics**:
   - `Transfer ≠ Income`, `Transfer ≠ Expense`, `Opening Balance ≠ Income` preserved in Home Cash Flow chart calculations.
   - Credit card limits and liability styling preserved in Money.
   - `Jar ≠ Account`, `Planned ≠ Spent` preserved in Plan.
   - Zero new domain formulas introduced in presentation components.
2. **Navigation & App Shell**:
   - Centered 440px viewport shell container active across all 5 screens.
   - BottomNavigation with active pill indicator, semantic labels, and icons.
   - Add Transaction floating action button present with proper safe-area padding.
3. **i18n & Locales**:
   - Both Vietnamese (`vi`) and English (`en`) supported via next-intl catalogs.
   - Zero hardcoded production strings introduced.
4. **Theme Parity**:
   - Light and Dark modes use semantic tokens (`surface-canvas`, `surface-card`, `border-subtle`, `text-primary`, `text-muted`).
