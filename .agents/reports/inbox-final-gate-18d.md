# INBOX 18D — Final Reference Gate

Date: 2026-08-24

## Verdict

`INBOX REFERENCE READY`

No concrete Inbox blockers remain.

## Contract verification

- Taxonomy is explicit and typed: informational, attention, action required,
  lifecycle decision, and ownership/system notification. Urgency is not
  inferred from copy, dates, or sign alone.
- Savings maturity, action-required, early-withdrawal confirmation, settlement,
  rollover, retry dedupe, and resolved/settled cleanup remain producer-owned.
- Loan due-soon/overdue and Debt attention use canonical due-state/direction
  context, deterministic dedupe, and transition/archive behavior. Inbox has no
  owning-domain mutation authority.
- Owner actionable, active household non-owner read-only, former-member
  read-only, household-owned, cross-household, and unavailable-source
  capabilities are preserved.
- Queue, detail, decision, confirmation, and review monetary values use the
  privacy-aware `FinancialValue` path; privacy masking covers accessible output.
- `read_at` is independent of lifecycle status. Read/unread mutations are
  idempotent, do not resolve/dismiss, and the badge means unread open items.
- Open queue reads are bounded to 25 items with deterministic
  `(created_at, id)` keyset pagination. Cursor mutation, archive filtering, and
  no-duplicate/no-skip behavior are covered by focused tests and E2E.
- Enrichment returns typed READY/UNAVAILABLE/READ_ONLY states; a missing source
  preserves the row/detail, suppresses source mutation, and does not fabricate
  data or fail unaffected rows.
- Lifecycle context uses source dates: due/overdue, maturity, expiry, and
  created date where useful. No deadline is derived from `createdAt`.
- Canonical source navigation remains Transactions, Savings, Loans, Debt, Plan,
  Together, and linked Loan for `emi_complete`; no stale Inbox route was found.
- Monthly Review remains optional; no legacy Quick Close/Ritual Inbox item is
  exposed and Plan recommendations do not duplicate Inbox decisions.

## Remote security verification

Remote project `bbzffxvgocjwsdbujvgn` was rechecked after applying
`20260824070000_inbox_final_acl_18d.sql`:

- `anon` has no table or `read_at` update grant.
- `authenticated` has SELECT and `read_at` UPDATE only through household-scoped
  RLS policies.
- Inbox sync RPC execution is limited to authenticated/postgres/service roles;
  no anon/public mutation execute grant exists.
- Existing Supabase advisor notices are unrelated project-wide findings; the
  Inbox ACL/RPC checks above are clean.

## Deterministic browser certification

Disposable fixture: `INBOX 18C1`, stable IDs/dedupe keys, 75 open items,
read/unread rows, Savings lifecycle, Loan due/overdue, Debt attention, owner
actionable, non-owner read-only, unavailable linked source, and lifecycle dates.
Setup is rerunnable, uses no financial movements, and cleanup completed with no
fixture state file left behind.

Dedicated populated matrix: **4 passed** at:

- 390px, Vietnamese, light, reduced motion
- 440px, English, dark
- 768px regression
- 1280px regression

Coverage included read/unread and badge changes, mark read/unread, three pages
of 25 items, stable pagination after read mutation, unavailable source
resilience, ownership capabilities, lifecycle context, privacy OFF/ON,
navigation, raw-key checks, and horizontal-overflow checks.

Legacy Inbox smoke coverage with the fixture completed **3 passed, 1 skipped**;
the skip is intentional when the first row is read-only/source-unavailable.

## Validation

- Inbox-focused unit/query/enrichment/integration checks: **72 passed**.
- Broader relevant batch: all Inbox-related cases passed; one unrelated Plan
  migration string contract remains in that batch.
- Full unit suite: **1105 passed / 1110 tests; 155 passed / 158 files**. The
  five failures are existing ownership/Plan string-contract expectations and
  are outside Inbox.
- Repository lint: passed.
- Typecheck: passed.
- Production build: passed.
- No repository-wide format cleanup was run.
