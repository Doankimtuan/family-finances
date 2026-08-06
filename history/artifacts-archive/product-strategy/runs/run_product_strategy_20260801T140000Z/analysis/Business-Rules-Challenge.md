---
generated_by: Product Strategy Board
run_id: run_product_strategy_20260801T140000Z
status: PRODUCT_V2_CANDIDATE
source_of_truth: NOT_ADOPTED
v1_unchanged: true
created_at: 2026-08-01T13:59:30Z
---

# Business Rules Challenge

Every V1 rule is challenged. Intent may be preserved while **language, defaults, and edges** change.

| V1 ID | Still valid? | v2 approach | Notes |
|-------|--------------|-------------|-------|
| `br-real-vs-virtual` | STILL_VALID | KEEP_AS_AXIOM | Non-negotiable differentiator. Rewrite in human language; never weaken. |
| `br-income-allocate` | VALID_TOO_COMPLEX | SIMPLIFY_UX | Keep percent/fixed + suggest/auto policies; default to suggest with one-tap confirm; hide engineer enums. |
| `br-expense-allocate` | VALID_TOO_COMPLEX | SIMPLIFY_UX | Auto-when-mapped stays; unmapped → Inbox item with plain choices, not queue jargon. |
| `br-jar-active` | STILL_VALID | CLARIFY_STATES | Keep; publish Active / Paused / Archived matrix in product language. |
| `br-closed-month` | STILL_VALID | RITUALIZE | Keep period lock; present as Month Ritual with corrections as first-class, not error path. |
| `br-amount-positive` | STILL_VALID | KEEP | Accounting invariant; users see signed directions, system stores positive + direction. |
| `br-overspend-policy` | STILL_VALID | DEFAULT_SAFER | Keep warn|block|allow_negative; default warn for new households; explain tradeoffs. |
| `br-month-close-mode` | SIMPLIFY | DEFAULT_ASSISTED | Prefer assisted close for couples; manual remains power mode. |
| `br-assumptions-admin` | CHALLENGE | SOFTEN | Inflation/growth assumptions: either both partners edit with audit, or guided wizard—not silent admin-only friction. |
| `br-one-household` | CHALLENGE | KEEP_V1_TEMP | One active household OK for MVP focus; multi-household is Later, not Now. |
| `br-rls-member` | STILL_VALID | KEEP | Security invariant; product promises shared private household space. |
| `br-savings-maturity` | STILL_VALID | GUIDED_FLOW | Keep renew/switch/withdraw; wrap in maturity coach UI. |
| `br-installment-complete` | STILL_VALID | KEEP | Clear completion rule; celebrate payoff in Health/Inbox. |
| `br-action-context` | STILL_VALID | KEEP | Auth+membership required; invisible to users except clear login/household gates. |

## Missing edges to address in Business Rules v2

- Partner disagreement on allocation (needs Approval / Together cues).
- Transfer-shaped activity vs jar intents (clarify without inventing fake ledger moves).
- Soft-delete vs archive vs pause for jars/accounts.
- What happens when one partner closes the month while the other still has Inbox items.
