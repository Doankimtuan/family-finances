# Renewal Flow

## Universal Rules

- Renewal requires household decision or explicit confirmation.
- Saved preference may pre-fill or recommend but never silently executes money movement.
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

Trigger: household chooses renew principal + interest.

Conditions:

- Product is in Grace Period or Awaiting Renewal.
- Package is available or provider confirms renewal terms.
- Interest amount is provider-confirmed or accepted under manual confirmed flow.

Result:

- Previous cycle closes as renewed/rolled.
- New Active cycle starts.
- New principal equals matured principal plus eligible interest.

Ledger impact:

- No settlement-account inflow.
- Posted interest handling follows interest-posting policy; expected interest alone never writes.

Inbox impact:

- Maturity ReviewItem resolved.
- Cascade siblings cancelled.

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

