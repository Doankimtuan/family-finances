# BASELINE 19A — Remaining Test Contract Cleanup

Date: 2026-08-24

## Verdict

`REFERENCE BASELINE GREEN`

## Reproduction

The minimum focused run reproduced exactly five failures:

```text
npm test -- --run \
  tests/unit/ownership-schema-14b.test.ts \
  tests/unit/ownership-rls-14c.test.ts \
  tests/unit/ownership-rpc-14d.test.ts \
  tests/unit/ownership-ui-14e.test.ts \
  tests/unit/plan12-migration-hardening.test.ts \
  tests/unit/i18n-messages.test.ts
```

Initial result: 3 files failed, 5 tests failed, 147 tests passed.

| Test                                                                            | Failure                                                                      | Classification                                                                                        |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `tests/unit/ownership-rls-14c.test.ts` — investment holdings immutability prose | Expected obsolete `investment_holdings is select-only to authenticated` text | Stale test debt; the current invariant is no ownership-immutability trigger for the select-only root. |
| `tests/unit/ownership-rls-14c.test.ts` — production capability prose            | Expected removed 14C historical app-layer prose                              | Stale test debt; database ownership-column write revokes and current RLS/RPC guards remain.           |
| `tests/unit/ownership-rls-14c.test.ts` — RPC gap prose                          | Expected removed `14D` handoff wording                                       | Stale test debt; current security-definer helper and pinned search path are asserted instead.         |
| `tests/unit/ownership-schema-14b.test.ts` — investment holdings lock prose      | Expected obsolete select-only comment                                        | Stale test debt; the current invariant is no interim write-lock trigger for investment holdings.      |
| `tests/unit/plan12-migration-hardening.test.ts` — timezone fallback             | Expected obsolete `Asia_Ho_Chi_Minh`; migration uses `Asia/Ho_Chi_Minh`      | Stale test debt; one-time household-local period backfill semantics are unchanged.                    |

No production code, migration, financial behavior, or UX was changed.

## Ownership contract check

The current certified behavior remains aligned:

- owner: personal resources are mutation-authorized only for the active owner;
- active household non-owner: household resources are readable and writable by
  active members, while another member's personal resources are read-only;
- former member: membership is inactive, so access and mutation fail closed;
- household-owned resource: active household membership provides shared access;
- read-only capability: investment holdings remain select-only at the table
  boundary and source capabilities do not fabricate mutation authority;
- server-derived authority: ownership fields are not trusted from browser input;
  membership, scope, and owner checks remain enforced by server/RLS/RPC logic.

The focused ownership tests passed after replacing prose assertions with these
current invariants. No ownership/security check was weakened.

## Plan and migration string contracts

`plan.unknownGoal` and `plan.unknownJar` are present in both English and
Vietnamese catalogs. The EN/VI message parity test passed, so no message change
was needed. Plan behavior and UX were not changed.

The migration test now checks the period-truncation/timezone/backfill structure
with a whitespace-tolerant assertion and the current `Asia/Ho_Chi_Minh`
fallback, rather than requiring the obsolete literal spelling or formatting.
Applied migrations were not rewritten.

## Validation

- Focused affected tests: **6 files, 152 passed**.
- Full unit suite: **158 files, 1,110 passed, 0 failed**.
- Repository lint: **passed**.
- Typecheck: **passed**.
- Production build: **passed**.
- No repository-wide formatting cleanup was run.

The full unit suite covered the regression boundaries for Plan, ownership/
Together, Inbox, Accounts, Savings, Investments, Loans, and Debt. No skipped
tests were added.
