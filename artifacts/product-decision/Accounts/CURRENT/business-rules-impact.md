# Business Rules Impact

This file identifies business-rule impacts only. It does not rewrite existing Sources of Truth.

## New Business Rules Identified

| Proposed rule area | Affected decisions | Need |
|--------------------|-------------------|------|
| Account real-position eligibility | ACC-PD-006, ACC-PD-011 | Clarify that only eligible owned-money accounts contribute to real position; credit obligations must not inflate owned money. |
| Account history preservation | ACC-PD-007, ACC-PD-010, ACC-PD-035 | Clarify that historical accounts remain interpretable after closure/archive. |
| Account adjustment accountability | ACC-PD-017, ACC-PD-020 | Clarify that manual balance changes must remain explainable. |
| Own-account transfer neutrality | ACC-PD-022 | Clarify that transfers between owned accounts do not create household income or expense. |

## Modified Business Rules Identified

No direct modifications to existing frozen Business Rules are made here.

Potential future SoT modification area:

- Existing BR-01 may need an Accounts-specific clarification for credit cards, savings products, and real-position totals.

## Clarified Business Rules Identified

| Existing principle | Clarification needed |
|--------------------|---------------------|
| BR-01 Real Ledger is not Virtual Planning | Account totals must not subtract jar allocations, and jars must not map to accounts as balances. |
| Health read-only (BR-24) | Health may summarize account reality but must never alter accounts or balances. |
| Financial safety over convenience | Provider imports and automation remain deferred until trust and correctness are validated. |

