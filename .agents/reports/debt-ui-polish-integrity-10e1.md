# Debt 10E.1 — UI Polish + Payment Integrity Fix

Date: 2026-08-21  
Verdict: **IMPLEMENTED — PARTIAL RELEASE VERIFICATION**

## Delivered

- Added explicit `opening_paid_amount` debt state and an idempotent migration that backfills legacy progress not represented by `debt_payments`.
- Added `getDebtPaymentReconciliation()` so derived progress, recorded payments, and opening paid amounts are checked as one model.
- Kept payment history honest: opening paid amounts render as a non-transaction history row; recorded payments retain transaction links; mismatches surface a warning.
- Polished overview/list/detail hierarchy with semantic debt/income colors, `FinancialValue`, compact progress, ownership badges, and meaningful-only due warnings.
- Shortened create/edit copy and made direction/creation mode segmented controls.
- Added privacy-safe account balances to account choices and localized the payment flow, including `Xem lại`, `Chọn tài khoản`, direction-aware review actions, and capped full/50% quick amounts.
- Fixed the shared `SelectField` so rich option labels do not replace the selected account name with an internal id.

## Verification

- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS: 136 files, 1,007 tests
- `npm run build` — PASS
- Prettier check on changed TypeScript/TSX/JSON files — PASS
- Browser evidence captured at 390, 440, 768, and 1280 CSS pixels in light and dark themes for the create sheet under `output/playwright/debt-ui-polish-10e1/`.

## Release prerequisite

The configured remote Supabase project is behind the repository. `supabase migration list --linked` and `supabase db push --linked --dry-run` show both the prior 10B migration and this 10E.1 migration pending. Consequently, the authenticated browser debt list currently fails closed with the existing safe error state because `opening_paid_amount` is not present remotely.

The pending migrations were not pushed from this task because doing so would also deploy the unrelated 10B migration. Apply the approved pending migrations through the normal deployment workflow, then repeat authenticated list, detail, payment, and history browser checks with real debt records.
