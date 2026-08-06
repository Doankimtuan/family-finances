# Future Considerations

## 5-to-10-Year Evolution Pressure

Savings will become harder to classify. Banks, fintechs, brokers, e-wallets, and wealth providers increasingly offer cash-like products with different legal protections. A durable model must classify the legal nature of the product before classifying the user experience.

## Product Diversity

Future product types may include:

- Demand savings.
- Term savings.
- Certificates of deposit.
- Money market deposit accounts.
- High-yield savings.
- E-wallet savings pockets.
- Brokerage cash sweep.
- Treasury-like savings products.
- Foreign-currency deposits.
- Promotional rate products.
- Tiered-rate products.

## Regulatory Change

Vietnam deposit insurance coverage can change by Prime Minister decision. Personal income tax treatment for bank deposit interest can also change. The domain should assume legal rules have effective dates and jurisdiction scope.

## Household Complexity

Future households may need:

- Legal owner versus household-visible owner.
- Multiple partners with unequal legal ownership.
- Child/minor savings.
- Elder parent savings.
- Inheritance handling.
- Power-of-attorney handling.
- Separate property versus shared property classification.

## Provider Integration

If bank feed or provider APIs are added, the source of truth hierarchy must be explicit:

- Provider statement beats internal estimate.
- Ledger posting beats planned transfer.
- Manual override must be auditable.
- Duplicate provider events must be idempotent.

## Recommendation Safety

Savings can provide decision support, but must avoid regulated advice. Safer future recommendations:

- "This product matures soon."
- "This rate differs from the prior cycle."
- "This provider/package is no longer available."
- "This balance appears above the insured limit."

Riskier future recommendations:

- "You should switch to provider X."
- "This is the best product."
- "You should lock for 12 months."
- "You should withdraw emergency funds from this product."

## Integration With Plan and Health

Savings can help Plan and Health answer better questions, but ownership must remain separate:

- Plan may say what a household wants savings to do.
- Savings says where money actually is and what contract governs it.
- Health may read and assess liquidity or concentration.
- Inbox asks for decisions.

