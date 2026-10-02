# Investment detail and actions verification

Updated 2026-10-02. One coherent holding-management flow: detail → buy / sell / valuation → review → existing recording action.

## Stitch sources

Project `16826760243481546078`, retrieved through Stitch MCP and downloaded with `curl -L`:

| Screen          | Stitch ID                        | Downloaded reference                 |
| --------------- | -------------------------------- | ------------------------------------ |
| Detail light    | a88d7b15c1d64880bf6484c1a844cb13 | `/tmp/vinha-detail-light.{html,png}` |
| Detail dark     | c90bc3cb8a7943ae894a11608a2ca5cb | `/tmp/vinha-detail-dark.{html,png}`  |
| Buy light       | f844c0c1417b42c5842b1754d08913bf | `/tmp/vinha-buy-light.{html,png}`    |
| Buy dark        | f8cf1bba9cf643ccac3e8dd668f19b80 | `/tmp/vinha-buy-dark.{html,png}`     |
| Sell light      | 0f00e9296e1f42498e32093b5678efb3 | `/tmp/vinha-sell-light.{html,png}`   |
| Valuation light | 00b35540ef36427383ee43c86953d368 | `/tmp/vinha-value-light.{html,png}`  |
| Valuation dark  | 99c1c510c84b4fd7adb317a9b9459ac5 | `/tmp/vinha-value-dark.{html,png}`   |

## Implementation

Neutral identity/value hero, privacy control, two-column holding facts, average cost through the existing historical preview, contextual actions, ownership/rules and real activity history. Forms retain HeroUI sheets, full-height scrolling, existing validation, fees, account selectors, quoted-currency behavior, review and confirmation.

Buy has exact quantity quick additions, explicit execution price, payment-account balance and the existing acquisition calculation for resulting quantity/average cost. Asset-fee trades do not display an incomplete purchase projection. Sell has exact 25% / 50% / 100% presets, MAX, proceeds, fees, realized result and remaining quantity. Valuation has the no-cash warning, unit-price adjustment shortcuts, date/notes and estimated value/PnL.

The design’s sample household names, allocations, minimum purchases, tax rates and external broker-order promises are not product capabilities and are not implemented. No API/database/authorization schema or command contract was changed. Automatic-pricing holdings still block manual valuation.

Two presentation defects were fixed: the server detail page no longer reads an enum through a client-module boundary, and a non-crypto trade no longer shows crypto controls merely because a different portfolio holding is crypto.

## Browser evidence and limits

Real Brave browser evidence is in `evidence/`. Detail, buy and sell were checked at 390px, 440px, 768px and 1280px in light/dark themes, with top and bottom captures. No document overflow; app and sheets remain centered and at most 440px wide. English buy has its own complete matrix. Keyboard activation, buy review, sell percentage preset, privacy masking and draft dismissal were exercised. No record or transaction was saved. Theme, viewport and reduced-motion overrides were restored after testing.

The tested DCDS holding uses automatic pricing. Its valuation route correctly displays the automatic-pricing guard; that state has a complete responsive/theme matrix. The editable manual valuation form is covered by component tests, but its real-browser verification is pending an existing manually priced holding. A clarification was requested; no data was seeded and no pricing rule was bypassed.

## Validation

- 45 focused tests passed across operation forms, operation previews, presentation, market valuation and UI polish.
- 14 read-only route authentication smoke tests passed in English/Vietnamese, including detail/buy/sell/valuation.
- Lint passed; investment files have no type errors. Typecheck retains two existing HomeTranslator errors in `home-streaming-sections.tsx` (99, 340).
- Full suite: 1,599 passed; five existing failures in message parity, account identity wrapping and credit-card tests missing an intl provider.
- Changed-file formatting and `git diff --check` passed. Repository-wide formatting still reports 222 existing unformatted files.
- Final refactor review: no new dependencies, raw colors, persisted display values, unsafe UI arithmetic or ad-hoc primary form controls. Quantity presets and purchase projection use the application/domain layer; new labels are in both locale files.
