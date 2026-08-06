# Acceptance Criteria Impact

This document lists acceptance criteria impacts only. It does not redesign tests.

| Area | Affected capabilities | Acceptance impact |
| --- | --- | --- |
| Real versus virtual clarity | PL-PD-002, PL-PD-005, PL-PD-008 | Acceptance should verify planned amounts are never presented as bank balances. |
| Income expectation | PL-PD-001, PL-PD-003 | Acceptance should distinguish expected income allocation from actual received income. |
| Recurring expectations | PL-PD-006 | Acceptance should verify recurring items do not imply paid status. |
| Due dates and calendar pressure | PL-PD-007, PL-PD-022 | Acceptance should verify expected due dates are not presented as provider-confirmed unless sourced from owning domains. |
| Plan review and correction | PL-PD-010, PL-PD-011, PL-PD-021 | Acceptance should verify review supports correction without rewriting ledger truth. |
| Shared visibility | PL-PD-012, PL-PD-018 | Acceptance should verify partner-visible planning assumptions remain consistent with Together policy. |
| Cross-domain facts | PL-PD-013, PL-PD-017 | Acceptance should verify Planning reads source facts without mutating owning domains. |
| Emergency handling | PL-PD-024 | Acceptance should verify emergency changes are virtual planning changes, not money movement. |
| AI explanation | PL-PD-036 | Future acceptance should verify no invented balances, advice, or autonomous mutations. |
| Rejected scope | PL-PD-033, PL-PD-035 | Acceptance should prevent tax-aware or advisory-grade planning from entering current scope. |
