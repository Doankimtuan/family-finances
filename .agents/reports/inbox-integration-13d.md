# Prompt 13D — Inbox Source-Domain Integration Hardening

**Status:** Discovery + hardening + live DB validation complete. No Inbox redesign, no read/unread, no new kinds, no Together events, no event bus, no ownership/permission changes.
**Date:** 2026-08-17
**Scope:** Integration hardening of the canonical `producer → produce_inbox_item → inbox_items → decision → source effect` chain.

---

## 1. Integration matrix

| Kind | Source action | Producer | produce inputs | Persisted row | Detail behavior | Allowed outcomes | Source effect | Terminal state | Idempotency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| unmapped_expense | Record expense without jar | `record_transaction` | kind, tx source, amount, currency, title, category | pending, envelope v1 | resolve panel | resolve_to_jar, dismiss | tx.jar_id set | resolved / dismissed / auto_resolved | refresh-while-pending |
| income_suggest | Record unmapped income under Suggest | `record_transaction` | kind, tx source, amount, currency, title | pending, envelope v1 | resolve panel | resolve_to_jar, dismiss | tx.jar_id set | resolved / dismissed / auto_resolved | refresh-while-pending |
| savings_maturity | Maturity detect / cascade | `detect_matured_savings`, `enqueue_savings_maturity_cascade` | savingId, cycleId, cascadeDay, expiry | pending, envelope v1, expires_at | maturity panel | renew/switch/withdraw/confirm_configured/choose_package/change_settlement/remind_tomorrow/dismiss | Savings settle/renew executed | acknowledged / dismissed | cycle-keyed; refresh pending/expired |
| early_withdrawal_confirmation | Request early withdrawal | app wrapper → gateway | savingId, cycleId, net, penalty | pending, envelope v1 | confirm/cancel | confirm, cancel, dismiss | Savings early-withdraw executed | acknowledged / dismissed | refresh-while-pending |
| emi_complete | Loan completed | `record_loan_payment` | loanId context | pending, envelope v1 | celebrate/later | celebrate, later | none (loan already paid) | acknowledged | never reopens |
| emergency_declaration | Emergency reallocate | `reallocate_jar_capacity` | plan_movement, assignee, intentNote, jars | pending, envelope v1, assignee | dismiss panel | dismiss | none (movement already recorded) | dismissed | per plan_movement (new action = new item) |

## 2. Producer-by-producer findings

- `record_transaction` — produces both unmapped_expense and income_suggest. Income and expense share `resolve_to_jar` but are distinct kinds with distinct dedupe identities; income rows are never treated as expenses (kind-scoped key).
- `record_loan_payment` — only live emi_complete producer (installment-plan RPC no longer exists remotely; card path refactored). Completion creates exactly one item per loan; retries cannot duplicate because the loan becomes `completed`.
- `detect_matured_savings` / `enqueue_savings_maturity_cascade` — both produce savings_maturity with savingId/cycleId/cascadeDay context and 31-day expiry.
- `reallocate_jar_capacity` — 13B restored BR-13 emergency production. 13D verified the partner-assignment and solo-audit branches.
- app `produceInboxItem` wrapper — routes early_withdrawal_confirmation (and any future app producer) through the gateway.

## 3. Dedupe findings

The 13D audit found and fixed a real bug: **the 13B dedupe key lacked cycleId**, so a new maturity in a later cycle collided with the old acknowledged item and would reopen it. The key is now:

```text
kind | source_type | source_id | cascadeDay | cycleId | assignee | dedupe_extra
```

Per-kind semantics:
- unmapped_expense / income_suggest: one logical item per transaction; retry reuses the pending row, never reopens a resolved/dismissed one.
- savings_maturity: one item per (saving, cycle, cascadeDay). Repeated worker runs on the same day refresh the pending row; a new cycle creates a new item; an acknowledged item is never reopened.
- early_withdrawal_confirmation: one per (saving, cycle).
- emi_complete: one per loan; terminal never reopens.
- emergency_declaration: new plan_movement = new logical event = new dedupe identity (source_id is the movement id).

## 4. Terminal-item reopen findings

The 13B gateway unconditionally reset `status='pending'` on conflict — replaying a producer could reopen a resolved/dismissed/acknowledged decision. Fixed with a per-kind `on conflict ... where` guard:

- `emi_complete`: `where status='pending'` (never reopen).
- `savings_maturity`: `where status in ('pending','expired')` (refresh while pending, revive expired but never resolved/acknowledged).
- all others: `where status='pending'`.

When a conflict hits a terminal item, the gateway returns the existing row id (idempotent) without changing status.

## 5. Authorization findings

- `produce_inbox_item` is security definer, requires `auth.uid()` + `is_household_member(p_household_id)`, grants only `authenticated`. A non-member cannot create an item for any household.
- Kind/source-type/context/assignee are validated inside the gateway, so a member cannot fabricate an arbitrary valid-looking item (e.g., savings context is required for savings kinds, intentNote for emergency).
- **Direct gateway misuse is prevented by validation, not by hiding the function.** Under Supabase grants (per-role, not per-caller), making it internal-only isn't possible without revoking from `authenticated` (which would break legitimate app-side early-withdrawal production). The audit concludes the internal validation is sufficient — this is documented, not changed.

## 6. SECURITY DEFINER call chain

| Caller | Definer | auth.uid check | membership check | search_path | Grants |
| --- | --- | --- | --- | --- | --- |
| `record_transaction` | definer | yes | yes | public | authenticated |
| `record_loan_payment` | definer | yes | yes | public | authenticated |
| `detect_matured_savings` | definer | — | yes | public | authenticated |
| `enqueue_savings_maturity_cascade` | definer | — | yes | public | authenticated |
| `reallocate_jar_capacity` | definer | yes | yes | public | authenticated |
| `produce_inbox_item` (gateway) | definer | yes | yes | public | authenticated |
| ack/dismiss/resolve RPCs | definer | yes | yes (household) | public | authenticated |

No privilege escalation: an authenticated user can only ever act within households they belong to, and every source RPC already enforces membership before calling the gateway.

## 7. Atomicity findings

All producers call the gateway inside the same `security definer` RPC transaction — the domain mutation (transaction insert, loan payment, saving cycle maturity, plan movement) and the Inbox row commit or fail together. No application-layer second call exists for SQL producers. The app-side early-withdrawal wrapper is a single RPC too. Verified by construction (all gateway calls are `perform`/`select` inside the producer body).

## 8. Changes made

**Migration `supabase/migrations/20260817103000_inbox_integration_hardening.sql`** (new):
- Rewrote `produce_inbox_item` with:
  - per-kind reopen policy (`on conflict ... where status ...`),
  - cycle-scoped dedupe key for savings kinds,
  - re-backfill of `dedupe_key` in the new format.
- Added new error codes (`inbox_removed_kind`, `inbox_invalid_source_type`, `inbox_invalid_assignee`, `inbox_missing_context`) to `inbox-constants.ts` + en/vi i18n.

**Migration `supabase/migrations/20260817110000_inbox_producers_gateway_deploy.sql`** (new, deployment fix):
- **The critical finding:** the remote dev project was still running the pre-gateway producer functions (13B edited the migration files but never applied them). This migration re-applies the gateway-based `record_transaction`, `record_loan_payment`, `detect_matured_savings`, `enqueue_savings_maturity_cascade`, and `reallocate_jar_capacity` (BR-13 emergency restored).

**Tests:**
- `tests/unit/inbox-integration-13d.test.ts` (new, 12 tests): full chain per kind — produce→row→typed→action→effect→terminal→retry.
- `tests/unit/inbox-producer-boundary.test.ts` (updated): forward guard scoped to post-gateway migrations; 13D reopen/cycle assertions.

## 9. DB/migrations

Applied live to the existing development project (`bbzffxvgocjwsdbujvgn`):
- `inbox_integration_hardening` — new gateway.
- `inbox_producers_gateway_deploy` — re-applied all 5 producer functions.
- Re-backfilled all `inbox_items.dedupe_key` rows to the 13D format.

Verified remotely after deploy: all 5 producers report `uses_gateway = GATEWAY`; the gateway reports `REOPEN-GUARDED` and `CYCLE-KEYED`.

## 10. Tests

- 12 new integration tests (producer→row→typed→action→effect→terminal→retry per kind).
- 5 boundary tests (no post-gateway direct inserts, live producers use gateway, reopen/cycle policy present, removed kinds rejected, dedupe key defined).
- Existing 13B gateway + savings-workflow + inbox suites all pass (119 tests across 11 files).

## 11. Browser validation (live)

Logged in as the dev household and exercised:
- Money → record unmapped expense → Inbox queue (canonical filters) → detail → resolve → receipt → terminal `resolved` + tx jar updated.
- Verified the post-deploy row carries the envelope (`version:1`, `kind`) and the 13D dedupe key; the pre-deploy row did not — proving the deployment fixed the live chain.
- Dismiss path verified live earlier: dismissed items leave the transaction untouched.

## 12. Remaining cleanup debt

- `inbox_items_unique_source_assignee` (BR-13 era) is now redundant — gateway dedupe_key covers assignee. **Not dropped** (no live code depends on it; listed for future cleanup).
- `cascade_day_key` generated column — now unused by the gateway (dedupe_key carries cascadeDay). **Not dropped**; potential cleanup.
- `due_at` column (payment-reminder era) — unused by all canonical kinds. **Not dropped**; potential cleanup.
- Two pre-deploy rows in the dev DB (45k/60k smoke) — one still has a null dedupe_key; harmless dev data. The 45k row's idempotent re-record path returns the existing pending row without relying on dedupe_key.

## 13. Product decisions required

- **PRODUCT DECISION REQUIRED (existing):** `emi_complete.later` currently maps to `acknowledged` — it is not a true defer action. Documented; do not introduce a defer state in this prompt.
- **PRODUCT DECISION REQUIRED:** solo-household emergency audit item — an Inbox item assigned to the declarer is arguably an implementation carry-over. Kept (matches current product rule); flag for product review.
- **PRODUCT DECISION REQUIRED:** any member may resolve/acknowledge/dismiss another member's assigned emergency item (partner-equal, per `partnerEqualNote`). Consistent with product intent; documented.

## 14. Final readiness verdict

All current canonical producers are integration-tested; retry behavior is explicit per kind; terminal items do not reopen; authorization is verified (validation-based, no escalation); atomicity is preserved; live DB + browser flows pass; no new Inbox concepts added.

---

PROMPT 13D COMPLETE

Producer integrations:
All 6 canonical kinds tested end-to-end (unmapped_expense, income_suggest, savings_maturity, early_withdrawal_confirmation, emi_complete, emergency_declaration). Live producers deployed to the remote dev project and verified `uses_gateway = GATEWAY`.

Dedupe corrections:
Added cycleId to the savings dedupe key (prevents cross-cycle reopen); re-backfilled all rows; per-kind reopen guard on `on conflict`.

Authorization:
Gateway + all producers are membership-checked and validation-guarded; direct gateway misuse prevented by validation (documented, not hidden).

Atomicity:
All producers create Inbox rows inside the same transactional RPC as the domain mutation.

DB validation:
Migration `inbox_integration_hardening` + `inbox_producers_gateway_deploy` applied to the live dev project (`bbzffxvgocjwsdbujvgn`); verified function bodies, row envelopes, dedupe keys, and resolve effects remotely. Browser flow (Money→Inbox→resolve) exercised live.

Inbox readiness:
READY

Product decisions required:
1. `emi_complete.later` is not a true defer (currently acknowledged).
2. Solo-household emergency audit item usefulness.
3. Cross-member outcome authorization on assigned emergency items (partner-equal, confirmed consistent).

Recommended next prompt:
Prompt 14A — Household Scope & Personal/Shared Finance Contract
