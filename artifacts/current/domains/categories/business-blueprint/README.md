# Categories Business Blueprint

## Overview

This blueprint defines the deterministic business behavior of the Categories domain for ViNha.

Categories are the household's classification vocabulary for money meaning. The domain answers one business question: what was this money event for?

## Scope

In scope:

- Household category definition.
- Income versus expense category meaning.
- Transaction categorization.
- Explicit uncategorized meaning.
- Category correction.
- Category filtering and actuals summaries.
- Household-specific vocabulary.
- Historical category interpretation.
- Category rename, archive, and restore.
- Read-only classification evidence for other domains.
- Provider or merchant category suggestions as non-authoritative evidence.
- Shared partner comprehension of category meaning.

Out of scope:

- Category balances.
- Category budgets or spending caps.
- Category payment execution.
- Category-owned planning capacity.
- Category-owned provider truth.
- Autonomous final categorization.
- Category-specific notes.
- Merge, split, visual identity, duplicate detection, confidence scoring, merchant learning, merchant normalization, templates, reconciliation, drift detection, export portability, and multi-currency category context.

## Business Responsibility

Categories owns household classification vocabulary and the meaning labels applied to transaction facts. It does not own money movement, account balances, virtual planning capacity, provider truth, health interpretation, payment execution, or household permissions.

## Relationship With Previous Phases

- Phase 1 discovered Categories as classification labels, not money containers.
- Phase 2 validated that young households naturally classify money by purpose but may confuse categories with jars, budgets, payment methods, and provider labels.
- Phase 3 approved the modest classification core, modified boundary-sensitive capabilities, deferred advanced capabilities, and rejected category-as-money behaviors.
- Phase 4 converts approved and modified decisions into a business contract.
