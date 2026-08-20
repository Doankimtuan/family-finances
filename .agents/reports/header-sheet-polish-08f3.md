# ViNha UI Polish — 08F.3

## Summary

Implemented the shared sheet footer spacing, compact account actions, shared product-header reuse, Money header cleanup, Home identity mark, and Allocation section hierarchy. Calculations, routes, Transactions, and Account Detail IA were not changed.

## Shared sheet footer fix

`ActionSheetLayout.Footer` now owns the shared horizontal padding, top separation, sticky positioning, and ordinary bottom breathing room:

```css
padding-bottom: calc(
  var(--sheet-footer-space) + env(safe-area-inset-bottom, 0px)
);
```

The spacing is tokenized as `--sheet-footer-space: var(--space-4)`. No feature-local footer workaround was added.

## Manage Account actions

Manage mode now renders compact flat action rows. Edit stays neutral; Archive uses the existing destructive icon/text treatment. Both rows include a leading action icon, trailing forward affordance, and shared Button hit-area behavior. Edit mode keeps the existing Cancel/Primary footer contract.

## Product header system

The existing `TopAppBar` composition remains the shared header system. Money and Home use its compact primary variant; existing contextual, detail, and form consumers remain on their current variants.

## Money header

Money no longer uses the marketing-style headline/subtitle/icon header. It now shows a compact title plus the short account metadata line. The removed marketing keys were deleted from both locale catalogs; the Vietnamese product title is `Tiền`.

## Home app identity mark

Home now places the existing `BrandMark` in the shared header trailing slot. It uses the decorative mark variant, which is aria-hidden and non-focusable, and is present in both page and loading compositions.

## Allocation hierarchy

“Tiền đang ở đâu” is now rendered as a subordinate `h2` treatment while retaining the existing family-tone allocation strip. No allocation calculation or data-shaping logic changed.

## Browser evidence

The local server was reachable at `http://127.0.0.1:3000`. Playwright attempted the protected Money route at the required mobile widths, but the route redirected to `/en/login` because this environment has no authenticated fixture/session:

- [390px auth redirect](../../output/playwright/header-sheet-polish-08f3/auth-redirect-390.png)
- [440px auth redirect](../../output/playwright/header-sheet-polish-08f3/auth-redirect-440.png)
- [768px auth redirect](../../output/playwright/header-sheet-polish-08f3/auth-redirect-768.png)
- [1280px auth redirect](../../output/playwright/header-sheet-polish-08f3/auth-redirect-1280.png)

Authenticated feature screenshots, sheet interaction checks, and computed footer spacing at 390/440px could not be captured. The 768px and 1280px authenticated checks are likewise fixture-blocked.

## Validation

- Focused polish/account/i18n tests: 4 files, 14 tests passed.
- Full test suite: 128 files, 944 tests passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- `npm run format:check`: pre-existing repo-wide failure; 2,208 files are reported by the repository check, including unrelated archive, skill, and existing source files.

## Final verdict

HEADER/SHEET POLISH COMPLETE WITH FIXTURE GAPS
