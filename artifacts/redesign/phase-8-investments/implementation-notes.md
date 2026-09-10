# Phase 8 — Implementation notes

**Status:** Presentation implemented. Browser validation is incomplete (login hydration never enabled in this environment). Does not overwrite `.agents/design-system.md`. Next phase is Plan — not started.

## What this phase did

Make Investments read as **estimated current holdings/value**, not cash and not net worth, without changing domain rules.

- Portfolio hero is estimated market value (`FinancialNumberKind.ESTIMATE`)
- Missing valuation renders “No price yet” / “Chưa có giá”, never ₫0
- Position cards are scan-first: identity + estimated value, footer for PnL / quantity / freshness
- Convert stays the existing mutation, moved to the holdings header as a 44px section pill
- Active/Closed tabs reflect the existing view-model split

## Files changed

- `app/[locale]/(product)/money/investments/investment-overview-client.tsx`
- `app/[locale]/(product)/money/investments/investment-position-row.tsx`
- `app/[locale]/(product)/money/investments/investment-detail-hero.tsx`
- `app/[locale]/(product)/money/investments/[id]/page.tsx`
- `app/[locale]/(product)/money/investments/investment-valuation-meta.tsx`
- `modules/investments/application/investment-constants.ts` (`InvestmentHoldingsTab`)
- `messages/en/money.json` / `messages/vi/money.json`
- `tests/unit/phase-8-investments-presentation.test.tsx` (new)
- `tests/unit/investment-ui-polish.test.tsx`
- `tests/unit/hero-pill-link.test.tsx`

Not changed: queries, commands, schemas, valuation/price math, create/convert/buy/sell payloads, Money hub, Home, routing.

## Shared components reused

`TopAppBar`, `Page`, `Card`, `Amount`, `FinancialValue`, `FinancialNumberKind`, `FinancialOwnershipBadge`, `FinancialPrivacyToggle`, `StatusBadge`, `StatusAlert`, `EmptyState`, `FilterChip`, `FloatingAction`, `AppIcon`, `IconContainer`, `MotionReveal`, existing Sheets / opening wizard / operation pages.

## Local pieces

No new shared financial-number primitive.

- `investment-position-row.tsx` — interactive/soft card + divided footer
- `investment-detail-hero.tsx` — estimate-only hero; unavailable copy is not an `Amount`
- `investment-overview-client.tsx` — S5 hub composition
- `InvestmentHoldingsTab` — UI tab ids for the existing active/closed split

## Presentation-only decisions

- Sort missing `currentValue` last **without** coercing null to 0.
- Do not wrap unavailable/freshness copy in `FinancialValue`.
- Do not zero-fill `estimatedUnrealizedPnlPercent`.
- Always show Active/Closed tabs when the overview client renders (counts may be 0).
- Allocation chart stays a segmented strip (no Recharts, no decorative donut).
- Gold detail caption remains “Estimated liquidation value” (existing domain meaning).
- Create/convert/buy/sell forms were inspected and left as-is so payloads cannot drift.
- Convert is not a `HeroPillLink`; it uses the same off-hero bordered pill language as Savings manage-providers.

## Estimate semantics

| Field | Kind | Notes |
| --- | --- | --- |
| `totalCurrentValue` / `currentValue` | `FinancialNumberKind.ESTIMATE` | Null → unmasked “No price yet” |
| Remaining cost basis | recorded amount | Unavailable copy when null |
| Estimated PnL | estimate | Only when the read model has both value and basis |
| Realized / income | factual totals from activities | Genuine 0 is allowed |
| Unit/reference price | masked via `FinancialValue` on the badge quote | Freshness line is not masked |

`data-financial-object="investment"` marks investment surfaces, matching savings/loan/debt markers.

## Privacy

Reuse `InvestmentPrivacyToggle` → `FinancialPrivacyToggle`. Hero and position amounts mask through `FinancialValue`. Unavailable labels and freshness are not masked. Tests assert amounts are not copied into `aria-label`.

## i18n

EN/VI:

- Overview subtitle emphasizes estimated holdings, not cash
- Empty description: estimate, not cash in accounts
- Holdings hint: value / units / price (no implied advice)

Existing keys kept for “Estimated market value”, coverage, “No price yet”, Convert, Active/Closed.

## Tests

```bash
npx vitest run tests/unit/phase-8-investments-presentation.test.tsx tests/unit/investment-ui-polish.test.tsx tests/unit/hero-pill-link.test.tsx
```

Result: 26 passed.

## Typecheck / lint

- `npx tsc --noEmit` — pass
- ESLint on the touch set — pass
- Production build not run (no infrastructure change)

## Conflicts avoided

- Did not invent return %, CAGR, IRR, daily P&L, or advice copy
- Did not add Net Worth / Total Money / Free to Spend / Ready to Assign
- Did not change price APIs or update frequency
- Did not add a convert action beyond `InvestmentFormMode.CONVERSION`
- Did not add lifecycle tabs beyond the existing active/closed split
- Did not seed fake holdings for screenshots
