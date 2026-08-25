# INBOX 18A — Reference Gap Audit

Date: 2026-08-24  
Scope: current working tree; audit only, no production fixes implemented.

## Verdict

`INBOX AUDIT BLOCKED`

The focused domain checks, typecheck, and build pass, but Inbox is not reference-ready. The live authenticated browser states could not be verified because the configured E2E login remained pending against the reused development server, and the implementation has one privacy/security defect plus multiple core contract gaps.

Counts: **P0 1 · P1 7 · P2 2**

## P0 findings

### P0-01 — Privacy ON does not mask Inbox amounts

Inbox queue and detail format `item.amount` directly into `ReviewCard` (`app/[locale]/(product)/inbox/inbox-queue-list.tsx:221-226`, `app/[locale]/(product)/inbox/[id]/page.tsx:185-201`). `ReviewCard` renders `amountLabel` as plain text; it does not use `FinancialValue`. Privacy masking therefore cannot apply to Inbox monetary values. The decision panel also passes formatted monetary values into confirmation rows (`app/[locale]/(product)/inbox/inbox-decision-panel.tsx:556-566`).

Expected: Privacy ON masks every amount while title/status/date/action context remains visible. This is a financial privacy exposure.

## P1 findings

### P1-01 — Loans/Debt attention taxonomy is missing

The canonical Inbox taxonomy contains only `unmapped_expense`, `income_suggest`, `savings_maturity`, `early_withdrawal_confirmation`, `emi_complete`, and `emergency_declaration` (`modules/inbox/application/inbox-constants.ts:9-21`). Loan integration emits only `emi_complete`; no Inbox producer or typed contract exists for due, overdue, payment attention, or debt attention. Existing loan due-state contracts are therefore not represented in Inbox.

### P1-02 — Active personal items are presented as actionable to non-owners

The read model resolves source ownership, but `resolveInboxSourceCapabilities` only disables execution for former owners; an active non-owner receives `canExecuteOutcome: true` (`modules/inbox/application/inbox-source-capabilities.ts:16-33`). The queue then links the item and the decision panel renders actions. Database triggers/owning RPCs protect the financial write, so no money mutation bypass was proven, but User B can be offered an action on User A's personal item and only discover the denial after submission.

### P1-03 — Read/unread semantics are absent

Inbox models only lifecycle statuses (`pending`, terminal/archive states); there is no read state, mark-read/unread action, or deterministic unread-count contract. The navigation count is a pending-item count, not unread count. Read state is therefore not distinct from resolution/action state as required.

### P1-04 — Open Inbox list is unbounded

`loadOpenInboxItems` orders the entire pending queue without `.limit()` or pagination (`modules/inbox/application/queries/review-items.ts:204-231`). Archived history is capped at 100, but the active queue and its enrichment arrays are not bounded. This violates the bounded-list/performance contract and can turn a large queue into a large response plus large client render.

### P1-05 — Partial enrichment failure is atomic for the whole list

Transaction and savings enrichment queries throw on error (`modules/inbox/application/queries/review-items.ts:130`, `:112`), and the outer query returns `null` for the entire Inbox. One unavailable linked resource can therefore replace the complete list with the generic load-error state instead of preserving unaffected items with a safe unavailable-resource marker.

### P1-06 — Canonical navigation is incomplete

`InboxSourceLink` resolves transactions, savings, and plan/jar destinations only (`app/[locale]/(product)/inbox/inbox-source-link.tsx:25-71`). There is no loan or debt destination mapping. In particular, `emi_complete` has no typed loan source link, so a supported loan-generated item cannot navigate to the current canonical Loans route. No stale route was found, but supported destinations are incomplete.

### P1-07 — Lifecycle context/date is not rendered

The read model carries `createdAt` and `expiresAt`, but queue/detail rendering does not display either. Maturity/expiry/settlement context is consequently not visible in the item itself, making lifecycle decisions harder to distinguish from generic attention and weakening the required title/status/date/action context.

## P2 findings

### P2-01 — Focused browser harness is not runnable to authenticated Inbox state

The requested focused Playwright run failed before tests because `reuseExistingServer: false` attempted to start a second Next server while port 3100/3101 was already occupied. Direct browser inspection reached `/en/login` and verified unauthenticated redirect, but the configured E2E account's login action remained pending, so populated, actionable, owner-unavailable, privacy-toggle, and responsive authenticated states lack browser evidence.

### P2-02 — Focused coverage does not characterize the missing reference states

The focused tests cover canonical producer/idempotency, savings workflows, loan integrity/due-state primitives, Plan recommendations/rituals, Together membership, privacy primitives, and i18n. They do not exercise Inbox due/overdue/debt items, read/unread behavior, active non-owner personal items, bounded active-list behavior, partial enrichment, or Inbox amount masking in a browser/component test.

## Explicit item classification

| Canonical item                  | Classification                | Evidence/semantics                                                                          |
| ------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| `unmapped_expense`              | action required               | Resolve to a jar, dismiss, or auto-resolve; financial outcome remains in Transactions/Plan. |
| `income_suggest`                | action required               | Resolve to a jar, dismiss, or auto-resolve.                                                 |
| `savings_maturity`              | lifecycle decision            | Renewal, package/settlement choice, withdrawal, reminder, or dismissal.                     |
| `early_withdrawal_confirmation` | lifecycle decision            | Confirm or cancel a savings early-withdrawal workflow.                                      |
| `emi_complete`                  | informational                 | Completion acknowledgement (`celebrate`/`later`); no payment mutation from Inbox.           |
| `emergency_declaration`         | ownership/system notification | Targeted household/partner notification from a plan movement; dismiss-only in Inbox.        |

No current canonical kind is explicitly classified as a generic informational reminder or generic attention-only item. Legacy `payment_reminder`, `penalty_warning`, and similar kinds are intentionally removed/filtered rather than silently surfaced.

## Audit matrix

### Inbox semantics and lifecycle

- Open and Archived tabs exist; terminal statuses are read-only in history.
- Actions/resolution are distinct from lifecycle status at the mutation layer, but read/unread is missing (P1-03).
- Stable item identity and gateway dedupe exist via `dedupe_key` and the producer RPC.
- Savings retry/idempotency and sibling cascade cancellation are covered by passing focused tests; no duplicate decision was observed in the audited contracts.
- Savings settlement/early-withdrawal workflows call the owning Savings workflow before Inbox acknowledgement. Source-level cleanup is present, but authenticated browser proof was blocked.

### Loans and Debt

- Canonical remaining/due-state calculations and owner-guard tests pass.
- Inbox does not consume due/overdue/payment-attention states; only loan completion produces `emi_complete` (P1-01).
- No debt-generated Inbox item contract or canonical debt route link is present (P1-01/P1-06).

### Plan

- Plan recommendations and Monthly Review are separate Plan surfaces; no Inbox producer was found for either, so no duplicate Inbox action was observed.
- Monthly Review remains a non-blocking Plan flow in the audited tests.
- No legacy Quick Close/Ritual Inbox item is in the active canonical taxonomy.

### Together, ownership, and authority

- Household scoping is applied to Inbox reads; no cross-household path was found.
- Former-owner handling is represented and covered by unit tests; former-owner items are non-actionable/read-only in the UI.
- Owning RPCs/triggers protect source mutations, and focused authority tests pass; no P0 authority bypass was proven.
- Active personal non-owner presentation is still incorrectly actionable until the mutation attempt (P1-02).

### Navigation, privacy, states, and responsive UX

- Transaction, Savings, Plan, empty, filtered-empty, load-error, not-found, offline banner, reduced-motion, and terminal-history paths exist in code.
- Loan/Debt source navigation is incomplete (P1-06).
- Amount masking is not applied to Inbox monetary text (P0-01).
- No raw i18n keys were reported by the focused i18n tests; EN/VI message parity passes.
- Static review found no Inbox-specific horizontal-overflow rule violation; the browser matrix (390 VI/light, 440 EN/dark, 768, 1280, privacy ON/OFF, reduced motion) could not be completed because authenticated browser state was unavailable (P2-01).

## Validation run

Passed:

- Focused Inbox/Savings/Loans/Debt/Together/privacy/i18n batch: **14 files, 81 tests**.
- Focused Plan/Debt/i18n/Inbox decision batch: **8 files, 60 tests**.
- `npm run typecheck`
- `npm run build`

Not completed:

- Focused Inbox browser smoke: harness could not start a second server; direct login remained pending on the reused server.
- Full unit suite intentionally not run, per 18A instruction.

## Smallest recommended implementation sequence

1. Fix the P0 privacy boundary: make every Inbox amount render through `FinancialValue`, including decision/confirmation summaries, then add one Inbox privacy regression test.
2. Fix ownership presentation: derive active non-owner capability from the canonical ownership contract, make the item read-only/unavailable before actions, and retain server-side owning-module authorization.
3. Add the reference-ready Loans/Debt Inbox contract (due, overdue, payment attention, owner-unavailable/resolved behavior) and canonical loan/debt links.
4. Add read/unread as independent state, display lifecycle dates/status context, and preserve deterministic unread counts.
5. Bound the open query and make enrichment row-tolerant; add focused tests for pagination/bounds and one-item enrichment failure.
6. Repair the E2E server reuse/auth fixture, then run the required 390/440/768/1280 EN/VI, light/dark, privacy, reduced-motion, offline/error, and owner-unavailable browser matrix.

No production fixes were implemented in 18A.
