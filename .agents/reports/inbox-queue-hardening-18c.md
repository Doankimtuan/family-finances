# INBOX 18C — Read State + Bounded Queue + Resilient Enrichment

Date: 2026-08-24

## Verdict

`INBOX QUEUE READY`

18C.1 closed the remaining populated-authenticated-browser certification
blocker with a deterministic, disposable fixture and a passing browser matrix.

## Implemented

- Added nullable `inbox_items.read_at` with open-queue cursor/unread indexes.
- Added idempotent mark-read and mark-unread commands and server actions.
- Navigation badge now means unread open Inbox items (`read_at is null`); the
  existing action-required count remains separate.
- Added bounded 25-row open-page reads with deterministic `(created_at DESC,
id DESC)` keyset pagination and load-more.
- Enrichment failures degrade affected rows to `UNAVAILABLE` while preserving
  unaffected rows. Existing ownership capability states remain read-only where
  applicable.
- Added lifecycle date/context and overdue presentation from persisted source
  context or `expires_at`; no deadline is derived from `created_at`.
- Added semantic unread state in queue links and compact read-state control in
  detail; read state does not change lifecycle status.
- Added a stable 75-row synthetic fixture and focused queue/read/enrichment
  regression checks.
- Added rerunnable fixture setup/cleanup at `scripts/inbox-18c1-fixture.mjs`
  with deterministic IDs, dedupe keys, owner/non-owner records, unavailable
  source coverage, and three bounded pages of open items.
- Added populated Inbox certification at
  `tests/e2e/inbox-18c1-populated.smoke.spec.ts`.
- Added the narrow authenticated read-state ACL migration and refreshed the
  navigation badge after idempotent read-state mutations.

## Validation

Passed:

- Focused Inbox tests: **5 files, 43 passed**.
- Changed-file ESLint: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Populated authenticated Inbox browser certification: **4 passed** using
  `.env.local` with fixture cleanup: 390px VI/light with reduced motion,
  440px EN/dark, 768px regression, and 1280px regression.
- Browser coverage included unread/read semantics, badge changes, mark
  read/unread, lifecycle context, 25/50/75 pagination, unavailable source
  resilience, owner/non-owner capabilities, privacy OFF/ON, no raw i18n keys,
  and no horizontal overflow.
- Fixture isolation check: deterministic fixture state file absent after
  cleanup.

Full unit suite and repository-wide lint were not run, per 18C scope.
