# State Machine

## State Definitions

### Draft

A configured but unfunded savings product. No provider-held principal exists.

### Pending Funding

Funding has been initiated or recorded but provider acceptance is not final. This is v1-hardened behavior; MVP may create Active only after confirmed/manual funding.

### Active

Provider-held savings principal exists under known terms. The product earns expected/accrued interest according to product rules, but only provider-confirmed interest becomes posted money.

### Paused

Not an approved Savings operational state. Pause belongs to Planning. Existing Savings products do not pause; they remain Active unless provider rules create a restricted exception.

### Grace Period

Maturity date has arrived and provider allows a defined review/rollover window before final settlement or auto behavior. If no provider grace period is known, this state is skipped.

### Awaiting Renewal

Product has matured or entered actionable maturity review and requires household decision: renew, switch, withdraw, or settle.

### Renewed

Previous cycle has been closed/rolled and a new active cycle is established with immutable terms.

### Completed

Savings product has matured and all principal/interest due to household has been settled or confirmed as settled.

### Closed Early

Savings product was closed before maturity after confirmed household decision or provider-confirmed emergency/early-withdrawal event.

### Cancelled

Savings was never funded or provider rejected/cancelled the product before active contract formation.

### Archived

Historical, non-operational savings record retained for audit, household memory, and Health read-only history.

## Transitions

| From | To | Trigger | Conditions | Result | Ledger Impact | Inbox Impact | Health Impact |
|---|---|---|---|---|---|---|---|
| Draft | Pending Funding | Household initiates funding | Funding source and settlement destination valid | Funding is in progress | No posted movement unless funding is confirmed/posted by Ledger policy | None | Read-only no-op |
| Draft | Active | Manual confirmed funding creation | Provider/product terms and funding are already confirmed | Product starts active cycle | Funding movement writes if not already posted | None | Reads new active savings later |
| Draft | Cancelled | Household cancels before funding | No accepted provider contract | Product not created as active | None | None | None |
| Pending Funding | Active | Provider/funding confirmation | Amount accepted and product terms established | Active cycle starts | Funding source outflow and savings-product inflow write to Ledger | None | Reads active savings later |
| Pending Funding | Cancelled | Provider rejects or funding fails | No product contract exists | Funding is voided or reversed | Reversal/correction writes only if prior ledger movement exists | Failed funding review if user action needed | Reads no active savings |
| Active | Grace Period | Maturity date reached with known grace window | Provider grace period exists | Product awaits decision within grace | None | Maturity decision/reminder created | Reads maturity risk only |
| Active | Awaiting Renewal | Maturity date reached without grace or grace skipped | Product matured and decision required | Product waits for household choice | None unless provider posts interest separately | Maturity decision created | Reads maturity due only |
| Active | Closed Early | Early withdrawal confirmed | Household confirms and provider outcome is known or accepted under manual flow | Product closes before maturity | Net payout and posted interest/penalty effects write | Early withdrawal confirmation resolved | Reads closed status later |
| Active | Archived | Historical import already closed | Imported product has no active lifecycle | Record retained only | None unless historical ledger import separately confirmed | None | Historical read only |
| Grace Period | Awaiting Renewal | Grace action required or window nearing end | Household decision still needed | Renewal/withdrawal decision remains active | None | Inbox priority escalates | Reads decision risk only |
| Grace Period | Renewed | Household renews during grace | New terms selected/confirmed | New cycle starts | Interest payout writes only if paid out; rolled principal stays product value | Decision resolved | Reads renewed cycle later |
| Grace Period | Completed | Household withdraws/settles | Settlement destination valid | Product fully settled | Principal/interest payout writes | Decision resolved | Reads completed status later |
| Awaiting Renewal | Renewed | Household chooses renew or switch | Package available; rate accepted; no silent rollover | New cycle active | Principal/interest roll or interest payout writes as applicable | Decision resolved; duplicate reminders cancelled | Reads renewed cycle later |
| Awaiting Renewal | Completed | Household chooses withdraw all | Settlement destination valid; provider outcome confirmed/manual | Product ends normally | Principal and posted interest settlement writes | Decision resolved | Reads completed status later |
| Awaiting Renewal | Closed Early | Provider closes as exception before normal settlement | Provider confirms exceptional close | Product closes as exception | Actual provider payout writes | Exception review resolved | Reads exception later |
| Renewed | Active | New cycle established | New immutable cycle exists | Product continues | None beyond renewal entries already written | New future reminders scheduled | Reads active cycle later |
| Completed | Archived | Retention/archive action | Product no longer operational | Historical record | None | None | Historical read only |
| Closed Early | Archived | Retention/archive action | Product no longer operational | Historical record | None | None | Historical read only |
| Cancelled | Archived | Retention/archive action | Product never active or funding reversed | Historical/cancelled record | None | None | None |

## Forbidden Transitions

- Draft -> Completed.
- Pending Funding -> Completed without Active or Cancelled.
- Active -> Renewed without maturity/grace/awaiting-renewal decision.
- Awaiting Renewal -> Renewed by saved preference alone.
- Health -> any Savings state.
- Planning pause -> Savings Paused.

