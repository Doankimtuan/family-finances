---
generated_by: Product Strategy Board
run_id: run_product_strategy_20260801T140000Z
status: PRODUCT_V2_CANDIDATE
source_of_truth: NOT_ADOPTED
v1_unchanged: true
created_at: 2026-08-01T13:59:30Z
---

# Domain Model v2

## Bounded contexts (preserved knowledge, clearer names)

| Context | Contains | User-facing name |
|---------|----------|------------------|
| Tenancy | Household, Member, Invitation | Together |
| Real Ledger | Account, Transaction, Debt/Liability, SavingsAccount, (Asset later) | Money |
| Intention Plan | Jar, Plan, Rules, Movement, ReviewItem, MonthRitual, Goal, Recurring | Plan + Inbox |
| Insight | HealthScore, Insight, Scenario | Health |

## Core entities (product language)

- **Household** — shared money space (currency, locale, policies)
- **Partner** — member with daily rights; **Admin** — elevated policies
- **Account** — real money container
- **Transaction** — real cashflow event
- **Jar** — intention envelope (not a bank)
- **ReviewItem** — decision object in Inbox
- **MonthRitual** — period close (was month close run)
- **Goal / Savings / Installment** — commitment objects
- **HealthSnapshot** — scored household state

## Deliberate de-emphasis

Asset/crypto detail is **Wealth (Later)**—entity may exist in knowledge, not core IA.

## Derived from

`dom-bounded-ledger`, `dom-bounded-jars`, `dom-bounded-tenancy`, and related V1 entities—**rewritten for product clarity**.
