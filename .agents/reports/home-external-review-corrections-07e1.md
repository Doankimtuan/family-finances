# ViNha Home — External Review Corrections 07E.1

## Summary

Accepted and implemented the focused corrections that materially improve Home:

- Removed the duplicated Net cash flow presentation from This period.
- Added reusable, persisted financial-value privacy masking.
- Added 12% chart Y-axis headroom.
- Added a dashed Expense series and matching line samples beside the existing
  Income / Expense labels.
- Reused the existing Inbox `UNMAPPED_EXPENSE` review capability for truthful
  Uncategorized attention.
- Strengthened the existing transaction CTA wording to `Add transaction` /
  `Thêm giao dịch`.
- Reduced vertical cost by removing the visible duplicate Net block and making
  the chart summary screen-reader-only while preserving its accessible
  description.

No Home IA, route, calculation, transfer/refund classification, or motion
model was redesigned.

## Rejected/deferred feedback

Not implemented in 07E.1:

- Bento Grid at desktop/tablet widths.
- Responsive multi-column dashboard.
- Personal vs Household context switcher.
- Recent-member avatar on Home.
- AI-generated smart insights.
- Three-action Income / Expense / Transfer bar.
- FAB redesign.
- Detailed or segmented Jar progress on Home.
- Category rainbow palette.
- Renaming the branded Together navigation label.
- Hiding financially important definitions exclusively inside tooltips.

These remain deferred because they are new product decisions, conflict with
the current product constitution, or belong to later modules.

## Net duplication

Before: the Hero showed selected-period Net cash flow and This period repeated
Net as a third analytics summary value.

After: This period contains only Income and Expense summaries plus the chart.
The Hero remains the one primary Home Net presentation, and the data model
still computes `net = income - expense` unchanged.

## Financial privacy

`FinancialPrivacyProvider` uses the existing client-provider boundary and
`localStorage` with the shared key `vinha.financial-values-hidden`. The
preference uses `useSyncExternalStore`, persists across navigation and app
reopen when storage is available, and reacts to storage changes.

`FinancialValue` is the reusable masking primitive. Shared `Balance` and
`Amount` now use it, and Home applies it to balance, Net, Income, Expense,
spending amounts, spending insight amounts, tooltips, and the accessible chart
table. Hidden values render a stable `••••••` representation; the raw amount is
not present in the masked DOM/accessibility output. Percentages and counts stay
visible.

The Home control is a 44px+ shared IconButton using AppIcon with Eye / EyeOff
icons. Its localized accessible name changes between `Hide financial values` /
`Show financial values` and `Ẩn số tiền` / `Hiện số tiền`, and it exposes the
current state with `aria-pressed`.

## Chart

The chart domain is configured from its real point values. The upper bound is
12% above the maximum, while zero-only and negative-supported data retain a
valid lower bound. Underlying values, tooltips, and the point-by-point
accessible table are unchanged apart from privacy masking.

Income remains solid. Expense uses the restrained `5 4` dash pattern, and the
existing summary labels now include matching semantic line samples. No second
large legend was added.

## Uncategorized

No new threshold was invented. The authoritative existing policy is the Inbox
`UNMAPPED_EXPENSE` review item used by Plan/Home review logic. Home exposes a
compact `Review in Inbox` / `Xem lại trong Hộp thư` link only when the current
spending data has a non-zero Uncategorized amount and an open
`UNMAPPED_EXPENSE` destination exists. Otherwise the row stays neutral.

## Transaction CTA

`MONEY_ADD` already opens the existing capture screen with Expense, Income, and
Transfer choices. Home therefore now says `Add transaction` /
`Thêm giao dịch` when an account exists, using the existing button hierarchy.
Day-zero behavior is unchanged: no account means the action remains
`Add an account` /
`Thêm tài khoản`, and no transaction CTA is shown.

## Vertical density

- Removed the duplicate Net summary block from This period.
- Kept the chart’s accessible summary but removed its repeated visible caption.
- Preserved the useful transfer/refund explanation and spending period context.
- No global spacing change or meaningful information removal was made.

## Accessibility

Focused component coverage verifies:

- Home balance is visible by default.
- Privacy toggle state and accessible name change correctly.
- Masked output does not expose the raw amount.
- Persisted privacy state is restored after remount.
- Chart data remains available through its semantic table.
- Expense’s non-color line distinction is present through the chart config and
  adjacent summary sample.
- Net is absent from the period analytics summary.

Existing 07E accessibility semantics were preserved: chart label,
`aria-describedby`, `aria-details`, locale-aware dates, and point-by-point
table structure remain in place.

## Responsive/theme/locale

Authenticated populated Home verification at 390px, 440px, 768px, 1280px,
both locales, both themes, Month/Quarter, privacy states, and reduced motion
could not be performed in this checkout because E2E credentials were not
configured. The browser smoke did verify the unauthenticated `/en/home` →
`/en/login` boundary. No authenticated evidence is claimed here.

## Validation

- Focused Home/privacy tests: passed — 11 tests.
- Full unit suite: passed — 123 files, 922 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `E2E_PORT=3000 npm run test:e2e:smoke`: passed — 5 passed, 2 credential-gated
  tests skipped.
- Targeted changed-file Prettier check: passed after formatting.
- Repository-wide `npm run format:check`: reports a large pre-existing set of
  formatting warnings in archived artifacts, skills, and unrelated files; no
  new production-code formatting warning remains in the changed set.

The requested `home-final-quality-07e.md` report was not present in the
checkout; the available 06, 07A, 07B, 07C.1, and 07D reports were reviewed.
