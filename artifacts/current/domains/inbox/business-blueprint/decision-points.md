# Decision Points

## Accept Source Attention

Who makes it:

- Business system according to domain rules.

Why:

- Only decision-bearing financial attention belongs in Inbox.

Possible outcomes:

- Accept as Pending.
- Reject as not Inbox-eligible.

Business impact:

- Protects Inbox from notification-feed drift.

## Review

Who makes it:

- Household member with valid household access.

Why:

- The household must understand the item before choosing an outcome.

Possible outcomes:

- Resolve.
- Acknowledge.
- Dismiss.
- Defer.
- Leave Pending.

Business impact:

- Turns passive attention into accountable household behavior.

## Resolve

Who makes it:

- Household member.

Why:

- Required decision has been made.

Possible outcomes:

- Resolved.
- Invalid Attempt.

Business impact:

- Ends active Inbox attention and may route decision outcome to owning domain.

## Acknowledge

Who makes it:

- Household member.

Why:

- Awareness is sufficient and no deeper Inbox action is required.

Possible outcomes:

- Acknowledged.
- Invalid Attempt.

Business impact:

- Ends active attention without claiming financial completion.

## Dismiss

Who makes it:

- Household member.

Why:

- Item should not remain active.

Possible outcomes:

- Dismissed.
- Invalid Attempt.

Business impact:

- Removes noise while preserving source ownership.

## Defer

Who makes it:

- Household member.

Why:

- Decision cannot be made yet.

Possible outcomes:

- Deferred.
- Invalid Attempt.

Business impact:

- Keeps unresolved attention visible without forcing premature decision.

## Expire

Who makes it:

- Business rule based on time-bound attention.

Why:

- Item's active window has passed.

Possible outcomes:

- Expired.
- Remains Pending.

Business impact:

- Keeps active queue current while preserving that underlying obligation may still exist.

## Auto-Resolve

Who makes it:

- Business rule constrained by accepted household pattern.

Why:

- Repeated low-risk review decision can be processed without active review.

Possible outcomes:

- Auto-Resolved.
- Remains Pending.

Business impact:

- Reduces repetitive work without moving money or hiding history.

## Recover

Who makes it:

- Household member or business rule triggered by new source evidence.

Why:

- Prior outcome is incomplete, disputed, or superseded.

Possible outcomes:

- Pending.
- New Candidate.
- No change.

Business impact:

- Preserves trust when old decisions need renewed attention.
