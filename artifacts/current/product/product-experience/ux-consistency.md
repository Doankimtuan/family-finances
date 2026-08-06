# UX Consistency

## Assessment

Consistency is the difference between ViNha feeling like an operating system and a set of finance features. The approved Design Foundation, Design System, Screen Blueprints, and glossary provide enough structure. The product experience needs strict copy, state, and action consistency.

## Consistency Rules

| Area | Rule |
|------|------|
| Screen question | Every screen answers one primary question |
| Primary CTA | One dominant action per screen |
| Amounts | Label the financial meaning of every amount |
| ReviewItems | One decision question per card |
| Health | Always read-only, source-fact based, and completeness-aware |
| Plan | Always intention, never real money movement |
| Money | Always real containers and movement |
| Together | Always household boundary, never relationship judgment |
| Motion | Sparse and tied to completion or state transition |

## Recommendations

### PX-UC-01: Create a UX copy checklist for financial state labels

Problem: Individual screens can be correct alone but inconsistent together.

User Impact: Users relearn terms across the product.

Affected Screens: All product screens.

Frequency: Daily.

Business Impact: High clarity impact.

Recommended UX: Add a copy QA checklist for amount label, source truth, decision question, confirmation language, and BR-01/BR-24-sensitive wording.

Implementation Cost: Low.

Priority: P0.

### PX-UC-02: Keep confirmations proportional

Problem: Repeated confirmations create fatigue; missing confirmations create fear.

User Impact: Users either click through blindly or mistrust changes.

Affected Screens: Transaction correction, Month Ritual, Savings maturity, policy changes, destructive actions.

Frequency: Event-based.

Business Impact: Medium-high.

Recommended UX: Confirm destructive, irreversible, closed-month, real-money, and partner-visible changes. Use undo or toast for low-risk reversible UI changes.

Implementation Cost: Medium.

Priority: P1.

