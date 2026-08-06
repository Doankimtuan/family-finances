# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IB-PD-001 | Collect pending financial decisions | Maintain a queue of unresolved household financial attention. | High | High | Low | Low | APPROVED | Validated core problem: young households accumulate undecided money items. |
| IB-PD-002 | Link item to source event or evidence | Preserve what caused the item. | High | High | Medium | Medium | APPROVED | Source linkage is required for trust and prevents Inbox from becoming free-floating tasks. |
| IB-PD-003 | Present why attention is needed | Explain the decision reason. | High | High | Medium | Medium | APPROVED | Users must know why an item exists before they can trust or process it. |
| IB-PD-004 | Preserve current state | Track whether an item is active or no longer active. | High | High | Low | Medium | APPROVED | State prevents unread-message confusion and supports household accountability. |
| IB-PD-005 | Support household resolution | Allow the household to complete the required decision. | High | High | Medium | Medium | APPROVED | Resolution is the central value of Inbox and matches shared-finance behavior. |
| IB-PD-006 | Support dismissal or acknowledgement | Allow non-resolution exits when no deeper decision is needed. | Medium | High | Medium | High | APPROVED WITH MODIFICATIONS | Valid need, but language must keep dismissal, acknowledgement, and financial completion distinct. |
| IB-PD-007 | Preserve decision history | Keep past review outcomes. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | History supports trust, but should remain concise and not become chat/audit overload. |
| IB-PD-008 | Distinguish active from historical items | Separate open attention from completed or expired history. | High | High | Low | Low | APPROVED | Validated by backlog and recovery behavior. |
| IB-PD-009 | Carry context for owning domain | Provide enough information for Transactions, Savings, Planning, or other owners to act. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Approved only if Inbox does not execute or own the underlying financial truth. |
| IB-PD-010 | Separate real money, virtual planning, read-only info | Keep Inbox from mutating money truth by itself. | High | High | Medium | High | APPROVED | Required by BR-01 and product safety. |
| IB-PD-011 | Defer an item | Allow a decision to remain intentionally unresolved. | Medium | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Real household need when context is missing; must not normalize indefinite backlog. |
| IB-PD-012 | Assign or target item to a partner | Direct an item to a specific partner. | Medium | Medium | Medium | High | DEFERRED | Real behavior, but privacy, blame, and control norms need more research. |
| IB-PD-013 | Suggested resolution based on prior behavior | Suggest likely jar/category/action. | Medium | High | Medium | High | APPROVED WITH MODIFICATIONS | Useful for repeated items, but suggestion must be explainable and non-authoritative. |
| IB-PD-014 | Group similar items | Let users understand related or repeated items together. | Medium | Medium | High | Medium | DEFERRED | Valuable for volume, but risks hiding one-decision-per-item clarity. |
| IB-PD-015 | Identify likely duplicate items | Detect repeated signals for the same event. | Medium | Medium | High | Medium | DEFERRED | Real provider risk, but depends on import/provider maturity. |
| IB-PD-016 | Track staleness | Recognize items losing usefulness over time. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Validated backlog risk; must be informational, not punitive. |
| IB-PD-017 | Expire time-bound reminders | Move no-longer-actionable reminders out of active queue. | Medium | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Approved only for time-bound decision/reminder items; expiration must not imply obligation was paid. |
| IB-PD-018 | Surface receipt, invoice, or provider evidence | Show supporting evidence when available. | Medium later | Medium later | High | Medium | DEFERRED | Useful but not validated as core for ordinary young households. |
| IB-PD-019 | Capture confidence or dispute notes | Record uncertainty, disagreement, or contested meaning. | Medium later | Medium later | High | High | DEFERRED | Real need, but can become comments/task management and requires privacy research. |
| IB-PD-020 | Exception-only review | Review only uncertain or unusual items. | Medium later | High later | High | High | DEFERRED | Strong future direction, but requires trustworthy import/classification maturity. |
| IB-PD-021 | Pattern-based auto-resolution with audit trail | Resolve repeated items automatically after accepted patterns. | Medium | Medium | High | High | APPROVED WITH MODIFICATIONS | Approved only as constrained, explainable, reversible-by-history behavior with no money movement. |
| IB-PD-022 | Cross-provider matching | Match bank, wallet, card, receipt, and invoice signals. | High later | High later | High | High | DEFERRED | Valuable after provider integrations; too complex for current simple-first scope. |
| IB-PD-023 | Provider-message classification | Interpret provider messages into possible review items. | Medium later | Medium later | High | High | DEFERRED | Needs Vietnam provider-channel research and high false-positive caution. |
| IB-PD-024 | Household-specific decision learning | Learn household patterns over time. | Medium later | Medium later | High | High | DEFERRED | Depends on user trust, explainability, and enough review history. |
| IB-PD-025 | Richer invoice and receipt review | Treat invoices/receipts as fuller review evidence. | Medium later | Medium later | High | Medium | DEFERRED | Potentially useful for household business or disputes, not validated as core. |
| IB-PD-026 | Review workload metrics | Measure queue size, age, or review burden. | Low now | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Approved only as calm operational context; Health may read it but Inbox must not become scoring. |
| IB-PD-027 | Partner coordination analytics | Analyze partner review behavior or contribution. | Low | Low | High | High | REJECTED | Conflicts with household-first trust and risks surveillance or blame. |
| IB-PD-028 | Regulatory or tax evidence retrieval | Retrieve tax/invoice evidence for household business use. | Low now | Low now | High | High | DEFERRED | Outside ordinary target household core; may be reconsidered for validated business households. |
| IB-PD-029 | General notification-center behavior | Use Inbox for broad alerts, marketing, or awareness-only messages. | Low | Low | Medium | High | REJECTED | Conflicts with Inbox as decision queue and increases noise/backlog anxiety. |

## Summary

- APPROVED: 7.
- APPROVED WITH MODIFICATIONS: 9.
- DEFERRED: 11.
- REJECTED: 2.
- Total reviewed: 29.
