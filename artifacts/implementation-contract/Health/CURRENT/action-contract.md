# Action Contract

## Assess Household Health

Trigger:

- User opens Health.
- Product surface requests a Health summary.

Actor:

- Owner, Partner, Viewer, Admin, System, or Background Worker with read permission.

Preconditions:

- Household context exists.
- Actor has permission to view household financial context.
- Source-domain read context is available or explicitly unavailable.

Validation:

- Household access is valid.
- Actor role allows read.
- Source facts are grounded or marked missing.
- Assessment does not require source mutation.

Business Rules:

- Health reads only.
- Health must respect BR-01 and BR-24.
- Health must not invent facts.

Success Result:

- Health returns one assessment state: No Visible Facts, Partial, Starting, Steady, Strong, or Stale.
- Factors and completeness context are included when available.

Failure Result:

- Health returns Unavailable or Invalid Attempt.
- No source-domain state changes.

## Refresh Health Assessment

Trigger:

- User refreshes Health.
- User returns to Health.
- Source facts are known to have changed.
- System requests current Health context.

Actor:

- Owner, Partner, Viewer, Admin, System, or Background Worker with read permission.

Preconditions:

- Same as Assess Household Health.

Validation:

- Current source facts replace prior assessment context.
- Stale prior facts are not silently reused.

Business Rules:

- Refresh recomputes interpretation only.
- Refresh does not persist independent Health truth.

Success Result:

- Health assessment reflects current visible facts.

Failure Result:

- Prior valid assessment may remain visible only if marked stale or unavailable according to UI contract.
- No source-domain state changes.

## Determine Data Completeness

Trigger:

- Assessment or refresh begins.

Actor:

- System or Background Worker.

Preconditions:

- Household read context is known.

Validation:

- Required source visibility is classified as visible, missing, stale, unavailable, or not applicable.
- Missing facts are not treated as zero risk.

Business Rules:

- Completeness must be explicit when it affects interpretation.

Success Result:

- Completeness classification is attached to the assessment.

Failure Result:

- Assessment becomes Partial or Unavailable.

## Explain Health Factors

Trigger:

- Health produces a condition state.
- User opens factor details.

Actor:

- Owner, Partner, Viewer, Admin, System, or Background Worker with read permission.

Preconditions:

- At least one factor exists or no-factor state is explicit.

Validation:

- Each factor has a recognized source domain.
- Each factor is grounded in visible facts.
- Factor language is non-advisory.

Business Rules:

- No black-box Health condition.
- Explanation must not tell the user to perform an action.

Success Result:

- User can see source-factor reasons for the assessment.

Failure Result:

- Factor is omitted or assessment becomes Invalid Attempt if explanation cannot be grounded.

## Present Read-Only Scenario

Trigger:

- User views Health scenario.
- Product surface requests a light Health scenario.

Actor:

- Owner, Partner, Viewer, Admin, System, or Background Worker with read permission.

Preconditions:

- Scenario can be derived from visible facts.
- Scenario does not require a money action.

Validation:

- Scenario uses grounded facts only.
- Scenario does not recommend, execute, or imply source-domain changes.
- Scenario does not invent balances.

Business Rules:

- Scenario is observational only.

Success Result:

- Read-only scenario is displayed.

Failure Result:

- Scenario is omitted or blocked.
- Health assessment remains otherwise unchanged.

## View Source Factor Context

Trigger:

- User selects a Health factor.

Actor:

- Owner, Partner, Viewer, or Admin with read permission.

Preconditions:

- Factor has source-domain context visible to actor.

Validation:

- Actor may view the source context.
- Navigation does not mutate source state.

Business Rules:

- Source domain owns the underlying fact.

Success Result:

- User can inspect source context in the owning domain or summary context.

Failure Result:

- Factor context is unavailable or permission-blocked.

## Forbidden Actions

The following actions must not exist in Health:

- Create money record.
- Edit source fact.
- Delete source fact.
- Approve decision.
- Reject decision.
- Resolve Inbox item.
- Create Inbox item.
- Move money.
- Repay debt.
- Reconcile transaction.
- Close account, card, loan, savings, goal, or plan.
- Archive source-domain object.
- Trigger automatic financial action.

Failure Result:

- Any attempted forbidden action returns Invalid Attempt or routes the user to the owning domain without changing data.
