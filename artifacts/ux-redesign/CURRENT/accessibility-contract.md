# Accessibility Contract

Target: WCAG AA.

## Global Requirements

- Logical focus order follows visual/task order.
- Keyboard access for all controls.
- Dialogs and sheets trap focus and restore focus on close.
- Errors are announced and linked to fields.
- Status is not color-only.
- Reduced-motion mode removes nonessential motion.
- Touch targets are at least 44px.
- Amounts and dates have accessible labels that include meaning.
- Loading states announce progress only when user action is blocked.

## Major Flow Requirements

| Flow | Focus order | Screen reader/error behavior | Special considerations |
|---|---|---|---|
| Auth/onboard | Title -> fields -> primary action -> alternatives | Announce auth errors without exposing sensitive details | OAuth callback status must be clear. |
| Money capture | Type -> amount -> account -> category/date -> submit | Amount errors announce currency and sign | Keyboard must not hide submit. |
| Accounts/cards/loans/savings setup | Step title -> required fields -> preview -> action | Step errors summarized and field-linked | Sticky action remains reachable. |
| Investment setup/valuation | Holding identity -> contribution/value -> date/source -> risk context -> action | Stale/unknown value warning announced | Estimated value not cash must be read. |
| Financial confirmations | Dialog heading -> consequence summary -> source/destination/amount -> confirm/cancel | Focus starts at heading; destructive confirm not first | Confirm labels specific, not generic. |
| Inbox review | Decision question -> source facts -> options -> action | Review type and consequence announced | Batch/delegation labels clear. |
| Health | Score/factor -> source link | Read-only status announced | No write controls. |

## Recommendation

| Current issue | User impact | Proposed UX behavior | Affected screens | Priority |
|---|---|---|---|---|
| Dense financial dialogs risk poor focus order. | Screen reader/keyboard users may miss consequences. | Confirmation focus starts at consequence summary and includes all money facts. | Confirmations | P0 |
| Amount pronunciation can be ambiguous. | Wrong interpretation of due/estimated/available. | Accessible labels include financial status and currency. | Money, Plan, Investments, Health | P0 |

