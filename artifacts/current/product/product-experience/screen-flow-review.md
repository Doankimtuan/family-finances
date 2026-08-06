# Screen Flow Review

## Assessment

The approved screen set is complete for MVP and follows a mobile-native hierarchy. The main flow risk is depth: Money and Plan each act as hubs with multiple second-level destinations. This is acceptable if urgent actions are surfaced from Home and if common actions do not require browsing the hub every time.

## Flow Findings

| Flow | Expected Path | Tap Risk | UX Finding |
|------|---------------|----------|------------|
| Add expense | Home or Money -> Add Transaction -> Save | Good | Meets under-15-second target if optional fields stay hidden |
| Resolve Inbox | Home Inbox CTA -> Queue -> Detail -> Resolve | Good | Detail must ask one decision question only |
| Savings maturity | Savings Detail -> Inbox Review -> Renew/Withdraw/Later | Moderate | Deep link should land directly on the maturity decision |
| Installment complete | Cards/Debts or Inbox -> Review -> Reallocate | Moderate | Freed cash flow should be suggested, not forced |
| Month Ritual | Plan Hub -> Month Ritual -> Assisted Steps -> Lock | Moderate | User should see time estimate and blockers before entering |
| Invite partner | Together -> Invite -> Accept link | Good | Keep member visibility simple |
| Health review | Home chip -> Health Overview -> Insights | Good | Health should not compete as sixth tab |

## Recommendations

### PX-SF-01: Deep-link to action state, not list state

Problem: Event-based journeys can land users on a list that still requires interpretation.

User Impact: A savings maturity or due payment can be missed even after tapping a notification.

Affected Screens: Inbox Review Detail, Savings Detail, Cards, Debts.

Frequency: Event-based.

Business Impact: Medium-high.

Recommended UX: Deep links from reminders should open the exact ReviewItem or detail section containing the required decision.

Implementation Cost: Medium.

Priority: P1.

### PX-SF-02: Show preflight before Month Ritual

Problem: Month Ritual may surprise users with unresolved items.

User Impact: Users abandon the ritual.

Affected Screens: Plan Hub, Month Ritual, Inbox Queue.

Frequency: Monthly.

Business Impact: High.

Recommended UX: Plan Hub should show ritual readiness: unresolved Inbox count, emergency reflections, and estimated time.

Implementation Cost: Medium.

Priority: P0.

