# Accounts UX — Flow Map

Companion to `.agents/design-system.md` §25 (Money hub) and §26 (Account
Management Flows). Visual rules live in the design system; this file records
the account flow structure and semantics for future migrations.

## Flow map

```
Money hub (accounts scan + "Create account")
├─ Create sheet (AddAccountForm, presentation="sheet")
│    └─ success receipt → View account | Add another | Go to Money
├─ Account row → /money/accounts/[id]
│    ├─ Liquid account detail
│    │    ├─ Balance hero (FinancialAccountHero, Card tone="hero")
│    │    ├─ Add transaction (QuickAction → /money/transactions/new)
│    │    ├─ Recent activity preview (4 rows) → /money/transactions
│    │    └─ Management sheet (trailing icon button, canMutate only)
│         ├─ Edit (name + type) → server updateAccountAction
│         ├─ Archive → confirm state → archiveAccountAction → back to Money
│         └─ (credit cards add: refund action)
│    └─ Credit card detail (own rich flow: hero, payments, installments,
│         statements, settle, cashback — unchanged by the 2026-08 flow pass)
└─ /money/accounts redirects to /money (index retired; hub owns the list)
```

## Field semantics

### Create

| Field                                                | Kind                       | Notes                                                                                   |
| ---------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| Type                                                 | Required, first            | `ACCOUNT_TYPE_CREATE_OPTIONS` (savings term products excluded — separate Money section) |
| Name                                                 | Required                   | Free text                                                                               |
| Opening balance                                      | Conditional (liquid types) | Current-state amount; not income; hint explains semantics                               |
| Credit limit / statement day / due day / linked bank | Conditional (credit card)  | Progressive disclosure after type selection                                             |
| Ownership                                            | Last                       | Household/Personal via `FinancialScopeField`; server enforces validity                  |

### Edit (management sheet)

- Editable: name, type (liquid types only; locked to a label for credit cards).
- Not editable: balance (changes flow through transactions/transfers only),
  ownership (server-controlled after creation).
- Balance is intentionally absent from the form — financial integrity rule.

## Ownership / read-only

- `canMutate` (server-derived) gates: management trailing button, capture CTA,
  card actions. Read-only detail still shows balance, ownership, and history.
- Ownership presentation: compact badge on hub rows; `onHero` text row on the
  detail hero, including the former-member read-only explanation.

## Destructive rules

- Accounts with financial history are archived, never hard-deleted. Copy says
  "Archive" and the confirm state explains consequences before the single
  confirm action.
- The archive entry is danger-styled inside the management sheet, never placed
  next to Save as an equal action.

## E2E anchors

`money-create-account`, `account-add-form`, `account-add-submit`,
`account-edit-open`, `account-edit-form`, `account-edit-type`,
`account-edit-submit`, `account-archive-open`, `account-archive-confirm`,
`money-account-detail` (+ `data-account-kind="credit-card"` on cards),
`account-detail-hero`, `account-quick-capture`, `account-management-open`,
`account-health-zero`.
