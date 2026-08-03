# ST-E04-004 — Implementation Summary

| Field | Value |
|-------|--------|
| Story | `ST-E04-004` |
| Title | Debts savings and cards/EMI surfaces |
| Sprint | S6 / `sprint-006` |
| Mode | `full_implement` |
| Status | **FROZEN** |
| Run | `run_sprint_exec_ST-E04-004_20260803T065138Z` |
| Date | `2026-08-03T06:51:38Z` |

## Delivered

| Task | Result |
|------|--------|
| Debts list + detail + pay | PASS — liabilities; Amount owed (BR-01) |
| Savings list + detail | PASS — maturity CTA → Inbox guided (AC-010) |
| Cards / EMI list + detail | PASS — InstallmentCard; pay → complete → Inbox (AC-011) |
| Schema + RPCs | PASS — migration `20260803120000_ledger_debts_savings_installments.sql` |
| Money hub links | PASS — Debts / Savings / Cards replace coming-soon |
| Offline fail-closed | PASS — MoneyOfflineBanner on mutating surfaces |
| i18n en/vi | PASS — money.products / debts / savings / cards |
| Tests | PASS — unit mappers + e2e smoke |

## Key paths

- `supabase/migrations/20260803120000_ledger_debts_savings_installments.sql`
- `modules/ledger/application/{money-product-types,queries/list-money-products,commands/money-products}.ts`
- `app/[locale]/(product)/money/{debts,savings,cards}/**`
- `shared/patterns/installment-card.tsx`
- `messages/{en,vi}/money.json`
- `tests/unit/money-products.test.ts`
- `tests/e2e/money-products.smoke.spec.ts`

## Quality gates

| Gate | Result |
|------|--------|
| lint | PASS |
| typecheck | PASS |
| unit | PASS (165) |
| e2e money-products | PASS (1 passed, 1 skipped) |
| build | PASS |
