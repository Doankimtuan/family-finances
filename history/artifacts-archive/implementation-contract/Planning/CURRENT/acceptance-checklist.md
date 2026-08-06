# Acceptance Checklist

## Planning Core

- [ ] Create Income Intention stores expectation only and creates no ledger write.
- [ ] Create Jar creates a virtual purpose container only.
- [ ] Planned amounts are never labeled or treated as account balances.
- [ ] Active jars can be allocation targets.
- [ ] Paused, Archived, Historical, Completed, and Cancelled jars are not allocation targets.
- [ ] Update Jar Or Allocation creates no transaction.
- [ ] Goal progress is never treated as Savings product balance.
- [ ] Recurring expectation never marks a bill paid.
- [ ] Expected due date is distinguishable from source-confirmed due truth.
- [ ] Calendar pressure is expectation unless sourced read-only from owning domain.

## State And Recovery

- [ ] Every allowed transition follows `state-contract.md`.
- [ ] Every forbidden transition is rejected.
- [ ] Invalid Attempt preserves prior valid state.
- [ ] Locked period rejects normal edit.
- [ ] Locked period permits explicit correction only.
- [ ] Historical records are read-only.
- [ ] Cancelled, Completed, and Archived records remain interpretable.

## Money Safety

- [ ] No Planning action writes Real Ledger.
- [ ] No Planning action changes account balance.
- [ ] No Planning action confirms payment.
- [ ] Emergency reallocation is virtual only.
- [ ] Inbox acknowledgment never changes money.
- [ ] Notification never changes money.
- [ ] Health never writes Planning.
- [ ] AI explanation, if present in future, never invents balances or actions.

## Inbox And Notifications

- [ ] Routine successful Planning changes do not create Inbox items.
- [ ] Plan/fact mismatch creates at most one active Inbox item per item/reason when user action is required.
- [ ] Partner challenge creates Planning Review item when unresolved.
- [ ] Review blocked by unresolved required items creates Planning Review item.
- [ ] Duplicate action does not create duplicate Inbox item.
- [ ] Due reminder states expected pressure, not paid status.
- [ ] Failure notification confirms no change occurred.

## Permissions

- [ ] Non-members cannot read Planning.
- [ ] Viewer cannot mutate Planning.
- [ ] Owner, Partner, and Admin can perform allowed human Planning actions.
- [ ] Background Worker cannot make household decisions.
- [ ] System can reject invalid actions only.
- [ ] Together policy is enforced for shared assumptions.

## Cross-Domain

- [ ] Planning reads Accounts without mutating them.
- [ ] Planning reads Transactions without mutating them.
- [ ] Planning reads Cards without owning card truth.
- [ ] Planning reads Loans without owning loan truth.
- [ ] Planning reads Savings without owning product truth.
- [ ] Categories may inform meaning but do not become jars automatically.
- [ ] Health remains read-only.
