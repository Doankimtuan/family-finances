# Consistency Check

## No Contradictory Rules

- Health can interpret source facts but cannot mutate them.
- Health can show scenarios but cannot recommend or execute actions.
- Health can reflect planning rhythm but cannot treat planning as cash.
- Health can reflect medical expense pressure but cannot give medical or insurance advice.

## No Duplicated Responsibilities

- Accounts own real containers.
- Transactions own money movement.
- Cards own card truth.
- Loans own loan truth.
- Savings owns savings-product truth.
- Planning owns intention.
- Goals own target intentions.
- Inbox owns decisions.
- Together owns membership and permissions.
- Health owns interpretation only.

## No Circular Ownership

- Source domains produce facts.
- Health consumes facts.
- Health produces interpretation.
- Source domains do not depend on Health interpretation to define their own truth.

## No Orphan Flows

| Flow | Source owner | Health outcome |
| --- | --- | --- |
| Assess Health | Multiple source domains | Condition and factors |
| Determine completeness | Multiple source domains | Completeness context |
| Explain factors | Health interpretation | Understandable reason |
| Interpret Inbox pressure | Inbox | Pressure factor |
| Interpret Planning rhythm | Planning | Rhythm factor |
| Interpret activity | Transactions | Tracking factor |
| Interpret obligations | Cards / Loans / other source domains | Pressure factor |
| Present scenario | Verified source facts | Read-only scenario |

Every Health flow either produces interpretation or safely omits/blocks interpretation.

## No Missing Lifecycle Stages

- Beginning: request or display of Health assessment.
- Normal operation: assess, explain, present.
- Changes: reassess when source facts change.
- Completion: assessment presented or unavailable.
- Termination: current assessment ends.
- Recovery: source facts or permission become valid again.
- Exceptional situations: partial, stale, unavailable, or invalid handling.

## No BR Violations

| Rule | Verification |
| --- | --- |
| BR-01 | Health never treats virtual planning as real money. |
| BR-24 | Health never mutates source domains. |
| No unnecessary automation | Health never triggers action. |
| User understands where money is | Health separates source facts from interpretation. |
| Financial safety over convenience | Health blocks unsafe, advisory, invented, or black-box interpretation. |

## No Architecture Violations

- This blueprint defines business behavior only.
- It does not define database, API, DTO, event, or technical contracts.
- It does not modify frozen Source of Truth.
