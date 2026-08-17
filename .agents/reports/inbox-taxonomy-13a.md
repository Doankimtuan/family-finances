# Prompt 13A — Freeze Inbox Decision Taxonomy

**Status:** Discovery + implementation complete. No Together / ownership / roles / permissions / generic event infrastructure touched.
**Date:** 2026-08-17
**Scope:** Inbox only.

---

## 1. Previous taxonomy

Storage kinds before this prompt (from DB CHECK constraints and app constants):

```text
unmapped_expense
income_suggest
savings_maturity
savings_matured
renewal_required
early_withdrawal_confirmation
penalty_warning
rate_changed_suggestion
package_expired
emi_complete
emergency_declaration
payment_reminder
```

App also carried a parallel Spec `ReviewItemType` taxonomy and a display `types.*` i18n block that overlapped the storage kinds without aligning 1:1.

## 2. Problems found

- `penalty_warning`, `rate_changed_suggestion`, `package_expired` existed only in DB constraints and constants. **No RPC ever wrote them** — dead kinds.
- `savings_matured` and `renewal_required` were real producers (savings detect/cascade RPCs) but had no distinct decision contract; they were the same "savings maturity decision" the user makes.
- `payment_reminder` had a producer function (`enqueue_payment_reminder`) that **no app code calls**, and no actionable outcome (only "dismiss when paid"). It was awareness-only, which the product decision excludes from Inbox.
- The app mapped storage kind → Spec type → display type in three layers (`toReviewItemType`, `types.*` i18n), allowing persisted kinds and application types to diverge silently. `income_suggest` and dead kinds mapped to `null`/no UI path.
- `InboxItemKind` on the read model was `string`, so unknown/legacy kinds silently rendered as generic items.
- Queue filters hardcoded a subset of kinds.

## 3. Final canonical taxonomy

One authoritative application-level type: `InboxItemKind` in
`modules/inbox/application/inbox-constants.ts` (as-const object + derived union).
The typed payload is a Zod discriminated union (`typedReviewItemSchema`) keyed by
the same `InboxItemKind` values — no separate Spec type layer remains.

```text
unmapped_expense
income_suggest
savings_maturity
early_withdrawal_confirmation
emi_complete
emergency_declaration
```

| Kind | Producer | Source type | User outcome | Terminal statuses |
| --- | --- | --- | --- | --- |
| `unmapped_expense` | `record_transaction` | transaction | resolve_to_jar, dismiss | resolved, dismissed, auto_resolved |
| `income_suggest` | `record_transaction` | transaction | resolve_to_jar, dismiss | resolved, dismissed, auto_resolved |
| `savings_maturity` | `detect_matured_savings`, `enqueue_savings_maturity_cascade` | guided | acknowledge (renew/switch/withdraw/confirm_configured/choose_package/change_settlement/remind_tomorrow/dismiss) | acknowledged, dismissed |
| `early_withdrawal_confirmation` | savings app workflow (`upsertSavingsEarlyWithdrawalInboxItem`) | guided | acknowledge (confirm/cancel/dismiss) | acknowledged, dismissed |
| `emi_complete` | `record_installment_payment`, loan/card payment RPCs | guided | acknowledge (celebrate/later) | acknowledged |
| `emergency_declaration` | `reallocate_jar_capacity` | plan_movement | dismiss | dismissed |

## 4. Removed / merged kinds

```text
savings_matured       -> MERGED into savings_maturity
renewal_required      -> MERGED into savings_maturity
penalty_warning       -> REMOVED (never produced)
rate_changed_suggestion -> REMOVED (never produced)
package_expired       -> REMOVED (never produced)
payment_reminder      -> MOVED OUT OF INBOX (no actionable outcome; producer unused)
```

Legacy kinds are still readable at the boundary: `INBOX_KIND_MIGRATION_MAP`
maps `savings_matured`/`renewal_required` to `savings_maturity`; the others map
to `null` and are filtered out of every queue query so they can never re-enter
the active queue.

## 5. Outcome contract per kind

Defined as data in `modules/inbox/application/review-item-schemas.ts`
(`OUTCOMES_BY_KIND`, `TERMINAL_STATUSES_BY_KIND`, `ACK_ACTION_BY_KIND`,
`kindExpiresAt`, `kindAutoResolvable`) and enforced by the ack-action schema in
`commands/review-items.ts`.

| Kind | Allowed outcomes | Required context | Optional context | Expiry | Auto-resolve |
| --- | --- | --- | --- | --- | --- |
| `unmapped_expense` | resolve_to_jar, dismiss | transaction id, amount, currency | suggested jar/category, merchant key, confirmation count | none | ≥0.90 confidence + suggested jar |
| `income_suggest` | resolve_to_jar, dismiss | transaction id, amount, currency | suggested jar/category | none | ≥0.90 confidence + suggested jar |
| `savings_maturity` | acknowledge set + dismiss | saving id, cycle id, amount, currency | renewal policy, recommended packages, warnings | 31 days | never |
| `early_withdrawal_confirmation` | confirm, cancel, dismiss | saving id, cycle id, net returned, penalty | full penalty breakdown | none | never |
| `emi_complete` | celebrate, later | installment plan id or debt id | — | none | never |
| `emergency_declaration` | dismiss | intent note, source/target jar | executed-by user | none | never |

## 6. Lifecycle state machine

States unchanged (7), semantics made explicit:

```text
PENDING (only active state)
   ├── RESOLVED          (user chose jar)
   ├── ACKNOWLEDGED      (user decision; Savings owns any money outcome)
   ├── DISMISSED         (user removed from attention)
   ├── EXPIRED           (time-bound window passed)
   └── AUTO_RESOLVED     (pattern/merchant, ≥0.90 confidence)
ARCHIVED is a history/presentation classification, not a user-chosen outcome.
No read/unread state (decided; revisit in Prompt 13C if volume demands).
```

`INBOX_ACTIVE_STATUS_VALUES` = `[pending]`; `INBOX_TERMINAL_STATUS_VALUES` =
resolved/dismissed/acknowledged/expired/auto_resolved.

## 7. DB/storage changes

Migration `supabase/migrations/20260817090000_inbox_taxonomy_canonical.sql`:

- `inbox_items_kind_check` tightened to the 6 canonical kinds.
- Legacy `savings_matured`/`renewal_required` rows updated to `savings_maturity`
  with a `legacyKind` marker in `context_json`.
- Removed-kind rows (`penalty_warning`, `rate_changed_suggestion`,
  `package_expired`, `payment_reminder`) archived with a `removedByTaxonomy`
  marker — they can never surface in the active queue.
- `acknowledge_inbox_item`, `resolve_inbox_item_to_jar`,
  `auto_resolve_inbox_item` rewritten to canonical-kind guards.
- `detect_matured_savings` and `enqueue_savings_maturity_cascade` rewritten to
  write the single canonical `savings_maturity` kind.

Note: Docker/Supabase CLI is not running in this environment, so the migration
was not executed against a live database. It was reviewed statically and
follows the same `create or replace` + constraint pattern as prior migrations.

## 8. UI changes

- `inbox-queue-list.tsx`: filters now derive from `INBOX_ITEM_KIND_VALUES`
  (no hardcoded subset); legacy `kind === null` rows are skipped.
- `inbox-decision-panel.tsx`: canonical typing; payment-reminder panel removed;
  dismiss remains for all kinds; legacy-kind items render a dismiss-only guard.
- `inbox-source-link.tsx`: canonical kinds only; savings link uses
  `SAVINGS_MATURITY`; removed payment-reminder path.
- `[id]/page.tsx`: null-safe kind/typed; no `types.*` i18n; decision question
  only when the kind is canonical.
- `plan/emergency-inbox-banner.tsx`: null-safe kind before partner check.
- `messages/en|vi/inbox.json`: removed dead `why.*`/`kinds.*` entries and the
  entire `types` block; canonical kinds only.

Browser evidence (light mode): `/en/inbox` queue with 6 canonical filters,
item detail with resolve panel, resolve→receipt→empty-state flow, archived tab
showing resolved items — captured at 390, 440, 768, 1280.

## 9. Tests added/updated

- `tests/unit/inbox-decisions.test.ts` — canonical mapping, legacy merge
  (`savings_matured`/`renewal_required` → `savings_maturity`), removed kinds →
  null, ack schema, mapper null for legacy.
- `tests/unit/sprint3-inbox-decision.test.ts` — every canonical kind
  instantiates + parses; taxonomy contract (outcomes/terminal/ack per kind,
  legacy never canonical, auto-resolve only jar kinds); BR-16 confidence;
  BR-21 single-kind cascade.
- `tests/unit/inbox-error-handling.test.ts` — count query with canonical-kind
  `.or()` filter.
- `tests/unit/inbox-display.test.ts` — title resolution without generic titles.
- `tests/unit/savings-domain.test.ts`, `savings-renewal-policy.test.ts`,
  `plan-month-ritual.test.ts` — canonical `SAVINGS_MATURITY` /
  `EMI_COMPLETE` references.

## 10. Validation results

- `npx tsc --noEmit` — pass.
- `npm run lint` — pass.
- `npm run test` — Inbox/savings/plan affected suites: 8 files, 96 tests pass.
  Full suite: only pre-existing failures remain (the `React.act is not a
  function` component-test environment issue and 4 files that fail on a clean
  tree: `i18n-messages`, `plan12-migration-hardening`, `health-readonly-shield`,
  `phase-f7-safety`). Verified by stashing changes and re-running.
- `npm run build` — pass.
- `npx playwright test tests/e2e/inbox-decisions.smoke.spec.ts` (+ together
  smokes) — 5 passed, credential-gated tests skipped as designed.
- `format:check` — fails on 2207 files including the clean tree (2203);
  not a working gate. My changed files pass `npx prettier --check`.

## 11. Remaining issues for Prompt 13B

- Direct `insert into public.inbox_items` still lives in domain RPCs
  (`record_transaction`, `record_installment_payment`, loan payment,
  `reallocate_jar_capacity`, savings detect/cascade). 13B should introduce the
  Inbox producer gateway and migrate these writers.
- The canonical ack action list still lives in two places (app schema and the
  `acknowledge_inbox_item` RPC). 13B can consolidate via the producer/contract.
- `due_at` column is now unused by any canonical kind (payment reminder was the
  only writer). Consider dropping it in a later cleanup.
- Savings maturity active window (31 days) is defined only in the app layer;
  the RPC-level expiry sweep (`run_inbox_staleness_worker`) currently expires
  only `payment_reminder`. If maturity items should expire, the worker needs a
  canonical-kind clause (13C/13B scope).

---

## Completion criteria check

- [x] One authoritative Inbox taxonomy (single `InboxItemKind` + discriminated
      payload union; no parallel Spec/display layer).
- [x] Every retained type has a valid outcome contract (data-driven tables +
      schema validation).
- [x] Persisted kinds and app types cannot silently diverge (legacy map +
      null-safe mapper + queue filters).
- [x] Every active type has valid UI handling (detail + decision panel +
      source link + filters).
- [x] Dead/ambiguous kinds removed or merged (4 removed, 2 merged, 1 moved
      out).
- [x] Lifecycle semantics explicit (active/terminal/archived separation).
- [x] Tests enforce the contract (taxonomy, exhaustiveness, outcomes,
      lifecycle, rendering, removed kinds).
- [x] lint/typecheck/build/relevant tests pass.

---

PROMPT 13A COMPLETE

Canonical Inbox types:
`unmapped_expense`, `income_suggest`, `savings_maturity`,
`early_withdrawal_confirmation`, `emi_complete`, `emergency_declaration`

Removed or merged:
removed `penalty_warning`, `rate_changed_suggestion`, `package_expired`;
merged `savings_matured` + `renewal_required` into `savings_maturity`;
moved `payment_reminder` out of Inbox.

Lifecycle:
`pending` (active) → `resolved` | `acknowledged` | `dismissed` | `expired` |
`auto_resolved`; `archived` is history presentation only.

Validation:
typecheck, lint, build, affected unit tests (96), Inbox E2E smoke all pass;
remaining full-suite failures are pre-existing on the clean tree.

Next:
Prompt 13B — Inbox producer gateway.
