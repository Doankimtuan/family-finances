# Action Contract

## Create Income Intention

Trigger: Household expects income for planning.

Actor: Owner, Partner, or Admin.

Preconditions:

- Actor is an active household member with planning rights.
- Household context is valid.
- Income is expected, not claimed as received.

Validation:

- Name or source label is present.
- Expected amount or allocation basis is positive.
- Direction is income expectation.
- Period or timing is valid if supplied.

Business Rules:

- BR-01, BR-02, BR-02a, BR-04, BR-15.
- Actual received income belongs to Transactions and Accounts.

Success Result:

- Income intention becomes Draft or Active.
- No ledger write occurs.

Failure Result:

- No intention is created.
- Prior state remains unchanged.

## Create Jar

Trigger: Household identifies a purpose container for planned money.

Actor: Owner, Partner, or Admin.

Preconditions:

- Actor has planning rights.
- Purpose is recognizable.
- Jar is not framed as a real account or balance.

Validation:

- Name is present.
- Kind is valid for Planning.
- Initial state is Draft or Active.
- Any initial allocation is valid as intention only.

Business Rules:

- BR-01, BR-02, BR-02a, BR-03, BR-15.
- Active jars may be allocation targets; paused and archived jars may not.

Success Result:

- Jar becomes Active unless explicitly saved as Draft.

Failure Result:

- No jar is created.
- User-visible failure states the invalid field, permission, or BR-01 boundary issue.

## Update Jar Or Allocation

Trigger: Household changes purpose, amount, percent, fixed allocation, or virtual capacity.

Actor: Owner, Partner, or Admin.

Preconditions:

- Target intention exists.
- Period is not Locked unless correction path is used.
- Target is Active unless the update is a lifecycle change.

Validation:

- Amounts are non-negative where stored and positive for movements.
- Percent allocation stays within valid planning range.
- Fixed allocation uses supported household currency.
- Direction is explicit for virtual movement.
- Target jar is Active for allocation.

Business Rules:

- BR-01, BR-03, BR-04, BR-06, BR-08, BR-15.

Success Result:

- Intention becomes Adjusted, then Active when valid.
- No real money moves.

Failure Result:

- Prior valid allocation remains unchanged.

## Pause Intention

Trigger: Household temporarily stops using an active intention.

Actor: Owner, Partner, or Admin.

Preconditions:

- Intention is Active.
- Period permits normal changes.

Validation:

- Intention is not Completed, Cancelled, Archived, Historical, or Locked.

Business Rules:

- Paused intentions are not allocation targets.
- Pause does not erase history or move money.

Success Result:

- Intention becomes Paused.

Failure Result:

- State remains unchanged.

## Resume Intention

Trigger: Household reactivates a paused intention.

Actor: Owner, Partner, or Admin.

Preconditions:

- Intention is Paused.
- Required context is still valid.

Validation:

- Intention is not terminal.
- Any allocation target remains valid.

Business Rules:

- Resume does not imply funding.

Success Result:

- Intention becomes Active.

Failure Result:

- State remains Paused.

## Create Or Update Goal

Trigger: Household defines or changes a target purpose.

Actor: Owner, Partner, or Admin.

Preconditions:

- Goal is understood as intention.
- Goal is not Savings product truth.

Validation:

- Name is present.
- Target amount is positive when supplied.
- Funded or progress value, if used, is not presented as provider balance.
- Target date, if supplied, is valid.
- Status transition is allowed.

Business Rules:

- BR-01, BR-02, BR-02a, BR-15.
- Savings owns product balance, rate, maturity, renewal, and withdrawal truth.

Success Result:

- Goal becomes Draft, Active, or Adjusted.

Failure Result:

- Goal remains unchanged.

## Create Or Update Recurring Expectation

Trigger: Household identifies repeating income or expense expectation.

Actor: Owner, Partner, or Admin.

Preconditions:

- Recurring item is expectation, not paid status.

Validation:

- Name is present.
- Expected amount is positive.
- Direction is income or expense expectation.
- Frequency and timing are valid.
- Next expected date, if supplied, is valid.

Business Rules:

- BR-01, BR-02, BR-02a, BR-15.
- Transactions own actual payment.

Success Result:

- Recurring expectation becomes Active or Adjusted.

Failure Result:

- Existing recurring expectation remains unchanged.

## Maintain Expected Due Date

Trigger: Household records or updates expected due pressure.

Actor: Owner, Partner, Admin, System, or Background Worker when using read-only source facts.

Preconditions:

- Due date is expected or source-confirmed.
- Source status is clear.

Validation:

- Date is valid.
- Source-confirmed due truth is attributed to owning domain.
- Expected due date is not labeled as paid or confirmed.

Business Rules:

- Planning owns expected pressure only.
- Cards, Loans, Savings, and providers own confirmed due truth.

Success Result:

- Expected due pressure is visible in Planning.

Failure Result:

- Due pressure becomes Needs Review or remains unchanged.

## Compare Plan With Facts

Trigger: Source-domain facts are available or changed.

Actor: System, Background Worker, Owner, Partner, or Admin.

Preconditions:

- Planning item exists.
- Source facts are read-only.

Validation:

- Source fact belongs to household.
- Source-domain ownership is preserved.
- Mismatch language remains explanatory.

Business Rules:

- Comparison does not mutate source facts.
- Review is household learning.

Success Result:

- Planning item may remain Active or become Needs Review.
- Read-only comparison context is available.

Failure Result:

- No authoritative comparison is produced when facts are missing or stale.

## Review Period

Trigger: Household reaches period review point.

Actor: Owner, Partner, or Admin.

Preconditions:

- Planning period exists.
- Active intentions and relevant facts are available or uncertainty is acknowledged.

Validation:

- Actor has planning rights.
- Unresolved required review items are either resolved or explicitly acknowledged.
- Period is not already Locked unless correction path is used.

Business Rules:

- BR-08, BR-09, BR-15.
- Review locks Planning only, not Ledger.

Success Result:

- Period becomes Reviewed or Locked.

Failure Result:

- Period remains Active or Needs Review.

## Correct Planning

Trigger: Household finds wrong or incomplete planning information.

Actor: Owner, Partner, or Admin.

Preconditions:

- Planning item or period exists.
- Correction concerns Planning only.

Validation:

- Correction reason is present.
- Target state supports correction.
- Correction does not alter real ledger or product truth.

Business Rules:

- BR-01, BR-08, BR-15.
- Explicit correction path is required for Locked periods.

Success Result:

- Item becomes Corrected, then Active or Historical as appropriate.

Failure Result:

- Prior valid state remains unchanged.

## Emergency Reallocation

Trigger: Emergency changes household priorities.

Actor: Owner, Partner, or Admin.

Preconditions:

- Affected intention exists.
- Emergency change is virtual.
- Period allows change or explicit correction path is used.

Validation:

- Source and target planning intentions are distinct when reallocation references both.
- Amount is positive.
- Direction is explicit.
- Action does not claim real withdrawal, payment, or transfer.

Business Rules:

- BR-01, BR-06, BR-08, BR-15.

Success Result:

- Planning becomes Adjusted, then Active or Needs Review.

Failure Result:

- Prior planning state remains unchanged.

## Complete Intention

Trigger: Household considers intention fulfilled.

Actor: Owner, Partner, or Admin.

Preconditions:

- Intention is Active or Paused.

Validation:

- Completion does not claim payment, savings balance, card payoff, or loan payoff unless source-domain fact exists read-only.
- Terminal transition is allowed.

Business Rules:

- Completion is planning status only.

Success Result:

- Intention becomes Completed, then Historical.

Failure Result:

- Intention becomes Needs Review or remains unchanged.

## Cancel Intention

Trigger: Household abandons an intention.

Actor: Owner, Partner, or Admin.

Preconditions:

- Intention exists and is not terminal.

Validation:

- Cancellation is allowed from Draft, Active, or Paused.
- Cancellation does not delete history.

Business Rules:

- No real money movement.

Success Result:

- Intention becomes Cancelled, then Historical.

Failure Result:

- Prior valid state remains unchanged.

## Archive Intention

Trigger: Household removes an intention from active use while keeping history.

Actor: Owner, Partner, or Admin.

Preconditions:

- Intention exists and is Active or Paused.

Validation:

- No active required review is hidden.
- Archived intention is not an allocation target.

Business Rules:

- History remains interpretable.

Success Result:

- Intention becomes Archived, then Historical.

Failure Result:

- State remains unchanged or Needs Review.

## Reject Invalid Attempt

Trigger: Requested action violates Planning contract.

Actor: System.

Preconditions:

- Invalid condition is detected.

Validation:

- Violation is identified as permission, state, field, financial boundary, ownership, or cross-domain error.

Business Rules:

- Invalid attempts preserve previous valid state.

Success Result:

- Action is rejected.
- Prior state remains unchanged.

Failure Result:

- Not applicable; this is the failure terminal for the attempted action.
