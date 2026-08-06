# Business Flows

## Assess Household Health

Trigger:

- Household opens Health or another domain requests a Health summary.

Preconditions:

- Household context is valid.
- User may view household financial context.
- At least one source-domain fact or explicit no-data condition is available.

Business Rules:

- Health reads only.
- Health must not invent missing facts.
- Health must separate real ledger facts from planning intentions.
- Health must explain the condition using visible factors.

Expected Result:

- Household receives a condition state with factors and completeness context.

Failure Result:

- Health becomes Unavailable or Invalid Attempt for this assessment and no source facts change.

## Determine Data Completeness

Trigger:

- Health assessment begins or source facts change.

Preconditions:

- Source-domain visibility can be evaluated.

Business Rules:

- Missing visibility must not be treated as absence of risk.
- Completeness must be communicated when it affects interpretation.

Expected Result:

- Assessment is classified as Complete Enough, Partial, Stale, or Unavailable.

Failure Result:

- Assessment remains Partial or Unavailable.

## Explain Health Factors

Trigger:

- A Health condition is produced.

Preconditions:

- At least one contributing factor is known.

Business Rules:

- Every condition must have understandable source factors.
- Factor explanation must be grounded in visible facts.
- Factor explanation must not become advice.

Expected Result:

- Household can see why the condition appears.

Failure Result:

- Health blocks black-box interpretation and marks the assessment Invalid Attempt or Partial.

## Interpret Inbox Pressure

Trigger:

- Open decision burden is visible.

Preconditions:

- Inbox provides read-only unresolved decision context.

Business Rules:

- Inbox owns decisions and review outcomes.
- Health may only interpret decision burden.

Expected Result:

- Health reflects unresolved decision pressure as a factor.

Failure Result:

- If Inbox context is unavailable, Health marks this factor missing or partial.

## Interpret Planning Rhythm

Trigger:

- Planning context is visible.

Preconditions:

- Planning provides read-only intention context.

Business Rules:

- Planning intention is not real money.
- Health may not treat jars, goals, or allocations as spendable cash.

Expected Result:

- Health reflects planning presence or absence as a condition factor.

Failure Result:

- Planning factor is omitted or marked partial; no planning state changes.

## Interpret Recent Activity Rhythm

Trigger:

- Recent transaction activity is visible.

Preconditions:

- Transactions provide recent activity context.

Business Rules:

- Recent activity indicates tracking rhythm only.
- Transaction volume alone must not imply wealth or safety.

Expected Result:

- Health reflects recent tracking rhythm as a factor.

Failure Result:

- Activity factor is omitted or marked partial.

## Interpret Liquidity Visibility

Trigger:

- Account, cash, or real-money visibility is available.

Preconditions:

- Real-money source facts are visible from owning domains.

Business Rules:

- Health may summarize visibility, not safe-to-spend permission.
- Health must not infer hidden balances.

Expected Result:

- Health reflects visible real-money clarity or missing liquidity context.

Failure Result:

- Liquidity interpretation is partial or unavailable.

## Interpret Obligation, Debt, And Card Pressure

Trigger:

- Visible bills, loans, cards, or repayment pressure exist.

Preconditions:

- Owning domains provide read-only obligation facts.

Business Rules:

- Cards and Loans own product truth.
- Health may not create, edit, close, repay, or reconcile obligations.
- Pressure is an observation, not an instruction.

Expected Result:

- Health reflects obligation pressure as a factor.

Failure Result:

- Obligation factor is omitted or marked partial.

## Interpret Medical-Expense Exposure

Trigger:

- Visible medical spending or medical-cost pressure exists.

Preconditions:

- Medical expense is visible as financial data from owning domains.

Business Rules:

- Health may interpret financial pressure only.
- Health must not provide clinical, provider, or insurance advice.

Expected Result:

- Health reflects medical-expense pressure as financial context.

Failure Result:

- Medical factor is omitted when facts are missing or advisory interpretation would be required.

## Interpret Emergency Resilience

Trigger:

- Visible buffer, reserve, or emergency-related context exists.

Preconditions:

- Real-money and/or intention context is distinguishable.

Business Rules:

- Health must not prescribe a required emergency-fund amount.
- Real buffer and virtual intention must remain distinct.

Expected Result:

- Health reflects visible resilience cautiously.

Failure Result:

- Emergency resilience factor is partial or omitted.

## Interpret Partner Rhythm

Trigger:

- Household decision or visibility rhythm suggests shared alignment context.

Preconditions:

- Household-level context is visible without partner scoring.

Business Rules:

- Health may not score, blame, or surveil a partner.
- Together owns household membership and permissions.

Expected Result:

- Health reflects neutral household rhythm only.

Failure Result:

- Partner factor is omitted when it would imply blame or personal scoring.

## Compare With Prior Grounded Condition

Trigger:

- Prior grounded condition context is available.

Preconditions:

- Prior context is stable, comparable, and explainable.

Business Rules:

- Comparison must not rely on invented or stale facts.
- Comparison must not become independent persisted Health truth.

Expected Result:

- Household sees whether visible condition appears improved, weakened, or similar.

Failure Result:

- Comparison is omitted and current assessment remains primary.

## Present Read-Only Scenario

Trigger:

- Household views a scenario or Health presents a light what-if.

Preconditions:

- Scenario can be derived from verified visible facts.

Business Rules:

- Scenario is observational, not prescriptive.
- Scenario must not move money, change plans, resolve Inbox, or alter source facts.
- Scenario must not invent balances.

Expected Result:

- Household sees a read-only interpretation of possible condition change.

Failure Result:

- Scenario is blocked or omitted.
