# Requirement Impact

This document identifies requirement impacts only. It does not create or modify official requirements.

## New Requirements

| Candidate requirement | Affected capabilities | Impact |
| --- | --- | --- |
| Transactions must preserve factual anchors: amount, currency, date, account, direction, and household context. | TX-PD-001, TX-PD-003, TX-PD-005 | Supports transaction trust and account evidence. |
| Transactions must support household review of unresolved activity. | TX-PD-008, TX-PD-012 | Connects real facts to Inbox-style decision work. |
| Transfers between owned accounts must not be counted as income or expense by default. | TX-PD-013 | Protects household cash-flow correctness. |

## Modified Requirements

| Existing requirement area | Affected capabilities | Impact |
| --- | --- | --- |
| Money transaction capture/list/detail | TX-PD-001 through TX-PD-011 | Scope should emphasize factual history, account context, review, and search. |
| Plan and jar interaction | TX-PD-007, TX-PD-012, TX-PD-013 | Clarify category/jar mapping as meaning/intent, not real movement. |
| Health interpretation | TX-PD-012, TX-PD-032 | Clarify Health consumes transaction facts read-only. |
| Offline money safety | TX-PD-001, TX-PD-020, TX-PD-021 | Maintain fail-closed stance for transaction mutations. |

## Removed Requirements

No removed requirements are identified.
