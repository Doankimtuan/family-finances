# Real-World Analysis

## Vietnam Context

Vietnamese households commonly use a mixed money system:

- Physical cash for small vendors, tips, markets, family support, and emergencies.
- Bank payment accounts for salary, transfers, bill payment, debit-card spending, and VietQR transfers.
- E-wallets for consumer payments, promotions, delivery, ride-hailing, peer transfers, and smaller daily balances.
- Credit cards for online purchases, travel, installment offers, cashback, and short-term liquidity.
- Bank savings accounts or term deposits for parked money.
- Informal family-held money, such as money kept by a parent, spouse, or relative.

Non-cash payment is increasingly common. NAPAS describes VietQR/FastFund 247 as a bank-to-bank QR transfer service across member banks, and public reporting citing the State Bank of Vietnam shows rapid QR, mobile banking, and internet banking growth. E-wallets are regulated as intermediary payment services and depend on linked bank/payment infrastructure. Deposit Insurance of Vietnam states the maximum protected amount is 125 million VND per depositor per insured institution.

Sources:

- NAPAS VietQR/FastFund 247: https://en.napas.com.vn/
- Vietnam News reporting State Bank of Vietnam non-cash payment growth: https://vietnamnews.vn/economy/1690354/qr-code-payment-transactions-surge-in-2024.html
- Circular 40/2024/TT-NHNN intermediary payment services English reference: https://thuvienphapluat.vn/van-ban/EN/Tien-te-Ngan-hang/Circular-40-2024-TT-NHNN-on-provision-of-payment-intermediary-services/621475/tieng-anh.aspx
- Deposit Insurance of Vietnam coverage limit: https://www.div.gov.vn/deposit-insurance-coverage-limit-increased-to-125-million-vnd-en

## Common Practices

- Salary usually lands in one bank account.
- Couples often keep individual accounts even after pooling household decisions.
- One partner may be the active money operator while the other checks occasionally.
- Cash is treated loosely unless the household is highly disciplined.
- E-wallet balances are often small, fragmented, and promotion-driven.
- Bank transfers and VietQR payments are used for rent, tuition, merchants, relatives, and peer payments.
- Some accounts are remembered by nickname, not institution details.
- Families often know "main bank", "salary card", "shopping wallet", or "cash at home" more readily than formal account names.

## Real-World Variations

- Single-earner household: one main salary account funds most spending.
- Dual-earner household: two salary accounts plus shared spending arrangements.
- Partially pooled couple: some accounts are shared in practice, others remain personal.
- Cash-heavy household: daily transactions may be under-recorded.
- Bank-heavy household: most activity is visible in app statements.
- Promotion-driven wallet use: e-wallets appear and disappear based on discounts.
- Multi-bank household: different banks used for salary, mortgage, term deposits, and cards.
- Rural or family-support pattern: cash and informal transfers can matter more than formal categorization.

## Terminology

- Payment account: bank account used for receiving, holding, and transferring money.
- Current/checking account: common international term for transactional bank account.
- Savings account: bank-held savings balance; may be flexible or term-based.
- Term deposit/fixed deposit: deposit locked for a period with stated interest and maturity behavior.
- E-wallet: stored-value account operated by a licensed intermediary payment provider.
- Bank feed: imported read-only account or transaction information from an external institution.
- Available balance: institution-side concept that may differ from ledger balance because of holds, pending transactions, card authorization, or overdraft rules.
- Ledger balance: recorded balance based on posted account history.
- Account mask: partial identifier used to recognize an account without exposing full account numbers.

## Industry Standards and Concepts

- Account identity normally includes institution, holder, account number or mask, currency, and type.
- Account balances can be current, available, pending, statement, or book balances depending on product type.
- Transactions are the auditable events that explain balance movement.
- Reconciliation compares household records against institution records.
- Account closure does not erase historical transactions.
- Real-world financial accounts may be single-owner, joint, delegated, custodial, linked, frozen, restricted, or closed.
- Payment rails affect timing and certainty: cash is immediate, bank transfer may be instant or delayed, card authorization may precede settlement, and wallet transfers depend on provider rules.

## International Differences That Affect Product Design

- The term "checking account" is familiar in the United States but less natural in Vietnam, where "payment account", "bank account", or local bank app language may be clearer.
- Deposit insurance limits, open-banking access, and account aggregation rights vary by country.
- Joint bank accounts are common in some markets but less central to many Vietnamese young households, where practical sharing may happen without formal joint ownership.
- Card and bank feeds are more standardized in some countries than in Vietnam, so manual records may remain important.

