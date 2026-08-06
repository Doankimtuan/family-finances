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

Interest confirmed as paid, credited, settled, or otherwise recognized by provider.

Ledger impact: Writes according to settlement method.

Use: real financial truth.

### Net Interest

Posted interest minus provider-confirmed tax, fee, withholding, or penalty impact.

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

- Provider amount known.
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

- No tax movement is created by Savings unless provider confirms withholding or tax.
- Tax metadata does not alter expected interest in MVP/v1 unless provider actual says so.

## Interest History

MVP:

- Keep current expected and posted interest.

v1:

- Track expected versus actual per cycle.

Future:

- Detailed interest history and provider statement evidence.

