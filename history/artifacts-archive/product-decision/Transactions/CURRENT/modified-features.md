# Modified Features

## TX-PD-007: Categorize By Household Meaning

Original idea: Assign purpose or meaning to a transaction.

Required modification: Category must remain explanatory metadata. It must not imply real money movement or automatically change virtual planning.

Reason: Protect BR-01 and avoid category/jar confusion.

Expected result: Users can understand spending meaning without confusing meaning with money.

## TX-PD-010: Refund, Reversal, Correction Audit Concepts

Original idea: Support refunds, reversals, and corrections.

Required modification: Use household-understandable language and preserve audit truth. Avoid silent edits or terminology that requires accounting expertise.

Reason: Phase 2 validated refunds and corrections but identified language risk.

Expected result: Users recover from mistakes or returns without losing trust.

## TX-PD-012: Feed Plan, Inbox, Health As Factual Input

Original idea: Transactions provide input to other domains.

Required modification: Other domains consume transaction facts without owning or rewriting them. Health remains read-only. Plan remains virtual.

Reason: Protect BR-01 and BR-24.

Expected result: Transactions support the Household Money OS without becoming a planning or health engine.

## TX-PD-013: Transfer Representation Between Owned Accounts

Original idea: Represent movement between owned accounts.

Required modification: Treat as real-ledger movement that is not income, not expense, and not jar movement by default.

Reason: Transfers are behaviorally important and financially risky if double-counted.

Expected result: Household movement between accounts does not distort spending or income understanding.

## TX-PD-020: Statement Reconciliation

Original idea: Compare product records with real provider/cash records.

Required modification: Approve only as a lightweight confidence responsibility. Full structured reconciliation workflows remain deferred.

Reason: Reconciliation is valuable, but heavy workflows conflict with simple-first scope.

Expected result: Product acknowledges trust checking without becoming accounting software.

## TX-PD-032: AI-Assisted Classification

Original idea: Use AI to suggest transaction meaning.

Required modification: AI may only assist classification or explanation. It must not invent balances, create real ledger facts, autonomously move money, or make Health write-backs.

Reason: Protect no unnecessary automation, BR-01, BR-24, and financial safety.

Expected result: Future assistance remains understandable and subordinate to user-confirmed financial facts.
