# Implementation Priority

This document recommends order only. It does not define implementation details.

## High

- TX-PD-001 Record real money movement.
- TX-PD-002 Income and expense distinction.
- TX-PD-003 Preserve amount, currency, date, account, direction.
- TX-PD-004 Chronological activity.
- TX-PD-005 Link to real account/container.
- TX-PD-008 Review unresolved activity.
- TX-PD-009 Search and filtering.
- TX-PD-011 Evidence for account balance changes.
- TX-PD-012 Feed Plan, Inbox, Health as factual input.
- TX-PD-013 Transfer representation between owned accounts.

Dependencies: Accounts must exist as real containers. Inbox, Plan, and Health must respect transaction facts without owning them.

## Medium

- TX-PD-006 Household note or description.
- TX-PD-007 Categorize by household meaning.
- TX-PD-010 Refund, reversal, correction audit concepts.
- TX-PD-020 Statement reconciliation.

Dependencies: Core transaction facts and household terminology must be clear.

## Low

- TX-PD-014 Pending versus posted distinction.
- TX-PD-015 Merchant normalization.
- TX-PD-016 Receipt attachment.
- TX-PD-017 Split categorization.
- TX-PD-018 Duplicate detection.
- TX-PD-019 Recurring pattern detection.
- TX-PD-021 Provider import.
- TX-PD-022 Cash reconciliation.
- TX-PD-023 Foreign currency metadata.
- TX-PD-024 Fees and discounts as explicit context.
- TX-PD-025 Partner comments/explanations.
- TX-PD-026 Open Banking/provider-sync enrichment.
- TX-PD-027 Reliable merchant identity.
- TX-PD-028 Confidence scoring.
- TX-PD-029 Dispute/chargeback/provider correction audit.
- TX-PD-030 Household-level review history.
- TX-PD-031 International remittance/currency conversion context.
- TX-PD-032 AI-assisted classification.

Dependencies: Direct user research, provider maturity, privacy validation, and evidence that added complexity increases household understanding.
