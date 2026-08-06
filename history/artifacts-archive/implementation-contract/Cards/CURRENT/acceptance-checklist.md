# Acceptance Checklist

## Core State

- [ ] Card cannot become Active without required facts.
- [ ] Credit card requires issuer, limit, statement date, and due date.
- [ ] Invalid action preserves previous valid state.
- [ ] Archived card returns through Needs Review before active interpretation.
- [ ] Billing Settled cannot reopen without Needs Review.
- [ ] Closed, Expired, Archived, and Abandoned Draft cards cannot receive new normal purchases.

## Money

- [ ] Available credit never increases real money totals.
- [ ] Credit-card purchase increases card obligation, not cash.
- [ ] Debit-card purchase uses linked real account context.
- [ ] Card repayment requires real money source.
- [ ] Ledger updates only when money moves or recognized adjustment is recorded.
- [ ] Card repayment is not double-counted as original purchase spending.
- [ ] Refund is not ordinary income by default.
- [ ] Cashback is not real income unless real money enters a real account.
- [ ] Partial repayment leaves remaining due visible.
- [ ] Inbox acknowledgement never changes money.
- [ ] Health never writes money or card state.
- [ ] Cards never execute repayment automatically.

## Inbox And Notifications

- [ ] No Inbox item is created for routine successful edit.
- [ ] Due reminder exists only when remaining due requires attention.
- [ ] Overdue review item is created when due date passed and remaining due remains.
- [ ] Refund ambiguity creates review item.
- [ ] Unknown fee or interest creates review item.
- [ ] Inbox auto-resolution never changes money.
- [ ] Notifications never imply available credit is cash.

## Permissions

- [ ] Non-members cannot read or mutate card data.
- [ ] Viewer cannot mutate card state, money, repayment, or billing facts.
- [ ] Partner/Admin can perform authorized card mutations.
- [ ] Background Worker cannot record repayment, close cards, or change balances.
- [ ] System can reject invalid attempts but cannot invent facts.

## Cross-Domain

- [ ] Accounts owns repayment source truth.
- [ ] Transactions owns real money movement.
- [ ] Planning reads due pressure but cannot reduce obligation.
- [ ] Loans do not own revolving card debt by default.
- [ ] Categories can classify purchases without changing obligation.
- [ ] Together permission rules are enforced.

## Product Decision Guardrails

- [ ] Provider feeds are not assumed.
- [ ] Automatic reconciliation is not assumed.
- [ ] Fraud detection is not introduced.
- [ ] Reward optimization is not introduced.
- [ ] Tokenized-card tracking is not introduced.
- [ ] Detailed dispute lifecycle is not introduced.
- [ ] Detailed issuer formulas are not invented.
