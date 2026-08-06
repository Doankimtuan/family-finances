# Risk Analysis

## Risk Rating Summary

| Risk | Severity | Likelihood | Status |
| --- | --- | --- | --- |
| Inbox becomes generic notification feed | High | Medium | Mitigate with eligibility contract |
| Health accidentally writes via shared service | High | Low | Mitigate with read-only shield |
| Goals or Planning treated as real balance | High | Medium | Mitigate with BR-01 UI/API tests |
| Investment value treated as spendable cash | High | Medium | Mitigate with valuation/proceeds distinction |
| Savings maturity decision writes before settlement | High | Low | Mitigate with settlement state tests |
| Together overreaches into legal/relationship authority | Medium | Medium | Mitigate with scope and materiality contracts |
| Death/member departure journey incomplete | Medium | Medium | Track as system evolution candidate |
| Multi-currency future blocked by VND assumptions | Medium | Medium | Keep currency constants and event payload fields explicit |
| Loans/Card/Debt responsibility blur | Medium | Medium | Typed debt event contracts |
| Month Close misses non-transaction stale decisions | Medium | Medium | Month Close cross-source sweep contract |

## Primary System Risk

The conceptual model is coherent. The main risk is implementation drift: domain rules are repeated in many places, while event payloads and source-domain acceptance contracts are not yet centralized for every completed domain.

## Mitigation Direction

Mitigate through contract tests, event registry, strict module imports, read-only Health enforcement, and Inbox eligibility gates.

