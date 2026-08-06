# Real-World Analysis

## Vietnam Context

Vietnamese bank card operations are regulated around card issuance, use, payment, switching, electronic clearing, and settlement. Circular 18/2024/TT-NHNN defines bank cards as payment instruments and distinguishes debit cards, credit cards, prepaid cards, physical cards, non-physical cards, co-branded cards, primary cardholders, supplementary cardholders, issuers, acquirers, card-accepting units, card switching organizations, and electronic clearing organizations. Circular 45/2025/TT-NHNN amends parts of that regime and took effect on January 5, 2026.

Domestic cards commonly use NAPAS infrastructure. NAPAS describes domestic cards as cards issued by Vietnamese banks and financial companies with SBV-issued BINs, commonly starting with `9704`, and complying with Vietnam domestic chip card standards. Card usage exists alongside a fast-growing digital-payment environment where QR payments, mobile banking, and bank transfers often compete with or complement cards.

Sources:

- Circular 18/2024/TT-NHNN on bank card operations: https://english.luatvietnam.vn/tai-chinh/circular-18-2024-tt-nhnn-bank-card-operations-358546-d1.html
- Circular 45/2025/TT-NHNN amendment reference: https://vnba.org.vn/en/sbv--on-the-issuance-of-circular-no--45-2025-tt-nhnn-amending-and-supplementing-several-of-articles-of-the-circular-no--18-2024-tt-nhnn-on-the-bank-card-operations-19735.htm
- NAPAS domestic card overview: https://en.napas.com.vn/napas-domestic-card
- VietnamPlus reporting on non-cash payment growth: https://en.vietnamplus.vn/vietnam-moves-to-shape-future-of-digital-payments-post330388.vnp
- Techcombank credit card terms example, effective January 15, 2025: https://techcombank.com/content/dam/techcombank/public-site/promo_file/terms-and-conditions-for-issuing-and-using-credit-cards-at-techcombank-applicable-from-jan-15-2025.pdf

## Common Practices

- Debit cards are used to access bank-account money at ATMs, POS terminals, e-commerce sites, and contactless acceptance points.
- Credit cards are used for online purchases, travel, cashback, reward points, installment offers, and short-term liquidity.
- Many households treat the salary debit card as the "main card" even though the money reality belongs to the underlying bank account.
- Credit-card users often focus on statement date, due date, minimum payment, annual fee, promotion period, and interest-free period.
- Supplementary cards may be used by a spouse, parent, employee, or older child, while the primary cardholder remains responsible to the issuer.
- Card spending may be manually tracked from bank app notifications, SMS, email statements, or monthly statements.
- Refunds and reversals often appear later than the original purchase and may land in a later statement cycle.
- Cash advances exist but are financially different from ordinary card purchases because they commonly attract immediate fees or interest.
- Rewards, cashback, vouchers, airport lounge access, and installment promotions influence card choice more than formal APR comparison for many users.

## Real-World Variations

- Debit card linked to a payment account.
- Credit card with a revolving credit limit and billing cycle.
- Prepaid card funded before use.
- Physical card, virtual card, or tokenized card in Apple Pay, Google Pay, Samsung Pay, or bank-app wallets.
- Domestic NAPAS card.
- International Visa, Mastercard, JCB, UnionPay, American Express, or co-badged card.
- Primary card with one or more supplementary cards.
- Secured credit card backed by deposit or collateral.
- Corporate or organization card used by an authorized individual.
- Single-currency domestic usage and cross-border usage with FX conversion.
- Merchant installment, issuer installment, zero-percent installment, or fee-based installment.

## Terminology

- Authorization: issuer approval that reserves spending capacity but may not be final.
- Hold: temporary reservation against available account balance or credit limit.
- Posting: transaction becomes a settled card ledger item.
- Statement period: period whose posted transactions are summarized into a card statement.
- Statement date: date the issuer closes the statement period.
- Payment due date: deadline to pay at least the required amount.
- Minimum payment: smallest payment needed to avoid delinquency, not necessarily interest.
- Statement balance: amount shown on the statement.
- Outstanding balance: total unpaid card debt known to the issuer.
- Available credit: credit limit minus used credit, adjusted by issuer rules.
- Revolving balance: amount carried after the due date.
- Cash advance: credit-card cash withdrawal or cash-like transaction.
- Chargeback: dispute process through issuer, acquirer, merchant, and card network.
- Supplementary card: card used by another person under the primary cardholder's responsibility.

## Industry Standards and Concepts

- Card identity usually includes issuer, card network, BIN/IIN, masked PAN, cardholder name, expiry, card type, and status.
- Sensitive card data is governed by card-industry security standards; household finance products normally should avoid storing full PAN, CVV, PIN, or magnetic-stripe data.
- Credit-card billing separates purchase date, posting date, statement date, due date, payment date, and provider posting date.
- Interest and fees are provider-specific. Some issuers calculate interest daily and debit it on statement date.
- Repayments may be applied in a defined priority order, such as fees and interest before cash advances before purchases.
- Domestic transactions in Vietnam are generally settled in VND; overseas card use may involve currency conversion back to VND under issuer terms and foreign-exchange rules.
- Card revocation, blocking, replacement, and reissuance are normal operational events.

## International Differences That Affect Product Design

- Credit-card penetration, open-banking access, statement data availability, dispute norms, surcharge rules, and interchange economics vary by market.
- Some countries have stronger automated card feeds and richer card-transaction metadata; Vietnam households may still rely heavily on manual statements, app notifications, and screenshots.
- The phrase "checking account" is natural in the United States but less natural in Vietnam than "payment account" or "bank account".
- Installment cards and merchant EMI are especially prominent in some Asian markets and may not map cleanly to North American credit-card mental models.
