# Boundaries

## What Belongs Here

- Read-only financial condition interpretation.
- Health score, pulse, level, or signal.
- Explanation of visible financial-health factors.
- Read-only observations from Accounts, Transactions, Planning, Goals, Cards, Loans, Inbox, and Month Close.
- Risk, pressure, resilience, and stability interpretation.
- Scenario visibility that does not move money or change source facts.

## What Belongs In Another Domain

| Concern | Owning domain |
| --- | --- |
| Account balances and real money location | Accounts |
| Cleared money movement | Transactions |
| Budget intentions and jars | Planning |
| Future target intentions | Goals |
| Credit card product truth | Cards |
| Loan product truth and repayment state | Loans |
| Decisions and review workload | Inbox |
| Household membership and permissions | Together / Tenancy |
| Month-end closure and historical ritual | Month Close |
| Insurance policy truth | Insurance or external provider domain if present |
| Medical diagnosis, treatment, appointments, clinical records | Outside Health financial domain |

## Where Integrations Happen

- Health reads ledger facts for real position and activity.
- Health reads plan facts for intention and allocation pressure.
- Health reads inbox facts for unresolved decision burden.
- Health reads debt and card facts for obligation pressure.
- Health may read insurance or provider facts if such source domains exist.
- Health may read month-close facts for stable historical comparison.

## Where Ownership Changes

Ownership does not move to Health. Health consumes facts and produces interpretation.

If a user acts on a Health observation, the action belongs to the relevant source domain:

- Moving money belongs to Accounts / Transactions.
- Changing a plan belongs to Planning.
- Updating a debt belongs to Loans or Cards.
- Resolving a decision belongs to Inbox.
- Updating membership belongs to Together / Tenancy.
