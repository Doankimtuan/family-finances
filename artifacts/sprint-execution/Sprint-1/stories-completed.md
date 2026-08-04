# Stories Completed — Sprint 1

| Story | Title | AC | Status |
|-------|-------|----|--------|
| `ST-E01-001` | Category ↔ Jar N:1 Mapping Contract | AC-CAT-01 | **COMPLETE** |
| `ST-E01-002` | Structured Refund Linkage & Jar Restoration | AC-TRN-01 | **COMPLETE** |
| `ST-E01-003` | 3-Way Immutable Correction Audit Chain | AC-TRN-02 | **COMPLETE** |

## Acceptance evidence

### AC-CAT-01
- Category create schema/UI requires `jarId`
- Unmapped create returns `category_unmapped`
- Unit: `tests/unit/sprint1-core-contracts.test.ts`

### AC-TRN-01
- Refund RPC sets `reverses_transaction_id`, updates `partially_refunded` / `fully_refunded`, restores jar capacity via income credit on original jar
- Unit + RPC mapping integration tests

### AC-TRN-02
- Correction RPC marks original `reversed`, inserts reversal (`reverses_transaction_id`) + correction (`corrects_transaction_id`)
- Net impact unit: expense 100 → 10 yields +90 from new legs
- UI audit chain on transaction detail
