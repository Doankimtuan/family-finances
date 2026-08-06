# Cross-Domain Impact

This file describes interactions only. It does not redesign boundaries.

## Accounts

Loans read account context for repayment source and cash availability. Accounts own where money is; Loans own the repayment obligation.

## Transactions

Loan repayments create or reference real money movements. Transactions own the ledger movement; Loans own obligation progress and repayment history.

## Cards

Cards own revolving balances, credit limits, utilization, statement cycles, and card billing. Loans own scheduled borrowing obligations. Credit-card revolving balances must not be modeled as Loans.

## Loans

Loans own obligation identity, lender, principal, schedule, repayment history, status, rate awareness, and completion context within approved scope.

## Planning

Planning may consider future repayment pressure. Loans must not own virtual payoff allocations or planning jars.

## Goals

Goals may compete with loan repayment for future cash flow. Goals remain aspirations; Loans remain obligations.

## Inbox

Inbox may surface due, overdue, stale, completed, or review-worthy loan events. Inbox owns the review surface; Loans own the underlying obligation facts.

## Health

Health may summarize loan burden and risk. Health must remain read-only and cannot mutate loans, payments, or balances.

## Categories

Categories may describe original funded spending, interest, or fees where relevant. Loans should not be reduced to ordinary expense categories.

## Together

Together may reflect partner visibility, acknowledgement, and shared household impact. Loans must avoid assuming every personal obligation is automatically shared.

