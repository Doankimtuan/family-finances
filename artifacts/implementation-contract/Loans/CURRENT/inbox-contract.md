# Inbox Contract

## Principle

Loans must not create unnecessary Inbox items. Inbox exists only when user attention or acknowledgement is required.

## Business Events

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
|----------------|--------------------------|------|----------|-----------------|------------|-----------------|---------------|
| Loan created successfully | No | None | None | None | None | Not applicable | Not applicable |
| Loan edited successfully | No | None | None | None | None | Not applicable | Not applicable |
| Rate awareness updated | No by default | None | None | None | None | Not applicable | Not applicable |
| Upcoming due date | Yes, only if user attention is needed | Loan Due Review | Medium | Review or record payment | After due date or when payment recorded | May resolve when repayment is recorded | Dismiss only as reminder dismissal; no money/state change |
| Due date passed without recorded payment | Yes | Loan Overdue Review | High | Record payment, mark Needs Review, or review loan | None by default | No automatic money change | Dismiss only if user confirms no action or keeps loan under review |
| Repayment recorded successfully | No | None | None | None | None | Not applicable | Not applicable |
| Final repayment recorded and loan becomes Completed | Yes, if acknowledgement is required | Loan Complete Review | Low | Acknowledge completion or open loan history | None by default | May resolve after acknowledgement | Dismiss does not change money |
| Payment truth unclear | Yes | Loan Review | Medium | Confirm, correct, or keep Needs Review | None by default | No | Dismiss only if loan remains Needs Review or user confirms no follow-up |
| Provider/family mismatch found | Yes | Loan Review | Medium | Confirm product record, correct facts, or keep Needs Review | None by default | No | Dismiss only after explicit choice |
| Loan cancelled | No by default | None | None | None | None | Not applicable | Not applicable |
| Loan defaulted | Yes, if user acknowledgement is needed | Loan Status Review | High | Acknowledge status or review loan | None by default | No | Dismiss only after acknowledgement |
| Loan archived | No | None | None | None | None | Not applicable | Not applicable |
| Invalid action rejected | No by default | None | None | None | None | Not applicable | Use inline/error feedback instead |
| Health flags loan burden | No by Loans default | None | None | None | None | Not applicable | Health may display read-only concern |

## Inbox Item Requirements

When a Loans Inbox item exists, it must include:

- Loan reference.
- Reason review is needed.
- Whether money is affected.
- Required user action.
- Clear statement that Inbox acknowledgement does not move money.
- Clear statement when recorded values are not provider-confirmed.

## Forbidden Inbox Behavior

- No Inbox item for routine successful edit.
- No Inbox item that automatically records repayment.
- No Inbox auto-resolution that changes loan balance.
- No Inbox action that creates payoff jar.
- No Inbox action that lets Health mutate loan state.

