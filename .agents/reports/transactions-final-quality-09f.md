# ViNha Transactions Track — 09F Final Quality Gate

Date: 2026-08-20

## Final verdict

**TRANSACTIONS P0 GATE PASS**

**TRANSACTIONS REFERENCE READY**

The previously documented 09P0.1 remote financial-integrity gate remains the
source of truth for database/RPC ownership and classification verification.
This pass found and corrected two visible Vietnamese terminology regressions;
no broader Transactions redesign was needed.

## Authenticated fixture

- `.env.local` was loaded without printing credential values.
- `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` were present.
- Login was attempted through the running app and succeeded.
- Authenticated fixture reached `/vi/home` and `/vi/money/transactions`.

## Confirmed fixes

- Vietnamese semantic filter/activity labels consistently use `Chuyển tiền`.
- Transaction detail labels the stored event date as `Ngày hiệu lực`.
- Compact credit-card account options include `Thẻ tín dụng` metadata.
- Added regression coverage for explicit compact credit-card identity.

## Shared ActionSheet regression

`ActionSheetLayout` remains the only feature-facing owner of sheet body/footer
clearance:

- body: scroll owner with `64px` bottom clearance;
- footer: sticky with `16px` ordinary bottom breathing room;
- safe-area inset is added in the shared primitive;
- no feature-level `env(safe-area-inset-bottom)` or footer spacer remains.

Authenticated 390px checks passed for:

- Transaction Tag selector;
- Account Edit;
- Pay Card;
- Convert Installment.

Each reported `overflow-y: auto`, sticky footer positioning, `64px` body
clearance, `16px` footer padding, and no horizontal overflow.

## Transactions runtime review

- Populated Vietnamese list rendered grouped date headings and flat rows.
- Income, Expense, and Transfer semantic filters were exercised.
- Income showed only income fixture events; Transfer showed a truthful empty
  state for the fixture.
- Amount signs/tone remained semantic rather than inferred from magnitude.
- Row subtitles added account context without repeating the primary meaning.
- Create form had no empty preview, no `Số dương theo VND`, no `Select an item`,
  and showed the actual account consequence after amount entry.
- Credit-card purchase copy remained product-aware.
- Detail remained flat, privacy-safe, and free of implementation terminology.
- Tag sheet retained search only when active tags exist and used shared sheet
  clearance.

## Responsive, theme, and motion evidence

Authenticated Chromium evidence was captured under:

`output/playwright/transactions-final-09f/`

The populated list was checked at 390, 440, 768, and 1280px with no horizontal
overflow. Screenshots were captured for the four widths plus the Vietnamese
create flow. Reduced-motion Chromium rendering was also checked; content stayed
immediate and stable with no overflow.

The existing shared motion policy remains the owner. No animated financial
values, list stagger, scroll reveal, parallax, or new motion dependency was
introduced.

## Validation

Passed:

- `npm run lint`
- `npm run typecheck`
- `npm run test` — 130 files / 975 tests
- `npm run build`
- changed-file Prettier check
- `git diff --check`
- authenticated Chromium checks at required widths

The repository-wide `npm run format:check` baseline remains non-zero because
the dirty worktree contains thousands of pre-existing formatting violations in
unrelated files. Those files were not reformatted.

Existing test stderr consists of known HeroUI PressResponder and fail-closed
Supabase mock warnings; no test failed.

## Deliberate non-work

No new module, UI library, motion system, desktop layout, analytics surface,
daily subtotal, or Transactions redesign was started. This is the final gate.
