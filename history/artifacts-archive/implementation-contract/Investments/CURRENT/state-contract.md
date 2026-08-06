# State Contract

## Business States

| State | Meaning | Active exposure? |
|-------|---------|------------------|
| Recognized | Investment-relevant asset identified but not fully confirmed. | No confirmed exposure |
| Active | Household owns or treats holding as active investment exposure. | Yes |
| Under Review | Facts are uncertain, stale, disputed, or contradictory. | Unknown or yes |
| Impaired | Holding remains relevant but recoverability/value/liquidity is materially doubtful. | Yes or doubtful |
| Partially Exited | Part of holding exited; some exposure remains. | Yes |
| Exited | Holding fully exited through sale/redemption/repayment/surrender. | No |
| Written Off | Holding treated as no recoverable value. | No |
| Transferred Out | Holding left household-visible control or custody. | No active household-visible exposure |
| Cancelled | Active ownership never formed. | No |
| Archived | Historical-only record. | No |

## Allowed Transitions

| From | To |
|------|----|
| Recognized | Active |
| Recognized | Under Review |
| Recognized | Cancelled |
| Active | Under Review |
| Active | Impaired |
| Active | Partially Exited |
| Active | Exited |
| Active | Written Off |
| Active | Transferred Out |
| Under Review | Active |
| Under Review | Impaired |
| Under Review | Exited |
| Under Review | Cancelled |
| Under Review | Written Off |
| Impaired | Active |
| Impaired | Partially Exited |
| Impaired | Exited |
| Impaired | Written Off |
| Partially Exited | Active |
| Partially Exited | Under Review |
| Partially Exited | Exited |
| Exited | Archived |
| Written Off | Archived |
| Transferred Out | Archived |
| Cancelled | Archived |

## Forbidden Transitions

- Recognized -> Exited without Active, Under Review, or Cancelled clarification.
- Cancelled -> Active without new recognition.
- Archived -> Active.
- Exited -> Active without new recognition.
- Written Off -> Active without recovery review.
- Health -> any Investments state.
- Planning or Goals -> any Investments state by intention alone.
- Market price change -> Exited without sale/redemption/transfer/write-off.
- Unrealized gain/loss -> cash movement.
- Active/Under Review/Impaired/Partially Exited -> Archived.

## Terminal States

- Cancelled.
- Exited.
- Written Off.
- Transferred Out.
- Archived.

Archived is final.

## Recovery Transitions

- Under Review -> Active.
- Under Review -> Exited.
- Under Review -> Cancelled.
- Under Review -> Written Off.
- Impaired -> Active.
- Impaired -> Partially Exited.
- Impaired -> Exited.
- Impaired -> Written Off.

## Invalid Transition Result

When a forbidden transition is attempted:

- State remains unchanged.
- No money moves.
- No Planning update occurs.
- User receives a state-validation failure.
