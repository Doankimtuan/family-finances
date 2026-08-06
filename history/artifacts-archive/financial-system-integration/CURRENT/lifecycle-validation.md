# Lifecycle Validation

## Result

PASS WITH RECOMMENDATIONS

Each domain has a coherent lifecycle. Cross-domain lifecycle continuity is strongest for Transactions, Planning, Inbox, Month Ritual, Savings, Cards, and Health. It needs contract hardening for account ownership changes and investment exits.

## Validated Master Lifecycle

```text
Income received
-> Transaction recorded
-> Account position updated
-> Planning allocation created
-> Expense, transfer, savings funding, loan repayment, card repayment, or investment contribution occurs
-> Category/Jar mapping or Inbox review clarifies meaning
-> Product domain updates its lifecycle
-> Month Ritual resolves stale attention and locks period
-> Health reads final and current state
```

## Product Lifecycle Continuity

| Lifecycle | Status | Notes |
| --- | --- | --- |
| Income -> allocation -> spending | Pass | BR-04 and BR-12 provide deterministic bridge. |
| Expense -> category -> jar decrement | Pass | Unmapped expense routes to typed Inbox. |
| Overspend -> emergency -> month reflection | Pass | Emergency declaration bypasses warning but remains visible and reviewed. |
| Refund -> restored jar capacity | Pass | BR-02 links refund and restores capacity. |
| Correction -> reversal -> correction | Pass | BR-03 preserves audit chain. |
| Savings funding -> maturity -> renewal/withdrawal | Pass | Savings defines ledger write and non-write cases clearly. |
| Loan disbursement/repayment -> completion | Pass with recommendation | Repayment fact split is clear; disbursement and informal repayment edge payloads should be explicit. |
| Card purchase -> statement -> repayment | Pass | Obligation and repayment distinction is clear. |
| Investment contribution -> valuation -> exit | Pass with recommendation | Unrealized value is separated from cash; partial exit and transfer-out events need exact source payloads. |
| Goal active -> completed/cancelled | Pass | Completion is intention, not proof of payment. |
| Month close -> Health snapshot | Pass | Health snapshot is read-only. |

## Determinism Gaps

- Death of family member, member departure, household split, and account ownership transfer are acknowledged as deferred or partially scoped.
- Moving abroad and multi-country changes are scalable but require future currency, country, and residency metadata contracts.
- Investment exits and proceeds require careful distinction among expected value, realized proceeds, fees, and settlement account posting.

## Lifecycle Recommendation

Create integration tests for full chained journeys:

- salary to jar to card purchase to repayment to month close;
- salary to savings to maturity to withdrawal to goal completion;
- emergency expense to emergency reallocation to partner visibility to month reflection;
- investment contribution to stale valuation to exit proceeds to Health.

