# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
|----|------------|-------------|----------------|------------|------------|------|----------|-----------|
| LOAN-PD-001 | Loan obligation | Represent that the household owes money under agreed or socially recognized terms. | High | High | Low | Medium | APPROVED | Core validated need: users understand owing money and need it visible. |
| LOAN-PD-002 | Lender identity | Identify who is owed money. | High | High | Low | Low | APPROVED | Users remember lender naturally; needed for trust and recognition. |
| LOAN-PD-003 | Borrower / household relevance | Indicate who in the household is responsible or affected. | Medium | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Approve household relevance, not complex legal ownership or surveillance semantics. |
| LOAN-PD-004 | Original principal | Track borrowed principal. | High | High | Low | Medium | APPROVED | Necessary to understand obligation origin and progress. |
| LOAN-PD-005 | Remaining principal | Track principal still owed. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Must be framed as recorded remaining principal, not guaranteed lender outstanding balance. |
| LOAN-PD-006 | Loan purpose or type | Represent broad purpose such as home, vehicle, tuition, family, BNPL, or other. | Medium | Medium | Low | Medium | APPROVED WITH MODIFICATIONS | Keep broad and household-understandable; avoid over-taxonomy. |
| LOAN-PD-007 | Repayment term | Represent expected duration. | High | High | Low | Medium | APPROVED | Users need to know when the burden ends. |
| LOAN-PD-008 | Repayment frequency | Represent how often payment is expected. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Monthly is validated for MVP; non-monthly is real but not primary. |
| LOAN-PD-009 | Scheduled due dates | Represent planned due dates. | High | High | Medium | Medium | APPROVED | Due-date awareness directly prevents household stress and missed payments. |
| LOAN-PD-010 | Expected payment amount | Represent expected amount due. | High | High | Medium | Medium | APPROVED | Monthly payment is the strongest natural household mental model. |
| LOAN-PD-011 | Principal / interest / fee distinction | Conceptually separate repayment components. | High | Medium | High | High | APPROVED WITH MODIFICATIONS | Distinguish concepts for safety, but do not force detailed splits when users lack provider data. |
| LOAN-PD-012 | Real repayments | Track actual payments made. | High | High | Medium | High | APPROVED | Required to keep Real Ledger and loan progress coherent. |
| LOAN-PD-013 | Payment source | Identify account or real money source used for repayment. | High | High | Medium | Medium | APPROVED | Users need to know where repayment money left from; protects BR-01. |
| LOAN-PD-014 | Payment history | Preserve repayment history. | High | High | Medium | Medium | APPROVED | Supports trust, correction, and partner review. |
| LOAN-PD-015 | Loan status | Track active, completed, cancelled, defaulted, or archived. | High | High | Medium | Medium | APPROVED | Lifecycle status is natural and needed for household clarity. |
| LOAN-PD-016 | History after completion | Preserve completed loan history. | Medium | Medium | Low | Low | APPROVED | Completion must not erase financial history or partner context. |
| LOAN-PD-017 | Planned vs actual comparison | Compare expected repayment with actual repayment. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Approve lightweight variance awareness; avoid advanced reconciliation workflow now. |
| LOAN-PD-018 | Upcoming / overdue awareness | Surface upcoming or overdue obligation awareness. | High | High | Medium | Medium | APPROVED | Strongly validated by due-date anxiety and financial safety. |
| LOAN-PD-019 | Partner visibility | Make household-relevant loan burden visible between partners. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Approve shared visibility; details of consent, privacy, and ownership need careful future rules. |
| LOAN-PD-020 | Informal loan notes | Capture simple context for family/friend loans. | Medium | High | Low | Medium | APPROVED WITH MODIFICATIONS | Useful for Vietnam households; keep lightweight and relationship-sensitive. |
| LOAN-PD-021 | Collateral tracking | Track pledged property or asset. | Medium later | Medium later | High | High | DEFERRED | Real for mortgages/vehicles, but not needed before core repayment clarity. |
| LOAN-PD-022 | Guarantor / co-borrower awareness | Represent other responsible parties. | Medium later | Medium later | High | High | DEFERRED | Important but legally and emotionally complex; needs research. |
| LOAN-PD-023 | Variable-rate history | Track rate changes over time. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Approve only where rate changes affect current repayment understanding; avoid benchmark sophistication now. |
| LOAN-PD-024 | Promotional-rate period | Represent temporary fixed or preferential rate period. | High | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Vietnam home/consumer loans make this important; must be understandable as user-entered/planned unless provider-confirmed. |
| LOAN-PD-025 | Early payoff estimate | Show approximate payoff pressure. | Medium | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Useful but must not imply lender quote; fees and expiry remain outside MVP certainty. |
| LOAN-PD-026 | Prepayment fee awareness | Represent early repayment fees. | Medium | Medium | Medium | Medium | DEFERRED | Real and useful, but provider-specific and not necessary for base loan tracking. |
| LOAN-PD-027 | Grace period awareness | Represent formal grace periods. | Low now | Medium in hardship | Medium | Medium | DEFERRED | Real but uncommon in simple household tracking; needs validation. |
| LOAN-PD-028 | Restructure / reschedule awareness | Represent changed terms after hardship or lender agreement. | Medium later | High in trouble | High | High | DEFERRED | Important recovery path but complex; not MVP scope. |
| LOAN-PD-029 | Payment-method preference | Remember preferred payment channel. | Low | Medium | Low | Low | DEFERRED | Convenience value only; not needed for financial safety. |
| LOAN-PD-030 | Provider statement attachment | Attach lender statement evidence. | Medium later | Medium later | Medium | Medium | DEFERRED | Useful for trust, but adds document-management burden. |
| LOAN-PD-031 | Contract evidence | Attach or reference loan contract. | Medium later | Medium later | Medium | Medium | DEFERRED | Valuable for formal loans; not required for core understanding. |
| LOAN-PD-032 | Credit-history impact awareness | Explain possible CIC or future borrowing impact. | Medium | Medium | High | High | DEFERRED | Education-sensitive and regulation-sensitive; needs local validation. |
| LOAN-PD-033 | Insurance / bundled product awareness | Represent insurance or bundled charges. | Medium later | Medium later | High | Medium | DEFERRED | Real but increases complexity before fee handling is validated. |
| LOAN-PD-034 | Provider-confirmed import | Import read-only loan facts from provider. | High later | High later | High | High | DEFERRED | Premature due to reliability, consent, and provider availability uncertainty. |
| LOAN-PD-035 | Automatic bank-statement reconciliation | Automatically reconcile repayments against bank statements. | High later | High later | High | High | DEFERRED | Useful later, but violates no unnecessary automation if introduced before trust model is proven. |
| LOAN-PD-036 | Rate benchmark and margin | Track benchmark, spread, and review formula. | Medium later | Low now | High | Medium | DEFERRED | Accurate for floating loans but too technical for young household MVP. |
| LOAN-PD-037 | Multi-currency borrowing | Support non-VND loans. | Low now | Low now | High | High | DEFERRED | Vietnam-first scope can stay VND-centered until evidence says otherwise. |
| LOAN-PD-038 | Debt consolidation analysis | Analyze combining multiple debts. | Medium later | Medium later | High | High | DEFERRED | Advisory boundary and complexity are high; not core tracking. |
| LOAN-PD-039 | Household affordability stress testing | Evaluate payment burden under income/rate scenarios. | Medium later | Medium later | High | High | DEFERRED | Valuable later, but risks over-engineering and pseudo-advice now. |
| LOAN-PD-040 | Refinancing comparison | Compare current loan with new loan offers. | Medium later | Medium later | High | High | DEFERRED | Advisory and provider-specific; not validated for current target scope. |
| LOAN-PD-041 | Collateral exposure view | Show household risk tied to pledged assets. | Medium later | Medium later | High | High | DEFERRED | Depends on collateral tracking, which is deferred. |
| LOAN-PD-042 | Regulatory disclosure normalization | Normalize lender disclosures for comparison. | Low now | Low now | High | High | DEFERRED | Too legal/compliance-heavy for current household operating scope. |
| LOAN-PD-043 | Credit-card revolving balance as Loan | Treat card balances as Loans. | Low | Low | Medium | Critical | REJECTED | Conflicts with Card boundary and risks confusing revolving credit with scheduled obligations. |
| LOAN-PD-044 | Virtual loan payoff jar | Let Loans own virtual payoff allocations. | Low | Low | Medium | Critical | REJECTED | Violates BR-01; payoff intentions belong to Planning/Jars/Goals, not Loans. |
| LOAN-PD-045 | Health mutates loans | Let Health change loan state, payment, or balance. | Low | Low | High | Critical | REJECTED | Violates BR-24; Health is read-only. |
| LOAN-PD-046 | Automatic repayment execution | Let Loans initiate real repayments automatically. | Low now | Medium convenience | High | Critical | REJECTED | Violates financial safety over convenience and no unnecessary automation. |

## Summary

- APPROVED: 12.
- APPROVED WITH MODIFICATIONS: 11.
- DEFERRED: 19.
- REJECTED: 4.

