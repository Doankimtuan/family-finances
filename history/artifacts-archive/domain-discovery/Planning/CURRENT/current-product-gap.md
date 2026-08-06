# Current Product Gap

This document compares the discovered real-world Planning domain with the current product artifacts and code. It lists factual gaps only and does not propose solutions.

## Current Product Observations

- The official feature specification defines Plan as jars, goals, recurring, Month Ritual, and real-versus-virtual teaching.
- The official requirements include Active jar targeting, percent or fixed income placement, Off/Suggest/Auto income allocation, positive movement magnitudes, explicit movement direction, and Month Ritual locking.
- The official business catalog treats real-versus-virtual separation as a non-negotiable axiom.
- The current module boundary includes `modules/plan`.
- Current plan constants include jar kinds, jar states, plan kinds, goal statuses, recurring frequencies, income allocation modes, ritual modes, ritual statuses, plan movement events, and calendar event sources.
- Current Plan types distinguish planned jar data, goal data, recurring rules, calendar data, and plan pulse.
- Current plan movement policy states plan movements have zero ledger impact.
- Current screen blueprints include Plan Hub, Jars, Jar Detail, Goals, Goal Detail, Recurring, Recurring Detail, and Month Ritual.
- Current Product Definition links Home, Money, Plan, Inbox, Together, and Health with Plan as an intention surface.
- Current Health code reads Plan data for insight scenarios while preserving read-only behavior.
- Current code includes a Household Financial Calendar under Plan with recurring, card due, loan, liability, and payoff milestone event sources.

## Factual Gaps Against Real-World Domain

| Real-world concern | Current product evidence | Factual gap |
| --- | --- | --- |
| Young households often plan around multiple salary dates. | Recurring rules support income and expense with weekly/monthly frequency. | No factual evidence of partner-specific salary timing or multiple income-source ownership in Planning. |
| Irregular income is common for freelance, commission, bonus, and small-business households. | Recurring frequency supports weekly/monthly patterns. | No factual evidence of irregular income planning semantics. |
| Annual, seasonal, Tet, school, insurance, and vehicle expenses affect household planning. | Calendar projection and recurring rules exist. | No factual evidence of annual/seasonal planning concepts in the observed Plan model. |
| Family support is a major real-world planning pressure in Vietnam. | Goals and recurring expenses are generic. | No factual evidence of family-support meaning distinct from generic expense or goal intention. |
| Cash spending can be hard to reconstruct. | Transactions and Accounts own real cash facts; Planning reads facts. | No factual evidence of Planning-specific treatment for incomplete cash evidence. |
| Partner negotiation is central to household planning. | Together grants shared daily Money/Plan/Inbox rights and audit for material policy changes. | No factual evidence of lightweight planning discussion, disagreement, or decision context in Plan itself. |
| Real-world planning often uses sinking funds for known future expenses. | Goals and jars exist. | No factual evidence that known future expenses are distinguished from general goals or jars. |
| Households need to distinguish expected bill, issued bill, and paid bill. | Recurring rules and calendar events exist; Transactions own facts. | No factual evidence of issued-versus-expected bill state in Planning. |
| Planned-versus-actual review is a natural part of budgeting. | Month Ritual exists as preview, approve, lock, and correction path. | Observed artifacts do not provide factual detail on variance categories or mismatch interpretation beyond ritual preview and lock. |
| Rollover is common in envelope budgeting. | Capacity delta and plan movements exist. | No factual evidence of explicit rollover terminology or period-to-period unused capacity semantics. |
| Long-term goals may compete with debt, savings products, insurance, and child education. | Goals exist and Cards/Loans/Savings have adjacent product domains. | No factual evidence of cross-goal prioritization or long-term planning semantics in current Plan. |
| Provider-connected planning tools may infer recurring obligations. | Calendar and recurring rules exist. | No factual evidence of provider-derived recurring detection in current product. |

## Product-Definition Alignment Observations

- The strongest alignment is the explicit separation between real ledger truth and planning intention.
- The current product already maps the central household planning concepts: jars, goals, recurring expectations, month review, and calendar pressure.
- The current model is intentionally MVP-oriented and narrower than the full real-world Planning domain.
- Several real-world concerns are present only as generic structures, not as named domain concepts.

No implementation changes are proposed in this discovery phase.
