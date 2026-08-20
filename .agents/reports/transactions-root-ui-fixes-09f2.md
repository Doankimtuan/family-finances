# ViNha Transactions Track — 09F.2

## A. Final verdict

**TRANSACTIONS ROOT UI FIXES COMPLETE**

## B. Authenticated fixture

- `.env.local` loaded: yes.
- `E2E_USER_EMAIL` found: yes.
- `E2E_USER_PASSWORD` found: yes.
- Login attempted with environment values only: yes.
- Login succeeded: yes.
- Authenticated route reached: `/en/home`; household fixture available.

## C. Shared ActionSheet root cause

The shared `ActionSheetLayout` already had a footer token, but several direct `SheetContent` consumers still used local `Sheet.Header`, `Sheet.Body`, and `Sheet.Footer` markup. Those local footers used `max(env(safe-area-inset-bottom), ...)`, while the shared body had no footer-height scroll-end clearance. The result was inconsistent bottom breathing room and a repeatable overlap risk.

## D. Shared ActionSheet fix

`ActionSheetLayout` is now the canonical composition for the remaining direct product-sheet consumers. The shared footer owns ordinary bottom space plus the safe-area inset through `--sheet-footer-space`; the shared body owns scroll-end clearance through `--sheet-footer-clearance` plus the same inset. Feature screens do not calculate device insets or add bottom spacers.

## E. Sheet regression consumers

Migrated direct consumers include Transaction Tag selector/management, savings renewal/settlement, debt create/payment, and savings catalog editors. Existing Account Manage/Edit, Pay Card, and Convert Installment flows already use the same layout. Authenticated Chromium also verified Tag Selector and Account Edit at 390px: footer padding `16px`, sticky footer, body padding-bottom `64px`, and body overflow `auto`.

## F. Create Transaction redesign

Before: a tinted amount card, long helper copy, full-height account control, always-mounted empty preview, and stacked full-width actions.

After: open baseline amount composition, currency in the label, compact required-first groups, adaptive account control, preview mounted only when amount/account are valid, and a shared horizontal action row.

## G. Account selector

Accounts at or below the four-account compact threshold use two-column shared `ChoiceTile` controls. Larger sets fall back to the shared `SelectField`. Credit-card selection uses the card icon and a quiet helper below the control instead of a paragraph inside the tile.

## H. Save/Cancel action design

The create form now uses `BottomActionBarLayout.SPLIT`: Cancel is the quiet secondary action and Save is the wider primary action. Both retain the shared 44px target and shell safe-area behavior.

## I. Tags/filter

The redundant More filters / Apply step was removed. The Tag selector is now a compact secondary filter control, and confirming a tag selection applies the URL filter immediately. Manage Tags remains a quiet destination link.

## J. Tag sheet

Search is rendered only when an active tag exists. Empty and archived-only states now explain the actual state and offer Create Tag plus the supported Manage Tags destination where relevant. The Tag sheet uses the canonical ActionSheet layout and has no feature-local bottom padding.

## K. Transaction Detail

The existing 09F detail corrections remain in place: flat information rows, no academic/internal headings, no empty Note row, compact tag editing with direct persistence on Done, integrated product facts, standard top back navigation, and no Delete action.

## L. Semantic amount presentation

The existing shared semantic tone work remains in place: true income and expense are differentiated, refunds use the refund tone, transfers are neutral, and product/principal movements remain neutral rather than being colored as income or expense.

## M. Row deduplication

Transaction subtitles keep distinct context without repeating the row title/category. Authenticated list evidence shows category/title followed by account context rather than duplicated activity labels.

## N. Privacy/accessibility

No credentials or tokens were written to source, reports, or screenshots. Shared form controls remain HeroUI/RHF-compatible, labels stay associated, action targets remain at least 44px, and no horizontal overflow was observed at 390, 440, 768, or 1280px.

## O. Browser evidence

Authenticated private-screen screenshots:

- `output/playwright/transactions-root-fixes-09f2/vi-tag-sheet-390-dark.png`
- `output/playwright/transactions-root-fixes-09f2/vi-tag-sheet-bottom-spacing-390-dark.png`
- `output/playwright/transactions-root-fixes-09f2/vi-transactions-list-390-dark.png`
- `output/playwright/transactions-root-fixes-09f2/vi-create-top-390-dark.png`
- `output/playwright/transactions-root-fixes-09f2/vi-create-account-selector-390-dark.png`
- `output/playwright/transactions-root-fixes-09f2/vi-create-bottom-390-dark.png`
- `output/playwright/transactions-root-fixes-09f2/vi-transaction-detail-390-dark.png`
- `output/playwright/transactions-root-fixes-09f2/vi-transaction-detail-tags-390-dark.png`
- `output/playwright/transactions-root-fixes-09f2/en-transactions-list-440-light.png`
- `output/playwright/transactions-root-fixes-09f2/vi-account-edit-sheet-390-dark.png`

The shared sheet was also checked at 440, 768, and 1280px in authenticated Chromium. All four widths reported `16px` footer bottom padding, `64px` body clearance, sticky footer positioning, `auto` body overflow, and no horizontal overflow.

## P. Tests

- Focused UI/semantic tests: 56 passed.
- Added coverage for shared sheet body clearance, conditional create preview, split actions, true empty tags, and archived-only tags.

## Q. Validation

Required repository validation is run after the final patch:

- `npm run lint`
- `npm run typecheck`
- `npm run test` — 130 files / 974 tests passed.
- `npm run build`
- changed-file Prettier check — passed.
- `git diff --check`
- authenticated Chromium verification

The repository-wide `npm run format:check` was also attempted. It reports 2,211 pre-existing formatting violations across unrelated dirty files; those files were not reformatted or otherwise changed.

## R. Remaining issues

No known 09F.2 functional or visual blockers remain. The local auth redirect is occasionally slow, so the browser verifier waits for the settled route and retries without exposing credential values.
