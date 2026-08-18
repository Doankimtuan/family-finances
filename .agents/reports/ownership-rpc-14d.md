# Family Finance — Ownership RPC Security 14D

Date: 2026-08-18

## 1. Executive summary

14D adds one shared, transaction-local ownership enforcement layer for
`SECURITY DEFINER` financial mutations. It reuses
`can_mutate_financial_resource`, validates every financial resource touched by
cross-resource writes, rejects cross-owner goal links/transfers, protects Inbox
outcomes sourced from personal transactions/savings, and filters personal
account activity out of Plan transaction inputs.

The application remains household-only. No Personal/Household UI or personal
creation flow was added.

## 2. RPC inventory before 14D

The live development project contains the following relevant security-definer
mutation families: transactions, account transfers, card settlement, debts and
liability payments, loan creation/payment/rate/status, savings create/settle/
renew/rollover/withdrawal, investment opening/buy/sell/conversion/income/
valuation, goal contributions/funding/lifecycle, Inbox production/resolve/
dismiss/acknowledge, and transaction tags.

Before 14D, these functions commonly checked only household membership. The
deployed inventory query found no direct `can_mutate_financial_resource` call
in the domain RPC bodies.

## 3. Canonical RPC authorization pattern

Added `public.assert_financial_mutation(household_id, financial_scope,
owner_membership_id)`, which delegates to the canonical 14C helper and raises
the stable `not_allowed` code. Root-table and child-table BEFORE triggers call
it inside the same transaction as the invoking RPC.

The guard derives identity from `auth.uid()`. Anonymous requests fail through
the existing RPC authentication/grant boundary. Internal worker calls without
a JWT retain their existing trusted execution path.

## 4. Ledger hardening

`accounts` root writes and all `transactions` inserts/updates/deletes are now
guarded. Transaction reassignment checks both old and new accounts, so a
personal transaction cannot be moved across owners. Tags inherit transaction
authority through `transaction_tag_assignments`.

## 5. Transfer hardening

`record_owned_account_transfer` writes transaction legs, and the transaction
guard validates both source and destination accounts. Household-to-household,
same-owner personal, and personal-to-household flows remain possible when the
caller owns every affected personal resource. Cross-owner personal legs fail
with `not_allowed`.

## 6. Card hardening

`card_payments`, billing months/items, and card settings are guarded through
their account roots. Settlement therefore requires authority over both the card
account and the pay-from account; the transaction leg independently checks the
source account.

## 7. Loan hardening

Loan roots, loan payments, schedule entries, and interest-rate periods are
guarded through the loan root. Loan payments additionally validate the paying
account. A payment against a personal loan cannot be made by the partner, even
when the partner can mutate a household account.

## 8. Liability/debt hardening

Liability roots and debt payments are guarded. A debt payment requires both
liability authority and paying-account authority.

## 9. Savings hardening

Savings roots, cycles, and early-withdrawal rows are guarded through the saving
root. Transaction legs validate funding/settlement accounts. Personal saving
settlement or withdrawal cannot write to another owner's personal account.

## 10. Investments hardening

Investment holdings, operations, fees, and valuations are guarded. Operations
validate source/destination holdings and cash accounts; valuation requires
holding authority. Ownership is rooted at `investment_holdings`, not the
vestigial investment-account shell.

## 11. Goals hardening

Goal roots and contributions are guarded. Funding links validate the goal and
the linked account/saving/holding/loan/liability. A personal goal may only link
to the same owner's personal source; household/personal mixed links fail with
`cross_scope_not_allowed`, and different personal owners fail with
`cross_owner_transfer_not_allowed`.

## 12. Plan scope-filter changes

Posted transaction inputs for jar budgets, monthly review, and ritual
divergence now join `accounts` and require `accounts.financial_scope =
household`. Plan remains household-only and no personal jars were added.

## 13. Inbox source-ownership changes

Inbox remains household-visible. Updating an Inbox item sourced from a personal
transaction or savings resource now validates the source owner. This covers
resolve-to-jar, dismiss, acknowledgement, and early-withdrawal decision paths.
`emi_complete` and `emergency_declaration` remain household-level outcomes; the
financial mutation is already complete or belongs to the household Plan flow.

## 14. Cross-resource authorization model

Every affected child write checks each root resource involved. The shared
trigger function covers loan/account, debt/account, card/account,
holding/account, goal/source, saving, billing/account, schedule/loan, and
transaction/account combinations. Authorization occurs before the child row
is written and uses row locks on the resolved roots.

## 15. Inactive-owner behavior

`can_mutate_financial_resource` requires an active membership. An inactive
owner therefore loses mutation authority while the resource remains readable.
The narrow `admin_archive_financial_resource` cleanup RPC remains the only
operational escape hatch and is limited to archive/terminal cleanup.

## 16. SECURITY DEFINER audit

The new helper/trigger functions use `SECURITY DEFINER`, `auth.uid()`, and
`set search_path = public`. Anonymous execution was explicitly revoked for
the internal guard helpers; authenticated execution is retained for the
canonical helper boundary. Existing domain RPCs retain their pinned search
paths and existing authenticated grants.

The legacy domain RPC bodies were not forked into dozens of duplicated guards.
The ownership check is enforced by shared BEFORE triggers that execute inside
the same RPC transaction, including old/new resource validation. This is the
single enforcement point for all current and future RPC paths touching the
protected tables.

## 17. Creation-capability decision

Conservative state: current creation RPCs continue to create household-owned
resources. Root insert policies and the root guard are structurally capable of
self-owned personal inserts, but no application flow sends personal ownership
parameters. Personal creation remains deferred to 14E.

## 18. Migrations

- `20260818051301_ownership_rpc_authorization_14d.sql`
- `20260818051612_ownership_rpc_authorization_14d_reapply.sql`
- `20260818051805_ownership_rpc_authorization_14d_acl.sql`

The first migration is authoritative and idempotent. The latter two preserve
the development migration ledger after live re-application/ACL verification.

## 19. Tests

Added `tests/unit/ownership-rpc-14d.test.ts` and updated Plan query
characterization coverage. Passing checks:

- ownership RPC boundary test: 1 passed
- targeted monthly review/schema/RPC tests: 80 passed
- typecheck: passed
- lint: passed
- full Vitest run: 116 passing files / 884 passing tests

## 20. Live DB validation

Applied to the existing development project `bbzffxvgocjwsdbujvgn` using the
Supabase migration path. A live SQL check under a member JWT claim confirmed:

| Check                              | Result  |
| ---------------------------------- | ------- |
| household resource + active member | `true`  |
| personal resource + same owner     | `true`  |
| personal resource + other owner    | `false` |

The development project currently has one active member in each household, so
a destructive-free two-authenticated-member mutation matrix was not run.

## 21. Remote deployed-function verification

The live project reports both 14D migration entries and the following trigger
coverage: accounts, transactions, savings, loans, liabilities, goals,
investment holdings/operations/fees/valuations, loan payment/schedule/rate
rows, debt payments, card payments/billing/settings, saving cycles/withdrawals,
goal contributions/links/snapshots, transaction tags, and Inbox items.

The live P0 RPC definitions remain `SECURITY DEFINER` with
`search_path=public`. Their deployed function bodies do not directly contain
the canonical helper call; the deployed trigger matrix is the effective
ownership guard for those bodies.

## 22. Remaining security gaps

- Provision a controlled two-member development household and run the full A/B
  authenticated RPC matrix, including inactive-owner cases.
- Add direct body-level guard calls if the project policy requires every legacy
  RPC source body to visibly call the helper, rather than accepting the shared
  transaction-local trigger boundary.
- Add remote behavioral fixtures for every cross-resource domain once A/B dev
  credentials are available.
- Supabase advisors still report pre-existing public SECURITY DEFINER exposure
  and one mutable-search-path function outside this change; these were not
  broadened by 14D and need a separate RPC ACL/search-path cleanup.

## 23. Final readiness classification

PROMPT 14D COMPLETE / NOT COMPLETE: **NOT COMPLETE for the full requested
validation standard; implementation is deployed and structurally ready.**

Ledger: guarded.

Cards: guarded for card and funding accounts.

Loans: guarded for loan and payment accounts.

Liabilities: guarded for liability and payment accounts.

Savings: guarded for saving lifecycle and accounts.

Investments: guarded for holdings, valuations, operations, and cash accounts.

Goals: guarded, including source compatibility.

Plan: personal account activity excluded from Plan transaction inputs.

Inbox: source ownership enforced without hiding personal items.

Cross-resource authorization: shared transaction-local guards deployed.

RPC security: **READY by effective trigger enforcement; direct RPC-body audit
still open.**

Can the UI create personal resources yet? **NO**

Live deployed-function verification: migration history and trigger coverage
verified; A/B behavioral matrix pending dev-member provisioning.

Remaining gaps: two-member live matrix and decision on direct body-level guard
style.

Recommended next prompt: Prompt 14E — Personal/Household Ownership UI &
Application Rollout
