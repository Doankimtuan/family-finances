# Technical Debt Review — Sprint 1

## Execution pack debt (validated)

| ID | Item | Pack severity | Board severity | Notes |
|----|------|---------------|----------------|-------|
| TD-S1-01 | Legacy `update_transaction` | Medium | **Blocking / High** | Undermines BR-02/03 Sprint goal |
| TD-S1-02 | System categories `jar_id` null | Low | Low | Acceptable with Inbox pending_mapping |
| TD-S1-03 | No Playwright for new flows | Medium | Medium | DoD gap; can be paired with DB integration |
| TD-S1-04 | Story ID namespace overlap | Low | Low | Documented |
| TD-S1-05 | Derived jar capacity | Info | Medium | Needs published derivation contract + income exclusion |

## Additional debt found by this board

| ID | Item | Severity |
|----|------|----------|
| TD-V-01 | Refund/reversal typed as ordinary income; no exclusion | **Blocking** |
| TD-V-02 | “Integration” tests are mocks | **Blocking** (DoD) |
| TD-V-03 | Dual category write paths (RPC vs `createJar` insert) | Low |
| TD-V-04 | Duplicated transaction SELECT strings | Low |
| TD-V-05 | Edit/Correct form duplication | Medium |
| TD-V-06 | Misleading `updateTransaction` JSDoc | Low |
| TD-V-07 | Migration not applied to target env | **Blocking** (Sprint DoD) |
| TD-V-08 | Roadmap conflict vs Product Decision Board EO-04 | Process — clarify before Sprint 2 |

## Architecture erosion forecast

If Sprint 2 builds plan movements atop a ledger that still allows in-place edits, BR-01 teaching (“virtual vs real”) will be taught while ledger history remains mutable — compounding trust debt.

## Technical debt score

| Dimension | Score |
|-----------|-------|
| Debt load | **6.5 / 10** (higher = more debt pressure; inverted in scorecard maintainability) |
| Intentional vs accidental | Mix — TD-S1-01 labeled intentional “next sprint” but Spec forbids it |
| Refactor risk if ignored | **High** |

## Maintainability score input

**6.5 / 10**
