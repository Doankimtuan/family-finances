# Migration Plan

1. Apply SQL migration renaming `installment_plans` → `loans` and reshaping columns.
2. Backfill `remaining_principal` from prior paid/num/installment amounts.
3. Map `card_label` → `lender`; set `loan_type = other` for existing rows.
4. Create `loan_payments` + RLS + grants.
5. Detach `card_billing_items.installment_plan_id`.
6. Replace RPC; revoke old function.
7. Deploy application (constants, APIs, routes, UI).
8. Redirect `/money/cards` → `/money/loans` (Next.js rewrite or page redirect).
9. Run unit + e2e smoke; verify BR-11 inbox still fires on completion.

## Rollback

- Restore previous migration (down not shipped); restore prior app build.
- Data: `loans` rows remain convertible back if columns preserved in a hotfix migration.

## Data risk

- Converted card-origin EMI plans lose card linkage (intentional).
- Counter-only historical “payments” have no `loan_payments` rows / transactions (acceptable; remaining_principal is authoritative going forward).
