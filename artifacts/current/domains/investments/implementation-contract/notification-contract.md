# Notification Contract

## Notification Principles

- Notifications must be sparse.
- Notifications must not encourage trading or market timing.
- Notifications must not present investment advice.
- Notifications must not claim estimated value is cash.

## Notification Matrix

| Notification | Trigger | Recipient | Purpose |
|--------------|---------|-----------|---------|
| Investment recognized confirmation | Holding enters Recognized | Acting user | Confirm record was created without implying active cash movement |
| Holding activated confirmation | Holding enters Active | Acting user and eligible household viewers | Confirm active investment exposure exists |
| Valuation stale warning | Value date becomes stale by product-defined review context or user marks stale | Eligible household viewers | Warn that value may not be current |
| Review required warning | Holding enters Under Review | Eligible household viewers | Prompt factual clarification |
| Impairment warning | Holding enters Impaired | Eligible household viewers | Communicate material doubt or risk context |
| Partial exit confirmation | Holding enters Partially Exited or remaining Active after partial exit | Acting user and eligible household viewers | Confirm partial exit context |
| Full exit confirmation | Holding enters Exited, Written Off, or Transferred Out | Acting user and eligible household viewers | Confirm active exposure ended |
| Archive confirmation | Holding enters Archived | Acting user | Confirm historical-only status |
| Invalid action error | Any forbidden action or transition | Acting user | Explain that action did not occur |

## Forbidden Notifications

- Buy recommendation.
- Sell recommendation.
- Hold recommendation.
- Market timing prompt.
- Price movement excitement prompt.
- Gamified streak.
- Automatic rebalance suggestion.
- Tax optimization prompt.

## Recipient Rules

- Owner receives notifications for holdings they can access.
- Partner receives notifications only for household-visible or permitted shared holdings.
- Viewer receives read-only notifications only when holding visibility allows.
- Background Worker and System do not receive user-facing notifications.
