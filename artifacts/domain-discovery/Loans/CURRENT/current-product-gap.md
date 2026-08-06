# Current Product Gap

This document compares the discovered real-world Loans domain with the current product artifacts and code. It lists factual gaps only and does not propose solutions.

## Current Product Observations

- The current code has a `/money/loans` surface with list, create, detail, edit metadata, edit interest, pay, and close actions.
- The current ledger constants define loan types: bank loan, personal loan, family loan, friend loan, store financing, BNPL, tuition, medical, vehicle, home, and other.
- Loan statuses include active, completed, cancelled, defaulted, and archived.
- Repayment frequency currently includes monthly.
- Repayment methods include fixed monthly and reducing balance.
- Interest strategies include fixed, promotional fixed-to-floating, and floating.
- The current create flow captures name, lender, type, principal, interest strategy, rates, term, start date, first payment date, repayment method, and note.
- The current application builds amortization schedules with whole-currency rounding and stores schedule entries.
- The current database includes `loans`, `loan_payments`, `loan_schedule_entries`, and `loan_interest_rate_periods`.
- Loan payments are recorded through a schedule-aware payment action and create real ledger transactions through the RPC path.
- Loan detail shows remaining principal, monthly payment, principal paid, interest paid, total interest, expected end date, repayment method, interest strategy, current rate, rate history, schedule, and history.
- Early payoff amount is exposed in the detail payment action.
- Loan-domain evolution artifacts explicitly separate Loans from Credit Cards and Debts.
- Current product copy states loan records are not bank balances.

## Factual Gaps Against Real-World Domain

| Real-world concern | Current product evidence | Factual gap |
|--------------------|--------------------------|-------------|
| Provider-confirmed outstanding balance can differ from projected remaining principal. | Product shows remaining principal and says it is not bank balance. | No factual evidence of storing provider-confirmed outstanding balance separately. |
| Fees, insurance, penalties, and charges can be separate from principal and interest. | Current schedule entries include principal, interest, and total due. | No factual evidence of separate fee, insurance, late fee, or penalty components. |
| Payment posting can lag payment initiation. | Loan payments have paid date and transaction linkage. | No factual evidence of pending, failed, reversed, or provider-posted payment status. |
| Early payoff often depends on date-sensitive lender payoff statement and prepayment fee. | Early payoff amount is computed from remaining principal and upcoming interest. | No factual evidence of prepayment fee, payoff quote expiry, or provider payoff confirmation. |
| Real contracts disclose legal borrower, co-borrower, guarantor, collateral, and purpose. | Product captures lender, type, name, and note. | No factual evidence of borrower role, co-borrower, guarantor, collateral, or formal purpose fields. |
| Consumer finance contracts include payment priority and delinquency treatment. | Product records scheduled or early payoff payment modes. | No factual evidence of configurable payment priority, delinquency notices, grace periods, or collection status. |
| Informal loans may be unscheduled or socially flexible. | Loan domain is schedule-oriented; Debts holds open-ended owed money. | No factual evidence of flexible informal repayment expectations inside Loans beyond scheduled family/friend loan types. |
| Credit lines can allow repeated drawdowns within a limit. | Loan creation appears one-principal, one-schedule. | No factual evidence of credit-line drawdown behavior in Loans. |
| Multi-currency loans exist. | Loan create path uses default currency. | No factual evidence of user-selectable loan currency in the current create flow. |
| Real-world rate formulas may use benchmark plus margin and review dates. | Product stores rate periods and strategy; HSBC-like market examples use reference rate plus spread. | No factual evidence of benchmark, margin, review cycle, or source-rate identity. |
| Loan restructuring and refinancing are common exits. | Status can be cancelled/defaulted/archived; payment and rate update exist. | No factual evidence of restructure, refinance, lender transfer, or consolidation lifecycle. |
| Documentation matters for contract, statement, and closure proof. | Note field exists. | No factual evidence of document/proof attachment in Loans. |
| Payment date may differ from due date and provider posting date. | Schedule has due date and paid_at. | No factual evidence of separate initiated_at, posted_at, or provider_confirmed_at dates. |

## Product-Definition Alignment Observations

- Current product is materially aligned with the core scheduled-loan concept.
- Current product already separates Loans from Credit Cards and open-ended Debts at the artifact and route level.
- Current product covers principal, repayment method, interest strategy, schedule, payment history, and rate periods.
- The main factual gaps are around provider confirmation, non-interest charges, legal parties, collateral, payment-posting states, documentation, and complex lifecycle changes.

No implementation changes are proposed in this discovery phase.

