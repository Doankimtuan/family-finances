# Renewal Flow

## Universal Rules

- Only `auto_renew_until_cancelled` preauthorizes automatic rollover.
- `always_ask`, `use_saved_preference`, and `one_time_renewal` continue through Inbox for a per-maturity decision.
- Automatic rollover uses the saved package and settlement rule. If either is unavailable, or a required account is no longer eligible, do not move money; create an actionable Inbox item under `fallbackPolicy=ask_user`.
- A successful automatic rollover creates an unread, read-only maturity result in Inbox. Read/unread changes do not change Savings or Ledger.
- New cycle terms must be immutable once established.
- Provider-confirmed terms outrank catalog estimates.
- Duplicate maturity reminders are cancelled after final decision.

## Manual Review

Trigger: maturity window or maturity date.

Conditions:

- Active product reached maturity window or maturity date.
- Household decision is required.

Flow:

1. Create maturity ReviewItem.
2. Present product facts: principal, maturity date, expected/posted interest, current terms, available options.
3. Household chooses renew, switch/change package, withdraw all, or review later if allowed.
4. Inbox records decision.
5. Savings executes only the selected flow after decision.

Ledger impact: None until renewal or settlement action is executed.

## Principal + Interest Renewal

Trigger: household chooses renew principal + interest, or the saved automatic renewal policy reaches maturity with a valid configured package and rule.

Conditions:

- Product is in Grace Period or Awaiting Renewal.
- Package is available or provider confirms renewal terms.
- Manual renewal uses its existing provider/manual confirmation rules.
- Automatic renewal may recognize interest using the existing rollover calculation because the policy explicitly preauthorizes it; do not add a new formula.

Result:

- Previous cycle closes as renewed/rolled.
- New Active cycle starts.
- New principal equals matured principal plus eligible interest.

Ledger impact:

- No settlement-account inflow.
- Posted interest handling follows interest-posting policy; expected interest alone never writes.

Inbox impact:

- Manual maturity ReviewItem is resolved after the confirmed renewal.
- Automatic renewal creates a read-only result item with old/new cycle, package, next maturity date, and rollover amount; it remains available for read/unread control.
- Cascade siblings cancelled.

## Automatic Renewal

Trigger: UTC maturity date reached while policy is `auto_renew_until_cancelled`.

Conditions:

- The saving, owner permission, current policy, configured package, settlement rule, and any required settlement account are rechecked while the saving and cycle are locked.
- The configured package remains active, renewable, compatible with the provider/currency, amount limits, and settlement rule.
- Invalid or missing configuration follows `fallbackPolicy=ask_user`; no replacement package or account is selected automatically, and that matured cycle is not retried automatically.

Result:

- One new immutable cycle is created and linked to the prior cycle.
- The existing rollover calculation records interest and tax and determines the new principal.
- The decision record and unread Inbox result commit with the rollover. A transient system failure rolls back the whole cycle and leaves it eligible for a later retry.

Inbox impact:

- No renewal, withdrawal, or package-choice controls are shown after success.
- The user can mark the result read or unread without affecting the completed rollover.

Health impact:

- Read-only update on next computation.

## Principal-Only Renewal

Trigger: household chooses renew principal only.

Conditions:

- v1 capability.
- Settlement account valid.
- Interest payout amount confirmed or accepted under manual confirmed flow.

Result:

- Previous cycle closes as renewed/rolled.
- New Active cycle starts with old principal.
- Interest pays to settlement account.

Ledger impact:

- Interest payout writes to settlement account.
- Principal remains provider-held.

Inbox impact:

- Decision resolved.

## Withdraw All

Trigger: household chooses withdraw all.

Conditions:

- Product is in Grace Period or Awaiting Renewal.
- Settlement account valid.

Result:

- Product moves to Completed when provider settlement confirmed/manual accepted.
- Withdrawal at maturity still requires the existing explicit user confirmation.

Ledger impact:

- Principal and posted/eligible interest move from savings product to settlement account.

Inbox impact:

- Decision resolved.

## Change Package

Trigger: household chooses switch/change package.

Conditions:

- v1 capability.
- Selected package exists or provider confirms terms.
- Rate and term are explicitly accepted.

Result:

- Previous cycle closes as renewed/rolled.
- New Active cycle starts under selected package.

Ledger impact:

- Same as principal + interest or principal-only renewal, depending on chosen settlement rule.

Inbox impact:

- Decision resolved.

## Provider Unavailable

Product decision status: Deferred for provider unavailable warning.

Deterministic rule:

- If provider unavailable is known before renewal, do not execute renewal.
- Create manual review.
- Allowed outcomes: withdraw all, wait, or mark exception.

Ledger impact: None until actual settlement.

## Rate Changed

Trigger: selected/current package rate differs from prior locked rate or expected catalog rate.

Conditions:

- Rate change known at maturity/review.

Result:

- Household must explicitly accept the new rate before renewal.

Ledger impact: None until renewal/settlement.

## Package Removed

Trigger: package no longer available.

Conditions:

- v1 capability.

Result:

- Same-package renewal is blocked.
- Household chooses withdraw all or choose another package.

Ledger impact: None until chosen action.
