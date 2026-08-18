# Family Finance — Ownership RPC Validation 14D.4

Date: 2026-08-18

## Executive result

**PROMPT 14D-T.1 COMPLETE / NOT COMPLETE: NOT COMPLETE**

The dedicated A/B harness reached READY and the remaining live matrix was
executed. RPC security is not READY because a valid owner EMI-completion call
exposed a real deployed contract bug, and the corrective migration could not
be deployed without the configured Supabase database password.

No trigger-based ownership architecture was changed. No trigger bypass was
found.

## Environment and identity safety

- Required public URL/key, A/B credentials, and modern secret key: present.
- `SUPABASE_SECRET_KEY` was preferred over the legacy service-role fallback.
- A and B are dedicated Auth users created/reused by the harness.
- A is admin and B is partner in the same controlled household.
- Existing developer memberships, households, and passwords were not changed.
- Controlled financial fixtures were removed by harness cleanup; dedicated Auth
  identities remain persistent by design.

## Live matrix

| Family        | Result | Evidence                                                                                                                                                                       |
| ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Goals         | PASS   | Supported `savings_account` funding path; household/household and A/A pass; cross-owner and cross-scope denials leave no link, contribution, funded-total, or source mutation. |
| Cards         | PASS   | A/A and household-card/A-personal funding pass; partner and cross-owner paths denied without payment, application, source, or billing mutation.                                |
| Loans         | FAIL   | A-personal/A-account passed and unauthorized paths were denied; the household-loan B-positive replay was consumed by the first payment and is not cleanly certified.           |
| EMI complete  | FAIL   | B final payment denied; valid A final payment failed with `Missing installment/debt context`.                                                                                  |
| Liabilities   | PASS   | A-personal/A-account and household/household representatives pass; cross-owner paths denied atomically.                                                                        |
| Savings       | PASS   | A/A withdrawal pass; partner and cross-owner settlement paths denied; A renewal pass and B renewal denied.                                                                     |
| Inbox savings | FAIL   | Read and source-sensitive cancel behavior pass; positive Inbox application workflow was not rerun because the deployed EMI contract blocker remains open.                      |
| Investments   | PASS   | A personal holding with A cash buys; partner and cross-owner cash paths denied; sell and income pass with no partial denial state.                                             |
| Plan          | PASS   | Live Monthly Review server path included household income/expense and excluded controlled personal income/expense.                                                             |
| Atomicity     | PASS   | Executed denial representatives left target, child, account, payment, and Inbox state unchanged.                                                                               |

## EMI defect

`record_loan_payment` emits `loan_id` in the `emi_complete` Inbox context, while
the deployed `produce_inbox_item` validator requires `loanId`. The valid owner
final payment therefore rolls back with `Missing installment/debt context`.

The root-cause migration is recorded at
`supabase/migrations/20260818091227_ownership_emi_context_contract_14d4.sql`.
`supabase db push --linked --dry-run` was blocked by Supabase CLI authentication
because no database password is configured. The migration is not deployed.

## Inbox cancel/dismiss evidence

B could read the pending A-personal saving item. B's cancel attempt was denied
and left the saving unchanged. A's cancel attempt passed, left the saving
financially unchanged, and produced terminal Inbox status `dismissed`.
This confirms source-sensitive ownership for the tested cancel path.

The required positive `Inbox → executeEarlyWithdrawalWorkflow` path remains
open; the direct Saving RPC was not substituted for it.

## Protected RPC manifest

The static manifest test passes, but certification is **INCOMPLETE** until the
deployed EMI contract is corrected, the exact EMI sequence is rerun, the
positive Inbox application path is executed, and the live evidence is promoted
to the final manifest status. No `OPEN`, `PARTIAL`, or `MISSING` status was
silently relabeled as COMPLETE.

## Validation gates

| Gate                        | Result                                                                |
| --------------------------- | --------------------------------------------------------------------- |
| Harness setup/preflight     | PASS — `OWNERSHIP TEST HARNESS READY`                                 |
| Live ownership matrix       | PASS except household-loan B replay, EMI, and positive Inbox workflow |
| Full Vitest                 | PASS — 117 files / 885 tests                                          |
| Typecheck                   | PASS                                                                  |
| Lint                        | PASS                                                                  |
| Targeted format check       | PASS                                                                  |
| Build                       | PASS                                                                  |
| Protected RPC manifest test | PASS before final certification                                       |
| Remote migration deployment | BLOCKED — database password unavailable                               |

## Final readiness

- Goals: **PASS**
- Cards: **PASS**
- Loans: **FAIL** — clean household-loan B-positive replay remains
- EMI complete: **FAIL**
- Liabilities: **PASS**
- Savings: **PASS**
- Inbox: **FAIL**
- Investments: **PASS**
- Plan: **PASS**
- Atomicity: **PASS** for executed representatives
- Protected RPC manifest: **INCOMPLETE**
- Trigger bypass: **NONE**
- RPC security: **NOT READY**
- Remaining P0 gaps: cleanly replay the household-loan B-positive case, deploy the local EMI context migration, rerun EMI, run the positive Inbox application workflow, then complete the protected RPC manifest.
- Can start Prompt 14E: **NO**
