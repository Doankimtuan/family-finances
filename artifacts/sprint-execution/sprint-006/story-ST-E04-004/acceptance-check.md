# ST-E04-004 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-010 maturity → Inbox | `enqueue_savings_maturity` + savings detail CTA | PASS |
| AC-011 EMI complete | `record_installment_payment` when paid >= num → `emi_complete` Inbox | PASS |
| BR-10 / BR-11 coach only | Guided Inbox kinds; no invented ledger balance | PASS |
| BR-01 | Owed/principal/installment use `Amount`, not `Balance` | PASS |
| Screens | debts, debt-detail, savings, savings-detail, cards (+ detail) | PASS |

## Verdict

**ACCEPTED** for ST-E04-004. **Sprint S6 COMPLETE** (4/4 frozen).
