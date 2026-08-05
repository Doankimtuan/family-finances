# Actors

## Household Owner

Owns household financial truth. Can create, fund, renew, settle, or close savings products subject to household policy and provider reality.

## Partner or Household Member

Participates in visibility and decisions according to household rules. A partner may not be the legal owner of a savings product, but may still need visibility if the product affects shared household planning.

## Legal Depositor

The person or persons named on the savings account, savings book, term deposit agreement, or provider contract. This actor owns the legal claim against the financial institution.

## Beneficiary or Heir

May become relevant on death, incapacity, inheritance, or legal authorization. This is not a normal lifecycle actor, but it is a real-world savings edge case.

## Bank or Credit Institution

Accepts deposits, holds funds, issues contract evidence, applies interest and fees, handles maturity and withdrawal, and reports the official balance.

## Fintech or Digital Savings Provider

May provide a savings-like experience, but the domain must distinguish whether the provider is itself a regulated deposit taker, a broker, an e-wallet, a trust/escrow arrangement, or a pass-through product.

## External Provider

The system of record for product terms, contract status, settlement, interest, penalties, and legal restrictions.

## Merchant or Counterparty

Usually not involved. Only relevant if savings funding or settlement is linked to a purchase, promotion, cashback, pledge, or collateral arrangement.

## Employer

Usually not involved. May be a source of salary surplus that later funds savings. Employer payroll itself belongs outside Savings.

## Government and Regulator

Defines eligibility, deposit rules, consumer protection, tax treatment, insurance, foreign-exchange limits, and bank resolution behavior.

## Deposit Insurance Institution

Provides statutory protection up to a legal limit when an insured institution fails. It does not guarantee all savings value in all circumstances.

## Ledger

Owns real money movement and account balances. Savings may request or reference ledger movements, but it must not invent money.

## Inbox

Owns household decisions and acknowledgments. Savings maturity and early withdrawal confirmations should be routed to Inbox when human decision is required.

## Plan

Owns intentions, jars, recurring plans, and allocations. Plan may reference savings availability conceptually, but must not own savings balances.

## Health

Reads savings data for metrics such as liquidity, concentration, and yield. Under BR-24, Health must not write, mutate, resolve, renew, settle, or move money.

## Background Worker

Detects maturity windows, stale products, provider status changes, and notification timing. It must be idempotent and must not convert suggestions into real money movement.

## Scheduler

Triggers periodic checks such as maturity cascade, interest refresh, stale provider data, and reconciliation reminders.

## Support or Operations

May help reconcile erroneous states, duplicated events, or provider mismatch. It must never overwrite legal or ledger truth without an auditable correction path.

