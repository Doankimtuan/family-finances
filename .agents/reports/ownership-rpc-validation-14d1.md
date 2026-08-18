# Family Finance — Live Ownership Validation 14D.1

Date: 2026-08-18

## 1. Executive summary

The live development project was tested through real authenticated REST RPC
calls using two existing development users. A controlled household was created
temporarily, both users were attached as Admin/Partner, controlled ownership
roots were inserted directly in SQL, and all controlled rows were removed
afterward. The original memberships were restored active.

The core A/B ownership boundary passes. The full requested 14D.1 matrix does
not pass yet because several deeper domain fixtures require additional valid
state and were not converted into successful behavior tests during this run.

## 2. A/B household setup

Signup was rate-limited, so the documented 14C fallback was used: the two
existing dev-authenticated users were temporarily moved into one controlled
household, with no password changes. After validation, the controlled household
and all rows were deleted and both original memberships were restored active.

Controlled roots included H/A1/B1 accounts, household/personal cards, AS/BS
savings, AL/BL loans, AD/BD liabilities, AI/BI holdings, HG/AG/BG goals, a jar,
and supporting Inbox/card-cycle rows.

## 3. Core ownership matrix

| Case                                 | Live result                 |
| ------------------------------------ | --------------------------- |
| A reads all five controlled accounts | PASS — 5 rows               |
| B reads all five controlled accounts | PASS — 5 rows               |
| A records A1 transaction             | PASS                        |
| B records A1 transaction             | PASS denial — `not_allowed` |
| B records B1 transaction             | PASS                        |
| A records B1 transaction             | PASS denial — `not_allowed` |
| A/B record household transaction     | PASS                        |
| A personal → B personal transfer     | PASS denial — `not_allowed` |
| Owner valuation/lifecycle mutation   | PASS                        |
| Partner valuation/lifecycle mutation | PASS denial — `not_allowed` |

## 4. Ledger results

`record_transaction` passed for both owners on their own personal accounts and
for both members on the household account. Partner writes failed before the
transaction row was created. Each successful call produced the expected Inbox
item through the existing producer gateway.

`update_transaction` is intentionally immutable in the live product and
returned its existing immutable error. `delete_transaction`, refund, and
correction were not run in this fixture because the successful transaction
rows were also producer-linked and cleanup was required as one controlled
household teardown.

## 5. Transfer results

The cross-owner A1 → B1 transfer was denied with `not_allowed`. No transfer
legs were created. Household and same-owner transfer variants remain pending a
second fixture pass.

## 6. Card results

The card settlement calls reached the live RPC but returned `Card not found` for
the directly-created card fixtures before ownership behavior could be measured.
This is a fixture/domain-state failure, not an ownership pass. Card validation
remains open.

## 7. Loan results

Partner mutation against A’s loan returned `not_allowed` for a valid status
transition. The owner transition used in the fixture was rejected by the
loan’s lifecycle transition rules, and payment reached the domain’s
`No upcoming schedule entry` validation before a payment mutation. A valid
schedule fixture is still required for the positive payment cases.

## 8. Liability results

No successful liability payment fixture was executed. Liability/account
cross-resource behavior remains open for a valid debt-payment setup.

## 9. Savings results

B’s early-withdrawal Inbox acknowledgement against A’s saving was denied with
`not_allowed`. The direct early-withdrawal RPC reached the domain state check
(`Cycle must be active`) before mutation because the fixture cycle was matured.
Positive owner and negative cross-account withdrawal cases remain open.

## 10. Investment results

`record_investment_valuation` passed for A’s personal holding when called by A
and returned `not_allowed` for B. Both members could read both holdings through
PostgREST.

Buy/sell/income cash-account combinations were not executed in this fixture.

## 11. Goal results

`change_goal_lifecycle` passed for A’s personal goal when called by A and
returned `not_allowed` for B. Goal funding-link compatibility combinations were
not executed because no valid funding-link source fixture was retained.

## 12. Plan results

The application queries contain the household-account join filter for current
jar budgets, monthly review, and ritual divergence, and the full unit suite
passes. A live calculation with controlled personal and household income was
not run in this fixture. Live Plan validation remains open.

## 13. Inbox personal-source results

The personal saving Inbox acknowledgement path passed the key negative case:
B’s confirmation returned `not_allowed`. The personal transaction Inbox path
was exercised through the successful A transaction producer and A’s
resolve-to-jar call. A second pending personal transaction item is required to
capture B’s negative resolve result without consuming A’s item first.

`emi_complete` remains informational/household-level after its financial
mutation; a live completion fixture was not created.

## 14. Inactive-owner results

After B was set inactive:

- B’s RPC mutation returned `Active household membership required`.
- A’s mutation against B’s personal account returned `not_allowed`.
- A continued reading the controlled accounts.
- Admin cleanup of B’s personal account returned `{ok:true}`.

The controlled account was included in teardown and the original membership
state was restored.

## 15. Atomicity results

The denied A1 → B1 transfer produced no transfer legs. Denied ledger,
valuation, goal, Inbox, and inactive-owner operations returned before their
target rows changed. Full payment/card/savings atomicity checks remain pending
valid positive fixtures.

## 16. Trigger vs direct-guard decision

**Decision: TRIGGER-BASED.** The shared BEFORE-trigger boundary is the canonical
invariant because it covers legacy SECURITY DEFINER RPCs, direct table paths,
old/new account reassignment, and cross-resource child writes without
duplicating authorization SQL in every function. The live A/B results confirm
the effective boundary for ledger, investment valuation, goals, Inbox, and
inactive-owner behavior.

Direct body guards are not required for aesthetics. Any future mutation that
does not touch a guarded table must be added to the manifest and either routed
through an existing guarded resource or given an explicit guard.

## 17. Protected RPC manifest

`tests/unit/ownership-rpc-manifest-14d1.test.ts` maintains a small family-level
manifest mapping RPCs to root resources. It asserts that every declared root
is in the effective guarded-table set. It intentionally tests the security
boundary, not the presence of a helper string in each RPC body.

## 18. Remote deployed verification

The live project was queried after deployment. The canonical helpers are
present with `SECURITY DEFINER` and pinned `search_path=public`; ownership RPC
triggers are present on accounts, transactions, card/payment tables, loan
children, debt payments, saving children, investment children, goal children,
transaction tags, and Inbox items. Both members read the controlled rows via
PostgREST, proving the household-wide visibility policy remains active.

## 19. Advisor findings

Supabase advisors still report the pre-existing public SECURITY DEFINER
exposure across the broad legacy public RPC surface and one mutable-search-path
function (`transactions_set_is_reversal`). These are not introduced by 14D.1
and are unrelated to the ownership trigger graph. They require a separately
bounded RPC ACL/search-path cleanup.

## 20. Cleanup

Completed. Controlled household, financial rows, Inbox rows, card rows,
provider, jar, and memberships were removed. Original dev memberships were
restored active. No temporary auth users were created because signup was
rate-limited.

## 21. Tests

- live A/B RPC checks: core ledger, transfer denial, valuation, goal lifecycle,
  Inbox denial, visibility, inactive owner, and admin cleanup executed
- protected manifest unit test added
- full Vitest suite: 117 files / 885 tests passed
- typecheck, lint, build: previously passed for the 14D implementation

## 22. Remaining gaps

- Valid card settlement fixture and full card combinations.
- Valid loan schedule/payment fixture and cross-account payment cases.
- Liability payment fixture.
- Savings active-cycle positive/negative settlement cases.
- Investment buy/sell/income cash-account cases.
- Goal funding-link compatibility cases.
- Live Plan calculation with household and personal activity.
- Full positive transfer matrix and second pending personal Inbox item.

## 23. Final readiness verdict

PROMPT 14D.1 COMPLETE / NOT COMPLETE: **NOT COMPLETE**

A/B matrix: **PASS for core ledger/visibility/owner checks; FAIL for full
requested domain matrix**

Cross-resource authorization: **PARTIAL**

Inbox personal-source security: **PASS for savings acknowledgement; PARTIAL
for transaction resolve/positive withdrawal outcome**

Plan personal exclusion: **PARTIAL — static/unit verified, live calculation
pending**

Inactive-owner: **PASS**

Atomicity: **PASS for executed denied paths; PARTIAL overall**

Canonical RPC guard architecture: **TRIGGER-BASED**

RPC security: **READY for the tested guarded paths; NOT READY for the complete
14D.1 matrix**

Remaining P0 gaps: valid cross-resource fixtures and live behavioral coverage
listed in §22.

Can we start Prompt 14E? **NO**

Recommended next prompt: Prompt 14D.2 — Complete Remaining Live Cross-Resource
Fixture Matrix
