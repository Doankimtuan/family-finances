# Inbox Contract

## Principle

Cards must not create unnecessary Inbox items. Inbox exists only when user attention, review, or acknowledgement is required.

## Business Events

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
|----------------|--------------------------|------|----------|-----------------|------------|-----------------|---------------|
| Card created successfully | No | None | None | None | None | Not applicable | Not applicable |
| Card edited successfully | No | None | None | None | None | Not applicable | Not applicable |
| Purchase recorded successfully | No by default | None | None | None | None | Not applicable | Not applicable |
| Purchase truth unclear | Yes | Card Review | Medium | Confirm, correct, or keep Needs Review | None by default | No | Dismiss only if item remains Needs Review or user confirms no follow-up |
| Statement recorded successfully | No by default | None | None | None | None | Not applicable | Not applicable |
| Upcoming card due date | Yes, only if user attention is needed | Card Due Review | Medium | Review, record repayment, or keep reminder | After due date or when settled | May resolve when remaining due is zero | Dismiss reminder only; no money/state change |
| Due date passed with remaining due | Yes | Card Overdue Review | High | Record repayment, review, or keep Needs Review | None by default | No automatic money change | Dismiss only after explicit acknowledgement or review |
| Repayment recorded successfully | No | None | None | None | None | Not applicable | Not applicable |
| Billing period settled | Yes, only if acknowledgement is useful | Card Settled Review | Low | Acknowledge or view history | None by default | May resolve after acknowledgement | Dismiss does not change money |
| Partial payment remains due | Yes, only if due-date risk remains | Card Partial Payment Review | Medium | Review remaining due | Due date or settlement | May resolve when settled | Dismiss does not change obligation |
| Refund timing unclear | Yes | Card Refund Review | Medium | Apply, review, or keep Needs Review | None by default | No | Dismiss only after explicit choice |
| Unknown fee or interest | Yes | Card Charge Review | Medium | Confirm, correct, or keep Needs Review | None by default | No | Dismiss only if charge remains reviewable or user confirms |
| Card-origin installment boundary unclear | Yes | Card Installment Review | Medium | Confirm card-origin meaning or review boundary | None by default | No | Dismiss only after explicit choice |
| Card closed with no unresolved obligation | No | None | None | None | None | Not applicable | Not applicable |
| Card closure blocked by unresolved due | Yes | Card Closure Review | High | Review remaining due or confirm closure meaning | None by default | No | Dismiss only if card remains Needs Review or user confirms |
| Invalid action rejected | No by default | None | None | None | None | Not applicable | Use inline/error feedback instead |
| Health flags card risk | No by Cards default | None | None | None | None | Not applicable | Health may display read-only concern |

## Inbox Item Requirements

When a Cards Inbox item exists, it must include:

- Card reference.
- Reason review is needed.
- Whether real money is affected.
- Required user action.
- Clear statement that Inbox acknowledgement does not move money.
- Clear statement when recorded values are not provider-confirmed.

## Forbidden Inbox Behavior

- No Inbox item for routine successful edit.
- No Inbox item that automatically records repayment.
- No Inbox auto-resolution that changes money or card obligation.
- No Inbox action that treats available credit as cash.
- No Inbox action that lets Health mutate card state.
