# Implemented features — Accounts MVP + Credit Card 1B

Status: **DONE** (2026-08-03)

## Accounts MVP (prior)

- [x] Evolution artifacts folder
- [x] `archiveAccount` / `updateAccount` + server actions
- [x] Account health helper (zero / ok)
- [x] Shared `AccountCard`
- [x] Accounts list: Real Position hero, ownership hint, liquid section, health chips, plans strip, progressive create + opening balance
- [x] Account detail: available balance, quick actions, edit, archive confirm
- [x] EN/VI messages + unit/e2e for accounts lifecycle

## Credit Card 1B (D-04)

- [x] Migration `20260803160000_ledger_credit_cards.sql` — type, settings, billing months/items, installment FKs, RLS
- [x] Constants + pure billing helpers (`credit-card-billing.ts`)
- [x] Real Position / liquid `listAccounts` exclude `credit_card`
- [x] `listCreditCards` / `getCreditCardDetail`
- [x] Create account with CC settings; `recordTransaction` over-limit **block** + billing assign; cashback; FIFO settle; convert→EMI
- [x] UI: progressive CC create, Accounts credit section, CC detail (util/settle/cashback/convert), capture error `credit_limit_exceeded`
- [x] Shared `CreditCardCard`; unit `credit-card-billing.test.ts`; e2e create-settings smoke
- [x] Decision log D-04

## Explicitly not shipped

- Auto-pay, min payment field, interest accrual
- DB billing triggers
- Product Definition / Architecture SoT edits
