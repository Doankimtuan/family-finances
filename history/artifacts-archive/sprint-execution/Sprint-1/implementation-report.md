# Implementation Report — Sprint 1 (Spec v2.1)

| Field | Value |
|-------|--------|
| Sprint | Implementation Planning **Sprint 1** / `Sprint-1` |
| Goal | Core Domain Contracts & Schema Realization (EPIC 1) |
| Plan SoT | `artifacts/implementation-planning/CURRENT/sprint-plan.md` |
| Spec SoT | Specification Synchronization v2.1 |
| Opened | 2026-08-03 |
| Completed | 2026-08-03T15:25:10Z |
| Status | **COMPLETE — awaiting approval** |

## Scope executed

| Story | Points | Outcome |
|-------|--------|---------|
| `ST-E01-001` Category ↔ Jar N:1 | 5 | Done |
| `ST-E01-002` Refund linkage & jar restoration | 8 | Done |
| `ST-E01-003` 3-way correction audit chain | 8 | Done |

## What shipped

### Database
- Migration `supabase/migrations/20260803220000_sprint1_category_jar_refund_correction.sql`
  - `categories.jar_id` FK + household mapping check (BR-12)
  - `transactions.reverses_transaction_id` / `corrects_transaction_id`
  - Status lifecycle: `pending_mapping` \| `posted` \| `partially_refunded` \| `fully_refunded` \| `reversed`
  - RPCs: `create_category`, `refund_transaction`, `correct_transaction`; hard delete blocked
  - `record_transaction` auto-fills jar from category mapping

### Application (ledger / plan)
- `createCategory`, `refundTransaction`, `correctTransaction` commands
- Policies: `category-jar-policy`, `refund-policy`, `correction-policy`
- `TransactionStatus` + ledger error codes in `ledger-constants.ts`
- `createJar` seeds matching household category (BR-12 Rule 2)
- Audit chain query `getTransactionAuditChain`

### UI
- Plan jars: **Create category** form with required jar select (AC-CAT-01)
- Money transaction detail: Correct / Refund CTAs + audit chain expander
- Routes: `/money/transactions/[id]/correct`, `/refund`
- Capture form auto-selects jar from mapped category

### Tests
- Unit + integration coverage for AC-CAT-01, AC-TRN-01, AC-TRN-02
- Regression: full unit suite green (194 tests)

## Explicit non-goals (not in this sprint)

- Sprint 2 plan movements / emergency flow
- Typed Inbox ReviewItem discriminators (Sprint 3)
- Product Decision Board EO-04 RecurringPatterns (post-S6 roadmap)

## Folder naming note

Rewrite S1–S6 live under `artifacts/sprint-execution/sprint-00x/`. This pack is **Spec v2.1 Implementation Planning Sprint 1** and uses `Sprint-1/` to avoid overwriting frozen rewrite packs. Story IDs `ST-E01-*` in this pack are **not** the same stories as rewrite `sprint-001`.
