# Business Rules

## Existing Rules Applied

### BR-01: Real Ledger Is Not Virtual Planning

Investments must never allow market value, unrealized gain, or household purpose to behave as jar capacity, goal progress, or available plan money by default.

### BR-24: Health Is Read-Only

Health may read investment context only. Health must not create, update, exit, write off, value, recommend, or otherwise mutate Investments.

## Clarified Rules

### INV-BR-001: Investment Is Not Cash

An investment holding is not cash. It may have estimated value, but that value becomes cash only through a real exit event and real money movement.

### INV-BR-002: Value Requires Freshness Context

Estimated value must carry valuation date when known. If date is unknown, the value is explicitly incomplete.

### INV-BR-003: Value Requires Source Context

Estimated value must identify source at household-understandable level when known: provider, statement, receipt, manual estimate, family update, market quote, or unknown.

### INV-BR-004: Contribution Is Not Return

Money contributed to an investment is not profit, income, or gain.

### INV-BR-005: Unrealized Gain/Loss Is Not Spendable

Unrealized gain/loss describes value change before exit. It must not be treated as real cash movement.

### INV-BR-006: Realized Outcome Requires Exit

Gain/loss becomes realized only after sale, redemption, repayment, surrender, transfer outcome, or write-off.

### INV-BR-007: Investment Income Is Investment Context

Dividends, coupons, and distributions may be investment income context, but real cash receipt remains a Transaction and must not be treated as ordinary salary by default.

### INV-BR-008: Liquidity Must Not Be Overstated

Investment value must not imply immediate availability unless cash proceeds are already realized or liquidity is clearly known.

### INV-BR-009: Risk Context Is Descriptive Only

Risk labels and leverage visibility must describe risk. They must not recommend action or optimize decisions.

### INV-BR-010: Ownership/Visibility Uncertainty Is Allowed

If ownership, partner visibility, or family control is unclear, the holding may remain Under Review rather than forcing false certainty.

### INV-BR-011: Private/Family Assets May Be Uncertain

Informal assets may be recognized with uncertainty. They must not be presented with false precision.

### INV-BR-012: History Survives Exit

Exited, written-off, transferred-out, or cancelled investments remain historically understandable until archived.

### INV-BR-013: No Investment Advice

The domain must not recommend buy, sell, hold, switch, rebalance, market timing, tax optimization, or crypto strategies.

### INV-BR-014: No Investment Automation

The domain must not automatically trade, rebalance, redeem, contribute, or move money.

### INV-BR-015: Reclassification Must Preserve Ownership Boundaries

If an item is reclassified to another domain, Investments must not keep owning facts that belong elsewhere.

## Derived Business Rules

- If holding identity is unknown, the holding cannot become Active.
- If a value has no date or source, it is less reliable than dated/source-known value.
- If exit proceeds are unknown, the holding remains Under Review or Impaired rather than Exited with false certainty.
- If active exposure remains after partial exit, the holding cannot be Archived.
