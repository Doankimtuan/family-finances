# Current Product Gap

This document compares the discovered real-world Investments domain with the current product artifacts and code. It lists factual gaps only and does not propose solutions.

## Current Product Observations

- Product Definition lists `F-Wealth` as "Wealth (assets/crypto depth)" with phase Future and MVP "no."
- Capability Catalog lists "Wealth assets" under `F-Wealth` with phase Future.
- Decision Log records "Assets/crypto" as Future Wealth.
- Information Architecture lists Assets/Wealth as future entry only, outside the current core IA.
- Technical Specification describes current Money as accounts, transactions, debts, savings, and installments.
- The current ledger constants include an `AccountType.BROKERAGE` value.
- Account create options omit brokerage.
- No `modules/investments` directory is present in the observed codebase.
- No active product route for investments or wealth was observed under the Money or Plan surfaces.
- Savings domain explicitly excludes stocks, bonds, mutual funds, and crypto from Savings.
- Accounts discovery notes brokerage as an existing account type but does not establish investment-holding behavior.

## Factual Gaps Against Real-World Domain

| Real-world concern | Current product evidence | Factual gap |
|--------------------|--------------------------|-------------|
| Investment holdings require asset identity, quantity, cost, value, and valuation date. | No Investments module or route observed. | No factual evidence of holding-level investment model. |
| Brokerage account cash differs from securities holdings. | `brokerage` exists as account type; create options omit it. | No factual evidence of distinction between broker cash and held assets. |
| Investment transfers differ from investment purchases. | Transactions exist for real money movement. | No factual evidence of investment order, trade, subscription, or redemption semantics. |
| Market value changes without cash movement. | Ledger balances are derived from opening balance plus transaction deltas. | No factual evidence of unrealized gain/loss or valuation movement. |
| Investments may produce dividends, coupons, distributions, and fees. | Transactions can record income/expense generally. | No factual evidence of investment-income classification or linkage to holdings. |
| Funds use units and NAV. | Savings products model principal/rate/term; no fund model observed. | No factual evidence of fund-unit or NAV tracking. |
| Bonds may mature, default, or pay coupons. | Loans and savings exist; investment bonds not observed. | No factual evidence of bond-specific lifecycle. |
| Gold may be physical, manually valued, and unit-based. | Cash/account and savings types exist. | No factual evidence of physical investment asset tracking. |
| Private or family investments may be unverifiable. | Together handles household membership; Inbox handles review items. | No factual evidence of uncertain or manually valued asset support. |
| Provider data freshness matters. | No investment provider integration observed. | No factual evidence of valuation source or freshness metadata. |
| Investments can be risky advice territory. | Health explicitly excludes investment advice in observed blueprint language. | No factual evidence of a governed investment-advice boundary for a future Investments domain. |

## Product-Definition Alignment Observations

- The current product intentionally defers Wealth/Assets rather than partially designing it as core MVP.
- Current Money and Savings domains already protect the boundary between guaranteed savings products and risk-bearing investments.
- The presence of `brokerage` as an account type indicates awareness of investment-adjacent containers, but no observed current product behavior turns this into a complete Investments domain.

No implementation changes are proposed in this discovery phase.
