# Action Contract

## Create Review Item

Trigger:

- A source domain identifies decision-bearing financial attention.

Actor:

- System, Background Worker, Owner, Partner, or Admin when acting with a valid source reason.

Preconditions:

- Household exists and actor/source may create attention for the household.
- Source domain or accepted source reason is present.
- Reason for attention is present.
- Item is not a generic notification.

Validation:

- Source is recognized.
- Reason is decision-bearing.
- Active duplicate for same source/reason is not already present.
- Required item context for the item type is present.

Business Rules:

- Inbox items represent unresolved financial attention only.
- Source ownership remains external.

Success Result:

- Candidate becomes Pending.
- Review item has source, reason, state, and household visibility.

Failure Result:

- No item is created.
- Prior source state remains unchanged.

## Review Item

Trigger:

- Actor opens or inspects an active item.

Actor:

- Owner, Partner, Viewer, Admin, System, or Background Worker for read-only purposes.

Preconditions:

- Item exists.
- Actor has read access.
- Item is Pending, Deferred, or historical-readable.

Validation:

- Household visibility permits reading.
- Source context can be shown without ownership leakage.

Business Rules:

- Review is read-only.
- Review does not change money, planning, or health.

Success Result:

- Item remains in prior state.
- Actor can understand source, reason, state, and allowed outcomes.

Failure Result:

- Item is not shown or is shown as unavailable.
- Item state is unchanged.

## Resolve Item

Trigger:

- Household makes the required financial decision.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Item is Pending.
- Actor may perform household decision actions.
- Resolution payload is valid for item type.
- Owning domain can accept outcome meaning.

Validation:

- Item state is Pending.
- Resolution does not attempt generic acknowledgement, deletion, or notification clearing.
- Resolution does not directly move real money.
- Resolution does not mutate source truth outside owning-domain acceptance.

Business Rules:

- Resolution ends active Inbox attention.
- Resolution is not money movement.

Success Result:

- Item becomes Resolved.
- Outcome and actor are recorded in decision history.
- Owning domain may consume outcome under its own rules.

Failure Result:

- Item remains Pending.
- Failure explains invalid state, permission, missing decision, or boundary violation.

## Acknowledge Item

Trigger:

- Household confirms awareness is sufficient.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Item is Pending.
- Item type allows acknowledgement.

Validation:

- Acknowledgement does not hide a required decision.
- Acknowledgement does not imply payment, transfer, correction, renewal, or approval.

Business Rules:

- Acknowledgement is distinct from resolution.

Success Result:

- Item becomes Acknowledged.
- Active attention ends.

Failure Result:

- Item remains Pending.

## Dismiss Item

Trigger:

- Household determines the item should not remain active.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Item is Pending or Deferred.
- Dismissal is allowed for item type and current state.

Validation:

- Dismissal does not hide required financial attention.
- Dismissal does not delete source truth.
- Dismissal reason, if required by item type, is present.

Business Rules:

- Dismissal is not deletion.

Success Result:

- Item becomes Dismissed.
- Source domain remains authoritative.

Failure Result:

- Item remains in prior valid state.

## Defer Item

Trigger:

- Household cannot decide yet.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Item is Pending.
- Item type allows deferral.

Validation:

- Deferral does not hide urgent required action.
- Deferral context is business-valid if required.

Business Rules:

- Deferred remains unresolved attention.

Success Result:

- Item becomes Deferred.

Failure Result:

- Item remains Pending.

## Return Deferred Item To Pending

Trigger:

- Deferred context arrives, review resumes, or deferral condition ends.

Actor:

- Owner, Partner, Admin, System, or Background Worker.

Preconditions:

- Item is Deferred.

Validation:

- Item still belongs to active household scope.
- Return reason is valid when initiated by System or Background Worker.

Business Rules:

- Pending restores active review.

Success Result:

- Item becomes Pending.

Failure Result:

- Item remains Deferred.

## Expire Time-Bound Item

Trigger:

- Active window for a time-bound item passes.

Actor:

- System or Background Worker.

Preconditions:

- Item is Pending or Deferred.
- Item has valid expiration basis.

Validation:

- Expiration date/window is known.
- Item type permits expiration.
- Item is not already terminal.

Business Rules:

- Expiration is not payment.
- Generic notification expiration is not Inbox behavior.

Success Result:

- Item becomes Expired.

Failure Result:

- Item remains in prior valid state.

## Archive Completed Item

Trigger:

- No-longer-active item should remain historical.

Actor:

- Owner, Partner, Admin, System, or Background Worker.

Preconditions:

- Item is Resolved, Acknowledged, Dismissed, Expired, or Auto-Resolved.

Validation:

- Item is not Pending or Deferred.
- Historical record remains traceable.

Business Rules:

- Archive cannot hide active attention.

Success Result:

- Item becomes Archived or is treated as historical.

Failure Result:

- Item remains in prior valid state.

## Suggest Resolution

Trigger:

- Prior household behavior supports an explainable suggestion.

Actor:

- System.

Preconditions:

- Item is Pending.
- Suggestion is relevant and explainable.

Validation:

- Suggestion does not claim authority.
- Suggestion does not move money.
- Suggestion has enough household pattern basis.

Business Rules:

- Suggestions are optional and subordinate to user decision.

Success Result:

- Suggestion is available as read-only decision support.
- Item remains Pending.

Failure Result:

- No suggestion is shown.
- Item remains Pending.

## Auto-Resolve Constrained Pattern

Trigger:

- Low-risk repeated review item matches accepted household pattern.

Actor:

- System.

Preconditions:

- Item is Pending.
- Item type is auto-resolution eligible.
- Pattern is accepted, explainable, and low-risk.
- Outcome cannot move real money.

Validation:

- No ambiguity or conflict exists.
- Source remains valid.
- Historical explanation can be recorded.

Business Rules:

- Auto-resolution is constrained, explainable, and auditable.
- Auto-resolution cannot execute payments or mutate Health.

Success Result:

- Item becomes Auto-Resolved.
- Decision history records pattern basis.

Failure Result:

- Item remains Pending.

## Recover Item

Trigger:

- New information makes a prior outcome incomplete, wrong, or relevant again.

Actor:

- Owner, Partner, Admin, System, or Background Worker with valid source evidence.

Preconditions:

- Prior item exists or new source attention is valid.
- Recovery reason is explainable.

Validation:

- Recovery preserves prior history.
- Recovery does not silently rewrite outcome.
- Recovered item has valid source/reason.

Business Rules:

- Recovery returns attention to Pending or creates new linked Candidate.

Success Result:

- Item becomes Pending or new linked Pending item exists.

Failure Result:

- Prior state remains unchanged.
