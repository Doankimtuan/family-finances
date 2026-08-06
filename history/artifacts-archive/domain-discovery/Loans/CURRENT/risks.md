# Risks

## Business Risks

- Treating all borrowing as identical hides important differences between bank loans, informal loans, credit lines, and credit cards.
- Incorrectly representing lender-confirmed status can reduce user trust.
- Informal family borrowing can create sensitive household conflict.
- Current rates, fees, and regulations can change.
- Provider data may be unavailable, delayed, or inconsistent.

## Financial Risks

- User underestimates total repayment cost.
- User misses payment and incurs penalties.
- User ignores post-promotional floating-rate increase.
- User pays early without understanding prepayment fee.
- User counts projected balance as confirmed lender balance.
- User records interest-free purchase plans as harmless and accumulates too many payments.
- User fails to distinguish principal reduction from spending.

## UX Risks

- Too much amortization detail can overwhelm ordinary households.
- Too little detail can hide meaningful risk.
- Terms like APR, reducing balance, floating rate, and principal can confuse users.
- Family loans may require gentler language than bank loans.
- Completion can be misunderstood if lender confirmation is absent.

## Misunderstanding Risks

- Loan vs Debt.
- Loan vs Credit Card.
- Principal vs total repayment.
- Payment due vs payment posted.
- Interest-free vs fee-free.
- Promotional rate vs full-term fixed rate.
- Planned schedule vs actual lender statement.

## Future Scalability Risks

- Model may become brittle if it assumes only monthly repayment.
- Model may become brittle if it assumes one borrower and one lender.
- Model may become brittle if it cannot represent fee, penalty, or rate-history concepts.
- Model may become brittle if it cannot separate provider truth from user-entered estimates.
- Model may become brittle if it cannot handle restructuring, refinancing, or loan transfer.

