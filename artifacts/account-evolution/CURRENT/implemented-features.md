# Implemented features — Accounts MVP

Status: **DONE** (2026-08-03)

## Delivered

- [x] Evolution artifacts (`artifacts/account-evolution/CURRENT/`) including D-01/D-02/D-03 and CC proposal
- [x] `archiveAccount` / `updateAccount` commands + Zod + barrel + server actions
- [x] `accountHealthFromBalance` (zero / ok) — presentation helper
- [x] Shared `AccountCard` (list + Money hub preview)
- [x] Accounts list: Real Position hero, ownership hint, liquid section, health chips, plans & credit IA strip, progressive create + opening balance
- [x] Account detail: available balance, ownership/health copy, quick actions (capture, activity), edit name/type, archive confirm
- [x] EN/VI `money.accountsPage` / `money.accountDetail` messages
- [x] Unit coverage in `tests/unit/ledger-accounts.test.ts`; e2e smoke extends `money-hub.smoke.spec.ts`

## Explicitly not shipped (by decision)

- Credit card account type / billing cycles / FIFO / utilization (D-01)
- Transfers, restore archived, post-create opening balance mutation
- Product / Architecture SoT changes
