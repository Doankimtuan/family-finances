# Consistency Check

## No Conflicts

Passed.

Approved decisions preserve Accounts as real containers. Deferred decisions do not contradict approved scope.

## No Duplicated Capabilities

Passed with clarification.

Balance freshness, staleness, and provider connection status were separated:

- Balance freshness/staleness is approved with modifications as a user-confidence concept.
- Provider connection status is deferred because it depends on provider feeds.

Per-account currency and multi-currency support were separated:

- Per-account currency is a field-level product need.
- Multi-currency support is the broader product behavior.
- Both are deferred.

## No Contradictory Decisions

Passed.

Reconciliation is approved as a lightweight responsibility while advanced reconciliation workflow is deferred. This is not contradictory: the domain owns trust repair, but not the full future workflow now.

## No BR Violations

Passed.

- BR-01 protected by approving real/virtual separation and rejecting jar-to-account mapping.
- Health read-only (BR-24) protected by rejecting Health write-back.
- No unnecessary automation protected by rejecting automatic money movement.

## No Architecture Violations

Passed at product-decision level.

The board does not prescribe architecture. Cross-domain ownership remains consistent:

- Accounts own containers.
- Transactions own movement.
- Cards own card obligations.
- Savings owns savings-product lifecycle.
- Planning/Jars own intention.
- Health summarizes only.
- Together protects access.

## Remaining Tensions

- Credit cards are behaviorally account-like but financially not owned money.
- Savings accounts, savings products, and savings goals require careful language.
- Personal/shared account relevance remains emotionally sensitive.
- Provider integration remains valuable but risky.

