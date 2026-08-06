# Implementation Priority

This file recommends product implementation order only. It does not define implementation details.

## High Priority

| Capability IDs | Reason | Dependencies |
|----------------|--------|--------------|
| ACC-PD-001, ACC-PD-002, ACC-PD-003, ACC-PD-004, ACC-PD-005, ACC-PD-006, ACC-PD-008, ACC-PD-012 | These create the minimum trustworthy account reality. | Tenancy, Transactions for balance movement. |
| ACC-PD-007, ACC-PD-010 | History must remain safe from the start. | Transactions. |
| ACC-PD-022 | Transfer correctness prevents major financial misunderstanding. | Transactions. |

## Medium Priority

| Capability IDs | Reason | Dependencies |
|----------------|--------|--------------|
| ACC-PD-009, ACC-PD-011, ACC-PD-013, ACC-PD-017, ACC-PD-020, ACC-PD-024, ACC-PD-035 | These improve trust, recognition, confidence, and portability after the core account layer works. | Base Accounts and Transactions. |
| ACC-PD-016 | Valuable but emotionally sensitive. | Together research and household visibility policy. |

## Low Priority

| Capability IDs | Reason | Dependencies |
|----------------|--------|--------------|
| ACC-PD-014, ACC-PD-021, ACC-PD-023 | Useful but not essential for early account comprehension. | Usage research. |
| ACC-PD-015, ACC-PD-018, ACC-PD-019, ACC-PD-025, ACC-PD-026, ACC-PD-027, ACC-PD-031, ACC-PD-032, ACC-PD-033, ACC-PD-034 | Advanced trust, integration, currency, and reconciliation concerns. | Mature account usage and provider research. |
| ACC-PD-028, ACC-PD-029, ACC-PD-030, ACC-PD-036 | Future expansion only. | Future domain boards. |

## Never Implement

| Capability IDs | Reason |
|----------------|--------|
| ACC-PD-037, ACC-PD-038, ACC-PD-039, ACC-PD-040 | Rejected due to BR-01, Health read-only (BR-24), automation, or ownership conflicts. |

