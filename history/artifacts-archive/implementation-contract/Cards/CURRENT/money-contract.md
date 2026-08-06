# Money Contract

## Principle

Cards must never blur real money, card obligation, and virtual planning. Credit limit and available credit are not money.

## Action Money Matrix

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
|--------|--------------|-------------------|---------------|------------------|-------------------|------------------|
| Create Card | None | None | None | None by default | Card facts become readable | Draft failure, validation failure |
| Edit Card Facts | None | None | None | Planning may read corrected dates later | Updated card facts become readable | Invalid edit |
| Record Credit-Card Purchase | Credit-card borrowing capacity | Card obligation | Transaction may record purchase meaning; no real cash source decreases | Due pressure may change | Billing period reads new obligation | Invalid/duplicate/uncertain purchase |
| Record Debit-Card Purchase | Linked real account | Merchant/payment target | Transaction records real expense; Accounts balance affected | Planning may read expense | Card shown as access method | Missing linked source |
| Associate Purchase To Billing Period | None | None | None | Due timing may become readable | Billing association readable | Cannot determine cycle |
| Record Statement | None | None | None | Due amount/date may become readable | Statement balance and remaining due readable | Statement conflict |
| Record Card Repayment | Real money account/cash/wallet | Card obligation | Transaction records real repayment movement; Accounts source decreases | Planning may read reduced pressure | Paid amount and remaining due readable | Invalid source, duplicate, automatic execution attempt |
| Record Partial Repayment | Real money source | Card obligation | Transaction records real partial repayment | Planning reads remaining pressure | Billing Partially Paid readable | Unknown payment truth |
| Record Refund | Merchant/card issuer credit path | Card obligation or card credit | Transaction may record card-specific adjustment when real movement is recognized | Planning may read reduced pressure | Refund adjustment readable | Timing/target unclear |
| Record Fee Or Interest | Card obligation | Issuer obligation | Transaction may record known card cost when recognized | Planning may read increased pressure | Fee/interest readable | Unknown charge |
| Record Cashback Or Statement Credit | Issuer reward/credit | Card obligation or real account only if actually paid out | Transaction only if real money enters account or obligation adjustment is recorded | Planning may read reduced pressure | Cashback/credit readable | Non-cash reward |
| Recognize Card-Origin Installment | Original card purchase | Future card-origin obligation | None unless installment payment is actually recorded | Planning may read future pressure | Card-origin awareness readable | Duplicate Loan risk |
| Close Card | None | None | None | Future card availability may stop | Closed/Expired/Replaced status readable | Unresolved obligation |
| Archive Card | None | None | None | Current-view planning may ignore archived card unless unresolved | Historical record readable | Archive would hide unresolved due |
| Review Card | None | None | None | None by review alone | Confidence/status readable | Review incomplete |
| Recover Card State | None | None | None | Planning may read recovered due facts | Recovered state readable | Invalid target state |
| Abandon Draft | None | None | None | None | Draft no longer current | Draft has active history |

## Required Ledger Rules

- Ledger writes occur only when real money moves or a recognized financial adjustment is recorded through the proper money domain.
- Card repayment must always identify a real money source.
- Inbox acknowledgement never writes ledger movement.
- Review never writes ledger movement.
- Health never writes ledger movement.
- Planning updates are read/derived only and never reduce card obligation.

## Forbidden Money Behavior

- Available credit must never increase real money totals.
- Card repayment must never be automatically executed by Cards.
- Refund must not be treated as ordinary income by default.
- Cashback must not be treated as real income unless real money enters a real account.
- Card-origin installment must not duplicate Loan obligation.
