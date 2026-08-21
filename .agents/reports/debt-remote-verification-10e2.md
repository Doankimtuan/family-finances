# Debt 10E.2 — Remote Migration Apply + Authenticated Verification

Date: 2026-08-21  
Target: Supabase project `family-finances-2` (`bbzffxvgocjwsdbujvgn`)  
Verdict: **DEBT REMOTE VERIFIED**

## Migration apply

Confirmed the linked project from `.env.local` and `supabase/.temp/linked-project.json`.
Applied only the two approved pending migrations:

- `20260820144206_debt_p0_integrity_receipt_gate_10b.sql`
- `20260821100000_debt_opening_paid_reconciliation_10e1.sql`

Remote migration history is aligned through 10E.1.

## Remote verification

- `opening_paid_amount` exists and is readable through the Data API.
- Legacy mismatch row verified: principal `100,000,000` minus remaining `98,990,100` gives displayed paid `1,009,900`; recorded payment `999,900` plus opening paid `10,000` explains it exactly.
- Authenticated invalid-account probes for both `create_debt` and `record_debt_payment` returned `P0001 Account not found or not eligible` and made no mutation.
- Anonymous `create_debt` returned permission denied; renamed unchecked RPC access returned no callable function.
- Valid authenticated payment through the browser succeeded using eligible Cash, returned a receipt, and created a `liability_payment` transaction with a linked payment-history URL.

## Authenticated browser verification

Used the configured `.env.local` E2E user `ownership-test-b@example.com`.

- Populated list: PASS
- Detail: PASS
- Create existing-balance debt: PASS
- Edit counterparty: PASS
- Payment form and capped quick actions: PASS
- Payment review (`Review` / `Xem lại`): PASS
- Payment receipt with direction, account, remaining amount, and `View transaction`: PASS
- Payment history with transaction link: PASS
- Opening-paid history row: PASS (`Paid before tracking` / `Đã trả trước khi theo dõi`)
- Privacy ON/OFF: PASS; amounts mask and restore through the global privacy toggle
- Vietnamese detail/history localization: PASS
- 390px light and dark screenshots: PASS
- No `Select an item`: PASS
- No local ActionSheet safe-area/bottom-padding hack: PASS; Debt sheets use shared `ActionSheetLayout`
- No hard Delete/Forgive action: PASS

Browser artifacts:

- `output/playwright/debt-remote-verification-10e2/detail-vi-390-light.png`
- `output/playwright/debt-remote-verification-10e2/detail-vi-390-dark.png`
- `output/playwright/debt-remote-verification-10e2/list-vi-390-dark.png`

Verification fixture: `d400bd80-b973-4571-a3f4-342a2b655cc6`. It remains in the linked development household because Debt intentionally exposes no delete/forgive action. Its final state is principal `10,000`, remaining `8,999`, opening paid `1,000`, and one recorded payment of `1`.

## Tests

- Debt + semantics + Home/Transactions focused tests: **130 passed**
- Authenticated E2E smoke: **3 passed**
- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run test`: PASS — 136 files, 1,007 tests
- `npm run build`: PASS

Remote `supabase db lint --linked --level error --fail-on error` reports one unrelated pre-existing Savings issue in `public.enqueue_savings_maturity` (`42P10`, missing matching unique/exclusion constraint). No Debt migration or Debt RPC issue was reported.
