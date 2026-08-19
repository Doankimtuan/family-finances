# ViNha Content Polish — Batch 1B

## Summary

Migrated the Investment presentation registry from localized display strings to typed i18n message keys. Updated the opening-position form, operation form/page, detail page, and overview client to resolve those keys through `next-intl` for both Vietnamese and English.

Also normalized the directly affected Vietnamese Investment copy from `Về Money` to `Về Tiền` and from `tuỳ` to `tùy`.

Asset-class behavior, financial calculations, routes, permissions, and operation semantics were preserved. No Investment screen redesign or broad wording rewrite was performed.

## Registry architecture

`investment-ux.ts` now owns asset-class configuration and typed message-key references only. `InvestmentUxMessageKey` restricts registry values to the existing Investment message tree and shared opening keys. Consumers resolve keys with their locale-scoped translator, so locale switching updates labels without changing the registry or business logic.

The registry preserves asset-specific terminology, including fund units/NAV, gold weight and buy-back pricing, stock shares, crypto BTC/USDT context, provider/custody labels, and bond/manual-asset wording.

## Keys added/reused

- 55 new Investment UX message keys were added to `messages/en/money.json`.
- The matching 55 keys were added to `messages/vi/money.json`.
- Six existing message keys were reused: `opening.assetClass.fund`, `opening.assetClass.gold`, `opening.historicalModeTitle`, `opening.purchaseModeTitle`, `opening.quantityLabel`, and `opening.unitLabel`. These cover eight former literal occurrences because `Số lượng` was shared across three asset classes.

## Hardcoded strings removed

All 68 user-facing literal occurrences previously owned by `investment-ux.ts` were removed. The file now contains message-key literals only; no user-facing Vietnamese or English copy remains there.

## Deferred content issues

- Preserve current Investment wording for the later Money → Investment content rewrite; this batch migrated meaning rather than polishing tone.
- Review phrases such as crypto “Spot” wording, generic bond/manual-asset copy, and asset-specific English labels during that later rewrite.
- Auth/System dedicated flow work remains deferred, including unrelated shared fallbacks in `shared/ui/form/auth-text-field.tsx` and `shared/patterns/error-state.tsx`.
- Broad module rewrites and the wider UX audit remain deferred.

## Regression verification

- Registry resolution covered all supported asset classes: Crypto, Stocks, Fund, Gold, and Bond.
- Locale resolution covered every registry presentation key in both Vietnamese and English.
- Investment unit tests covered typed registry resolution, opening-mode labels, buy validation/submission, fee-source switching, server-error presentation, operation view-model behavior, and domain foundations.
- The authenticated Playwright Investment smoke test was attempted, but the local Playwright web server timed out after 60 seconds. No browser assertions ran, so authenticated opening, sell, valuation, conversion, income, and visual viewport checks are not claimed here.

## Validation

- JSON parse: pass — all 44 locale JSON files parsed successfully.
- Namespace/key parity: pass — Vietnamese and English key sets matched with 0 mismatches.
- ICU/interpolation parity: pass — 0 argument mismatches across 3,000 paired leaf messages.
- Locale switching: pass — unit coverage resolved every supported asset-class registry key in both locales.
- Investment-focused tests: pass — 22 tests across five focused test files.
- Full unit tests: pass — 120 files, 901 tests.
- Lint: pass — `npm run lint`.
- Typecheck: pass — `npm run typecheck`.
- Build: pass — `npm run build`.
- Remaining hardcoded Investment presentation strings: 0 in `modules/investments/application/investment-ux.ts`; remaining unrelated Investment copy is outside this presentation registry and was not rewritten.
