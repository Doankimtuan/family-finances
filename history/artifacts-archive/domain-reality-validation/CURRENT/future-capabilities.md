# Domain Reality Validation — Future Capabilities

## Catalog of Future Capabilities Identified Across All Domains

This catalog consolidates all future capabilities identified during domain validation. Each capability is classified by time horizon with justification for why it is future, not now.

---

## Near-Term (1-2 Years)

These capabilities should be incorporated into the product roadmap within the next 1-2 years. They address competitive gaps or user needs that will become pressing after MKP launch.

### FC-01: Category Auto-Tagging
**Domain:** Categories
**Description:** Automatic merchant-to-category mapping based on merchant name, transaction history, and user corrections. Start with rule-based matching (e.g., "Grab" → Transport), evolve to ML-based suggestions.
**Priority:** Critical
**Why Future, Not Now:** MKP can launch with manual categorization and basic merchant rules. Auto-tagging requires transaction volume to train (cold start problem) and adds non-trivial ML infrastructure. Launch with manual; add auto as transaction data accumulates.
**Dependencies:** Sufficient transaction volume for training data.

### FC-02: Card Payment Due Date Tracking
**Domain:** Cards
**Description:** Display payment due dates prominently. Add payment reminder notifications. Show minimum payment amount. Calculate interest if only minimum is paid.
**Priority:** High
**Why Future, Not Now:** Card payment management is essential for financial health but is a UX feature on top of the existing Card model. The domain model supports it — it needs UI and notification infrastructure.
**Dependencies:** Notification system.

### FC-03: Recurring Bill Calendar
**Domain:** Planning
**Description:** A calendar view of upcoming recurring bills and income events. Projected account balances based on scheduled transactions. "What will my balance be on the 15th?"
**Priority:** High
**Why Future, Not Now:** The Planning domain captures recurring patterns; the calendar is a visualization layer. MKP can show upcoming transactions in a list. Calendar view requires the recurring pattern data to be reliable, which takes time to establish.
**Dependencies:** Reliable recurring pattern detection from Planning domain.

### FC-04: Transaction Search and Filtering
**Domain:** Transactions
**Description:** Full-text search across transactions. Filter by date range, amount range, category, account, counterparty. Saved search views.
**Priority:** Medium-High
**Why Future, Not Now:** Basic transaction listing is sufficient for MKP. Search becomes important as transaction volume grows (100+ transactions). MKP users will have low transaction volumes initially.
**Dependencies:** Search indexing infrastructure.

### FC-05: Data Export (CSV, PDF)
**Domain:** Shared
**Description:** Export transactions, account statements, and plan summaries as CSV and PDF. Data portability for user trust and practical use (tax preparation, financial planning).
**Priority:** Medium
**Why Future, Not Now:** Export is important for trust but not for core MKP experience. Users need data in the app before they need to export it.
**Dependencies:** Report generation infrastructure.

### FC-06: Jar Templates
**Domain:** Budgets/Jars
**Description:** Pre-built jar templates for common household types: "Young Couple," "Family with Kids," "Empty Nesters." Templates include recommended jars, default allocations, and category mappings.
**Priority:** Medium
**Why Future, Not Now:** Jar creation is part of onboarding and can be manual initially. Templates add value after basic jar functionality is proven. Requires usage data to know what templates are most useful.
**Dependencies:** Usage data on common jar configurations.

---

## Medium-Term (2-3 Years)

These capabilities represent significant feature additions that expand ViNha's value proposition. They should be planned for but are not blocking MKP success.

### FC-07: Net Worth Tracking (F-Wealth)
**Domain:** Health (or new Wealth domain)
**Description:** Aggregate all accounts (checking, savings, investments, property, debts) into a net worth view. Historical net worth tracking. Net worth trends and projections.
**Priority:** High
**Why Future, Not Now:** Explicitly scoped as F-Wealth (Future). Investment account integration requires significant infrastructure (brokerage APIs, market data). Net worth without investments is misleading. Launch with Real Ledger + Plan; add Wealth when investment integration is ready.
**Dependencies:** Investment account integration, market data providers, asset valuation.

### FC-08: Installment Amortization and Payoff Optimization
**Domain:** Installments
**Description:** Display amortization schedules (principal vs interest over time). Debt payoff strategies: avalanche (highest interest first) vs snowball (smallest balance first). Payoff projections and "what if" scenarios.
**Priority:** Medium-High
**Why Future, Not Now:** The basic installment model (principal, term, payments) is sufficient for MKP. Payoff optimization is a power-user feature that requires accurate interest rate data and amortization schedules.
**Dependencies:** Complete interest rate data from Installment entities.

### FC-09: AI-Assisted Categorization and Insights (F-AI-Assist)
**Domain:** Categories, Health
**Description:** AI-powered transaction categorization with confidence scores. AI-generated spending insights ("Your dining spend is up 30% this month"). AI answers to natural language questions about finances. BR-14 compliance: AI explains and suggests; never manipulates.
**Priority:** Medium
**Why Future, Not Now:** Explicitly scoped as F-AI-Assist (Future). AI features require mature transaction data, well-defined safety boundaries, and user trust. Launch with deterministic rules; add AI when the data foundation and safety guardrails are proven.
**Dependencies:** ML infrastructure, AI safety framework, BR-14 enforcement mechanisms.

### FC-10: Multi-Currency Support
**Domain:** Accounts, Transactions
**Description:** Hold accounts in multiple currencies. Record transactions in their native currency. Display consolidated views in a primary currency with exchange rates.
**Priority:** Medium
**Why Future, Not Now:** MKP targets Vietnamese market (single currency). Multi-currency adds significant complexity (exchange rates, conversion timing, forex gains/losses). Needed for international expansion.
**Dependencies:** Exchange rate data providers, currency conversion infrastructure.

### FC-11: Approval Flows for Financial Decisions (F-Approvals)
**Domain:** Together
**Description:** Partner approval workflows for transactions above thresholds. Spending requests: "I want to buy X for $Y from Jar Z — approve?" Policy changes requiring partner confirmation.
**Priority:** Medium
**Why Future, Not Now:** Explicitly scoped as F-Approvals (Future). Basic Together domain covers household visibility and policies. Approval workflows add significant complexity and may create friction in trusting relationships. Validate basic Together first.
**Dependencies:** Notification system, policy engine, partner interaction patterns.

### FC-12: Subscription Detection and Management
**Domain:** Planning (or new Recurring domain)
**Description:** Automatic detection of subscription payments (Netflix, Spotify, iCloud). Subscription dashboard: what, how much, when, can I cancel? Subscription cost trends.
**Priority:** Medium
**Why Future, Not Now:** Recurring detection in Planning can identify repeating transactions. Subscription detection is a specialized application of recurring detection. Copilot and Monarch offer this; it's a competitive feature, not a domain necessity.
**Dependencies:** Recurring pattern detection reliability, merchant identification database.

### FC-13: Savings Product Diversity
**Domain:** Savings
**Description:** Support for CDs, money market accounts, treasury bonds, high-yield savings. Maturity tracking with alerts. Interest rate comparison across savings products.
**Priority:** Medium-Low
**Why Future, Not Now:** Basic savings account tracking is sufficient for MKP. Product diversity adds value for financially sophisticated users. The current Savings model (account type, term, rate, maturity) can be extended without redesign.
**Dependencies:** Product type taxonomy, maturity alert system.

---

## Long-Term (3-5 Years)

These capabilities represent major product evolution. They are aspirational and may never be implemented, but the architecture should not preclude them.

### FC-14: Cash Flow Projections (F-Wealth)
**Domain:** Planning, Accounts
**Description:** Projected account balances based on recurring income, bills, and planned spending. "What will my checking balance be in 2 weeks?" Visual cash flow timeline. Overdraft risk warnings.
**Priority:** Medium-High
**Why Future, Not Now:** Cash flow projections require reliable recurring patterns, scheduled transactions, and planning data. This data matures over time. Simplifi offers this; it's a compelling feature but depends on data quality that takes months to establish.
**Dependencies:** Reliable recurring patterns, scheduled transactions, planning rule execution.

### FC-15: Investment Tracking (F-Wealth)
**Domain:** New Wealth domain
**Description:** Investment account integration (brokerage, retirement). Holdings and performance tracking. Asset allocation visualization. Tax-advantaged account awareness (IRA, 401k equivalents).
**Priority:** Medium
**Why Future, Not Now:** Explicitly in F-Wealth scope. Investment tracking is infrastructure-heavy (brokerage APIs, market data, tax rules). The domain model must not preclude it, but building it now would delay MKP by 12+ months.
**Dependencies:** Brokerage API integrations, market data providers, asset classification.

### FC-16: Multi-Household Support (F-Multi-Household)
**Domain:** Together
**Description:** Users can belong to multiple households (e.g., shared custody, multi-generational, business partnership). Household switching. Per-household profiles and preferences.
**Priority:** Medium
**Why Future, Not Now:** Explicitly scoped as F-Multi-Household (Future). BR-12 enforces one active household in v2 Now. Multi-household adds significant complexity in data isolation, permission models, and UX. Validate single-household first.
**Dependencies:** Household isolation architecture, cross-household data boundaries.

### FC-17: Predictive Financial Health (F-Health)
**Domain:** Health
**Description:** Predictive health scenarios: "If you maintain this savings rate, you'll have X in Y months." "Based on your spending trajectory, your emergency fund will last Z months." Machine learning on household financial patterns.
**Priority:** Medium-Low
**Why Future, Not Now:** Predictive health requires extensive historical data (12+ months) and validated models. Basic health (score + narrative + simple scenarios) must prove value first. ML predictions that are wrong erode trust.
**Dependencies:** 12+ months of historical data, validated prediction models.

### FC-18: Offline Read Support (F-Offline-Read)
**Domain:** All
**Description:** Read access to cached financial data when offline. View transactions, account balances, jar allocations without connectivity. Write operations remain online-only (BR-15).
**Priority:** Low-Medium
**Why Future, Not Now:** Explicitly scoped as F-Offline-Read (Future). Offline read requires local data caching, sync conflict resolution, and storage management. BR-15 (online-only mutations) must remain enforced.
**Dependencies:** Local storage infrastructure, sync engine, conflict resolution.

### FC-19: Conversational Finance Interface
**Domain:** All
**Description:** Natural language interface for financial queries: "How much did we spend on groceries last month?" "What's our savings rate?" Voice interaction support. BR-14 compliance: conversational AI must not invent or move money.
**Priority:** Low
**Why Future, Not Now:** Conversational interfaces are emerging technology. The domain model supports structured queries; conversational layer is a UX addition. Wait for conversational AI maturity and user readiness.
**Dependencies:** NLP/LLM integration, query-to-domain-model mapping, BR-14 safety in conversational context.

### FC-20: Financial Education Integration
**Domain:** Health, All
**Description:** Contextual financial education based on user behavior. "You're carrying a credit card balance — here's how interest works." Achievement-based learning paths. Financial literacy scoring.
**Priority:** Low
**Why Future, Not Now:** Education is valuable but secondary to core financial management. Competing products don't offer this well. ViNha's behavioral methodology (Inbox, Ritual) may be more effective than explicit education.
**Dependencies:** Content library, behavior-triggered recommendation engine.

---

## Permanently Out of Scope (Reconfirmed)

These capabilities are explicitly and permanently excluded. The architecture should actively prevent them.

- **Offline Writes** — BR-15: all money mutations require connectivity. Offline writes create sync conflicts with financial data. Permanently excluded.
- **Brokerage Trading** — ViNha is not a trading platform. Viewing investment holdings (future) is acceptable; executing trades is not.
- **Tax Filing** — ViNha is not a tax preparation tool. Exporting data for tax purposes is acceptable; filing taxes is not.
- **Crypto Trading/Wallets** — ViNha tracks real financial accounts, not speculative assets. Viewing crypto holdings (if mainstream) could be future; trading never.
- **Standalone Categories IA** — Categories are tags, not a top-level navigation item. This is architectural, not scoping.
- **Standalone Decision Tools IA** — Decision tools belong in Inbox or Together context. No separate "Decisions" section.

---

## Capability Dependency Graph

```
Near-Term (1-2y)          Medium-Term (2-3y)         Long-Term (3-5y)
─────────────────         ─────────────────         ─────────────────
Auto-Tagging ───────────► AI Categorization ──────► Conversational UI
Card Due Dates            Subscription Mgmt
Bill Calendar ──────────► Cash Flow Projections
Transaction Search        Net Worth Tracking ─────► Investment Tracking
Data Export               Amortization/Payoff ────► Predictive Health
Jar Templates             Multi-Currency
                          Approval Flows ─────────► Multi-Household
                          Savings Diversity
                                                    Financial Education
                                                    Offline Read
```

---

*Future capabilities cataloged. All capabilities are validated as "not now" with clear criteria for when they become "now." The architecture must not preclude any future capability listed here, even if it is never implemented.*
