---
generated_by: Product Strategy Board
run_id: run_product_strategy_20260801T140000Z
status: PRODUCT_V2_CANDIDATE
source_of_truth: NOT_ADOPTED
v1_unchanged: true
created_at: 2026-08-01T13:59:30Z
---

# Feature Challenge Matrix (V1 → Product v2)

This board challenges every V1 feature. **Existence is not justification.**

| V1 ID | Statement (knowledge) | Stance | v2 disposition | Rationale |
|-------|----------------------|--------|----------------|-----------|
| `ft-auth` | Auth login/signup at /login.… | KEEP_INTENT | REWRITE_UX | Identity is required; login should feel like entering a shared home, not a SaaS gate. |
| `ft-household` | Household create/invite/accept at /household.… | KEEP_INTENT | SIMPLIFY | Household create/invite stays; reduce dead-end screens between signup and first value. |
| `ft-onboarding` | Eight-step onboarding wizard under /onboarding/*.… | REWRITE | MERGE_PROGRESSIVE | 8 steps are too many before value. Essential: partners + money reality + first plan. Wealth/debts deepen later. |
| `ft-dashboard` | Dashboard aggregates household financial overview at /dashboard.… | REWRITE | BECOME_HOME | Replace aggregate dump with Home answering three questions: real money, plan health, decisions waiting. |
| `ft-accounts` | Accounts hub including cash/checking and detail at /accounts and /accounts/[id].… | KEEP_INTENT | MERGE_INTO_MONEY | Accounts remain real-ledger truth but live under Money, not a parallel universe from Activity. |
| `ft-savings` | Fixed-term savings accounts with mature/withdraw at /accounts/savings*.… | KEEP_INTENT | SIMPLIFY | Fixed-term savings stay; maturity actions need clearer guided rituals, less API-shaped UI. |
| `ft-cards` | Credit card detail with billing items and installments at /accounts/card/[id].… | KEEP_INTENT | SIMPLIFY | Cards/installments stay for family cashflow reality; EMI should feel like a debt plan, not a billing dump. |
| `ft-assets` | Assets including crypto and investment profiles at /assets/[id].… | DE_SCOPE | SECONDARY_WEALTH | Assets/crypto are not core JTBD. Move to later Wealth lane; do not block onboarding or Home. |
| `ft-debts` | Debt/liability management via accounts debt actions and onboarding debts step.… | KEEP_INTENT | ELEVATE | Debt is core family stress. Elevate alongside Money; stop treating as onboarding-only afterthought. |
| `ft-activity` | Transaction activity log at /activity.… | KEEP_INTENT | REWRITE_UX | Activity becomes the ledger timeline with smart capture; primary daily write path. |
| `ft-goals` | Goals with contributions/status at /goals.… | KEEP_INTENT | MERGE_INTO_PLAN | Goals belong in Plan next to jars/savings targets, not a disconnected trophy shelf. |
| `ft-jars` | Virtual jars: list, detail, history, setup, review queue.… | KEEP_INTENT | REWRITE_UX | Jars are the product differentiator—but review must become Inbox, not a buried queue. |
| `ft-categories` | Category management at /categories and settings/categories.… | MERGE | INTO_TAGGING | Kill standalone category IA. Categories exist as tags + plan rules inside Activity/Plan. |
| `ft-recurring` | Recurring rules at /recurring.… | KEEP_INTENT | SIMPLIFY | Recurring is high-frequency family need; surface predicted bills on Home/Inbox. |
| `ft-decision-tools` | Decision tools / scenarios at /decision-tools.… | MERGE | INTO_HEALTH_INSIGHTS | Scenarios fold into Financial Health & Insights; stop orphan /decision-tools habit. |
| `ft-settings` | Settings: profile, household, members, assumptions, cash-flow, categories.… | KEEP_INTENT | SPLIT_TOGETHER | Profile vs Together (household/members/permissions) vs Preferences; admin gates stay explicit. |
| `ft-insights` | AI insights foundation (flagged) with migrations and lib/insights.… | REWRITE | CORE_HEALTH | Insights become always-on Financial Health, not a flagged side experiment. |
| `ft-health` | Health scoring surface behind feature flag.… | MERGE | WITH_INSIGHTS | Health score is the north-star metric surface; unify with insights. |

## Kill / merge summary

- **Kill as primary IA:** standalone Categories, Decision Tools route, Health-as-flag-only.
- **De-scope from core path:** deep Assets/crypto.
- **Elevate:** Inbox (from jar review), Debt, Recurring predictions, Financial Health.
- **Preserve intent:** real ledger, jars allocation, household partnership, savings/EMI rituals.
