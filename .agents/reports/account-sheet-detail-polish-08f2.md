# ViNha Money Track — 08F.2 Account Sheet & Detail Composition Polish

## Summary

Implemented the Account-only composition pass without changing Money Hub,
Credit Card Detail behavior, Transactions, routes, commands, calculations,
privacy, or opening-balance semantics.

- Added one reusable `ActionSheetLayout` composition contract.
- Migrated Account Create and Account Manage/Edit to that contract.
- Made Edit a direct sheet mode with one current title and a shared footer.
- Integrated ownership into the normal Account Detail identity region.
- Suppressed duplicate account type text at presentation time.
- Removed the single-item Quick Actions heading.
- Kept recent activity as flat `TransactionRow` event rows.

## Shared sheet architecture

`shared/patterns/action-sheet-layout.tsx` provides compositional `Header`,
`Body`, and `Footer` slots. `SheetContent` remains the only surface owner and
continues to own the HeroUI Drawer handle, max height, and overflow boundary.

Composition was chosen over a HOC because the Account consumers need explicit
header/body/footer order and no injected behavior. The contract is small enough
to reuse for future long-form sheets without creating a configurable form
framework.

## Safe area / footer

`ActionSheetLayout.Footer` owns sticky positioning, tonal separation, and the
single safe-area rule:

```css
padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom));
```

`SheetActionFooter` now consumes this shared footer slot. Account files do not
own bottom-padding or safe-area calculations.

## Create

Create Account now uses `ActionSheetLayout.Header`, `Body`, and the shared
`SheetActionFooter`. The form body scrolls independently while Cancel/Add stay
reachable. Conditional credit-card fields, RHF/Zod validation, and opening
balance semantics remain unchanged.

The receipt presentation also uses the shared scroll-body contract.

## Manage / Edit

Before:

```text
Manage title
└── sheet body
    └── edit/archive actions
        └── bordered edit form
```

After:

```text
Manage title
└── flat action rows

Edit title
└── scrolling edit fields
└── shared sticky Cancel / Save footer
```

Mode is owned by `AccountDetailManagement`. Edit Cancel returns to Manage and
resets the form; reopening Edit resets from persisted props. Closing the sheet
also returns to Manage. No nested sheet or card-in-card composition remains.

## Account Detail

Normal Account Detail now gives the hero ownership metadata in the identity
region, uses the account name as the strongest identity text, and only renders
the localized type when it differs from the account name. The page header keeps
back navigation, the account title, and management action without repeating the
hero type.

The hero’s internal balance spacing was reduced modestly while retaining the
large privacy-aware balance treatment and 44px interaction contracts. The sole
`Add transaction` action is rendered directly after the hero; the redundant
single-item Quick Actions heading is gone.

## Recent activity

Account Detail continues to use the shared `TransactionRow` event archetype:
flat rows, quiet leading icons, divider grouping, right-aligned signed amounts,
and preserved transaction links. Activity rows are not wrapped in bounded
financial-object cards.

## Accessibility

- HeroUI Drawer semantics, focus trapping, Escape handling, and return focus
  remain owned by the existing sheet primitive.
- Header/body/footer order follows visual and keyboard order.
- Shared footer controls retain minimum 44px targets and visible focus styles.
- Account ownership remains textual and available to assistive technology.
- Edit labels, validation, RHF field wiring, and action order are preserved.
- Financial privacy continues to use the existing `Balance`, `FinancialValue`,
  and privacy provider paths.

## Responsive/theme

The authenticated fixture was checked at 390px, 440px, 768px, and 1280px. The
constrained product shell remained 440px at wider viewports and no horizontal
overflow was observed. Create, Manage, Edit, and normal Account Detail were
checked in both light and dark themes at 390px. No motion architecture was
changed.

## Browser evidence

Captured under `output/playwright/account-polish-08f2/`:

- `en-create-account-390-dark.png`
- `en-manage-account-390-dark.png`
- `en-edit-account-390-dark.png`
- `en-account-detail-390-dark.png`
- `en-account-detail-440-dark.png`
- `en-account-detail-768-dark.png`
- `en-account-detail-1280-dark.png`
- `vi-create-account-390-dark.png`
- `vi-manage-account-390-dark.png`
- `vi-edit-account-390-dark.png`
- `vi-account-detail-390-dark.png`
- `vi-create-account-390-light.png`
- `vi-manage-account-390-light.png`
- `vi-edit-account-390-light.png`
- `vi-account-detail-390-light.png`

The repository Playwright Account Detail spec was run separately; its four
credential-gated cases were skipped because `E2E_USER_EMAIL` and
`E2E_USER_PASSWORD` were not configured. The authenticated in-app browser
fixture was available and supplied the evidence above without submitting any
financial mutation.

## Validation

- Focused Account sheet/detail tests: passed — 8 tests.
- Full unit suite: passed — 127 files, 941 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; 94 routes generated.
- Targeted Prettier check: passed for all changed implementation, test, and
  report files.
- Account Detail Playwright spec: 4 credential-gated cases skipped; manual
  authenticated browser verification passed at required widths.

## Final verdict

ACCOUNT SHEET/DETAIL POLISH COMPLETE
