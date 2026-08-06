# Technical Implementation Order — ViNha

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Technical Execution Order

To minimize refactoring, technical debt, and integration churn, all technical tasks MUST be executed in the strict sequential order specified below.

---

## 2. Sequential Task Execution Order

### Phase 1: Database & Core Contract Foundations (Sprint 1)
1. `TSK-E01-001-DB`: Add `jar_id` FK column to `categories` table with `ON DELETE RESTRICT`.
2. `TSK-E01-001-BE`: Update `CategoryApplicationService` to require `jar_id` mapping (BR-12).
3. `TSK-E01-001-FE`: Build Category creation modal with required Jar selection.
4. `TSK-E01-001-QA`: Unit test verifying unmapped category rejection (AC-CAT-01).
5. `TSK-E01-002-DB`: Add `reverses_transaction_id` nullable FK column to `transactions` table.
6. `TSK-E01-002-BE`: Build `POST /api/v2/transactions/refund` service linking refund to original.
7. `TSK-E01-002-FE`: Build refund linking UI prompt.
8. `TSK-E01-002-QA`: Integration test verifying Jar capacity restoration on refund (AC-TRN-01).
9. `TSK-E01-003-DB`: Add `corrects_transaction_id` nullable FK column to `transactions` table.
10. `TSK-E01-003-BE`: Build atomic 3-way correction chain service (`Reversed` original, reversal, correction).
11. `TSK-E01-003-FE`: Build transaction correction modal and audit chain UI expander.
12. `TSK-E01-003-QA`: Test verifying net balance impact of 3-way correction chain (AC-TRN-02).

---

### Phase 2: Decoupled Plan Movements & Emergency Flow (Sprint 2)
13. `TSK-E02-001-DB`: Create `plan_movements` table with `$0.00` ledger impact constraint.
14. `TSK-E02-001-BE`: Create `POST /api/v2/jars/reallocate` API service for virtual Jar capacity movement.
15. `TSK-E02-001-FE`: Render Jar reallocation UI slider with clear virtual capacity warning banner.
16. `TSK-E02-001-QA`: Test verifying bank account balance is untouched on plan movement (AC-JAR-01).
17. `TSK-E02-002-DB`: Add `is_emergency` boolean and `intent_note` text to `plan_movements` table.
18. `TSK-E02-002-BE`: Update reallocation handler to bypass BR-07 warning modal when `is_emergency = true`.
19. `TSK-E02-002-FE`: Add "Declare Emergency" checkbox and mandatory intent note text input.
20. `TSK-E02-002-QA`: Test verifying modal bypass when emergency box is checked (AC-JAR-02).
21. `TSK-E02-003-BE`: Publish `EmergencyDeclaredEvent` to send high-priority alert to partner device.
22. `TSK-E02-003-FE`: Render emergency alert banner on partner device.
23. `TSK-E02-003-QA`: End-to-end test verifying partner device receives emergency notification.

---

### Phase 3: Inbox Decision Engine & Auto-Resolution (Sprint 3)
24. `TSK-E03-001-DB`: Add `type` discriminator enum column to `review_items` table.
25. `TSK-E03-001-BE`: Build strongly-typed `ReviewItem` schema validators (`UnmappedExpense`, etc.).
26. `TSK-E03-001-FE`: Render Inbox decision queue with type-specific icon headers and payloads.
27. `TSK-E03-001-QA`: Unit test verifying typed ReviewItem instantiation (AC-INB-01).
28. `TSK-E03-002-DB`: Add `source` and `pattern_id` columns to `transactions` table.
29. `TSK-E03-002-BE`: Build pattern auto-resolution policy engine (`confidence_score` $\ge 0.90$).
30. `TSK-E03-002-FE`: Show pre-filled category/jar suggestions on pattern-generated ReviewItems.
31. `TSK-E03-002-QA`: Test verifying silent auto-resolution of high-confidence pattern matches.
32. `TSK-E03-003-DB`: Add `expires_at` timestamp column to `review_items` table.
33. `TSK-E03-003-BE`: Create temporal worker to expire payment reminders > 7 days past due (BR-15).
34. `TSK-E03-003-FE`: Render Archived tab in Inbox for expired and auto-resolved items.
35. `TSK-E03-003-QA`: Automated test verifying premature maturity resolution cancels alert cascade (BR-21).

---

### Phase 4: Month Ritual Maturity & Temporal Auto-Lock (Sprint 4)
36. `TSK-E04-001-DB`: Add `status` enum ('Draft', 'InReview', 'PendingReview', 'Approved') to `month_rituals`.
37. `TSK-E04-001-BE`: Build scheduled background worker for 30-day temporal auto-lock (`PendingReview`).
38. `TSK-E04-001-FE`: Render read-only locked status banner on auto-locked month rituals.
39. `TSK-E04-001-QA`: Test verifying 30-day auto-lock transitions ritual to `PendingReview` (AC-RIT-01).
40. `TSK-E04-002-BE`: Build Month Ritual Step 1 Category-Jar Divergence Check gate endpoint.
41. `TSK-E04-002-FE`: Build Step 1 UI blocking ritual progression if unmapped categories exist.
42. `TSK-E04-002-QA`: Test verifying Step 1 gate blocks progression until mapping is resolved.
43. `TSK-E04-003-DB`: Add `consecutive_completed_rituals` counter column to `households`.
44. `TSK-E04-003-BE`: Build Step 3 Emergency Reflection query and Quick Close eligibility checker (BR-23).
45. `TSK-E04-003-FE`: Render Emergency Reflection card in Step 3 and 1-tap Quick Close summary card.
46. `TSK-E04-003-QA`: Test verifying Quick Close mode unlocks after 6 consecutive completed rituals.

---

### Phase 5: Unified Household Financial Calendar (Sprint 5)
47. `TSK-E05-001-DB`: Create unified calendar projection query indexing recurring patterns, card due dates, and debt payoff dates.
48. `TSK-E05-001-BE`: Build `GET /api/v2/calendar/events` multi-domain aggregation service.
49. `TSK-E05-001-FE`: Build Calendar data provider state management store.
50. `TSK-E05-001-QA`: Integration test verifying calendar aggregates events across 3 domains (AC-CAL-01).
51. `TSK-E05-002-BE`: Build cash flow deficit prediction algorithm comparing scheduled bills vs expected balances.
52. `TSK-E05-002-FE`: Render mobile interactive Calendar grid view with low-balance warning indicators.
53. `TSK-E05-002-QA`: Unit test verifying low balance warning fires on deficit date.
54. `TSK-E05-003-BE`: Build debt payoff milestone handler triggering `InstallmentComplete` ReviewItem.
55. `TSK-E05-003-FE`: Render payoff milestone badge on Calendar and celebration modal.
56. `TSK-E05-003-QA`: Test verifying debt payoff triggers cash flow reallocation prompt.

---

### Phase 6: Health Read-Only Shield & GA Hardening (Sprint 6)
57. `TSK-E06-001-DB`: Configure read-only database connection user and replica pool for `modules/health/`.
58. `TSK-E06-001-BE`: Implement `HealthReadOnlyDbContext` enforcing zero write calls (BR-24).
59. `TSK-E06-001-FE`: Render financial health score cards and trend charts on Home view.
60. `TSK-E06-001-QA`: Automated test attempting write query from Health module -> verify rejection (AC-HLT-01).
61. `TSK-E06-002-DB`: Create `ai_audit_logs` table recording all AI suggestions and explicit user approvals.
62. `TSK-E06-002-BE`: Build AI Non-Invention Policy Guard middleware enforcing BR-14 non-invention rules.
63. `TSK-E06-002-FE`: Render AI suggestion cards with mandatory explicit user confirmation buttons.
64. `TSK-E06-002-QA`: Security test verifying AI cannot trigger money movement without user approval.
65. `TSK-E06-003-DB`: Run full database migration validation and index optimization.
66. `TSK-E06-003-BE`: Run full integration test suite and API benchmark.
67. `TSK-E06-003-FE`: Run Playwright E2E suite, accessibility audit (a11y), and bundle size check.
68. `TSK-E06-003-QA`: Sign-off GA readiness verification report.
