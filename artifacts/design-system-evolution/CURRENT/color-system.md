# Color System

## Rule

Use semantic roles only. Do not hardcode hex values in application UI. Values live in theme tokens and CSS variables.

## Semantic Roles

| Role | Purpose |
|---|---|
| Page | App viewport background and full-screen canvas. |
| Surface | Default content surface. |
| Elevated surface | Sheets, dialogs, toasts, and lifted panels. |
| Primary text | Main readable text and money facts. |
| Secondary text | Labels, helper text, and supporting copy. |
| Positive | Completed, improving, or confirmed positive state. |
| Caution | Needs attention, approaching deadline, recoverable issue. |
| Critical | Destructive, irreversible, failed, or high-risk state. |
| Informational | Neutral guidance, source, freshness, and system context. |
| Income | Incoming real money. |
| Expense | Outgoing real money. |
| Savings | Savings product, maturity, or saved intention. |
| Debt | Borrowed obligation, repayment, or payoff context. |
| Investment | Estimated risk-bearing holding context. |
| Planning | Jar, goal, recurring plan, or month ritual intention. |

## Existing Token Alignment

Current tokens already include canvas, surface, text, primary, status, money direction, health, chart, skeleton, overlay, focus, and inverse roles. Phase E may add aliases for `debt`, `investment`, and `planning` if repeated usage appears.

## Usage Rules

- Primary action uses `primary`.
- Secondary action uses `secondary`.
- Income uses income or credit only when direction is real money.
- Expense uses expense or debit only when direction is real money.
- Savings uses saving when the object is savings or saved intention.
- Planning uses accent or a future planning alias, but never if it implies real cash.
- Critical red is reserved for real risk, destructive action, failed mutation, or unrecoverable state.
- Caution amber is preferred for ordinary overspend, due soon, stale source, or incomplete setup.
- Informational blue is for source, freshness, read-only health, and neutral system guidance.

## Light And Dark

Light and dark themes are first-class. Every semantic role must preserve meaning and contrast in both modes. Do not desaturate dark mode so far that status loses meaning.

