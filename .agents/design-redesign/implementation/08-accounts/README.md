# Implementation 08 — Accounts

**Status: PARTIAL.** Accounts Overview and both create pages are implemented on the existing ledger API. The reference includes unsupported provider metadata and account-prefilled actions, which remain documented gaps. Existing edit/archive and credit actions are preserved. Asset and credit detail still use compositions that differ materially from their approved Stitch screens, so exact visual parity is not marked complete.

## Scope

- Accounts Overview, Add Account, Add Credit Account, existing asset/credit detail and metadata-edit/archive flows.
- No Savings, Investments, Loans, Personal Lending, Plan, Inbox, or Together migrations.
- No Supabase schema or command changes. New route constants and two dedicated create routes were added.
- No create, edit, archive, payment, or other financial action was submitted in the authenticated browser.

## References

- `accounts-screen-map.md` records exact Stitch IDs, actual routes, source files, and the unsupported data gaps.
- Stitch project: `16826760243481546078`.
- Downloaded references: `/tmp/implementation-08-accounts-stitch/`.

## Implementation state

| Screen / flow      | State                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Accounts Overview  | Implemented: real owned balance, grouped bank/cash-wallet assets, separate credit liabilities.                  |
| Add Account        | Implemented for existing domain fields, including explicit opening-balance semantics.                           |
| Add Credit Account | Implemented for existing credit settings; new debt remains zero.                                                |
| Asset Detail       | Existing real-data screen/actions preserved; exact Stitch composition remains outstanding.                      |
| Credit Detail      | Existing real-data billing/payment/installment/history preserved; exact Stitch composition remains outstanding. |
| Edit / Archive     | Existing metadata edit and soft archive reused.                                                                 |

## Docs

- `existing-accounts-audit.md`
- `accounts-screen-map.md`
- `data-contract.md`
- `financial-semantics.md`
- `visual-qa.md`
- `qa.md`
- `changes.md`
