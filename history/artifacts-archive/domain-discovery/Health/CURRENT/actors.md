# Actors

## User

Views household condition, interprets Health signals, and decides whether to investigate underlying facts.

## Partner

Shares visibility, contributes context, and may interpret risk differently from the primary user.

## Household

The financial unit being assessed. Includes shared income, shared obligations, dependents, and jointly felt risk.

## Family

May provide emergency support, request support, lend money informally, pay medical costs, or influence financial decisions.

## Employer

Provides salary, employment benefits, social insurance contributions, private insurance benefits, advances, or income uncertainty.

## Bank

Holds accounts, deposits, loans, cards, and transaction records that may be read as Health inputs.

## E-Wallet / Fintech

Holds fragmented balances, payment activity, credit products, installment products, and subscription payments.

## Card Provider

Provides credit limit, billing obligations, utilization, repayment history, fees, and interest exposure.

## Lender

Provides loan obligations, repayment schedules, interest burden, delinquency status, and payoff state.

## Insurance Provider

Provides coverage, premium obligations, claims, reimbursement, exclusions, limits, and renewal state.

## Healthcare Provider

Creates medical expense events, bills, deposits, reimbursements, and payment deadlines.

## Government / Social Insurance Provider

Defines public insurance eligibility, contributions, benefit rates, coverage rules, and administrative constraints.

## System

Reads household facts, computes condition signals, and displays observations without mutating source domains.

## Background Worker

May refresh read models, detect stale signals, or prepare read-only observations if such behavior exists in the product context.

## Third-Party Provider

External source of account, transaction, loan, insurance, employment, or health-financing information.
