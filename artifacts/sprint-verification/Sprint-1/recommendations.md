# Recommendations — Sprint 1 (file-level)

Do **not** implement in this verification pass. Guidance for the implementation team.

---

## R1 — Close mutate-in-place (B1)

1. **DB:** In a new migration (do not rewrite frozen history casually), replace `update_transaction` body to `raise exception` for financial field changes **or** revoke `EXECUTE` from `authenticated` and remove grants.
2. **App:** Remove or hard-disable `updateTransaction` export path for amount/type/account/category/jar.
   - `modules/ledger/application/commands/update-transaction.ts`
   - `app/[locale]/(product)/money/transactions/mutate-actions.ts`
3. **UI:** Remove Legacy edit CTA from  
   `app/[locale]/(product)/money/transactions/[id]/page.tsx`  
   Retire or convert `.../[id]/edit/` to note-only if Spec later allows (out of Sprint 1 Spec).
4. **Tests:** Invert `tests/unit/ledger-transaction-edit.test.ts` success expectation for `update_transaction`.

---

## R2 — Income exclusion for refunds/reversals (B2)

Preferred Spec-aligned options (pick one, document in ledger constants):

**Option A:** Add `is_reversal boolean not null default false` (Business Evolution) set true on refund + correction reversal legs; exclude in all income aggregations.

**Option B:** Treat any row with non-null `reverses_transaction_id` as non-income for reporting (and document that correction reversals always set the link).

Touch points:

- `supabase/migrations/20260803220000_…` pattern → **new** migration amending RPCs
- `modules/ledger/application/transaction-types.ts` (`applyTransactionDeltas` may still affect **account cash** — keep cash correct; exclude only **income reporting / jar plan income**)
- Any future monthly income / allocate-income query under `modules/plan` / `modules/ledger`
- Unit tests asserting “refund $50 does not increase monthly income total”

Also publish the jar capacity derivation rule in one query helper (spent = expenses on jar − excluded refunds/reversals, etc.).

---

## R3 — Real AC verification (B3)

1. Add Postgres-backed integration tests (local Supabase or transaction-rollback harness) for:
   - create category without jar → error
   - refund 50 of 150 → `reverses_transaction_id`, `partially_refunded`, capacity delta
   - correct 100→10 → three rows + statuses + links
2. Optionally add Playwright smoke:
   - category create required jar
   - detail → refund
   - detail → correct → audit chain visible
3. Rename or relocate mocked “integration” file to `*.command.test.ts` to avoid false confidence.

---

## R4 — Apply migration (B4)

1. `supabase db` / pipeline apply `20260803220000_sprint1_category_jar_refund_correction.sql`
2. Verify backfill: `cleared`→`posted`; household categories jar filled
3. Manual smoke on staging with one household fixture

---

## R5 — Non-blocking cleanups (after B1–B4)

| Action | Files |
|--------|-------|
| Deduplicate TX select | `get-transaction.ts`, `list-transactions.ts`, `get-transaction-audit-chain.ts` |
| Share form shell for correct vs capture fields | `correct-transaction-form.tsx`, `edit-transaction-form.tsx` |
| Use `TRANSACTION_CORRECTABLE_STATUS_VALUES` in UI gates | `[id]/page.tsx`, `correct/page.tsx` |
| Fix JSDoc | `update-transaction.ts` |
| Empty-state when no jars on category form | `create-category-form.tsx` |

---

## R6 — Process

1. Do not start Sprint 2 (`ST-E02-*`) until B1–B4 closed and Verification Board re-checks.
2. Clarify Product Decision Board EO-04 vs Implementation Planning Sprint 2 sequencing before planning commit.
3. Keep Categories → `modules/ledger` mapping; do not invent `modules/categories/` against Constitution.
