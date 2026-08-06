# Business Boundaries

## What Belongs Here

- Real money movement facts.
- Income, expense, and owned-account transfer interpretation.
- Required factual anchors.
- Chronological activity history.
- Household note and description.
- Category meaning on a transaction.
- Review-needed status for unclear transaction meaning.
- Refund, correction, reversal, and historical audit relationships.
- Lightweight reconciliation as confidence behavior.
- Read-only factual input to other domains.

## What Belongs Elsewhere

- Account identity, account type, active/closed account state: Accounts.
- Card statement cycle, due date, credit limit, billing month: Cards.
- Loan principal, interest, schedule, obligation state: Loans.
- Savings product lifecycle, maturity, withdrawal rules: Savings.
- Virtual jars, allocations, month ritual, planning capacity: Planning.
- Goals, targets, aspiration progress: Goals.
- Review queue ownership and household decision workflow: Inbox.
- Health interpretation and warnings: Health.
- Category taxonomy and label governance: Categories.
- Household collaboration, partner visibility, permissions, shared conversations: Together and Tenancy.
- Provider connections, sync reliability, enrichment: Integration or Platform.

## What Transactions Must Never Own

- Virtual planning money.
- Jar balances or goal balances.
- Health write-back.
- Card billing obligations.
- Loan schedules.
- Savings maturity state.
- Provider authority over truth.
- AI authority over truth.
- Personal spending judgment.
- Advanced analytics ownership.
- Technical data transport contracts.

## Responsibility Leakage Prevention

- A transaction may reference a jar, but the jar remains planning intention.
- A transaction may trigger Inbox review, but Inbox owns review queue behavior.
- A transaction may feed Health, but Health cannot mutate it.
- A transaction may relate to a card, loan, or savings product, but those domains own their specialized lifecycle.
- A transaction may be reconciled against provider information, but provider data is not automatically authoritative in current scope.
