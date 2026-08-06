# Inbox Contract

## Inbox Principles

- No Inbox item is created for normal, clear investment tracking.
- Inbox exists only when user attention is required to resolve uncertainty.
- Inbox acknowledgment never moves money.
- Inbox never recommends buy, sell, hold, switch, rebalance, or market timing.

## Business Event Matrix

| Event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
|-------|--------------------------|------|----------|-----------------|------------|-----------------|---------------|
| Holding recognized with complete minimum facts | No | None | None | None | None | None | None |
| Holding missing identity | Yes | Investment review | High | Provide identity or cancel/reclassify | None | No | Dismiss only by cancel, reclassify, or completed identity |
| Asset class unknown | Optional | Investment review | Low | Confirm class or keep unknown | None | No | Can dismiss if unknown is intentional |
| Ownership/visibility unclear | Yes | Investment review | High | Confirm household/personal/family/unclear status | None | No | Can dismiss only when uncertainty is intentionally accepted |
| Valuation source missing | Optional | Investment review | Medium | Add source or mark unknown | None | No | Can dismiss if unknown source is accepted |
| Valuation date missing or stale | Optional | Investment review | Medium | Update date/value or accept stale value | None | No | Can dismiss if stale value is accepted |
| Contradictory contribution/value/proceeds | Yes | Investment review | High | Correct, mark uncertain, or reclassify | None | No | Cannot dismiss while contradiction remains active |
| Holding marked Impaired | Optional | Investment risk review | High | Confirm impairment context or exit/write off | None | No | Dismiss only if impairment remains acknowledged |
| Partial exit with unclear remaining exposure | Yes | Investment exit review | High | Clarify remaining holding or mark Under Review | None | No | Cannot dismiss until remaining exposure is clear or accepted unknown |
| Full exit with unclear proceeds | Yes | Investment exit review | High | Confirm proceeds, transfer, write-off, or unknown | None | No | Cannot dismiss until final state is explainable |
| Cancelled investment with unresolved refund | Yes, if cash movement is unresolved | Transaction/investment review | High | Resolve refund/reversal in Transactions context | None | No | Dismiss only when transaction owner resolves or uncertainty accepted |
| Archive attempt blocked | No | None | None | None | None | None | Error state handles it |

## Priority Rules

- High: ownership conflict, unclear proceeds, contradiction, impairment, unresolved refund.
- Medium: stale value or missing source that may affect household interpretation.
- Low: optional classification detail when household accepts unknown.

## Expiration Rules

- Investment Inbox items do not expire automatically.
- A stale-value item may become less prominent after user accepts stale/unknown status, but it is not auto-resolved.

## Auto Resolution

Auto resolution is forbidden unless the exact missing business fact becomes known through a permitted action.
