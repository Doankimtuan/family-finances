# Domain Reality Validation — Overview

## Cross-Domain Synthesis

### Strongest Domains (Score ≥ 8.5)

**Transactions (9.6/10)** — The most mature domain. Immutable facts, clear boundaries, well-understood by users. The model mirrors real banking behavior perfectly. No competitor does transactions fundamentally better. The domain's simplicity is its strength — it doesn't try to be more than events.

**Inbox (8.7/10)** — The most innovative domain. No competitor has an explicit decision queue that bridges Real and Intention. This is ViNha's behavioral moat. The "one card, one decision" pattern is unique. The risk is that users may not understand it initially.

**Budgets/Jars (8.6/10)** — Well-modeled intention envelopes. The BR-01 distinction (jars ≠ bank balance) is critical and well-enforced. YNAB's category envelope system validates this approach. The risk is that jar management could become tedious at scale.

### Solid Domains (Score 8.0–8.4)

**Together (8.4/10)** — Household-first architecture is ViNha's structural differentiator. No competitor treats the household as the fundamental unit. The risk is handling single-user transitions and household dissolution gracefully.

**Installments (8.3/10)** — Well-defined completion logic (BR-11). The structured debt model maps cleanly to real installment products. Risk: handling variable-rate installments and early payoff.

**Goals (8.3/10)** — Clear aspirational targets. Distinct from jars. Forward-looking progression is well-modeled. Risk: goal tracking without investment projection may feel incomplete.

**Month Close/Ritual (8.1/10)** — The most opinionated domain. No competitor has an explicit monthly ceremony. This could be ViNha's behavioral differentiator or its biggest adoption barrier. The assisted mode default (BR-09) is smart.

**Savings (8.1/10)** — Real financial instruments well-separated from jars. BR-10 (maturity → Inbox flow) is a good bridge. Risk: limited savings product coverage (no investment accounts).

### Domains Needing Attention (Score 7.0–7.9)

**Cards (7.9/10)** — Payment instruments are well-modeled but credit card behavior is complex. Statement cycles, minimum payments, interest calculations are absent. Competitors handle card management more comprehensively.

**Categories (7.9/10)** — Tag-based classification is correct architecture. "Not a destination" is right. But the auto-categorization gap is significant — all major competitors offer it. This should be a near-term evolution opportunity.

**Planning (8.0/10)** — Automation rules are conceptually right but the model may be too rigid. Recurring patterns, income placement (BR-04), and rule management need real-world validation. Simplifi's spending plan approach offers a lighter alternative.

### Overall Patterns

1. **Real Ledger domains are stronger** — Accounts (9.3), Transactions (9.6) are near-perfect. Financial truth is easier to model than financial intention.

2. **Intention Plan domains have more variability** — Inbox (8.7) and Jars (8.6) are strong; Planning (8.0) is weaker. Behavioral domains are harder to get right.

3. **The Real/Intention separation is validated** — The BR-01 distinction holds across all domains. No validation found cases where the boundary breaks.

4. **Household-first is a genuine differentiator** — No competitor treats the household as the default unit. This is not a marketing claim — it's architectural.

5. **Auto-categorization is the biggest gap** — Every major competitor offers it. ViNha's manual-first approach to Categories will feel dated at launch if not addressed.

6. **The Month Ritual is ViNha's riskiest bet** — It could be revolutionary or a UX barrier. No one else does it. That's either genius or hubris.

7. **Simplicity is uneven** — Transactions are optimally simple. Planning may be over-engineered. Cards may be under-engineered.

### Cross-Domain Behavioral Assessment

ViNha's domain model generally supports healthy financial behavior:
- **Separation of Real/Intention reduces mental accounting errors** (people confuse "budget categories" with "real money")
- **Inbox reduces decision avoidance** (unmapped expenses don't disappear into categories)
- **Month Ritual creates a regular review cadence** (behavioral economics strongly supports periodic check-ins)
- **Household-first reduces financial secrecy** (partners see the same picture)

Friction points:
- **Jar management could create budgeting fatigue** (too many jars to maintain)
- **Manual categorization may feel like busywork** (competitors have solved this)
- **Month Ritual could feel like a chore** (ceremony must add value, not just steps)

### Architecture Stress Points

The following cross-domain interactions will stress the architecture:
1. **Inbox → Jars + Ledger** — The bridge between Real and Intention must handle edge cases (split transactions, partial mappings)
2. **Month Ritual → All domains** — Locking plan movements (BR-08) affects every Intention domain
3. **Together → All domains** — Multi-user mutations must stay consistent under concurrent access
4. **Health → All domains** — Read-only reflection requires consistent snapshots of changing data

### Confidence Summary

| Domain | Confidence | Rationale |
|--------|-----------|-----------|
| Transactions | Very High | Reality-tested by every banking app |
| Accounts | High | Well-understood financial concept |
| Inbox | High | Innovative but unproven in market |
| Budgets/Jars | High | Validated by YNAB's success |
| Together | High | Correct architecture, needs UX validation |
| Goals | Medium-High | Standard concept, ViNha's spin is unproven |
| Installments | Medium-High | Well-modeled but limited scope |
| Savings | Medium-High | Good foundation, needs expansion later |
| Month Ritual | Medium | Highest risk — unproven ceremony concept |
| Planning | Medium | May need simplification or UX iteration |
| Cards | Medium | Under-engineered for real card behavior |
| Categories | Medium | Correct model, missing table-stakes features |
| Health | Medium | Read-only constraint is right; usefulness unproven |

---

*Synthesis completed across all 13 domains, 8 validation dimensions, and 4 competitor products.*
