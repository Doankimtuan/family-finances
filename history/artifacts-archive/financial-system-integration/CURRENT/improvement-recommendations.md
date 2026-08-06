# Improvement Recommendations

## Recommendation 1: Create a Canonical Cross-Domain Event Registry

Problem: Several interactions are described consistently but not centralized as event contracts.

Root Cause: Domain blueprints were completed independently after the older 9-context architecture matrix.

Affected Domains: All writable domains, Inbox, Health.

Financial Impact: Prevents duplicated, missing, or impossible money events.

Recommended Solution: Define a non-redesign implementation registry of event names, producer, consumer, payload fields, source owner, and idempotency rule.

Priority: P1

Implementation Complexity: Medium

Business Risk: High if omitted

## Recommendation 2: Expand Typed Inbox Contracts

Problem: Inbox taxonomy is strong but incomplete for Investments, detailed Loan events, Goals, and Together policy materiality.

Root Cause: Initial taxonomy focused on unmapped expenses, savings maturity, card reminders, installments, and emergencies.

Affected Domains: Inbox, Investments, Loans, Goals, Together, Month Ritual.

Financial Impact: Reduces wrong decisions, notification noise, and accidental source-truth mutation.

Recommended Solution: Add typed ReviewItem contracts for investment uncertainty, loan due/overdue/completion/mismatch, goal evidence mismatch, and material policy changes.

Priority: P1

Implementation Complexity: Medium

Business Risk: Medium to High

## Recommendation 3: Add Month Close Cross-Source Sweep

Problem: Month Close explicitly resolves unmapped expenses and emergency reflection, but other stale financial decisions need deterministic treatment.

Root Cause: Month Ritual v2 centers on category divergence and Inbox triage, but source-specific stale behavior is not fully enumerated.

Affected Domains: Inbox, Month Ritual, Cards, Loans, Savings, Investments, Goals, Planning.

Financial Impact: Prevents unresolved obligations or product decisions from being hidden after month lock.

Recommended Solution: Define Month Close behavior for each ReviewItem type: block, carry forward, expire, archive, auto-resolve, or require partner acknowledgement.

Priority: P1

Implementation Complexity: Medium

Business Risk: High

## Recommendation 4: Harden Household Membership and Ownership Transitions

Problem: Death, member departure, household split, and account ownership transfer are only partially supported.

Root Cause: Together intentionally defers full household closure and separation workflows.

Affected Domains: Together, Accounts, Transactions, Cards, Loans, Savings, Investments, Goals, Inbox, Health.

Financial Impact: Prevents hidden ownership, incorrect visibility, and unsafe mutation after membership changes.

Recommended Solution: Add future system evolution requirements for inactive/deceased member visibility, historical access, legal-owner flags, and blocked write behavior where authority is unclear.

Priority: P2

Implementation Complexity: High

Business Risk: Medium

## Recommendation 5: Formalize Investment Settlement and Valuation Guards

Problem: Investments correctly separates unrealized value from cash, but implementation needs exact guardrails for sale, partial exit, transfer out, and stale valuation.

Root Cause: Investment products have more valuation ambiguity than cash, savings, cards, or loans.

Affected Domains: Investments, Transactions, Accounts, Inbox, Goals, Health.

Financial Impact: Prevents phantom cash, premature goal completion, and inflated Health resilience.

Recommended Solution: Require valuation source/date/confidence, proceeds settlement state, realized gain/loss source transaction linkage, and no available-cash treatment until settlement.

Priority: P1

Implementation Complexity: Medium

Business Risk: High

## Recommendation 6: Prepare Currency and Country Contracts

Problem: ViNha is VND-first, but future scalability includes multiple currencies and countries.

Root Cause: Current frozen scope is household money in current market assumptions.

Affected Domains: Accounts, Transactions, Savings, Investments, Loans, Cards, Planning, Health.

Financial Impact: Prevents cross-currency double counting, false gains, and country-specific misinterpretation.

Recommended Solution: Ensure every money event and valuation has currency, FX source when converted, valuation date, and country/provider context where relevant.

Priority: P2

Implementation Complexity: High

Business Risk: Medium

