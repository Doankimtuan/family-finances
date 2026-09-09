# Competitive Decision Log

Durable decisions from Phase 1. Later agents must not re-research these without new evidence.

Decision values: **ADOPT** | **ADAPT** | **REJECT** | **DEFER**

---

### D-001

```text
ID: D-001
Reference: Monarch
Pattern: Household command center / shared operating picture
Insight: The durable value is a shared picture and exception review, not widget count or net worth.
ViNha applicability: ADAPT Home + Together household framing
Decision: ADAPT
Reason: Aligns with five-tab household-first IA. Does not require new domain objects.
Contract impact: None if we do not add net worth, reports, or hide-account ACL.
Future phase: 3 Home, 13 Together
```

### D-002

```text
ID: D-002
Reference: Monarch
Pattern: Customizable dashboard widgets (including Net worth, Advice, Credit score, Getting started)
Insight: Official widget set (help, 2 Sep 2025) optimizes for coverage, not a takeaway. Analyst teardown (McCade 2026) shows leftover Getting Started and no first answer.
ViNha applicability: Do not build a widget editor. Do not place Advice/Credit score/Net worth on Home.
Decision: REJECT
Reason: Conflicts with one-purpose screens, anti card-soup, no advice, no invented aggregates.
Contract impact: Would violate Design SoT §§11–13, 32.
Future phase: None (do not reopen in Phase 3)
```

### D-003

```text
ID: D-003
Reference: Monarch
Pattern: Net Worth as a primary financial aggregate
Insight: Central to Monarch/Copilot tracking products. Explicitly forbidden in ViNha Design SoT. IA future-scalability.md still lists Net Worth as a future Money Product.
ViNha applicability: Not a redesign item.
Decision: REJECT (for all UI redesign phases)
Reason: Invented aggregate relative to current domain. Accessible liquid total is the Money hero ceiling.
Contract impact: Document IA vs Design SoT tension. Product strategy may revisit later as a domain project — not UX.
Future phase: Out of scope. If ever built, it is a domain capability program, not Phase 4 cosmetics.
```

### D-004

```text
ID: D-004
Reference: Monarch
Pattern: Shared Views — ownership filters; members still see all accounts
Insight: Collaboration is view-filtering, not privacy compartments. No hide-account option (Verified Shared Views).
ViNha applicability: ADAPT ownership badges and filters if they already exist; REJECT hide-account.
Decision: ADAPT (visibility honesty) / REJECT (hide accounts)
Reason: Together already models Admin/Partner. Inventing hide would be new ACL.
Contract impact: Copy must not promise privacy Monarch-style either — tell the truth about shared visibility.
Future phase: 13 Together
```

### D-005

```text
ID: D-005
Reference: Monarch
Pattern: Assignable needs-review + swipe review loop + dashboard banner
Insight: Review is a household workflow, not a personal notification.
ViNha applicability: Route banners to Inbox. Member assignment only if inbox/tenancy already supports an assignee.
Decision: ADAPT
Reason: Inbox is the attention center (S10). Do not create a second review product on Transactions.
Contract impact: STOP if implementing swipe-review requires new ledger fields.
Future phase: 3 Home, 5 Transactions, 12 Inbox
```

### D-006

```text
ID: D-006
Reference: Monarch
Pattern: Recurring auto-detect + Recurring Review modal
Insight: Automation must be confirmed; badge + banner create a queue.
ViNha applicability: Recurring + Calendar exist as user-authored planning.
Decision: DEFER (detection) / ADAPT (upcoming visibility of known recurring)
Reason: Detection is a domain capability. Upcoming preview of existing Recurring is presentation.
Contract impact: Do not fake detections.
Future phase: 11 Recurring / Calendar
```

### D-007

```text
ID: D-007
Reference: Monarch / Copilot / industry roundups
Pattern: Reports as a primary IA area
Insight: Reports are how aggregators justify subscription breadth.
ViNha applicability: No Reports tab. Charts live on Home cash-flow, Health, and existing product charts.
Decision: REJECT
Reason: Binding Design SoT. Would be a sixth mental destination.
Contract impact: None if ignored.
Future phase: None
```

### D-008

```text
ID: D-008
Reference: Monzo
Pattern: Pots as cash subdivisions (hide/lock, Bills Pot, spend-from-pot)
Insight: Users love named envelopes they can fund in a tap. Official docs (Aug 2026): Pots are inside the current account, not separate accounts.
ViNha applicability: Hũ is intention, not cash.
Decision: REJECT (cash-pot domain) / ADAPT (named envelope interaction)
Reason: Binding Hũ ≠ Pots. Interaction speed and naming still apply.
Contract impact: Any UI that shows Hũ total as spendable cash is a defect.
Future phase: 10 Hũ / Goals
```

### D-009

```text
ID: D-009
Reference: Monzo
Pattern: Unified payment/capture field order + bottom sheets for extra confirmation
Insight: Delightful Payments (Jul 2024): same on-screen order; sheets for extra context; backend for money movement.
ViNha applicability: Capture, pay-card, contribute, reallocate.
Decision: ADAPT
Reason: Matches form-strategy and Sheet physics. Do not convert loan/savings wizards into sheets.
Contract impact: Preserve overlay type and validation.
Future phase: 2 Shell, 5 Transactions, 7–8 product actions
```

### D-010

```text
ID: D-010
Reference: Monzo
Pattern: One Add money CTA that branches by method
Insight: One entry beats five equal buttons.
ViNha applicability: FAB Add Transaction is already the canonical global create.
Decision: ADOPT
Reason: Already S2. Competitive evidence confirms it.
Contract impact: Do not bury FAB or duplicate it per section.
Future phase: 2, 3, 4, 5
```

### D-011

```text
ID: D-011
Reference: Monzo community
Pattern: Visual Pot grid that hid Left to Pay
Insight: Personality grids can increase clicks to the number people came for.
ViNha applicability: Hũ list must remain scannable (planned amount + progress).
Decision: REJECT (photo mosaic as the only list) / ADAPT (optional personality that doesn’t hide the amount)
Reason: Aligns with anti hidden-actions and card-soup.
Contract impact: Icon registry still forbids persisted SVG/emoji.
Future phase: 10
```

### D-012

```text
ID: D-012
Reference: Monzo onboarding analyses
Pattern: Conversational, few-step onboarding; invite/joint later
Insight: Complexity after first value, not before.
ViNha applicability: Existing two-step onboard, invite later.
Decision: ADOPT
Reason: Already S1. Do not add tours.
Contract impact: None.
Future phase: 15 Auth / Onboarding
```

### D-013

```text
ID: D-013
Reference: Copilot
Pattern: Dashboard hero = Free to Spend on a spend-pace chart
Insight: Official help (14 Apr 2026) defines Free to Spend as leftover vs monthly budget, excluding expected recurrings from the line.
ViNha applicability: Home question is household condition, not “can I still spend.” Accessible money lives on Money and is ledger-based.
Decision: REJECT (as Home hero / as cash) / ADAPT (Home cash-flow may exclude distorting items only if domain already models them)
Reason: Free to Spend would invent or mislabel a budget leftover as money.
Contract impact: High if shipped as Balance.
Future phase: 3 Home — do not import the Copilot question
```

### D-014

```text
ID: D-014
Reference: Copilot
Pattern: To Review + blue dots on every list + bulk mark reviewed
Insight: Review is visually persistent and finishable (help 2025–2026).
ViNha applicability: Inbox already owns unresolved work.
Decision: ADAPT (queue + Home preview) / DEFER (ledger review flags / bulk) / REJECT (second review system)
Reason: One attention system. Bulk/dots require fields.
Contract impact: STOP if new transaction.reviewed is needed.
Future phase: 5, 12
```

### D-015

```text
ID: D-015
Reference: Copilot
Pattern: Transaction row craft, chips, tap-to-edit detail, similar transactions
Insight: Best scanability in class (Analyst 2026 + official Transactions help).
ViNha applicability: S8 already names Copilot as primary Transactions reference.
Decision: ADAPT (rows, chips, density) / DEFER (similar txns, in-place edit platform, bulk)
Reason: Presentation vs new capabilities.
Contract impact: Preserve edit/refund/correct confirmation levels.
Future phase: 5 Transactions
```

### D-016

```text
ID: D-016
Reference: Copilot
Pattern: Dark cinematic canvas, candy category tags, chart-as-primary-interface
Insight: Distinctive brand (Crosley; Refero). Apple-award craft.
ViNha applicability: Visual identity is Calm Household Finance (warm stone, deep teal, medium density).
Decision: REJECT (brand/canvas/chart-as-Home) / ADAPT (semantic color on quiet surfaces, one question per chart)
Reason: Visual consistency gate: must not look like a Copilot clone.
Contract impact: Would require a new visual language — out of scope.
Future phase: Polish only inside existing tokens
```

### D-017

```text
ID: D-017
Reference: Copilot
Pattern: Partner sharing via magic link (full control of one account)
Insight: Official help: additional devices have full control. Not household roles. Analyst 2026: no family plan.
ViNha applicability: Together already has invitations and membership.
Decision: REJECT
Reason: Shared login is worse than ViNha’s model. Do not “simplify” Together into magic links.
Contract impact: Would weaken tenancy.
Future phase: 13 — use as a negative example
```

### D-018

```text
ID: D-018
Reference: Copilot
Pattern: Referral Free Months block on Dashboard
Insight: Official dashboard includes growth/referral chrome.
ViNha applicability: Home is household overview.
Decision: REJECT
Reason: Pollutes first-screen hierarchy; not a household finance question.
Contract impact: None.
Future phase: 3
```

### D-019

```text
ID: D-019
Reference: Copilot web help (Dec 2025) vs 2026 reviews saying “no web”
Insight: Official: web exists. Reviews lag.
ViNha applicability: Methodology only.
Decision: ADOPT (prefer official dates)
Reason: Evidence quality rule.
Contract impact: None.
Future phase: Research hygiene
```

### D-020

```text
ID: D-020
Reference: YNAB
Pattern: Give every dollar a job + five planning questions
Insight: Official 2026 method. Matches ViNha teaching copy.
ViNha applicability: Plan hub, Hũ, Goals, Ritual.
Decision: ADAPT
Reason: Philosophy already owned. Make Plan *feel* like those questions.
Contract impact: None if grid/RTA not imported.
Future phase: 9–11
```

### D-021

```text
ID: D-021
Reference: YNAB
Pattern: Category grid, Ready to Assign, Auto-Assign, Age of Money
Insight: These are YNAB’s ledger UX. Age of Money is a Reflect metric (Jul 2025 blog).
ViNha applicability: Different domain (Hũ intention vs assigned cash).
Decision: REJECT
Reason: Would invent financial concepts and a second money model.
Contract impact: High.
Future phase: None
```

### D-022

```text
ID: D-022
Reference: YNAB
Pattern: Targets — set aside another / refill up to / have a balance of; snooze
Insight: Official targets help, 4 Sep 2026.
ViNha applicability: Map onto existing Goal/Hũ plan types if they already distinguish build-up vs refill; otherwise copy-only.
Decision: ADAPT (progress, anti-guilt, funding as action) / DEFER (new target-type entities)
Reason: Do not add target types the plan module does not have.
Contract impact: STOP if new plan entities are required.
Future phase: 10
```

### D-023

```text
ID: D-023
Reference: YNAB
Pattern: Month-turn ritual as a first-class practice
Insight: Official five-minute routine + community month-turn posts (2026).
ViNha applicability: `/plan/ritual` exists.
Decision: ADAPT
Reason: Ritual is the correct home. Make the decision question and preview-confirm obvious. Do not turn Ritual into YNAB reconcile-all-accounts.
Contract impact: Preserve lock/approval confirmation; ledger unchanged when plan locks (S9).
Future phase: 11 Ritual
```

### D-024

```text
ID: D-024
Reference: All four / ViNha SoT
Pattern: Desktop-width finance dashboards
Insight: Monarch users often prefer web for deep work (Community). ViNha desktop is a 440px column.
Decision: REJECT
Reason: Binding shell.
Contract impact: Any “use the extra desktop space” proposal fails.
Future phase: 2
```

### D-025

```text
ID: D-025
Reference: All four
Pattern: Invented navigation destinations (Reports, extra tabs, Dashboard customization as IA)
Insight: Competitors grow sideways. ViNha grows inside five tabs (IA future-scalability except Net Worth).
Decision: REJECT
Reason: Five tabs + Health secondary + Settings in Together.
Contract impact: Binding.
Future phase: 2
```

### D-026

```text
ID: D-026
Reference: ViNha UX contract + competitors’ unlabeled numbers
Pattern: State-labeled amounts (cash vs expected vs estimated vs due vs planned)
Insight: Highest shared failure mode across competitors is unlabeled aggregates. Already P0 in ux-redesign priority-matrix.
Decision: ADOPT
Reason: Pre-existing ViNha P0; competitive research raises severity.
Contract impact: Presentation labels only; no new calculations.
Future phase: All screens that show money
```

### D-027

```text
ID: D-027
Reference: ViNha S2 + Monzo
Pattern: Global Add Transaction FAB on Home and Money
Insight: High-frequency create must not depend on scroll or dashboard data.
Decision: ADOPT
Reason: Already canonical. Offline disables it.
Contract impact: Do not move into page flow.
Future phase: 2–5
```

### D-028

```text
ID: D-028
Reference: Design SoT vs IA screen catalog
Pattern: Cards as `/money/cards` vs credit accounts on Money hub
Insight: IA navigation-architecture.md removes `/money/cards` from the mental model. Design SoT matrix still lists Cards.
Decision: DEFER (documentation alignment) / REJECT (rebuilding a standalone cards index)
Reason: Implementation already treats accounts scan + credit as Money hub (S4). Redesign should not resurrect a competing index.
Contract impact: Route confusion for future agents.
Future phase: 6 — follow live routes in app-path / app/; update SoT later if needed
```

### D-029

```text
ID: D-029
Reference: Health BR-24 vs Copilot insights tone
Pattern: Read-only condition vs recommendations
Insight: Copilot-style “what to do next” becomes advice.
Decision: REJECT (advice) / ADAPT (chart clarity, source/freshness)
Reason: Binding.
Contract impact: Health remains no-write.
Future phase: 14
```

### D-030

```text
ID: D-030
Reference: Best-of-four synthesis
Pattern: ViNha = Calm Household Finance with four quality bars, not a mashup UI
Insight: Cloning any one product would break identity or contracts.
Decision: ADOPT (positioning)
Reason: Phase 1 objective.
Contract impact: Visual consistency gate in Design SoT §9.
Future phase: All
```

---

## Index by decision

| Decision | IDs |
| --- | --- |
| ADOPT | D-010, D-012, D-026, D-027, D-030 |
| ADAPT | D-001, D-004 (partial), D-005, D-006 (partial), D-008 (partial), D-009, D-013 (partial), D-014 (partial), D-015 (partial), D-016 (partial), D-020, D-022 (partial), D-023, D-029 (partial) |
| REJECT | D-002, D-003, D-004 (hide), D-007, D-008 (cash pots), D-011 (mosaic-only), D-013 (Free to Spend hero), D-014 (second review system), D-016 (cinematic brand), D-017, D-018, D-021, D-024, D-025, D-029 (advice) |
| DEFER | D-006 (detection), D-014 (ledger flags/bulk), D-015 (similar/bulk/in-place platform), D-022 (new target entities), D-028 (docs vs routes) |
