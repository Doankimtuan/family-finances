# State Machine

## State Definitions

### Recognized

The household has identified an investment-relevant asset, but active ownership or key facts may still need confirmation.

### Active

The household currently owns or treats the holding as investment exposure.

### Under Review

Important facts are uncertain, stale, disputed, or contradictory. Review does not imply the investment is wrong; it means the household cannot fully trust the current interpretation.

### Impaired

The holding is still relevant but value, liquidity, or recoverability is materially doubtful. Examples include issuer default, family dispute, suspected scam, suspended redemption, or major unverifiable loss.

### Partially Exited

Part of the holding has been sold, redeemed, repaid, transferred, or written off; some active exposure remains.

### Exited

The holding no longer remains active because it was fully sold, redeemed, repaid, surrendered, or otherwise converted out of active investment exposure.

### Written Off

The household treats the holding as having no recoverable value or no reliable claim remaining.

### Transferred Out

The holding left household-visible control or custody but was not necessarily sold for cash.

### Cancelled

The investment never became active ownership, or recognition was invalid before active holding was confirmed.

### Archived

Historical record retained for memory, audit, and read-only context. No active behavior continues.

## Allowed Transitions

| From | To | Trigger | Business result |
|------|----|---------|-----------------|
| Recognized | Active | Ownership and minimum facts confirmed | Holding becomes active exposure. |
| Recognized | Under Review | Minimum facts are unclear | Holding awaits clarification. |
| Recognized | Cancelled | No investment ownership formed | Investment recognition ends. |
| Active | Under Review | Value, ownership, liquidity, or classification is questioned | Holding requires clarification. |
| Active | Impaired | Material doubt or risk event occurs | Holding remains relevant but doubtful. |
| Active | Partially Exited | Partial sale/redemption/transfer/write-off occurs | Remaining exposure continues. |
| Active | Exited | Full sale/redemption/repayment/surrender occurs | Active exposure ends. |
| Active | Written Off | Holding has no recoverable value | Active exposure ends as loss/write-off. |
| Active | Transferred Out | Holding leaves household-visible ownership/control | Active household exposure ends or moves out. |
| Under Review | Active | Facts clarified and active ownership remains | Holding returns to active. |
| Under Review | Impaired | Clarification shows material doubt | Holding becomes impaired. |
| Under Review | Exited | Clarification shows full exit occurred | Holding becomes exited. |
| Under Review | Cancelled | Clarification shows no active ownership formed | Holding becomes cancelled. |
| Under Review | Written Off | Clarification shows no recoverable value | Holding becomes written off. |
| Impaired | Active | Doubt resolved and value/claim remains | Holding returns to active. |
| Impaired | Partially Exited | Partial recovery or partial write-off occurs | Remaining exposure continues. |
| Impaired | Exited | Recovery or sale fully ends exposure | Holding exits. |
| Impaired | Written Off | No recoverable value remains | Holding becomes written off. |
| Partially Exited | Active | Remaining holding is clear | Remaining holding continues. |
| Partially Exited | Under Review | Remaining amount/value is unclear | Holding awaits clarification. |
| Partially Exited | Exited | Remaining holding is fully exited | Active exposure ends. |
| Exited | Archived | Retention/archive action | Historical-only record. |
| Written Off | Archived | Retention/archive action | Historical-only record. |
| Transferred Out | Archived | Retention/archive action | Historical-only record. |
| Cancelled | Archived | Retention/archive action | Historical-only record. |

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

## Recovery Transitions

Recovery transitions are:

- Under Review -> Active.
- Under Review -> Exited.
- Under Review -> Cancelled.
- Under Review -> Written Off.
- Impaired -> Active.
- Impaired -> Partially Exited.
- Impaired -> Exited.
- Impaired -> Written Off.

## Terminal States

Terminal operational states:

- Cancelled.
- Exited.
- Written Off.
- Transferred Out.
- Archived.

Archived is the final historical state.
