# Family Finance — Live Ownership Validation 14D.3

Date: 2026-08-18

## 1. Executive summary

14D.3 traced the remaining goal-funding and Inbox paths and reviewed the live
trigger boundary. No ownership code or migration change was required. The
goal-funding fixture failure from 14D.2 was caused by using the invalid source
kind `account`; the supported value is `savings_account`. The deployed goal
funding trigger already enforces goal ownership, source ownership, same-scope
compatibility, and same-owner personal compatibility.

The prompt is still not complete. The remaining live matrix was not fully
executed, and no result is being promoted from static or fixture-only evidence
to PASS.

## 2. Goal funding findings

The supported creation path is
`modules/plan/application/commands/link-goal-funding.ts`, which validates the
goal/source household, source lifecycle, currency, goal type, and then inserts
`goal_funding_links`. The database trigger
`guard_goal_funding_link_mutation` additionally checks mutation authority for
both the goal and source, rejects scope mismatches with `cross_scope_not_allowed`,
and rejects different personal owners with
`cross_owner_transfer_not_allowed`.

The prior failed setup used `source_kind = 'account'`; the repository contract
uses `GoalFundingSourceKind.SAVINGS_ACCOUNT` / `savings_account`. No trigger
bypass was introduced or used. A full authenticated command-path matrix was
not completed after correcting the fixture, so Goals remain OPEN.

## 3. Card closure

14D.2 live-proved household-card/household-funding and A-personal-card/
household-funding owner/partner behavior. The same-owner-personal funding,
other-owner-personal funding, and household-card/A-personal-funding branches
were not re-executed in 14D.3. Cards remain PARTIAL.

## 4. Loan closure

14D.2 live-proved an active A-personal loan with an upcoming schedule entry,
including owner success and partner denial with no payment side effect. The
personal-account, other-owner-account, household-loan, and final-payment
branches were not completed. Loans remain PARTIAL.

## 5. EMI complete

No valid final-payment fixture was completed. The approved contract remains
owner-only financial payment followed by household-level informational
`emi_complete` acknowledgement. EMI remains OPEN.

## 6. Liability closure

14D.2 live-proved A-personal liability plus household account: A succeeded and
B was denied atomically. Personal-account and household-liability branches
were not completed. Liabilities remain PARTIAL.

## 7. Savings closure

14D.2 live-proved an active A-personal saving plus household settlement account,
including owner success and partner denial. Same-owner/other-owner settlement,
renewal, and rollover branches were not completed. Savings remain PARTIAL.

## 8. Inbox savings closure

The direct saving ownership denial was live-proven in 14D.2. The required
positive `Inbox → executeEarlyWithdrawalWorkflow → confirmEarlyWithdrawal`
path, plus cancel/dismiss semantics, was not completed through the application
server action in 14D.3. Inbox remains PARTIAL.

## 9. Investment closure

14D.2 live-proved A-personal holding plus household cash for buy: A succeeded,
B was denied. Sell, income, personal cash, other-owner cash, and conversion
branches remain unexecuted. Investments remain PARTIAL.

## 10. Plan application-flow closure

14D.2 live-proved the deployed filtered transaction query with household income
10m, personal income 90m, household expense 1m, and personal expense 9m. The
server-rendered Plan/monthly-review/ritual application path was not invoked in
14D.3. Plan remains PARTIAL.

## 11. Atomicity results

Atomicity passed for every denied branch actually executed in 14D.2:
transfers, card partner settlement, loan partner payment, liability partner
payment, saving partner withdrawal, investment partner buy, and personal Inbox
resolve. The complete representative-denial matrix is not closed, so overall
atomicity remains PARTIAL.

## 12. Protected RPC manifest

The existing `tests/unit/ownership-rpc-manifest-14d1.test.ts` remains the
canonical trigger-based regression boundary and passes. It correctly tests the
effective guarded-table graph rather than requiring helper text inside every
RPC body. It is not marked COMPLETE because live coverage still has open P0
families.

## 13. Bugs found/fixed

No production bug was fixed. The suspected goal-scope gap was disproved by the
deployed `guard_goal_funding_link_mutation` definition, which already checks
scope and personal owner compatibility. The only goal fixture defect was the
invalid source-kind literal. No migration was applied.

The validation teardown had deleted the two original development membership
rows before attempting to restore them. Those rows were recreated with their
documented IDs, original households, active state, and Admin role. Live
`active_membership_id` calls returned both expected membership IDs afterward.

## 14. Remote deployed verification

Live verification confirmed the deployed trigger graph and canonical
trigger-based architecture. Supabase advisors still report unrelated legacy
public SECURITY DEFINER exposure and `transactions_set_is_reversal` mutable
search path; these remain outside 14D.3.

## 15. Cleanup

The failed 14D.3 goal fixture transaction rolled back, so no controlled goal
household or financial rows remained. The original development memberships were
restored and verified through authenticated RPC calls. No passwords changed and
no temporary auth users were created.

## 16. Tests

- Full Vitest suite: 117 files / 885 tests passed.
- Typecheck: PASS.
- Lint: PASS.
- Build: PASS.
- Existing ownership manifest: PASS.
- Live membership restoration verification: PASS.

## 17. Remaining gaps

- Authenticated goal-funding compatibility matrix through the supported command
  path, including same-owner, cross-owner, and mixed-scope cases.
- Remaining card funding-account combinations.
- Remaining loan and liability account combinations.
- Savings same-owner/other-owner settlement and renew/rollover.
- Positive Inbox savings outcome and cancel/dismiss behavior.
- Investment sell, income, personal-cash, cross-owner-cash, and conversion.
- Full server-rendered Plan flow.
- Final loan payment and `emi_complete` household acknowledgement.

## 18. Final readiness verdict

PROMPT 14D.3 COMPLETE / NOT COMPLETE: **NOT COMPLETE**

Goals: **FAIL — live command-path matrix still open**

Cards: **PARTIAL**

Loans: **PARTIAL**

EMI complete: **FAIL — not live-proven**

Liabilities: **PARTIAL**

Savings: **PARTIAL**

Inbox: **PARTIAL**

Investments: **PARTIAL**

Plan: **PARTIAL**

Atomicity: **PARTIAL overall; PASS for executed denied branches**

Protected RPC manifest: **INCOMPLETE**

RPC security: **NOT READY**

Remaining P0 gaps: all items listed in §17.

Can we start Prompt 14E? **NO**

Recommended next prompt: Prompt 14D.4 — Execute the Remaining Authenticated
Application-Path Matrix
