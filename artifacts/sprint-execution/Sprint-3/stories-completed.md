# Stories Completed — Sprint 3

| Story | Title | AC | Status |
|-------|-------|----|--------|
| `ST-E03-001` | Strongly-Typed ReviewItem Schema Discriminators | AC-INB-01 | **COMPLETE** |
| `ST-E03-002` | Pattern Metadata Annotation & Auto-Resolution Policy Engine | AC-INB-01 | **COMPLETE** |
| `ST-E03-003` | Inbox Staleness & Temporal Expiration Worker | AC-INB-01 | **COMPLETE** |

## Acceptance evidence

### AC-INB-01
- `ReviewItemType` constants: UnmappedExpense, MaturityDecision, PaymentReminder, InstallmentComplete, EmergencyDeclaration
- Zod discriminated union + `instantiateTypedReviewItem`
- Unit: `tests/unit/sprint3-inbox-decision.test.ts`

### BR-16
- `AUTO_RESOLVE_CONFIDENCE_THRESHOLD = 0.9`; merchant confirmations → confidence
- `auto_resolve_inbox_item` RPC + application gate
- UI pattern suggestion with pre-filled jar

### BR-15 / BR-21
- Payment reminders expire at due+7d via `run_inbox_staleness_worker`
- Archived tab lists expired / auto_resolved / archived / completed
- Maturity ack archives sibling cascade timers for same source
