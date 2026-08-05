# Stories Completed — Sprint 5

| Story | Title | AC | Status |
|-------|-------|----|--------|
| `ST-E05-001` | Multi-Domain Household Schedule Projection Service | AC-CAL-01 / REQ-CAL-01 | **COMPLETE** |
| `ST-E05-002` | Calendar View UI & Early Cash Flow Deficit Warning | AC-CAL-01 | **COMPLETE** |
| `ST-E05-003` | Debt Payoff Milestone & Celebration Surface | BR-11 / BR-20 | **COMPLETE** |

## Acceptance evidence

### AC-CAL-01 (evolved AC-09.1)
- Unit: recurring + card_due + installment sources in one projection window
- UI: source tags via `plan.calendar.sources.*`

### ST-E05-002
- `buildCashFlowForecast` flags days where running real cash ≤ `CASH_FLOW_DEFICIT_THRESHOLD`
- Calendar banner + day callout

### ST-E05-003
- Final remaining installment → `payoff_milestone` source + celebration CTAs (Inbox / jar reallocate)
