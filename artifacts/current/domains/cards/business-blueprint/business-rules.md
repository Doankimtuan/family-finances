# Business Rules

This file documents business behavior only. It does not modify frozen Sources of Truth.

## Existing Rules Applied

| Rule | Business behavior in Cards |
|------|----------------------------|
| BR-01 Real Ledger is not Virtual Planning | Credit-card obligation, real repayment, and virtual repayment preparation remain separate. |
| BR-24 Health is read-only | Health may read card risk signals but cannot change card state or balances. |
| Financial safety over convenience | Cards cannot execute automatic repayment. |
| Simple before powerful | Provider-heavy automation, advanced rewards, disputes, and detailed issuer formulas remain out of current scope. |
| Household-first | Card behavior is described in household-recognizable terms, not card-network infrastructure terms. |

## Clarified Rules

| Rule area | Behavior |
|-----------|----------|
| Credit capacity | Credit limit and available credit are borrowing capacity, not real money. |
| Card purchase | Credit-card purchase creates or increases card obligation. |
| Card repayment | Repayment is a real money movement from a real source toward card obligation. |
| Statement truth | Statement values are household-recorded unless provider-confirmed evidence exists. |
| Refund | Refund can reduce card obligation but does not automatically cancel current due amount without billing-period interpretation. |
| Fee and interest | Known fees and interest are card-specific costs; unknown formulas must not be invented. |
| Cashback | Cashback or statement credit may reduce obligation; non-cash reward optimization is out of scope. |
| Installment | Card-origin installments remain visible as card-origin obligations without turning revolving card debt into Loans by default. |
| History | Closing, expiry, replacement, or archive does not erase card history. |
| Review | Review clarifies truth but does not move money or execute payment. |

## Derived Rules

| Rule | Behavior |
|------|----------|
| Required credit-card facts | Active credit-card tracking requires issuer, credit limit, statement date, and due date known enough for safe household interpretation. |
| Remaining due | Remaining due must be explainable from known statement amount, paid amount, refunds, credits, fees, interest, or corrections. |
| Ambiguous truth | If card truth cannot be confidently interpreted, the card or billing period becomes Needs Review. |
| Last valid state | Invalid attempts preserve the last valid card state. |
| No silent rewrite | Updates cannot silently rewrite historical purchases, repayments, or billing meaning. |
| No duplicate obligation | A card purchase, card repayment, and card-origin installment must not create duplicate household obligations. |
| No provider fiction | Household-recorded values must not be presented as provider-confirmed values unless confirmation exists in approved scope. |
