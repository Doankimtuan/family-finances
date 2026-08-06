# Business Flows

## Create Review Item

Trigger:

- A source domain identifies decision-bearing financial attention.

Preconditions:

- Household context is valid.
- Source domain owns the underlying fact or intention.
- Reason for attention is known.
- Item is not a generic notification.

Business Rules:

- Inbox item must represent unresolved financial attention.
- Inbox must link to source context.
- Source ownership remains outside Inbox.

Expected Result:

- Candidate becomes Pending.
- Household can review the item.

Failure Result:

- No Inbox item is created when attention is generic, source is invalid, or reason is missing.

## Review Pending Item

Trigger:

- Household inspects an active item.

Preconditions:

- Item is Pending or Deferred returned to Pending.

Business Rules:

- Review is read-only until a business outcome is chosen.
- Review must not change real ledger or planning truth by itself.

Expected Result:

- Household understands source, reason, available context, and possible outcomes.

Failure Result:

- Item remains Pending if context is insufficient or invalid.

## Resolve Item

Trigger:

- Household makes the required financial decision.

Preconditions:

- Item is Pending.
- Decision is valid for the item type.
- Owning domain can accept the outcome meaning.

Business Rules:

- Resolution ends active Inbox attention.
- Resolution does not by itself move real money.
- Owning domain remains responsible for financial truth.

Expected Result:

- Item becomes Resolved.
- Decision history records outcome and actor.
- Owning domain may consume the outcome.

Failure Result:

- Item remains Pending when decision is invalid, incomplete, or boundary-breaking.

## Acknowledge Item

Trigger:

- Household recognizes the item and no deeper Inbox decision is required.

Preconditions:

- Item is Pending.
- Acknowledgement is a valid outcome for this item.

Business Rules:

- Acknowledgement is not payment, transfer, correction, or approval.
- Acknowledgement must be distinguishable from resolution.

Expected Result:

- Item becomes Acknowledged.
- Active attention ends.

Failure Result:

- Item remains Pending when acknowledgement would hide a required decision.

## Dismiss Item

Trigger:

- Household determines the item should not remain active.

Preconditions:

- Item is Pending or Deferred.
- Dismissal does not hide a required financial decision.

Business Rules:

- Dismissal is intentional removal from active attention.
- Dismissal is not deletion of source truth.
- Dismissal does not prove the underlying obligation disappeared.

Expected Result:

- Item becomes Dismissed.
- Source domain remains unchanged unless it owns a separate decision.

Failure Result:

- Item remains Pending when dismissal would violate required review.

## Defer Item

Trigger:

- Household cannot decide yet because context is missing or timing is wrong.

Preconditions:

- Item is Pending.
- Deferral is allowed for the item.

Business Rules:

- Deferral keeps the item unresolved.
- Deferral must remain visible as active or intentionally pending attention.
- Deferral cannot be used to archive an unresolved item.

Expected Result:

- Item becomes Deferred.
- Item remains eligible to return to Pending.

Failure Result:

- Item remains Pending when deferral would hide urgent or time-bound attention.

## Return Deferred Item To Pending

Trigger:

- Deferred context becomes available, time arrives, or household resumes review.

Preconditions:

- Item is Deferred.

Business Rules:

- Returning to Pending restores active review.
- Prior deferral history remains understandable.

Expected Result:

- Item becomes Pending.

Failure Result:

- Item remains Deferred only when the deferral condition still applies.

## Expire Time-Bound Item

Trigger:

- Time-bound Inbox attention passes its active window.

Preconditions:

- Item is Pending or Deferred.
- Item has a valid expiration basis.

Business Rules:

- Expiration ends Inbox attention only.
- Expiration must not imply payment, cancellation, or resolution of underlying obligation.
- Generic notification expiration is not an Inbox flow.

Expected Result:

- Item becomes Expired.
- Historical record remains available.

Failure Result:

- Item remains Pending when no valid expiration basis exists.

## Archive Completed Item

Trigger:

- Item is no longer active and should remain historical.

Preconditions:

- Item is Resolved, Acknowledged, Dismissed, Expired, or Auto-Resolved.

Business Rules:

- Archive is historical storage of decision outcome.
- Archive cannot hide active unresolved attention.

Expected Result:

- Item becomes Archived or is treated as historical.

Failure Result:

- Pending or Deferred item cannot be archived directly.

## Suggest Resolution

Trigger:

- Prior household behavior gives an explainable likely outcome.

Preconditions:

- Item is Pending.
- Suggestion is relevant to item type.
- Suggestion can be explained in household terms.

Business Rules:

- Suggestion is optional.
- Suggestion is not authoritative.
- User decision overrides suggestion.

Expected Result:

- Household sees a possible outcome without losing control.

Failure Result:

- No suggestion is presented when confidence, relevance, or explainability is insufficient.

## Auto-Resolve Constrained Pattern

Trigger:

- A low-risk repeated review item matches a previously accepted pattern.

Preconditions:

- Pattern is explainable.
- Outcome cannot move real money.
- Item type is eligible.
- Decision history can show what happened.

Business Rules:

- Auto-resolution is constrained and auditable.
- Auto-resolution cannot execute payments.
- Auto-resolution cannot mutate Health.
- Auto-resolution cannot apply to high-risk or ambiguous items.

Expected Result:

- Item becomes Auto-Resolved.
- Active attention ends with historical trace.

Failure Result:

- Item remains Pending when any eligibility condition fails.

## Recover Item

Trigger:

- New information makes a previous outcome questionable or incomplete.

Preconditions:

- Original item exists or source attention can be re-established.
- Recovery reason is explainable.

Business Rules:

- Recovery must preserve prior history.
- Recovery cannot erase the original outcome.
- Recovery returns attention to Pending or creates new linked attention.

Expected Result:

- Household can review the revived or new item.

Failure Result:

- No state changes when recovery reason is invalid.
