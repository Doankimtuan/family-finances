# Decision Matrix — All 37 Items

| ID | Description | Domain | Score | Decision | Target Version | Priority | Rationale |
|---|---|---|---|---|---|---|---|
| EO-01 | Auto-Categorization | Categories | 49 | **APPROVED** | R1 | P1 | Biggest competitive gap; suggest-with-override only; every competitor offers this |
| EO-02 | Card Payment Due Dates | Cards | 42 | **APPROVED** | R1 | P1 | Financial safety gap; missing payments has severe consequences |
| EO-03 | Recurring Bill Calendar | Planning | 44 | **APPROVED WITH MODIFICATIONS** | R1 | P1 | Simplify to bill calendar view only; full cash-flow projections deferred to R2 |
| EO-04 | Simplify Planning to Patterns | Planning | 46 | **APPROVED** | R1 | P0 | Current engine is over-engineered; simplify before user accumulation |
| EO-05 | Transaction Search/Filtering | Transactions | 39 | **APPROVED** | R1 | P1 | Basic search/filter for R1; saved views deferred to R2 |
| EO-06 | Jar Templates | Budgets/Jars | 39 | **APPROVED** | R1 | P1 | New users don't know what jars to create; guided starting point |
| EO-07 | Inbox Batch Operations | Inbox | 45 | **APPROVED** | R1 | P1 | One-by-one review doesn't scale; critical for Inbox maturity |
| EO-08 | Health Score Iteration | Health | 38 | **APPROVED** | R1 | P2 | Continuous iteration based on usage data; ongoing through R1-R2 |
| EO-09 | Installment Interest Visibility | Installments | 40 | **APPROVED** | R1 | P1 | Without interest visibility, users can't make informed prepayment decisions |
| EO-10 | Month Ritual Quick Close | Month Close | 39 | **APPROVED WITH MODIFICATIONS** | R1 | P2 | Quick close after 3+ rituals; must maintain ritual integrity and partner visibility |
| EO-11 | Data Export CSV/PDF | Shared | 35 | **APPROVED** | R1/R2 | P2 | CSV export in R1; PDF monthly summaries in R2 |
| EO-12 | Savings Maturity Alerts | Savings | 36 | **APPROVED** | R1 | P1 | BR-10 already requires maturity flows; alerts prevent missed maturities |
| EO-13 | Card Interest Cost Display | Cards | 38 | **APPROVED** | R1 | P1 | Pairs with EO-02; visualization of interest cost drives behavior change |
| EO-14 | Goal Multi-Source Funding | Goals | 39 | **DEFERRED** | v2.5 | — | Adds complexity to goal model; not MKP-critical; current single-jar funding sufficient |
| EO-15 | Together Diverse Households | Together | 37 | **DEFERRED** | v3 | — | Current focus is partner households; diverse structures add significant complexity |
| EO-16 | Inbox Auto-Resolution Rules | Inbox | 46 | **APPROVED WITH MODIFICATIONS** | R2 | P2 | High value but must include undo, transparency, rule complexity limits |
| EO-17 | Category Sub-Tags | Categories | 34 | **DEFERRED** | v2.1 | — | Adds complexity without clear MKP value; evaluate after auto-categorization matures |
| EO-18 | Goal Progress Celebration | Goals | 28 | **APPROVED** | R1 | P2 | Simple UX enhancement; positive reinforcement with minimal complexity |
| EO-19 | Simple Jar Reallocation UX | Budgets/Jars | 33 | **APPROVED** | R1 | P2 | UX improvement for common task; quick-select approach over drag-and-drop |
| EO-20 | Transaction Split Support | Transactions | 39 | **APPROVED** | R1 | P1 | Important user need; multi-category splits for single transactions |
| EO-21 | Card Reward Tracking | Cards | 33 | **DEFERRED** | Future Capability Pack | — | Not core to money management; optimization, not foundational |
| EO-22 | Savings Product Diversity | Savings | 36 | **DEFERRED** | v2.5 | — | Current model handles basic savings; CD/MM/T-bill support is v2.5 scope |
| EO-23 | Planning Conditional Rules | Planning | 41 | **REJECTED** | — | — | Domain Philosophy explicitly warned against this; dangerous complexity; contradicts EO-04 simplification |
| EO-24 | Month Ritual Gamification | Month Close | 30 | **REJECTED** | — | — | Financial decisions shouldn't be gamified; undermines ritual seriousness |
| EO-25 | Health Scenario Modeling | Health | 37 | **DEFERRED** | v2.5 | — | "What if" modeling valuable but not MKP-critical; needs stable Health score first |
| EO-26 | Jar Sub-Allocation / Sub-Jars | Budgets/Jars | 38 | **REJECTED** | — | — | Violates simplicity principle; hierarchy adds cognitive load without clear benefit |
| EO-27 | Account Type Sub-Classification | Accounts | 30 | **DEFERRED** | Future Capability Pack | — | Low value-add; current taxonomy sufficient for MKP |
| EO-28 | Installment Variable Rate Support | Installments | 38 | **DEFERRED** | v2.5 | — | Edge case for Vietnam market; fixed-rate installments dominate |
| EO-29 | Together Permission Granularity | Together | 39 | **DEFERRED** | v3 | — | Partner/Admin sufficient for now; granular permissions add complexity |
| EO-30 | Month Ritual Customization | Month Close | 33 | **DEFERRED** | v2.5 | — | Premature optimization; let ritual stabilize before offering customization |
| DNI-01 | Health Write-Back | Health | — | **REJECTED** | — | — | Violates BR-14; Health must remain read-only |
| DNI-02 | Jar-to-Account Mapping | Budgets/Jars | — | **REJECTED** | — | — | Violates BR-01; jars are intentions, not account mirrors |
| DNI-03 | Auto-Commit Categorization | Categories | — | **REJECTED** | — | — | Destroys user trust; categorization must always be suggest-with-override |
| DNI-04 | Partner Spending Comparison | Together | — | **REJECTED** | — | — | Creates resentment; undermines "together" ethos |
| DNI-05 | Month Ritual Removal | Month Close | — | **REJECTED** | — | — | Removes core behavioral mechanism; ritual is non-negotiable |
| DNI-06 | Health Score Leaderboards | Health | — | **REJECTED** | — | — | Shaming, not motivating; financial privacy violation |
| DNI-07 | Investment Recommendations | Health | — | **REJECTED** | — | — | Creates regulatory liability; ViNha is not a financial advisor |

---

## Summary Statistics

| Category | Count |
|---|---|
| Total Items Reviewed | 37 |
| APPROVED | 14 |
| APPROVED WITH MODIFICATIONS | 3 |
| DEFERRED | 10 |
| REJECTED | 10 |
| P0 Priority (MKP-Critical) | 1 |
| P1 Priority (R1 High) | 11 |
| P2 Priority (R1-R2 Medium) | 5 |
| R2 Target | 2 (features) + 2 (extensions) |
| v2.1 Target | 1 |
| v2.5 Target | 5 |
| v3 Target | 2 |
| Future Capability Pack | 2 |
