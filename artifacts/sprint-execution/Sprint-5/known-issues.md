# Known Issues — Sprint 5

| ID | Issue | Severity | Notes |
|----|-------|----------|-------|
| KI-S5-01 | Installment due day hardcoded to 1 | Medium | Plans lack `next_due_date`; derive better when schema adds it |
| KI-S5-02 | Card synthetic dues may repeat outstanding amount | Low | Prefer billing-month remaining when available |
| KI-S5-03 | No REST calendar adapter | Low | RSC query is SoT in rewrite app |
