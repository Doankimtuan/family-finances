# Health Boundary

## Result

PASS

Health is consistently documented as a read-only leaf domain.

## Valid Health Inputs

Health may consume:

- account visibility and recorded position;
- transaction rhythm and spending/income evidence;
- category patterns;
- planning rhythm, jars, and emergency intention;
- goal context;
- card utilization, due pressure, interest and fees;
- loan burden and repayment state;
- savings resilience, liquidity, maturity, and concentration facts;
- investment exposure, stale values, liquidity, and risk context;
- Inbox unresolved decision burden;
- Together household scope and visibility context.

## Forbidden Health Actions

Health must never:

- create, correct, reverse, or delete transactions;
- move money;
- update accounts;
- change card, loan, savings, or investment state;
- allocate jars;
- complete goals;
- create, resolve, dismiss, defer, expire, or archive Inbox items;
- create financial events;
- provide advisory-grade financial, investment, insurance, tax, medical, legal, or credit advice;
- treat plans or goals as cash;
- treat its own score as source truth.

## Boundary Implementation Requirement

BR-24 should be enforced at three layers:

- code: no write-capable Health application APIs;
- database: read-only connection or equivalent permission shield;
- tests: constitutional tests proving Health makes zero write calls and emits no operational events.

