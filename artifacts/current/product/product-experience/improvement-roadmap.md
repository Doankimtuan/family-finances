# Improvement Roadmap

## Release Readiness Path

### UX Gate 1: Concept Clarity

Problem: Core terms are financially correct but not all are naturally understood by first-time users.

User Impact: A young couple may understand "money" but not why Accounts, Jars, Goals, Savings, and Health are separate.

Affected Screens: Home, Money Hub, Plan Hub, Jars, Goals, Savings, Health.

Frequency: Daily.

Business Impact: High. Confusion here weakens trust and BR-01 comprehension.

Recommended UX: Introduce a repeated three-part pattern: "Where money is", "What it is planned for", and "What needs a decision". Use first-exposure helper text and short labels, not documentation pages.

Implementation Cost: Medium.

Priority: P0.

### UX Gate 2: Daily Loop Friction

Problem: Daily capture and Inbox resolution must remain fast as domains expand.

User Impact: If capture or triage feels like bookkeeping, users stop entering data.

Affected Screens: Home, Money Hub, Transaction Add, Inbox Queue, Inbox Review Detail.

Frequency: Daily.

Business Impact: High. The operating system depends on current facts.

Recommended UX: Keep common expense capture under 15 seconds, preserve one primary CTA per screen, and use one decision question per Inbox card.

Implementation Cost: Medium.

Priority: P0.

### UX Gate 3: Monthly Rhythm

Problem: Month Ritual is valuable but can feel bureaucratic.

User Impact: Families may delay month close, weakening plan trust and Health usefulness.

Affected Screens: Plan Hub, Month Ritual, Inbox Queue, Health Overview.

Frequency: Monthly.

Business Impact: High. Month Close is the core long-term discipline mechanism.

Recommended UX: Start with a preview, then a small set of required review steps, then lock and reflect. Show unresolved decisions before the ritual, not during a surprise blocking step.

Implementation Cost: Medium.

Priority: P0.

### UX Gate 4: Household Trust

Problem: Shared finance requires transparency without surveillance or relationship judgment.

User Impact: Partners may feel monitored, blamed, or overruled.

Affected Screens: Together Members, Policies, Preferences, Home, Inbox, Month Ritual.

Frequency: Weekly/Monthly.

Business Impact: Medium-high. Trust is the reason ViNha exists as household software.

Recommended UX: Use neutral attribution for policy changes, equal daily access for partners, and explicit save previews for material policy changes.

Implementation Cost: Low to Medium.

Priority: P1.

### UX Gate 5: Long-Term Calm

Problem: A finance app can become annoying when every signal competes for attention.

User Impact: Users mute notifications or abandon reviews.

Affected Screens: Inbox, Home, Health, Calendar-related surfaces.

Frequency: Ongoing.

Business Impact: Medium-high. Retention depends on restraint.

Recommended UX: Bundle low-urgency items, reserve push-level attention for time-sensitive decisions, and make Health a weekly/monthly mirror instead of a nag.

Implementation Cost: Medium.

Priority: P1.

