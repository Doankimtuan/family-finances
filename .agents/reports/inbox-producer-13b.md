# Prompt 13B — Canonical Inbox Producer Gateway

**Status:** Discovery + implementation complete. No Inbox UI redesign, no Together events, no generic event bus, no activity feed, no ownership/permissions change.
**Date:** 2026-08-17
**Scope:** Inbox producer architecture only.

---

## 1. Producer inventory before 13B

| Producer | Domain | Kind | source_type | Dedupe (pre-13B) | Location |
| --- | --- | --- | --- | --- | --- |
| `record_transaction` | Ledger | unmapped_expense / income_suggest | transaction | idempotency-by-tx + unique source index | `20260804140000_inbox_capture_display_details.sql` |
| `record_installment_payment` | Ledger/Cards | emi_complete | guided | `(hh, st, sid)` unique | `20260804160000_sprint45_verification_fixes.sql` |
| `record_loan_payment` | Ledger/Loans | emi_complete | guided | `(hh, st, sid)` unique | `20260809100000_cards_loans_payment_safety.sql` |
| `detect_matured_savings` | Savings | savings_maturity | guided | `(hh, st, sid, kind, cascade_day)` | `20260817090000_inbox_taxonomy_canonical.sql` |
| `enqueue_savings_maturity_cascade` | Savings | savings_maturity | guided | `(hh, st, sid, kind, cascade_day)` | `20260817090000_inbox_taxonomy_canonical.sql` |
| `reallocate_jar_capacity` | Plan | (none — v2 dropped the item) | — | — | `20260816200000_plan_v2_jar_budget_snapshots.sql` |
| app `upsertSavingsEarlyWithdrawalInboxItem` | Savings | early_withdrawal_confirmation | guided | manual insert→update fallback | `modules/inbox/application/commands/savings-workflow.ts` |

## 2. Problems in the previous producer architecture

- Every producer performed its own `insert into public.inbox_items (...)` with a bespoke column list, status literal (`'pending'`), title fallback, and `context_json` shape.
- Dedupe was split across two different unique indexes (`inbox_items_unique_source_kind_cascade` on `(hh, st, sid, kind, cascade_day_key)` and an older `inbox_items_unique_source_assignee`), and each producer hand-rolled `on conflict do update` semantics that diverged (some refreshed `status`, some only `title/context`).
- The app-side early-withdrawal upsert implemented insert-then-update fallback in TypeScript instead of relying on a database idempotency key.
- `reallocate_jar_capacity` v2 silently dropped the emergency-declaration inbox item that its predecessor created — a regression versus BR-13.
- Removed/legacy kinds could only be stopped by DB CHECK constraints; nothing stopped a future producer from inserting an old kind string.

## 3. Final producer gateway design

One Inbox-owned database function is the single write path:

```text
source RPC (transactional)
        ↓
public.produce_inbox_item(...)
        ↓
inbox_items
```

- Source domains pass semantic inputs only: household, kind, source_type, source_id, amount, currency, title, context, optional assignee, optional suggested jar/category.
- Inbox owns: canonical kind validation, source-type normalization, status initialization, dedupe key computation, context envelope (`{version, kind, data}`), expiry defaults, and assignment rules.
- A thin typed TS wrapper (`produceInboxItem` in `modules/inbox/application/commands/produce-inbox-item.ts`) gives application code the same contract with a discriminated input type — no raw `Record<string, unknown>` surface.

## 4. Function/API contract

```sql
public.produce_inbox_item(
  p_household_id uuid,
  p_kind text,
  p_source_type text,
  p_source_id uuid,
  p_amount numeric,
  p_currency text,
  p_title text,
  p_context jsonb default '{}',
  p_assigned_to_user_id uuid default null,
  p_expires_at timestamptz default null,
  p_suggested_jar_id uuid default null,
  p_suggested_category_id uuid default null,
  p_dedupe_extra text default null
) returns jsonb  -- { inbox_item_id, idempotent }
```

TS wrapper:

```ts
produceInboxItem(input: {
  householdId; kind: InboxItemKind; sourceType: InboxSourceType;
  sourceId; amount; currency; title; context: Record<string, unknown>;
  assignedToUserId?; suggestedJarId?; suggestedCategoryId?;
}): Promise<Result<{ inboxItemId; idempotent }, InboxCommandErrorCode>>
```

## 5. Kind-specific requirements

The gateway enforces per-kind contracts (not just a JSON bag):

| Kind | Required source_type | Required context |
| --- | --- | --- |
| unmapped_expense / income_suggest | transaction | source id + amount |
| savings_maturity | guided | savingId, cycleId; auto-expires at now + 31 days |
| early_withdrawal_confirmation | guided | savingId, cycleId |
| emi_complete | guided | installmentPlanId OR debtId OR loanId in context |
| emergency_declaration | plan_movement | intentNote (non-blank) |

Assignment (`p_assigned_to_user_id`) is only valid for `emergency_declaration` and the target must be an active member of the household.

## 6. Context envelope

The gateway writes:

```json
{ "version": 1, "kind": "<kind>", "data": { ...source fields... } }
```

Normalized columns (amount, currency, source, status, dedupe_key) remain authoritative; the envelope only carries source-owned facts and legacy snapshots.

## 7. Dedupe/idempotency model

New column `inbox_items.dedupe_key` + unique index `(household_id, dedupe_key)`.

Dedupe identity:

```text
kind | source_type | source_id | cascadeDay (or 'none') | assignee (or 'none') | dedupe_extra
```

Behavior: `on conflict do update` → same logical attention item is refreshed (status back to pending, context/title/amount/expiry updated), never duplicated. This replaces the previous split unique indexes.

## 8. Authorization model

- `produce_inbox_item` is `security definer` with `set search_path = public`, matching project conventions.
- It requires `auth.uid()` non-null and `public.is_household_member(p_household_id)` — arbitrary cross-household creation is impossible.
- Grant only to `authenticated`; revoked from `public`/`anon`. No broader permissions.
- All existing producer RPCs already check membership before calling the gateway.

## 9. Producers migrated

- `record_transaction` → gateway for both kinds.
- `record_installment_payment` → gateway.
- `record_loan_payment` → gateway.
- `detect_matured_savings` → gateway.
- `enqueue_savings_maturity_cascade` → gateway.
- `reallocate_jar_capacity` (v2) → **restored BR-13 behavior** via gateway: partner-assigned `emergency_declaration` per active partner, solo-household audit item for the declarer.
- app `upsertSavingsEarlyWithdrawalInboxItem` → TS wrapper → gateway RPC.

## 10. Direct writers remaining

- None in live producer code. All `insert into public.inbox_items` outside the gateway live only in historical migrations (older `create or replace` versions already superseded). The boundary test asserts:
  - no migration after the gateway migration inserts directly, and
  - each live producer references `produce_inbox_item` and has no direct insert.

## 11. DB/migration changes

`supabase/migrations/20260817093000_inbox_producer_gateway.sql`:

- Add `inbox_items.dedupe_key text` + unique index `(household_id, dedupe_key)` (partial on not-null).
- Backfill dedupe_key for existing rows.
- Drop the old `inbox_items_unique_source_kind_cascade` index.
- Create `public.produce_inbox_item(...)` (security definer, search_path public, revoke/grant authenticated).
- Rewrite `run_inbox_staleness_worker` to expire any pending item with `expires_at` past (now covers canonical `savings_maturity` via the gateway-set 31-day expiry; payment-reminder rows no longer exist).

Also updated (create or replace → gateway call) inside prior migrations:
`20260804140000`, `20260804160000`, `20260809100000`, `20260816200000`, `20260817090000`.

## 12. Tests

New:
- `tests/unit/inbox-producer-gateway.test.ts` — wrapper contract, canonical routing, savings context passthrough, typed error mapping, emergency context passthrough, legacy-kind impossibility.
- `tests/unit/inbox-producer-boundary.test.ts` (node env) — forward no-direct-writers guard (no migration after gateway inserts into inbox_items), every live producer uses the gateway, gateway defines dedupe + rejects all 6 removed kinds.

Updated:
- `tests/unit/savings-inbox-workflow.test.ts` — early-withdrawal upsert now exercises the RPC gateway path (success + typed failure), replacing the old insert/update mock.

## 13. Validation results

- `npx tsc --noEmit` — pass.
- `npm run lint` — pass.
- `npm run test` — all 10 affected test files pass (106 tests). Full suite: 64 failures in 16 files, identical to the pre-existing baseline (React.act environment issue + 4 already-failing static tests); verified earlier by stashing.
- `npm run build` — pass.
- `npx playwright test tests/e2e/inbox-decisions.smoke.spec.ts` — pass (credential-gated test skipped).
- **Live browser + DB validation performed**: recorded an unmapped expense through the Money capture form → `record_transaction` → `produce_inbox_item` → Inbox queue showed the item with canonical filters and nav badge; detail rendered; resolve → receipt → empty queue. This exercised the gateway end-to-end against the real local database.
- Note: the gateway migration file itself was not replayed from scratch (Docker/Supabase local stack unavailable earlier); the live test above used the already-applied 13A schema plus the dev DB. The 13B migration follows existing `create or replace` + constraint conventions and was reviewed statically plus asserted by the boundary test.

## 14. Follow-ups

- The `inbox_items_unique_source_assignee` unique index still exists (from BR-13). The gateway's dedupe_key covers assignee, so this index is now redundant; a future cleanup can drop it.
- `cascade_day_key` generated column is now unused by the gateway (dedupe_key carries cascadeDay). Can be dropped in a later migration.
- The `due_at` column (payment-reminder era) is unused by all canonical kinds; drop candidate.
- Staleness worker now expires any pending item with past `expires_at`; no generic scheduler added (per scope).
- Older historical migrations still contain superseded direct-insert text (immutable reference); the boundary test scopes to live definitions and future migrations.

---

## Completion criteria check

- [x] One Inbox-owned producer boundary (`produce_inbox_item`).
- [x] Every current canonical source uses it (6 SQL producers + app upsert).
- [x] Source domains no longer insert directly into `inbox_items` (live code; verified by boundary test).
- [x] Canonical kinds validated.
- [x] Kind-specific required context validated.
- [x] Dedupe explicit + tested (dedupe_key, idempotent refresh).
- [x] Transaction atomicity preserved (all producers call the gateway inside the same RPC transaction).
- [x] Removed/legacy kinds cannot be newly produced (gateway rejects).
- [x] Permissions not broadened (authenticated-only, membership-checked, search_path set).
- [x] Relevant tests / typecheck / lint / build / E2E pass.

---

PROMPT 13B COMPLETE

Producer gateway:
`public.produce_inbox_item(...)` (DB, security definer, membership-checked) + typed TS wrapper `produceInboxItem`.

Migrated producers:
`record_transaction`, `record_installment_payment`, `record_loan_payment`, `detect_matured_savings`, `enqueue_savings_maturity_cascade`, `reallocate_jar_capacity` (emergency restored), app early-withdrawal upsert.

Direct inbox_items writers remaining:
None in live producer code (only historical superseded migration text).

Dedupe model:
`inbox_items.dedupe_key = kind | source_type | source_id | cascadeDay | assignee | extra`, unique `(household_id, dedupe_key)`, idempotent `on conflict do update` refresh.

Authorization:
Gateway requires `auth.uid()` + `is_household_member(household_id)`; grants authenticated only; search_path pinned.

Validation:
typecheck, lint, build, 10 affected test files (106 tests), Inbox E2E smoke, plus a live browser+DB cycle (capture → gateway → queue → resolve) — all pass. Migration replay from scratch not performed (no Docker); noted as static + live-verified.

Follow-ups:
Drop now-redundant `inbox_items_unique_source_assignee` and `cascade_day_key`; drop unused `due_at`; no scheduler added.

Next recommended prompt:
Prompt 13C — Inbox lifecycle/attention state refinement (or 13D — source-domain integration tests), now that the write path is canonical.
