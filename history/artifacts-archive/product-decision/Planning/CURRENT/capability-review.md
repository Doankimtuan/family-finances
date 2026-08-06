# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PL-PD-001 | Household income intention | Represent expected household income as planning input. | High | High | Low | Medium | APPROVED | Salary-cycle planning is validated and central; must remain expectation until money arrives. |
| PL-PD-002 | Purpose-based jars or envelopes | Represent household purpose containers. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Valid metaphor, but must never be labeled or understood as account balance. |
| PL-PD-003 | Fixed and variable allocation targets | Represent fixed amounts and flexible proportions. | High | High | Medium | Medium | APPROVED | Matches real allocation behavior after payday and existing Plan rules. |
| PL-PD-004 | Intention lifecycle states | Represent active, paused, completed, cancelled, or archived intentions. | High | Medium | Low | Low | APPROVED | Households naturally pause, resume, finish, and abandon intentions. |
| PL-PD-005 | Savings goals as intention | Represent goals without claiming provider balance. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Goals are validated, but must stay separate from Savings product truth. |
| PL-PD-006 | Recurring expectations | Represent repeating income and expense expectations. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Recurring obligations are central, but a recurring item must not imply payment happened. |
| PL-PD-007 | Expected due dates | Represent expected dates for obligations. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Due pressure is useful, but expected dates must not masquerade as provider-confirmed truth. |
| PL-PD-008 | Planned-versus-real distinction | Explicitly distinguish planned money from real money. | High | High | Low | Low | APPROVED | This protects BR-01 and is the foundation of Planning. |
| PL-PD-009 | Compare intention with factual evidence | Compare plan assumptions with real ledger/product facts. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Valuable for review, but language must be explanatory rather than accounting-heavy or judgmental. |
| PL-PD-010 | Month or period review | Support household review and closure of a planning period. | High | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Validated as useful but must stay lightweight and understandable; "ritual" language needs validation. |
| PL-PD-011 | Corrections to intention | Allow explicit correction of planning mistakes. | High | High | Low | Medium | APPROVED | Real households make mistakes; correction protects trust without changing ledger truth. |
| PL-PD-012 | Shared household visibility | Make planning visible in shared household context. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Shared planning is valuable, but partner blame and privacy risks require careful scope. |
| PL-PD-013 | Read-only cross-domain facts | Consume facts from Accounts, Transactions, Cards, Loans, Savings, and Inbox. | High | High | Medium | High | APPROVED | Planning needs facts for context; ownership must remain with source domains. |
| PL-PD-014 | Annual or seasonal expense planning | Represent Tet, school, insurance, travel, and other non-monthly pressure. | Medium | High | Medium | Medium | DEFERRED | Real and Vietnam-relevant, but needs research and can overload MVP. |
| PL-PD-015 | Irregular income planning | Represent freelance, bonus, commission, and uncertain income. | Medium | Medium | High | High | DEFERRED | Real but not yet validated enough for target prevalence or user comprehension. |
| PL-PD-016 | Sinking funds | Accumulate intention for known future expenses. | Medium | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Useful, but should be framed through simple goal/jar intention, not a separate advanced budgeting system. |
| PL-PD-017 | Debt payoff intention | Represent planned payoff or repayment preparation. | Medium | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Valuable only as intention; debt truth remains with Cards or Loans. |
| PL-PD-018 | Family-support planning | Represent expected support to or from family. | Medium | High | Medium | High | APPROVED WITH MODIFICATIONS | Vietnam-relevant, but should remain ordinary planning meaning until terminology is researched. |
| PL-PD-019 | Goal priority ranking | Rank goals against each other. | Medium | Medium | Medium | Medium | DEFERRED | Real later, but risks over-optimizing before basic goals are trusted. |
| PL-PD-020 | Partner notes or decision context | Capture discussion context around planning choices. | Medium | Medium | Medium | High | DEFERRED | Partner behavior is real, but privacy and blame dynamics need research. |
| PL-PD-021 | Planned-versus-actual variance language | Explain mismatch between intention and reality. | High | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Useful only with calm household language; avoid punitive accounting tone. |
| PL-PD-022 | Calendar projection | Show upcoming expected inflows, outflows, and due pressure. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Calendar pressure is validated, but projection must remain expected and read-only. |
| PL-PD-023 | Rollover awareness | Recognize unused planned capacity across periods. | Medium | Medium | High | High | DEFERRED | Envelope-relevant, but abstract and risky before jar/balance comprehension is proven. |
| PL-PD-024 | Emergency-plan handling | Allow planning adaptation during emergencies. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Emergencies are real; changes must be framed as intention reallocation, not money movement. |
| PL-PD-025 | Multiple planning periods | Support planning periods beyond the current month. | Medium | Medium | High | Medium | DEFERRED | Useful later, but simple-first MVP should not require multi-period complexity. |
| PL-PD-026 | Provider-assisted recurring detection | Infer recurring patterns from provider or transaction evidence. | Medium | Medium | High | High | DEFERRED | Useful later; provider reliability, consent, and false-confidence risks are unresolved. |
| PL-PD-027 | Household cash-flow forecasting | Forecast future cash position from plans and facts. | Medium | High | High | High | DEFERRED | Valuable but high risk of false certainty and maintenance burden. |
| PL-PD-028 | Scenario comparison | Compare what-if household planning scenarios. | Medium | Medium | High | High | DEFERRED | Useful later; too powerful before core plan trust and Health boundaries are stable. |
| PL-PD-029 | Major-life-event planning | Plan for marriage, birth, move, home, or vehicle transitions. | Medium later | Medium later | High | Medium | DEFERRED | Real 5-10 year need, but not simple-first and requires separate validation. |
| PL-PD-030 | Child education planning | Represent child education cost intentions. | Medium later | High later | High | Medium | DEFERRED | Important for growing families but too life-stage-specific for current core. |
| PL-PD-031 | Retirement or long-term wealth planning | Represent long-horizon wealth or retirement goals. | Low now | Low now | High | High | DEFERRED | May matter later, but current product targets household operating clarity. |
| PL-PD-032 | Insurance coverage planning | Represent insurance coverage and premium planning. | Low now | Medium later | High | High | DEFERRED | Real but specialized; risks entering advice and product-truth territory. |
| PL-PD-033 | Tax-aware planning | Represent tax-sensitive household planning. | Low | Low | High | High | REJECTED | Not core for Vietnam young-household MVP and risks inaccurate advice and maintenance burden. |
| PL-PD-034 | Multi-household or extended-family planning | Plan across multiple households or extended-family units. | Medium later | Medium later | High | High | DEFERRED | Future pressure exists, but current product has one active household principle. |
| PL-PD-035 | Advisory-grade financial planning | Provide advice-grade recommendations. | Low | Medium | High | Critical | REJECTED | Conflicts with financial safety, advisory risk limits, and Health read-only principles. |
| PL-PD-036 | AI-assisted planning explanations | Explain plans and mismatches using household facts. | Medium later | Medium later | High | High | APPROVED WITH MODIFICATIONS | Allowed only as future assistive explanation grounded in facts; no invented balances or autonomous actions. |

## Summary

| Decision | Count |
| --- | --- |
| APPROVED | 6 |
| APPROVED WITH MODIFICATIONS | 14 |
| DEFERRED | 14 |
| REJECTED | 2 |
| Total reviewed | 36 |
