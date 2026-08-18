# Family Finance — Live Ownership Validation 14D.2

Date: 2026-08-18

## 1. Executive summary

14D.2 ran a second live validation pass against the existing development
Supabase project with two authenticated users. The fixture used the existing
dev accounts, temporarily attached to one controlled household, and was
removed afterward. This pass converted the previously invalid card, loan,
debt, savings, investment-buy, transfer, Plan-scope, and Inbox fixtures into
real behavioral tests.

The complete requested matrix is still not closed. Goal funding-link
compatibility was not proven live, and the full card source-account matrix,
full investment sell/income/conversion matrix, and final EMI acknowledgement
fixture remain incomplete. No ownership bypass or trigger bypass was found.

## 2. Valid fixture strategy

The fixture used an open card billing month, an active loan with an upcoming
schedule entry, an active saving cycle, a personal liability with remaining
balance, personal investment holdings with positive quantity/cost basis, and
household/personal cash accounts. The positive-owner call was run before each
partner denial where the operation consumed lifecycle state.

The existing development users were reused without password changes. Their
memberships were temporarily moved into the controlled household and restored
to their original households and active Admin state during cleanup.

## 3. Transfer matrix

| Case                    | A                    | B                    | Result |
| ----------------------- | -------------------- | -------------------- | ------ |
| Household → household   | allowed              | allowed              | PASS   |
| A personal → household  | allowed              | denied `not_allowed` | PASS   |
| Household → A personal  | allowed              | denied `not_allowed` | PASS   |
| A personal → A personal | allowed              | denied `not_allowed` | PASS   |
| A personal → B personal | denied `not_allowed` | denied `not_allowed` | PASS   |

Successful calls returned two transaction legs with one transfer group. Denied
calls returned before inserting legs; no partial transfer was observed.

## 4. Card settlement matrix

| Case                                   | Live result          |
| -------------------------------------- | -------------------- |
| Household card + household funding, A  | PASS                 |
| Household card + household funding, B  | PASS                 |
| A personal card + household funding, A | PASS                 |
| A personal card + household funding, B | denied `not_allowed` |

The prior `Card not found` result was caused by the RPC selecting the user’s
first membership without filtering inactive memberships. Using the controlled
membership arrangement that the live function actually resolves, valid card
settlement succeeded and the ownership denial was observed. A personal-card
plus same-owner-personal-funding and cross-owner-personal-funding calls remain
open. Card payment, application, billing, and source transaction rows were
created only for successful calls.

## 5. Loan matrix

| Case                                   | Live result                        |
| -------------------------------------- | ---------------------------------- |
| A personal loan + household account, B | denied `not_allowed`               |
| A personal loan + household account, A | PASS; payment and schedule updated |

The valid upcoming schedule entry removed the previous `No upcoming schedule
entry` fixture failure. The denied call ran first, so no loan payment,
transaction, schedule, or Inbox side effect was created by the denied call.

Household-loan positive calls, personal-account payment cases, and the full
final-payment `emi_complete` fixture remain open.

## 6. Liability matrix

| Case                                        | Live result                                |
| ------------------------------------------- | ------------------------------------------ |
| A personal liability + household account, B | denied `not_allowed`                       |
| A personal liability + household account, A | PASS; debt payment and transaction created |

The denial occurred before payment insertion. Personal-account and household-
liability variants remain open.

## 7. Savings matrix

| Case                                                       | Live result                      |
| ---------------------------------------------------------- | -------------------------------- |
| A personal active saving + household settlement account, B | denied `not_allowed`             |
| A personal active saving + household settlement account, A | PASS; early withdrawal completed |

The active-cycle fixture removed the previous `Cycle must be active` failure.
The owner call changed the cycle to its terminal state and created the
settlement transaction. Same-owner-personal and other-owner-personal settlement
account variants, plus renew/rollover, remain open.

## 8. Investment matrix

| Case                                       | Live result                                  |
| ------------------------------------------ | -------------------------------------------- |
| A personal holding + household cash, B buy | denied `not_allowed`                         |
| A personal holding + household cash, A buy | PASS; operation and cash transaction created |

Valuation owner/partner behavior was already live-validated in 14D.1. Sell,
income, same-owner cash, other-owner cash, and conversion variants remain open.

## 9. Goal funding matrix

Not complete. Direct setup of a goal funding link was rejected by the live
`enforce_goal_funding_link_integrity` trigger before a usable link fixture could
be created. Goal lifecycle owner/partner behavior was validated in 14D.1, but
the required household/personal source compatibility matrix was not proven
through the real goal funding flow.

## 10. Live Plan exclusion

Four real authenticated `record_transaction` calls created:

- household income: `10,000,000`
- household expense: `1,000,000`
- A personal income: `90,000,000`
- A personal expense: `9,000,000`

The live transaction query used by Plan, including the embedded account scope
filter, returned a household-only result of:

```text
qualifying income: 10,000,000
household expense: 1,000,000
personal rows excluded: 2
```

This proves the deployed query boundary excludes personal-account activity.
The complete server-rendered Plan read flow was not invoked through the app
server in this pass; the live data/API query and existing unit coverage passed.

## 11. Inbox transaction-source matrix

Two pending personal-source transaction items were visible to both members.
B resolving A’s personal-source item returned `not_allowed`; the transaction
and Inbox item remained unchanged. A resolving the same item succeeded and
marked the Inbox item resolved. PASS.

## 12. Inbox savings-source matrix

B confirming A’s active personal saving withdrawal returned `not_allowed`.
The saving was unchanged at denial. A then confirmed through the direct saving
RPC successfully. The earlier 14D.1 negative Inbox acknowledgement result also
remains valid. The full positive Inbox confirmation gateway outcome and cancel
semantics remain open.

## 13. EMI complete behavior

Not fully live-validated. The valid loan-payment path was exercised, but the
fixture did not reduce the loan to zero and therefore did not produce a live
`emi_complete` item. The approved contract remains: payment is owner-only;
post-completion acknowledgement is informational and household-level.

## 14. Atomicity matrix

| Operation                          | Denied before mutation | State check                             |
| ---------------------------------- | ---------------------- | --------------------------------------- |
| A personal → B personal transfer   | yes                    | zero transfer legs                      |
| Personal card partner settlement   | yes                    | no payment observed                     |
| Personal loan partner payment      | yes                    | no payment/schedule mutation            |
| Personal liability partner payment | yes                    | no debt payment                         |
| Personal saving partner withdrawal | yes                    | cycle remained active before owner call |
| Personal investment partner buy    | yes                    | no operation row                        |
| Personal Inbox resolve             | yes                    | item remained pending                   |

Atomicity passed for every denied path executed in this pass. Full matrix
coverage remains incomplete because several positive/negative combinations
were not run.

## 15. Protected RPC manifest status

The existing `tests/unit/ownership-rpc-manifest-14d1.test.ts` remains the
regression boundary. It maps protected mutation families to guarded root
tables and does not require direct helper calls in RPC bodies. The manifest
test passes. It is not yet marked complete because the live coverage matrix
still has open P0 families listed in §20.

## 16. Trigger bypass audit

No ownership-relevant trigger bypass was found. The deployed database has
BEFORE ownership triggers on roots and cross-resource tables including
accounts, transactions, card tables, loan tables, debt payments, saving
cycles/withdrawals, investment operations, goals, goal funding links, and
Inbox source updates. No `COPY`, trigger-disabled maintenance path, or
unprotected derived financial mutation was found in the repository or live
protected RPC surface.

## 17. Remote deployed verification

Live verification confirmed:

- `settle_card_payment`, loan, debt, saving, investment, transfer, and Inbox
  RPC calls executed against the deployed project.
- RPCs returned stable `not_allowed` ownership failures on denied paths.
- Deployed ownership triggers are present across the protected table graph.
- The Plan account-scope filter returned household-only live totals.

The canonical RPC architecture remains **TRIGGER-BASED**. No direct body guard
was added because no mutation bypassed the guarded graph.

## 18. Cleanup

Completed. The controlled household, accounts, card rows, loan/debt/saving
rows, investment rows, transactions, Inbox items, and supporting rows were
deleted. Both original memberships were restored to their original household,
active state, and Admin role. Verification returned zero controlled household,
account, transaction, and Inbox rows. No temporary auth users were created.

## 19. Tests / validation

- Live authenticated A/B RPC calls: PASS for the cases listed above.
- Full Vitest baseline: 117 files / 885 tests passed before this report-only
  pass.
- Existing ownership manifest test: PASS.
- Typecheck, lint, and build: PASS in the preceding 14D.1 gate; no production
  code or migration changed in 14D.2.

## 20. Remaining gaps

- Full personal/household card source-account matrix.
- Household-loan and personal-account loan payment combinations.
- Full liability account matrix and household liability case.
- Savings same-owner/other-owner settlement plus renew/rollover.
- Investment sell, income, same-owner cash, other-owner cash, and conversion.
- Goal funding-link compatibility through the actual goal funding flow.
- Full server-rendered Plan flow and monthly ritual output.
- Positive Inbox savings gateway outcome and cancel/dismiss semantics.
- Live final loan payment and `emi_complete` acknowledgement.

## 21. Final readiness verdict

PROMPT 14D.2 COMPLETE / NOT COMPLETE: **NOT COMPLETE**

Transfer: **PASS**

Cards: **PARTIAL**

Loans: **PARTIAL**

Liabilities: **PARTIAL**

Savings: **PARTIAL**

Investments: **PARTIAL**

Goals: **FAIL — funding compatibility not live-proven**

Plan: **PARTIAL — live filtered data proven; full application flow pending**

Inbox: **PARTIAL**

Atomicity: **PASS for executed denials; PARTIAL overall**

Protected RPC manifest: **INCOMPLETE**

Trigger bypass: **NONE**

RPC security: **NOT READY**

Remaining P0 gaps: the open live combinations in §20, especially goal funding
compatibility and the remaining cross-resource card, loan, savings, and
investment branches.

Can we start Prompt 14E? **NO**

Recommended next prompt: Prompt 14D.3 — Close Goal Funding and Remaining
Cross-Resource Branches
