# Stories Completed — Sprint 2

| Story | Title | AC | Status |
|-------|-------|----|--------|
| `ST-E02-001` | Decoupled Jar Plan Movements ($0.00 Ledger Impact) | AC-JAR-01 | **COMPLETE** |
| `ST-E02-002` | Emergency Declaration Flag & BR-07 Warning Bypass | AC-JAR-02 | **COMPLETE** |
| `ST-E02-003` | Partner Emergency Notification & Visibility | AC-JAR-02 | **COMPLETE** |

## Acceptance evidence

### AC-JAR-01
- `plan_movements.ledger_impact` constrained to `0`; RPC refuses if transaction count changes
- Command returns `ledgerTransactionsCreated: 0` and `ledgerImpact: 0`
- UI banner states virtual capacity only (never bank balance)
- Unit: `tests/unit/sprint2-plan-movements.test.ts`

### AC-JAR-02
- `is_emergency` + mandatory `intent_note` on emergency reallocations
- `shouldShowOverspendWarning` returns false when emergency; otherwise requires `warningAcknowledged` under warn policy
- Partner visibility: Inbox `emergency_declaration` with intent note; Plan banner + Inbox panel

### BR-13 mapping
- Spec “partner device notification” realized as household Inbox high-priority item (shared queue; no push stack in this sprint)
