# Changes Log: Implementation 07 — Main App Shell Screens

## Modified Code Files

1. `shared/patterns/base-row.tsx`:
   - Updated `BaseRow` so when `isLink` is active, the `data-testid` is placed directly on `<Link data-testid={testId}>`, and when `isInteractive` is active with an action handler, on `<button data-testid={testId}>`.
   - Preserves exact selector contracts in existing test suites (`money-reality-hub.test.tsx`, `money-ia-privacy.test.tsx`).
2. `app/[locale]/(product)/home/home-product-summaries.tsx`:
   - Migrated custom `ProductRow` implementation to canonical `BaseRow`.
   - Cleaned up obsolete local CSS class names and unused icon imports.
3. `app/[locale]/(product)/money/money-module-section.tsx`:
   - Migrated custom module navigation link list to canonical `BaseRow` while preserving test IDs (`money-link-accounts`, `money-link-savings`, `money-link-investments`, `money-link-loans`, `money-link-debt`) and `data-financial-kind={FinancialNumberKind.CURRENT_STATE}`.
4. Top-level Shell & Layouts:
   - Verified canonical `ChromeShell` integration across `(product)` layouts with `BottomNavigation` and centered 440px viewport.

## Documentation Created

- `.agents/design-redesign/implementation/07-main-screens/README.md`
- `.agents/design-redesign/implementation/07-main-screens/existing-screen-audit.md`
- `.agents/design-redesign/implementation/07-main-screens/screen-component-map.md`
- `.agents/design-redesign/implementation/07-main-screens/data-contract.md`
- `.agents/design-redesign/implementation/07-main-screens/performance-review.md`
- `.agents/design-redesign/implementation/07-main-screens/visual-qa.md`
- `.agents/design-redesign/implementation/07-main-screens/qa.md`
- `.agents/design-redesign/implementation/07-main-screens/changes.md`
- Updated `.agents/design-redesign/handoff/screen-implementation-checklist.md`
