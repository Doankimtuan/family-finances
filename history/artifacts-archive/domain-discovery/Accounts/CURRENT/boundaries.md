# Boundaries

## What Belongs Here

Accounts owns:

- Real money containers.
- Account identity and household label.
- Account type.
- Institution or provider reference where relevant.
- Recorded balance context.
- Liquidity nature.
- Active/historical account status.
- Whether an account is included in real household position.
- Account-level reconciliation context.

## What Belongs Elsewhere

Transactions:

- Individual money movement events.
- Income, expense, transfer, refund, reversal, correction, and audit chains.
- Merchant, category, date, and note of a money event.

Cards:

- Credit limit.
- Statement cycle.
- Minimum payment.
- Due date.
- Outstanding revolving balance semantics.
- Interest and card-specific obligations.

Savings:

- Term deposit contract.
- Principal, rate, maturity, renewal, early withdrawal, and settlement.
- Savings-product lifecycle.

Jars / Budgets:

- Intention allocations.
- Planned spending.
- Remaining allocation.
- Overspend policy.
- Jar-to-jar reallocations.

Goals:

- Future desired outcome.
- Target amount and progress intention.
- Goal funding interpretation.

Health:

- Read-only summary and interpretation.
- Financial health scoring or narrative.

Inbox:

- Human decisions that need resolution.
- Unmapped transactions or maturity decisions.

Together / Tenancy:

- Household membership.
- User access.
- Partner visibility policies.
- Permission to perform money actions.

## Integration Points

- Transactions reference accounts.
- Home and Health read account position.
- Savings references funding and settlement accounts.
- Cards may link to repayment or funding accounts.
- Inbox may display account context for decisions.
- Provider feeds may supply read-only balance and transaction information.
- Tenancy protects account access.

## Ownership Changes

Ownership changes when:

- A real-world account changes legal holder.
- A household member joins or leaves.
- A personal account becomes household-relevant.
- A shared account becomes personal or excluded.
- An account closes and becomes historical.
- A savings product settles into a different account.

The Accounts domain observes these facts. It does not decide household policy by itself.

