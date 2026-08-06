# Technical Debt — Sprint 1

| ID | Item | Severity | Notes |
|----|------|----------|-------|
| TD-S1-01 | Legacy in-place `update_transaction` still exists | Medium | Detail prefers Correct; legacy edit link retained for note/account tweaks. Prefer retiring mutate-in-place next sprint. |
| TD-S1-02 | System categories remain `jar_id` null | Low | By design (templates). Household copies bind on create; capture can still leave system tags unmapped → Inbox. |
| TD-S1-03 | No Playwright coverage for refund/correct/category | Medium | Add smoke in Sprint 2 hardening or GA epic. |
| TD-S1-04 | Story ID namespace overlap with rewrite `sprint-001` | Low | Documented; packs use `Sprint-1/` vs `sprint-001/`. |
| TD-S1-05 | Jar capacity is derived, not a separate store | Info | Refund restores capacity by posting income on original `jar_id`; no dedicated capacity ledger table. |
