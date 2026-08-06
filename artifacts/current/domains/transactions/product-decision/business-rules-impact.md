# Business Rules Impact

This document identifies required Business Rule impacts only. It does not rewrite existing Sources of Truth.

## New Business Rules

| Candidate | Affected capabilities | Impact |
| --- | --- | --- |
| Transaction facts are real-ledger events only | TX-PD-001, TX-PD-012, TX-PD-013 | Clarify that transaction records cannot represent virtual planning movement. |
| Transfers between owned accounts are not income or expense by default | TX-PD-013 | Prevent double-counting and protect household cash-flow truth. |
| AI assistance cannot create or mutate ledger truth autonomously | TX-PD-032 | Preserve financial safety and user understanding. |

## Modified Business Rules

| Existing rule area | Affected capabilities | Impact |
| --- | --- | --- |
| BR-01 Real Ledger is not Virtual Planning | TX-PD-007, TX-PD-012, TX-PD-013 | Needs explicit transaction/category/jar wording so meaning and planning do not change real money. |
| BR-24 Health read-only | TX-PD-012, TX-PD-032 | Needs explicit confirmation that Health consumes transaction facts only. |

## Clarified Business Rules

| Rule area | Affected capabilities | Impact |
| --- | --- | --- |
| Refund/correction audit truth | TX-PD-010 | Clarify that corrections and refunds explain history rather than silently erase it. |
| Review responsibility | TX-PD-008, TX-PD-012 | Clarify that unresolved transaction facts may create review work without changing the transaction fact. |
| Statement reconciliation | TX-PD-020 | Clarify that reconciliation supports confidence but does not make external provider automation authoritative by default. |
| Positive amount plus direction | TX-PD-002, TX-PD-003, TX-PD-013 | Clarify transfer handling alongside income/expense direction before Business Blueprint. |
