# Interest Flow

## Interest Types

### Expected Interest

Projection from principal, rate, term, and basic interest method.

Ledger impact: Never writes.

Use: household preview and maturity expectation.

### Accrued Interest

Running estimate of interest earned to date.

Ledger impact: Never writes unless provider confirms posting or settlement.

Use: early withdrawal preview, household awareness.

### Posted Interest

Interest confirmed as paid, credited, settled, or recognized by a valid `auto_renew_until_cancelled` rollover using the existing calculation.

Ledger impact: Writes according to settlement method.

Use: real financial truth.

### Net Interest

Posted interest minus provider-confirmed impact or tax calculated by the existing rollover rules.

Ledger impact: Writes only when actual net amount is confirmed.

Use: final household outcome.

## Expected Interest Flow

Trigger: product setup, active review, maturity preview.

Conditions: principal, rate, term, and interest method known.

Result: display/use expected amount as projection.

Ledger impact: none.

Inbox impact: may be included in ReviewItem context only.

Health impact: read-only estimate may support insight but cannot become balance.

## Accrued Interest Flow

Trigger: active savings review or early withdrawal preview.

Conditions: start date, as-of date, rate, method known.

Result: accrued estimate calculated.

Ledger impact: none.

Inbox impact: included in early withdrawal or maturity decision context.

Health impact: read-only.

## Posted Interest Flow

Trigger: provider confirms interest payment, maturity settlement, interest payout, or statement import/manual confirmation.

Conditions:

- Provider amount known, or a valid saved auto-renewal policy authorizes the existing rollover calculation.
- Destination known: settlement account, savings product, or new principal.

Result:

- Posted interest becomes real.
- Expected-versus-actual comparison may be recorded in v1.

Ledger impact:

- Writes income/interest movement when paid to account.
- When rolled into principal, new product principal is updated through renewal flow; no fake settlement-account cash movement.

Inbox impact:

- Interest paid notification may be created only when it is a meaningful household event.

## Tax Flow

Product decision status: Deferred.

Deterministic current rule:

- No tax movement is created by Savings unless provider confirms withholding or a valid preauthorized rollover applies the saved tax rule through the existing calculation.
- Tax metadata does not alter expected interest outside that rollover path.

## Interest History

MVP:

- Keep current expected and posted interest.

v1:

- Track expected versus actual per cycle.

Future:

- Detailed interest history and provider statement evidence.
