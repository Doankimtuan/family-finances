# Financial Confirmation Model

## Levels

| Level | Use for | Behavior |
|---|---|---|
| No confirmation | Harmless, reversible, non-financial UI changes. | Save or apply with unobtrusive feedback. |
| Lightweight confirmation | Meaningful but recoverable changes. | Short confirm sheet/dialog naming what changes. |
| Preview and confirm | Real money movement, irreversible/destructive action, closed-period change, partner-visible authority change, or domain contract risk. | Preview consequence, require explicit confirm, show receipt. |

## Preview and Confirm Must Show

- What will happen.
- Money source.
- Money destination.
- Amount.
- Fees, tax, interest, penalty, or uncertainty where relevant.
- Effective date.
- Reversibility.
- Related records created.
- Domain owner of resulting records.

## Required Preview-Confirm Actions

- Transfer between accounts.
- Refund transaction.
- Correct transaction.
- Create account with opening balance posting.
- Archive account with dependencies.
- Record card payment.
- Create loan when it posts or represents obligation.
- Record loan payment or early payoff.
- Update loan future interest when schedule changes.
- Close/archive loan.
- Create/fund savings.
- Savings maturity renewal/withdrawal/change package.
- Early withdrawal.
- Investment buy/sell/partial exit/full exit/write-off/transfer out.
- Household role/ownership changes.
- Month Ritual lock/approval.

## Investment-Specific Clarity

Investment confirmations must state:

- Estimated value is not cash.
- Unrealized gain/loss is not spendable.
- Realized outcome requires exit and cash movement.
- ViNha is recording facts, not recommending buy/sell/hold.

## Feedback Receipt

After confirmation, show:

```text
Done.
Real money: [changed / unchanged]
Plan: [changed / unchanged]
Decision: [recorded / not applicable]
Related record: [created item]
```

## Recommendations

| Current issue | User impact | Proposed UX behavior | Affected screens | Priority |
|---|---|---|---|---|
| Confirmations are not yet a unified model. | Users may over-trust or ignore warnings. | Apply the three-level model consistently. | All flows | P0 |
| Investment values can be misread as cash. | Unsafe financial interpretation. | Add not-cash language before sell/value actions. | Investments, Health | P0 |
| Multi-domain outcomes feel hidden. | Low trust. | Use receipts for real money/plan/decision impacts. | Money, Plan, Inbox | P0 |

