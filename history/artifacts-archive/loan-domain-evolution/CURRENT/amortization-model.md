# Amortization Model

## Purpose

Consumer-loan schedule generation for the Loan BC. Monthly rate convention **1A**:

`r = annualRatePct / 12 / 100`

Amounts are whole currency units (VND ints). Interest and principal per period use half-up rounding; the final period adjusts principal so `sum(principal_due) === P`.

**Repayment strategy** and **Interest strategy** are orthogonal axes.

## Repayment strategies

### Equal Monthly Payment (`fixed_monthly`)

Annuity / equal payment. Within each contiguous rate segment, PMT is recomputed from balance at segment start + remaining periods + that rate.

### Declining Balance (`reducing_balance`)

Equal principal slices via half-up `round(P / n)`; the final period takes the residual balance so `sum(principal_due) === P`. Interest each period is `round(remaining_balance × r)` at that period’s resolved rate (never recomputed on original principal after a rate change).

## Interest strategies

| Strategy | Storage | Rate timeline |
|----------|---------|---------------|
| Fixed (`fixed`) | single `annual_interest_rate` | one open period |
| Promo Fixed → Floating (`promo_fixed_to_floating`) | promo fields + switch date | promotional then floating periods |
| Floating (`floating`) | current rate + Edit Interest | append-only history |

Rate resolved per due date from `loan_interest_rate_periods` / engine `rateSegments`.

## Engine API

Pure module: `modules/ledger/application/loan-amortization.ts` (client-safe).

- `buildRateSegmentsFromStrategy`, `buildAmortizationSchedule` (rate segments)
- `simulateLoanPreview` — dual PMT for promo
- `recomputeUpcomingSchedule` — floating rate edits (paid rows untouched)

## Persistence

Full schedule on create via `create_loan_with_schedule` (+ rate periods JSON).  
`update_loan_interest_rate` closes open period, appends floating period, replaces **upcoming** schedule only.

## Explicit non-goals

Benchmark+margin UI, periodic review automation, balloon, grace, refinance, interest-only, Skip Payment, Card Installment.
