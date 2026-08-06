# Business Rules

This document documents Health behavior only. It does not modify frozen Source of Truth.

## Existing Rules

| Rule | Business behavior |
| --- | --- |
| BR-01 Real Ledger is not Virtual Planning | Health must not treat jars, goals, plans, or other intentions as real money or spendable balance. |
| BR-24 Health is read-only | Health must not create, edit, delete, approve, repay, reconcile, close, or move money in any source domain. |
| No unnecessary automation | Health must not trigger automatic financial action. |
| User always understands where money is | Health must clearly distinguish source-domain facts from Health interpretation. |
| Financial safety over convenience | Health must block unsafe interpretation even if it would feel convenient. |

## Clarified Rules

| Rule | Business behavior |
| --- | --- |
| Health must be explainable | Every Health condition must have visible, understandable factors. |
| Health must be grounded | Health must use verified visible facts only and must not invent balances, obligations, income, claims, or risk facts. |
| Health must communicate incompleteness | Missing or stale facts must not be treated as absence of risk. |
| Health scenario language is observational | Scenarios must not prescribe actions or initiate changes. |
| Medical interpretation is financial only | Health may reflect visible medical-expense pressure but must not give clinical, provider, or insurance advice. |
| Partner rhythm is household-level only | Health may reflect shared rhythm but must not score, blame, or surveil a partner. |

## Derived Rules

| ID | Rule |
| --- | --- |
| HLT-BR-001 | Health assessment begins by determining household eligibility and visible source facts. |
| HLT-BR-002 | If household context or permission is invalid, Health is Unavailable. |
| HLT-BR-003 | If no usable source facts exist, Health is No Visible Facts. |
| HLT-BR-004 | If material source facts are missing or stale, Health must mark the assessment Partial or Stale. |
| HLT-BR-005 | Health may classify visible condition only as an understandable business state, not a precise black-box diagnosis. |
| HLT-BR-006 | Health factors must retain source-domain ownership labels in business meaning. |
| HLT-BR-007 | Health comparison is allowed only when prior context is grounded and comparable. |
| HLT-BR-008 | Health must omit or block any factor that would require advice, invention, or mutation. |
| HLT-BR-009 | Health output cannot be used as authorization for spending, transfer, repayment, or plan change. |
| HLT-BR-010 | Health recovery occurs only when source facts, permissions, or invalid context are corrected outside Health. |
