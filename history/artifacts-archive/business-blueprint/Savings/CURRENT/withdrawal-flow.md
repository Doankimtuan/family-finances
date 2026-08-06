# Withdrawal Flow

## Full Maturity Withdrawal

Trigger: household chooses withdraw all from Grace Period or Awaiting Renewal.

Conditions:

- Product matured.
- Settlement account valid.
- Household decision recorded.

Flow:

1. Inbox records withdraw decision.
2. Savings requests/records settlement.
3. Provider confirms or household manually confirms actual settlement.
4. Ledger records savings outflow and settlement account inflow.
5. Product moves to Completed.
6. Historical record remains until Archived.

Ledger impact: writes only at confirmed/manual settlement.

Inbox impact: ReviewItem resolved and siblings cancelled.

Health impact: reads updated liquidity later.

## Full Early Withdrawal

Trigger: household requests early withdrawal from Active.

Conditions:

- Product is active.
- Early withdrawal policy known enough to preview.
- Household confirms after seeing penalty/forfeiture.

Flow:

1. Savings produces penalty/forfeiture preview.
2. Inbox creates early withdrawal confirmation if decision is material.
3. Household confirms or cancels.
4. If confirmed, provider settlement is recorded.
5. Ledger writes actual net payout.
6. Product moves to Closed Early.

Ledger impact: none at preview; writes at confirmed settlement.

Inbox impact: confirmation resolved.

Health impact: read-only after state update.

## Emergency Withdrawal

Trigger: household marks withdrawal as emergency or context indicates urgent household need.

Conditions:

- Same as full early withdrawal.

Business rule:

- Emergency changes priority and communication tone only.
- Emergency does not bypass confirmation or ledger truth.

Result:

- Early withdrawal confirmation is high priority.
- Partner decision memory applies where configured.

## Partial Withdrawal

Product decision status: Deferred.

Deterministic rule:

- Standard user-initiated partial withdrawal is not part of Savings MVP/v1.
- If requested, user must choose full withdrawal or no withdrawal.
- If provider confirms an actual partial settlement outside ViNha, create exception review.

Provider-confirmed partial settlement exception:

1. Record actual principal withdrawn.
2. Record actual interest/penalty.
3. Record remaining principal only if provider confirms remaining product terms.
4. Ledger writes actual payout.
5. Product remains Active with adjusted provider-confirmed principal or moves to Closed Early if no remaining product exists.

## Split Principal

Product decision status: Deferred except provider-confirmed partial settlement exception.

Deterministic rule:

- ViNha does not split principal by intention or jar.
- Provider-confirmed split creates either remaining active principal or new product/cycle only when provider confirms it.

## Remaining Balance

For normal full withdrawal:

- Remaining balance becomes zero and product moves Completed or Closed Early.

For provider-confirmed partial exception:

- Remaining balance equals provider-confirmed remaining principal.
- Expected/accrued interest recalculates from confirmed remaining product terms.

## Notifications

- Early withdrawal preview: no notification unless user leaves decision unresolved.
- Early withdrawal completed: notification allowed.
- Penalty warning: Inbox item if penalty/forfeiture is material.
- Error/failure: Inbox review if user action is required.

