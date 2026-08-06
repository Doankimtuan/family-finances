# Notification And Inbox Review

## Assessment

Inbox is valuable only if it remains a typed decision queue, not a general feed. The approved Inbox eligibility rule is strong and should be treated as UX law: an Inbox item belongs only when it requires a household decision, partner confirmation, source-domain clarification, material acknowledgement, or approved auto-resolution policy.

## Signal Rules

| Signal Type | Destination |
|-------------|-------------|
| Requires decision | Inbox |
| Time-sensitive obligation | Inbox plus reminder surface |
| Informational trend | Home or Health, not Inbox |
| Low-risk completed event | Toast or history |
| Partner-visible material policy change | Together context, Inbox only if acknowledgement required |
| Stale source fact | Inbox if user action can resolve it |

## Recommendations

### PX-NI-01: Inbox value contract

Problem: As Savings, Loans, Cards, Investments, Goals, and Together emit events, Inbox can become crowded.

User Impact: Users stop trusting the badge.

Affected Screens: Inbox Queue, Review Detail, Home Inbox CTA.

Frequency: Daily/Weekly.

Business Impact: High.

Recommended UX: Every Inbox item must show source, decision question, consequence, allowed actions, and expiration behavior. Awareness-only items must stay out.

Implementation Cost: Medium.

Priority: P0.

### PX-NI-02: Bundle repeated reminders

Problem: Savings cascades, payment reminders, and stale facts can create repeated attention.

User Impact: Notification fatigue.

Affected Screens: Inbox Queue, Home, Money Hub.

Frequency: Weekly/Event-based.

Business Impact: Medium-high.

Recommended UX: Bundle related reminders into one current decision card. Escalate only when timing or risk changes materially.

Implementation Cost: Medium.

Priority: P1.

