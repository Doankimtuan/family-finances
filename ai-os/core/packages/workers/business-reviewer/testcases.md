# Testcases — `business-reviewer`

| Case | Intent |
|------|--------|
| case-01-happy-path | Happy path |
| case-02-budget-exceed | Budget exceed |
| case-03-blocking-validation-fail | Blocking gate fail |
| case-04-blocking-review-fail | Blocking coverage review fail |
| case-05-missing-skill | Missing skill |

Invariants: primary `review-finding`; never mutate sources; never regenerate; never validate schemas; never invent missing info.
