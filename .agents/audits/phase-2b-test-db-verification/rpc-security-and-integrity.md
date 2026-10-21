# Phase 2B — RPC Security and Integrity

**Overall status:** BLOCKED for live PostgreSQL security/integrity verification. Local source contract: PASS.

## Source-level review

The new helper is an internal `SECURITY INVOKER` function with `search_path=public`. Its ACL revokes execute from `PUBLIC`, `anon`, `authenticated`, and `service_role`, and grants it to `postgres`, the owner of the existing `SECURITY DEFINER` loan-creation wrapper. The public wrapper remains the authenticated entry point. The helper checks the loan's household before accepting schedule rows; it does not change RLS policies.

The function validates schedule shape and internal financial consistency before the insert loop: array type and term count, object rows, JSON scalar types, whole-number contiguous installment numbers, nonnegative integer amounts, total payment arithmetic, balance progression, monthly due dates from `first_payment_date`, aggregate principal/interest/repayment against the loan, zero final balance, and repayment equal to principal plus interest. Requiring JSON numeric scalars rejects special numeric strings such as `"NaN"`; PostgreSQL orders numeric `NaN` above ordinary numbers and treats it as equal to itself ([PostgreSQL numeric types](https://www.postgresql.org/docs/current/datatype-numeric.html)). SQL exceptions abort the calling transaction, but that atomic behavior was not exercised against PostgreSQL in this phase.

The static SQL contract checks in `tests/unit/rpc-acl-hardening.test.ts` passed. These checks inspect migration text; they do not establish actual catalog privileges or execution behavior.

## Runtime test matrix

| Case                                                                    | Result                                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------------- |
| Valid schedule invokes helper through the loan wrapper                  | BLOCKED — no isolated database.                          |
| Negative, fractional, missing, or malformed schedule fields             | BLOCKED — no PostgreSQL RPC execution.                   |
| Missing installments, duplicate/out-of-order sequence, or invalid dates | BLOCKED — no PostgreSQL RPC execution.                   |
| Incorrect principal, interest, repayment, or balance totals             | BLOCKED — no PostgreSQL RPC execution.                   |
| Cross-household loan identifier                                         | BLOCKED — no PostgreSQL RPC execution.                   |
| Repeated submission/idempotency                                         | BLOCKED — no PostgreSQL RPC execution.                   |
| Failure rollback and absence of partial schedule rows                   | BLOCKED — no PostgreSQL RPC execution.                   |
| Runtime RLS and cross-account/household visibility                      | BLOCKED — no authenticated sessions or isolated fixture. |

## Remaining integrity limit

The helper reconciles values internally but does not independently recompute the amortization policy or interest formula from the loan's rate strategy. A direct authenticated caller able to invoke the wrapper could submit a self-consistent schedule with policy-inaccurate interest and totals. The application command calculates the schedule, and this phase preserved that policy rather than duplicating it in SQL. Treat direct-RPC policy validation as a release risk until a safe runtime test and product decision establish the required trust boundary.
