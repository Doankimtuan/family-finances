# Modified Features

These capabilities are valid but require scope modification before any implementation phase.

## INV-PD-002 Investment Account Recognition

Original idea:

- Track where investment assets are held.

Required modification:

- Treat provider/account location as lightweight recognition context, not mandatory setup depth.

Reason:

- Young households may have incomplete provider details.

Expected result:

- Users can recognize holdings without heavy onboarding burden.

## INV-PD-004 Broad Asset-Class Classification

Original idea:

- Classify all investment assets.

Required modification:

- Keep categories broad and household-understandable until Vietnam-first terms are tested.

Reason:

- Overly detailed taxonomy is over-engineered and may confuse users.

Expected result:

- Clear enough classification without professional-investor complexity.

## INV-PD-005 Quantity Or Units

Original idea:

- Track exact units for every investment.

Required modification:

- Support household-level accuracy; do not require exact units for informal or physical assets in future design.

Reason:

- Gold, family investments, and private assets may not have clean unit data.

Expected result:

- Better real-world fit for imperfect household records.

## INV-PD-007 Cost Basis

Original idea:

- Track acquisition cost.

Required modification:

- Treat as household cost context, not tax-lot precision.

Reason:

- Tax-level precision is complex and not validated for target users.

Expected result:

- Users can understand gain/loss without tax-engine complexity.

## INV-PD-008 Estimated Current Value

Original idea:

- Show current investment value.

Required modification:

- Always preserve estimated/dated/non-cash interpretation.

Reason:

- Phase 2 shows users may treat market value as available cash.

Expected result:

- Value is useful without becoming financially misleading.

## INV-PD-010 Valuation Source

Original idea:

- Track detailed provenance of value.

Required modification:

- Keep source simple: provider, statement, receipt, manual, family update, or unknown.

Reason:

- Deep provenance is maintenance-heavy and not necessary for household clarity.

Expected result:

- Users know how trustworthy a value might be.

## INV-PD-011 Unrealized Gain/Loss

Original idea:

- Show value change before sale.

Required modification:

- Frame as not-yet-realized and not spendable.

Reason:

- Avoid false affordability and trading-style excitement.

Expected result:

- Users can understand direction without mistaking it for cash.

## INV-PD-013 Investment Income

Original idea:

- Track dividends, coupons, and distributions.

Required modification:

- Treat as investment context tied to real cash movement, not ordinary salary-like income by default.

Reason:

- Prevents income distortion and category confusion.

Expected result:

- Investment income remains explainable.

## INV-PD-015 Liquidity Distinction

Original idea:

- Model investment liquidity.

Required modification:

- Keep simple: easy, delayed, restricted, uncertain, or unknown; avoid advice-like scoring.

Reason:

- Liquidity matters, but precise scoring may mislead.

Expected result:

- Households understand whether value can become cash without false certainty.

## INV-PD-016 Ownership And Household Visibility

Original idea:

- Track owner, controller, and visibility.

Required modification:

- Treat as sensitive household context requiring privacy/trust validation.

Reason:

- Investments can reveal private risk-taking and losses.

Expected result:

- Future design can protect trust rather than create surveillance.

## INV-PD-022 Manual Valuation Confidence

Original idea:

- Indicate uncertainty for manually valued assets.

Required modification:

- Keep confidence language simple and non-punitive.

Reason:

- Users may avoid tracking if uncertainty feels like failure.

Expected result:

- Informal values are useful but not over-trusted.

## INV-PD-027 Margin And Leverage Visibility

Original idea:

- Represent margin or borrowed investment exposure.

Required modification:

- Approve only risk visibility; reject any leverage enablement, optimization, or encouragement.

Reason:

- Financial safety requires warning-level awareness, not trading support.

Expected result:

- Household can identify borrowed-risk exposure without product encouragement.

## INV-PD-028 Risk Labels

Original idea:

- Label risk.

Required modification:

- Use descriptive risk context, not personalized advice.

Reason:

- Financial-risk language can become advice-like.

Expected result:

- Users understand uncertainty while remaining decision owners.

## INV-PD-030 Household Purpose Note

Original idea:

- Record why an investment exists.

Required modification:

- Keep as optional context; do not let it replace Goals or Planning.

Reason:

- Purpose is meaning, not proof of allocation or guarantee.

Expected result:

- Household memory improves without BR-01 confusion.

## INV-PD-039 Private/Family Investment Tracking

Original idea:

- Track informal/private/family investments.

Required modification:

- Emphasize uncertainty, manual verification, and household context.

Reason:

- These assets are common enough to matter but often unverifiable.

Expected result:

- Family assets can be acknowledged without false precision.

## INV-PD-041 Investment Health Signals

Original idea:

- Let Health interpret investment exposure.

Required modification:

- Health may only read and summarize; no mutation, advice, or decision automation.

Reason:

- Protects BR-24 and financial safety.

Expected result:

- Investment exposure can inform health without Health owning investments.

## Modified Count

Approved with modifications: 16.
