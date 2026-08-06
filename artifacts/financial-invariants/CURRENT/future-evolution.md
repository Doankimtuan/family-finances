# Future Evolution

## Evolution Rule

Future domains may add new financial meaning, but they may not weaken BR-01, BR-24, append-only ledger history, ownership, settlement-through-Accounts, traceability, idempotency, or auditability.

## Future Domain Checks

| Future capability | Required invariant preservation |
| --- | --- |
| Insurance | Premiums, claims, reimbursements, and coverage values must distinguish expected, submitted, approved, and paid states. |
| Mortgage | Principal, interest, escrow, fees, collateral value, and payments must remain separately traceable. |
| Real Estate | Estimated property value is not cash; sale proceeds become cash only on settlement. |
| Crypto | Wallet balances, custody, market value, realized trades, transfers, fees, and tax lots require source/date/currency context. |
| Multiple Currency | Every money amount needs currency; converted views need FX source, rate, timestamp, and reporting purpose. |
| Multiple Country | Country-specific product semantics must be explicit and must not silently change accounting meaning. |
| Business Assets | Personal/household assets and business assets require ownership, visibility, tax, and authority boundaries. |

## Required Platform Extensions

- Money type with currency and precision policy.
- Valuation envelope with source, date, confidence, and owner.
- Product settlement state machine for pending, confirmed, failed, corrected, and reversed settlement.
- Jurisdiction/context metadata for future country-specific behavior.

