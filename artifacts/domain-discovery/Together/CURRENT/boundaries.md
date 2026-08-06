# Boundaries

## Belongs Here

- Household identity.
- Household membership.
- Member role within the household.
- Invitation state.
- Household-level policies.
- Household-level preferences.
- Material policy-change visibility.
- Trust boundary for household-scoped data.
- Whether a person is inside or outside the shared financial space.

## Belongs In Another Domain

Auth:

- Login.
- Password reset.
- OAuth provider linking.
- MFA.
- Session lifecycle.
- User identity verification.

User Profile:

- Personal name, avatar, email, and user-level preferences.

Accounts:

- Real-world financial containers.
- Account holder facts.
- Balance and institution identity.
- Account inclusion in real position.

Transactions:

- Real money movements.
- Corrections, refunds, transfers, splits, and transaction attribution.

Cards / Loans / Savings:

- Product terms, obligations, due dates, interest, maturity, settlement, and payoff facts.

Planning:

- Jars, goals, recurring patterns, allocation intention, and month close behavior.

Inbox:

- Open household decisions and review items.
- Decision resolution state.

Health:

- Read-only interpretation of household financial position and behavior.

Platform / Security:

- RLS, encryption, audit infrastructure, logs, service role, provider secrets, and compliance mechanisms.

## Where Integrations Happen

- Auth integration establishes user identity before household membership can be resolved.
- External financial providers may expose individual account data, but Together determines household-scoped visibility only after consent and membership are valid.
- Notification systems may deliver invitation and policy-change messages.
- Other domains ask Together or tenancy for household scope and access.

## Where Ownership Changes

- Once a member is admitted, money records remain owned by their financial domains, not Together.
- Once a household policy affects spending or planning behavior, enforcement belongs to the domain that performs that behavior.
- Once a review item exists, Inbox owns attention state, even if Together owns visibility rules.
- Once health is calculated, Health owns the reflection, while Together owns who may see it.

## Boundary Warning

Together must not become a general permissions system, relationship counseling tool, banking connector, or legal marriage registry.
