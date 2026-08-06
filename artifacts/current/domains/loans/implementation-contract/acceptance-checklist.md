# Acceptance Checklist

## Core Loan

- [ ] A loan cannot become Active without lender identity.
- [ ] A loan cannot become Active without positive original principal.
- [ ] A loan cannot become Active without repayment expectation.
- [ ] A credit-card revolving balance cannot be created as a Loan.
- [ ] A jar, goal, account, or plan cannot be created as a Loan.
- [ ] Broad loan type remains within approved product scope.

## State

- [ ] Every transition follows state-contract allowed transitions.
- [ ] Forbidden transitions are rejected without changing loan state.
- [ ] Completed cannot return directly to Active.
- [ ] Cancelled cannot return directly to Active.
- [ ] Archived cannot return directly to Active.
- [ ] Recovery from terminal/history states passes through Needs Review.
- [ ] Invalid Attempt preserves previous valid state.

## Money

- [ ] Create Loan does not move money.
- [ ] Edit Loan Details does not move money.
- [ ] Update Rate Awareness does not move money.
- [ ] Review Loan does not move money.
- [ ] Estimate Early Payoff does not move money.
- [ ] Mark Completed does not move money by itself.
- [ ] Cancel Loan does not move money.
- [ ] Mark Defaulted does not move money.
- [ ] Archive Loan does not move money.
- [ ] Repayment writes ledger only through the Transactions-owned money path.
- [ ] Repayment requires valid payment source.
- [ ] Loan repayment is not treated only as ordinary spending.
- [ ] Planning updates never change loan balance.
- [ ] Inbox acknowledgement never changes money.
- [ ] Health never writes loan data.

## Inbox And Notifications

- [ ] Routine successful create/edit does not create Inbox items.
- [ ] Due reminder Inbox item exists only when attention is needed.
- [ ] Overdue review item is created when due date passes without recorded payment.
- [ ] Completion review item is created only when acknowledgement is needed.
- [ ] Inbox auto-resolution never changes money or balance.
- [ ] Notifications never execute repayment.
- [ ] Notifications never claim provider confirmation without evidence.

## Permissions

- [ ] Non-members cannot read or mutate loans.
- [ ] Viewer cannot mutate loan state, money, repayment, or rate.
- [ ] Partner/Admin permissions are enforced for mutations.
- [ ] Background Worker cannot record repayment or move money.
- [ ] System rejects invalid attempts without inventing facts.

## Validation And Edge Cases

- [ ] Duplicate repayment does not create duplicate money movement.
- [ ] Interrupted mutation does not assume partial success.
- [ ] Network retry is duplicate-safe.
- [ ] Provider mismatch moves loan to Needs Review.
- [ ] Irregular repayment is recorded as actual, not forced into schedule.
- [ ] Unknown fees or penalties are not invented.
- [ ] Early payoff is labeled as estimate, not lender quote.
- [ ] Final payment with residual uncertainty does not auto-complete.
- [ ] Archive active unresolved loan is rejected or routed to Needs Review.

