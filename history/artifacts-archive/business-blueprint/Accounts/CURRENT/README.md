# Accounts Business Blueprint

## Overview

This blueprint defines the deterministic business behavior of the Accounts domain for ViNha.

Accounts are the household's real financial containers: places where money is held, recognized, constrained, or historically understood. The domain answers one business question: where is the household's real money or account-related obligation context?

## Scope

In scope:

- Real account/container identity.
- Household-recognizable account names.
- Broad account type.
- Starting and recorded balance context.
- Active, review, historical, and closed business states.
- Eligibility for real household position.
- Account context for transactions.
- Lightweight reconciliation behavior.
- Transfer neutrality.
- Closure and historical preservation.

Out of scope:

- Jar-to-account mapping.
- Planning allocation.
- Health write-back.
- Account-owned spending analytics.
- Provider automation.
- Multi-currency.
- Advanced reconciliation workflow.
- Detailed available/pending/institution balance model.

## Business Responsibility

Accounts owns the business truth of containers. It does not own spending purpose, planning intention, health interpretation, credit-card lifecycle, loan lifecycle, savings-product maturity, or household permissions.

## Relationship With Previous Phases

- Phase 1 discovered the real-world nature of Accounts.
- Phase 2 validated that Accounts match young household behavior.
- Phase 3 approved the simple reality-layer scope and rejected boundary-breaking capabilities.
- Phase 4 converts approved and modified decisions into a business contract.

