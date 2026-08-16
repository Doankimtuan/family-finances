# Business Rules

## Existing Rules

| Rule | Behavior in Planning |
| --- | --- |
| BR-01 Real Ledger is not Virtual Planning | Planning is intention only; jars, goals, allocations, and reallocations are not account balances or transactions. |
| BR-02 Action context | Planning changes require valid household context. |
| BR-02a Membership protection | Planning belongs to the active household and is protected by membership. |
| BR-03 Active jar target | Only Active jars are valid allocation targets. |
| BR-04 Income placement | Income placement is expected allocation until actual income is confirmed elsewhere. |
| BR-06 Positive amount and direction | Planning movements use positive magnitude and explicit virtual direction. |
| BR-08 Monthly Review (non-locking) | Monthly Review is an optional report. Marking or skipping it never locks Plan mutations or Money. Historical V1 approved/pending_review statuses are informational only. |
| BR-09 Assisted planning default | Assisted mode may recommend reallocations, overspend covers, and review insights. It never moves money or invents balances (BR-14). |
| BR-13 Partner-visible assumptions | Material planning assumptions may need partner-visible handling. |
| BR-14 AI non-invention | AI must not invent balances, due truth, or financial actions. |
| BR-15 Online-first money mutations | Planning mutations are not offline write behavior in current scope. |
| BR-24 Health read-only | Health may read Planning but cannot mutate Planning. |

## Clarified Rules

| Rule | Clarification |
| --- | --- |
| Planning intent is not provider truth | Expected income, recurring rules, due dates, and projections remain expected unless owning domains confirm facts. |
| Planning adaptation does not move money | Jar changes, sinking funds, payoff intentions, and emergency reallocations are virtual. |
| Planning review is household learning | Review explains and closes understanding; it does not judge or silently rewrite facts. |
| Goal versus savings product | Goals are intention; Savings owns product balance, rate, maturity, renewal, and withdrawal truth. |
| Recurring expectation versus payment | A recurring item does not prove a payment happened. |
| Calendar pressure | Calendar entries show expected pressure unless source facts are explicitly read from owning domains. |
| Shared planning safety | Planning visibility must respect household trust, privacy, and blame sensitivity. |

## Derived Rules

| Rule | Business behavior |
| --- | --- |
| Planning cannot own real money location | Accounts own where money is. |
| Planning cannot own money movement | Transactions own factual movement. |
| Planning cannot own credit or debt truth | Cards and Loans own obligation truth. |
| Planning cannot own savings product truth | Savings owns product truth. |
| Invalid attempts preserve prior valid state | Boundary-breaking planning actions do not change the existing valid plan. |
| Historical planning is not erasure | Cancelled, completed, archived, corrected, and reviewed records remain interpretable. |
| Expected data must be distinguishable | Household must be able to tell expected from confirmed. |
| Rejected scope stays out | Tax-aware and advisory-grade planning are not Planning behavior. |
| BR-23 Quick Close deprecated | V1 Quick Close streak/autolock is deprecated. Monthly Review is never a required close workflow. |

## Plan V2 Foundation Rules

| Rule | Business behavior |
| --- | --- |
| Monthly Review is optional | It is a report and reflection checkpoint only. Skipping it has zero operational consequence. |
| Monthly Review is non-blocking | Review states, including historical `approved` and `pending_review`, never prevent Plan mutations or Money activity. |
| Plan mutability is independent | Creating, editing, pausing, resuming, reallocating, and updating Plan intentions remain available regardless of Review state. |
| Assisted is recommendation-only | Assisted may surface suggestions; it never closes a month, moves money, allocates automatically, or funds a Goal automatically. |
| Legacy V1 records remain historical | Ritual rows, completion streaks, and auto-lock timestamps may remain stored for compatibility, but they do not control V2 behavior. |
