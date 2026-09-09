# Competitive UX Intelligence

**Phase:** 1 — Research and product UX analysis only  
**Date:** 9 September 2026  
**Product:** ViNha / Family Finance  
**Status:** COMPLETE

This document answers:

> After studying the best consumer finance products in the market, what should ViNha learn, what should ViNha deliberately reject, and what should ViNha become?

It does **not** redesign screens, change contracts, or overwrite `.agents/design-system.md`.

---

## 1. Executive summary

ViNha should not become Monarch, Monzo, Copilot, or YNAB. Those products solve adjacent problems with different money models.

The useful synthesis is:

```text
ViNha = Calm Household Finance

• Monarch-level household clarity
• Monzo-level interaction simplicity
• Copilot-level visual polish
• YNAB-level planning clarity
```

while preserving ViNha’s own domain: five tabs, 440px shell, Hũ as intention (not cash), no invented Net Worth or Reports tab, Health read-only, no investment advice.

**What the four products actually do well**

| Source  | Verified strength                                                                 | Transferable principle                                      | Non-transferable concept                         |
| ------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| Monarch | Shared household operating picture, assign-for-review, account inventory          | Household context before inventory                          | Net worth, Advice widget, dashboard widget soup  |
| Monzo   | Fast common-path capture, sheets for extra context, plain-language money actions  | Minimum information on the common path                      | Pots as cash storage inside a bank account       |
| Copilot | Transaction scanability, review dots, chart-as-question, premium density          | Scan first, then disclose                                   | Dark cinematic canvas, Free to Spend as cash     |
| YNAB    | Money-has-a-job philosophy, targets, monthly ritual, progress that asks a decision | Planning is active work, not passive tracking               | Category-grid architecture, Ready to Assign math |

**Top implication for later phases**

ViNha already has the harder product contracts (reality vs intention, Inbox as attention, Together as household, confirmation by consequence). The competitive gap is **presentation and interaction quality**: first-screen question, scanability, capture speed, review finishability, and labeled financial meaning — not missing competitor features.

**Hard rejects (do not reopen in redesign)**

- Net Worth as a hub metric or Money Product
- Reports as a destination or tab
- Hũ as Monzo Pots (cash envelopes)
- YNAB category grid / Ready to Assign ledger
- Copilot midnight cinematic visual language
- Investment advice, Health mutations, new navigation tabs

**Contract tension already in ViNha artifacts**

`artifacts/information-architecture/CURRENT/future-scalability.md` lists Net Worth as a future Money Product. `.agents/design-system.md` forbids inventing Net Worth. For all redesign phases, the Design SoT wins. Net Worth remains a possible future **domain** decision, not a UX-redesign deliverable.

---

## 2. Research methodology

### 2.1 Scope

Public, current product behavior for Monarch Money, Monzo, Copilot Money, and YNAB, compared against ViNha’s existing IA, UX, and design-system contracts.

No lab accounts, no private app builds, no production-code changes.

### 2.2 Evidence classes

Every major claim is tagged:

| Tag                         | Meaning                                              |
| --------------------------- | ---------------------------------------------------- |
| **Verified**                | Official site, help center, or product announcement  |
| **Observed UI**             | Documented UI structure from official or high-quality reviews of the actual UI |
| **Community**               | Reddit / forums / long-term user reviews             |
| **Analyst**                 | Third-party 2025–2026 comparisons                    |
| **Inference**               | Our interpretation for ViNha                         |

Speculation is never presented as product fact.

### 2.3 ViNha baseline inspected before competitive work

- `.agents/design-system.md` (authoritative redesign SoT)
- `AGENTS.md` and `.agents/instructions/PROJECT.md`
- `artifacts/information-architecture/CURRENT/`
- `artifacts/ux-redesign/CURRENT/`
- `artifacts/design-system-evolution/CURRENT/`
- Screen-family recipes S1–S12
- `modules/shared-kernel/app-path.ts` (five-tab routes, capture, Money/Plan/Inbox/Together/Health)
- Shared patterns: `TransactionRow`, `JarCard`, `FinancialAccountHero`, `Sheet`, `FloatingAction`, `AppViewport`

### 2.4 Decision test used throughout

```text
Does ViNha already support the concept?
        ↓
YES → Can the competitive pattern improve the existing experience?
        ↓
YES → ADAPT

NO
↓
Would introducing the concept require a new domain capability?
↓
YES → REJECT / DOCUMENT ONLY
```

### 2.5 Limits

- We did not operate live competitor accounts. Some density, motion, and empty-state details are inferred from official help plus reviews.
- Copilot’s visual language is documented more strongly in design analyses than in help articles.
- Monzo is a bank, not a household ledger. Interaction principles transfer; cash-management concepts do not.
- Source conflicts are called out in §3 and in the decision log.

---

## 3. Source list

Prioritized 2025–2026 official and high-quality sources. Accessed September 2026.

### Official — Monarch

- [Monarch marketing site](https://www.monarch.com/) — household aggregation, collaboration at no extra cost, mark-as-reviewed, recurring detection
- [Customizing Your Dashboard](https://help.monarch.com/hc/en-us/articles/360058127551-Customizing-Your-Dashboard) — **Verified**, updated 2 Sep 2025. Widget set includes Getting started, Credit score, Budget, Net worth, Recurring, Spending trend, Transactions, Investments, Advice. Web vs mobile layouts are independent.
- [Shared Views](https://help.monarch.com/hc/en-us/articles/42228648365076-Shared-Views-in-Monarch) — **Verified**. Ownership on accounts/transactions; members still have **full visibility**; no hide-account option.
- [Tracking Recurring Expenses and Bills](https://help.monarch.com/hc/en-us/articles/4890751141908-Tracking-Recurring-Expenses-and-Bills) — **Verified**. Recurring Review flow, badge + banner, notification on new detections.
- [Reviewing Transactions](https://help.monarch.com/hc/en-us/articles/5528707082516-Reviewing-Transactions) — **Verified**. Needs-review assignment to anyone / self / household member; mobile swipe right = reviewed, swipe left = skip; dashboard orange banner “Let’s review some transactions”.
- [Getting Started with Monarch](https://help.monarch.com/hc/en-us/articles/360048393272-Getting-Started-with-Monarch) — cited via secondary knowledge bases; Cloudflare blocked a direct fetch in this session.

### Official — Monzo

- [Monzo Pots](https://monzo.com/features/pots) — **Verified**, ratings dated 10 Aug 2026. Pots are spaces **inside** a current account; Bills Pots; hide/lock; bills calendar; up to 20 Pots; Pots ≠ separate bank accounts.
- [Paying bills from Pots](https://monzo.com/help/budgeting-overdrafts-savings/web-bill-pots) — **Verified**. Scheduled payments edited inside the Pot; shortfall covered from main account.
- [Delightful Payments](https://monzo.com/blog/delightful-payments) — **Verified**, 3 Jul 2024. Unified payment flow: amount → reference → source → destination → review; bottom sheets for extra confirmation; client-driven transitions, backend for money movement.
- [Adding money](https://monzo.com/ie/help/using-monzo/help-add-money) — **Verified**. Home “Add money” as a single entry that branches by method.

### Official — Copilot

- [Dashboard Tab Overview](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview) — **Verified**, 14 Apr 2026. Free to Spend hero graph, To Review, Budgets snapshot, Upcoming recurrings, Net This Month, referral Free Months. Dashboard tab is locked as Home.
- [Transactions Tab Overview](https://help.copilot.money/en/articles/9554412-transactions-tab-overview) — **Verified**, Feb 2026 / updated Sep 2026. Search + filters; tap-to-edit date/name; split; mark recurring; iOS `+` for manual capture.
- [Transaction Dot Color Guide](https://help.copilot.money/en/articles/9834380-transaction-dot-color-guide) — **Verified**, 27 Mar 2025. Blue = needs review, gray = tip, red = split imbalance.
- [Bulk Editing Transactions](https://help.copilot.money/en/articles/7668990-bulk-editing-transactions) — **Verified**, 10 Mar 2026. Long-press multi-select on iOS; keyboard review on desktop.
- [Copilot Money for Web](https://help.copilot.money/en/articles/11780342-copilot-money-for-web) — **Verified**, Dec 2025. Web exists; filters for Account, Category, Date, Recurring, Review Status, Tag, Type.
- [Sharing Your Account with a Partner](https://help.copilot.money/en/articles/4523792-sharing-your-account-with-a-partner) — **Verified**. Magic-link grants **full control** of one account. Not household roles.

### Official — YNAB

- [Foundations: The YNAB Method](https://www.ynab.com/guide/foundations-the-ynab-method) — **Verified**, © 2026. Give every dollar a job; five planning questions; anti-guilt “spendfulness”.
- [Goal Tracking](https://www.ynab.com/features/goal-tracking) — **Verified**. Targets, color-coded progress, snooze.
- [Getting Started with Targets](https://support.ynab.com/en_us/getting-started-with-targets-ryAEP08xC) — **Verified**, 4 Sep 2026. Set aside another vs refill up to vs have a balance of; weekly/monthly/yearly/custom.
- [The Five-Minute YNAB Routine](https://www.ynab.com/blog/five-minute-budget-routine) — **Verified**. Daily / weekly / turn-of-month ritual.
- [What Is the Ideal Age of Money?](https://www.ynab.com/blog/what-is-the-ideal-age-of-money) — **Verified**, updated 8 Jul 2025. Reflect tab metric. **Not a ViNha domain concept.**

### Reviews, analysis, community (2025–2026)

- [Monarch Money Review 2026 (Senki)](https://www.senki.io/post/monarch-money-review) — household command-center framing
- [Monarch 4-year daily use review (2026)](https://marriagekidsandmoney.com/monarch-money-review/) — collaboration as the actual daily value; review-exceptions not every transaction
- Simon McCade dashboard teardown (LinkedIn, Jan 2026) — **Analyst**: no single takeaway, leftover Getting Started widget, chrome heavier than insight
- [Copilot design analysis (Blake Crosley)](https://blakecrosley.com/guides/design/copilot-money) — **Analyst**: charts as primary interface; dark canvas + semantic color
- [Copilot design system (Refero)](https://styles.refero.design/style/91b110da-902b-4d09-8bf0-26bd1f25f8b2) — **Observed UI** of marketing/system: midnight canvas, thin type, single blue CTA
- [Copilot App Store listing](https://apps.apple.com/us/app/copilot-track-budget-money/id1447330651) — Apple Design Award finalist 2024; 4.8★
- [Monarch vs Copilot vs YNAB 2026](https://financeaidaily.com/blog/monarch-vs-ynab-vs-copilot-simplifi-2026/) and [Comparison Math](https://www.comparisonmath.com/monarch-vs-copilot-vs-ynab-best-budgeting-app-2026/) — **Analyst**
- [FinCompareLab Copilot review](https://www.fincomparelab.com/reviews/copilot-money-review/) — **Analyst**: no family plan; couples pay twice
- [Monzo community: New UI for Pots](https://community.monzo.com/t/new-ui-for-pots-any-advice/149784) — **Community**: card-grid Pots hid Left-to-Pay; list view restored scanability
- [Peace of Mind Spending, Jul 2026](https://peaceofmindspending.com/my-first-day-of-the-month-routine/) — **Community**: YNAB month-turn ritual as a practiced behavior
- Banking onboarding comparison (Craft Innovations) — **Analyst**: Monzo onboarding as conversational, one-question steps

### Source conflicts (resolved)

| Claim | Conflict | Resolution |
| ----- | -------- | ---------- |
| Copilot has no web app | Several 2026 reviews vs official help Dec 2025 | **Prefer official:** web exists as of Dec 2025 |
| Copilot Family Plan ($155/yr) | Comparison Math vs official sharing article + FinCompareLab | **Prefer official:** no household roles; magic-link full control |
| Copilot is best for couples | Occasional roundups vs Monarch help + Copilot help | **Monarch is the household product; Copilot is solo-first** |

### ViNha contracts used as the comparison baseline

- `.agents/design-system.md` §§11–13, 32–34
- `artifacts/information-architecture/CURRENT/navigation-architecture.md`
- `artifacts/ux-redesign/CURRENT/ux-principles.md`, `friction-analysis.md`, `priority-matrix.md`
- `artifacts/design-system-evolution/CURRENT/product-personality.md`, `design-principles.md`

---

## 4. Monarch findings

### 4.1 What Monarch is

Monarch is a **household financial command center**: aggregate accounts, shared budget, goals, recurring, reports, and (in their model) net worth. Collaboration is included at no extra seat cost. **Verified** (monarch.com; Getting Started / Shared Views help).

### 4.2 Home / dashboard

**Verified widget set (Sep 2025 help):** Getting started, Credit score, Budget, Net worth, Recurring, Spending trend, Transactions, Investments, Advice.

**Verified behavior:** Customize reorders/hides cards. Web and mobile layouts are independent.

**Analyst (McCade 2026):** The dashboard often has **no single takeaway**. Completed Getting Started still occupies prime space. Navigation chrome can outweigh content. Activity lists without interpretation increase anxiety.

**Community (4-year household review, 2026):** Daily use is not “stare at net worth.” It is **review exceptions, confirm categories, talk with a partner**. Time-to-confidence can be under five minutes once rules exist.

```text
Evidence
→ Observation: Official dashboard is a customizable widget stack including Net worth and Advice.
→ Interpretation: Household value comes from shared picture + review, not from widget count.
→ ViNha implication: Home should answer one household question and surface Inbox/Plan attention — not import widget customization or net worth.
```

### 4.3 Household collaboration

**Verified (Shared Views):**

- Multiple members, one household budget
- Assign account/transaction ownership
- Filter “mine / theirs / shared”
- **No option to hide accounts.** Every member sees all connected accounts.

This is closer to ViNha Together than Copilot. ViNha already has Admin/Partner, ownership badges, and partner-visible confirmations. Monarch’s lesson is **shared operating picture**, not new permission complexity.

**Conflict:** ViNha must not describe Admin as financial ownership (Together recipe S11).

### 4.4 Accounts and money organization

Monarch’s strength is **one inventory of containers**: banks, cards, loans, investments, property. Users can answer “where is the money?” without opening five bank apps. **Verified** marketing + **Analyst** 2026 reviews.

ViNha Money hub already encodes this: accessible-money hero (liquid accounts only), composition strip, accounts scan, then Growing / Borrowed groups. **Do not add net worth** to complete the picture.

### 4.5 Transaction review

**Verified:** Needs-review can be assigned to a household member. Dashboard banner launches a swipe review loop. Bulk edit exists on web.

This maps cleanly onto ViNha **Inbox**, not onto a new “reviewed” flag on every Money row — unless the ledger already has that field. If it does not, **DEFER** a Copilot-style review dot rather than inventing a second review system.

### 4.6 Recurring

**Verified:** Auto-detect + Recurring Review modal + nav badge + notifications. Calendar of bills/subscriptions.

ViNha already has Plan Recurring + Calendar. Adopt the **review-of-detections** pattern only if detection already exists; otherwise keep Recurring as user-authored schedules (current contract).

### 4.7 Navigation and density

Monarch is **desktop-strong, mobile-adequate**. **Community:** weekly deep work on web, daily review on phone. That split is forbidden for ViNha: desktop remains the 440px shell.

**Inference:** Borrow Monarch’s *information architecture of household overview*, not its *wide dashboard chrome*.

### 4.8 Why Monarch can feel serious without being useful

It feels serious because it shows **the whole household in one place**. It becomes overwhelming when every widget is equal, Advice appears beside Budget, and the first screen does not answer a question.

**ViNha should learn:** household orientation, shared review, account inventory, attention banners that launch a finishable loop.  
**ViNha should reject:** net worth hero, Advice, credit-score widgets, user-built dashboard soup, desktop-first layout.

---

## 5. Monzo findings

### 5.1 What Monzo is

A UK retail bank. Pots, cards, payments, and feeds are **cash-moving banking UX**, not a household ledger. Principles transfer. Concepts often must not.

### 5.2 Pots — interaction vs domain

**Verified (Aug 2026 feature page):**

- Named, imaged “spaces” inside one account
- Hide / lock to reduce temptation
- Bills Pot pays Direct Debits by moving money into the main account first
- Bills calendar predicts repeating payments
- Pots are **not** separate accounts (two feed items when a bill pays)

**Community:** A visual Pot grid that hid “Left to Pay” increased clicks. List view restored scanability.

```text
Evidence
→ Observation: Pots are cash subdivisions of a bank balance, with personality and scheduled payouts.
→ Interpretation: Users love named envelopes they can act on in a few taps.
→ ViNha implication: ADAPT personality, list scanability, and sheet-based actions. REJECT cash-in-Hũ.
```

### 5.3 Fast capture and sheets

**Verified (Delightful Payments, 2024):** One field order for all payment types; extra context in **bottom sheets**; review before money moves; client-side transitions for speed; backend for eligibility and posting.

**Verified (Add money):** One Home CTA, then method choice — not five equal buttons.

**Inference for ViNha capture:** Amount and destination first; optional fields later; sheet for extra context; page for loan/savings wizards (already contracted).

### 5.4 Microcopy and onboarding

**Analyst (onboarding comparison):** Conversational labels (“Tell us the email you’d like to use for all things Monzo”), two clear entry choices, short steps, reassurance without legal walls of text.

Aligns with ViNha S1: two-step onboard, invite later, no tutorial slides.

### 5.5 Why Monzo feels fast

- One obvious action
- Progressive disclosure
- Sheets instead of new mental spaces
- Immediate feed feedback
- Personality without childish gamification

**Anti-pattern to watch:** Over-visual object grids that hide the one number people came to check (Left to Pay). ViNha Hũ list should stay scannable rows/cards with planned amount and progress, not a photo mosaic.

---

## 6. Copilot findings

### 6.1 What Copilot is

A premium, Apple-first money tracker. Strengths: categorization, transaction craft, charts, density. Weakness for ViNha’s job: **solo-first collaboration** (**Verified** magic-link sharing).

### 6.2 Home / Dashboard

**Verified (Apr 2026):**

1. Spending-progress graph with **Free to Spend** as the headline number
2. Ideal vs actual spend rate (dotted vs solid)
3. To Review
4. Trending budgets
5. Upcoming recurrings (horizontal)
6. Net This Month vs prior
7. Referral Free Months

Dashboard tab cannot be demoted. Recurring large bills are excluded from the spend graph so rent does not destroy the line.

**Inference:** Copilot Home answers “Can I still spend?” ViNha Home must answer “How is the household doing?” — different primary question. Do not import Free to Spend as if it were accessible cash.

### 6.3 Transactions

**Verified:**

- Blue review dots across all lists
- Search + stacked filters (account, category, date, recurring, review, tag, type)
- Bulk review / recategorize
- Detail: tap date or name to edit in place
- Similar transactions (Mac/iPad)
- Manual `+` capture

This is the strongest **scanability** reference in the set. ViNha already points Transactions at Copilot in the screen matrix.

### 6.4 Visual system

**Analyst (Crosley, Refero):** Dark quiet canvas, color reserved for data, charts as the interface, thin typography, one vivid CTA.

**Conflict with ViNha DNA:** Calm Household Finance is warm-stone, medium density, deep teal, light-first. Copilot’s cinematic dark is a **brand**, not a transferable layout.

**Transferable craft:** tabular amounts, one dominant number, semantic color only, row anatomy, chart answers one question.

### 6.5 Charts

Copilot makes the chart the hero. ViNha already limits Money hub to a composition strip and puts cash-flow on Home. **ADAPT** “chart answers one question + exclude distorting recurrings if the domain already models them.” **REJECT** chart-as-the-product and trading-terminal density.

### 6.6 Why Copilot feels premium

Restraint, hierarchy, and review ergonomics — not extra features. Users (Analyst 2026) consistently call it the best-looking finance app.

**ViNha should learn:** row craft, review indicators *if Inbox is the system of record*, filter chips, chart hygiene.  
**ViNha should reject:** Free to Spend as cash, referral widgets on Home, dark-space identity, shared-login household model.

---

## 7. YNAB findings

### 7.1 What YNAB is

An active planning method: **give every dollar a job** before spending. Not a net-worth aggregator. **Verified** 2026 method guide.

Five questions (official):

1. What does this money need to do before I’m paid again?
2. What larger, less frequent expenses do I prepare for?
3. What can I set aside for next month?
4. What goals do I prioritize?
5. What changes do I need to make?

ViNha already teaches “Give every đồng a job.” The job is to make Plan **feel like those questions**, not to clone the grid.

### 7.2 Targets, funding, progress

**Verified (Sep 2026 help):**

- Set aside another (build up)
- Refill up to (variable spend)
- Have a balance of (one-time stockpile)
- Snooze without deleting the target
- Color-coded progress; underfunded is a prompt, not a moral failure

**Community:** Month-turn ritual (reconcile, cover overspending, assign) is the product’s emotional peak.

### 7.3 Ritual vs tracker

YNAB turns finance from “what happened” into “what should this money do next.” That is exactly Plan + Ritual’s job in ViNha.

**Do not import:** Ready to Assign as a second ledger, Age of Money, credit-card payment categories as YNAB implements them, or the full category spreadsheet.

### 7.4 Copy

Official voice is anti-guilt, priority-based, flexible (“life happens, snooze the target”). This matches ViNha content rules (no shame, no optimization pressure).

### 7.5 Why YNAB converts tracking into planning

Because **funding is an action with a visible leftover question**, and the month has a ritual. Progress bars are evidence of a decision, not decoration.

---

## 8. Cross-product comparison

| Dimension              | Monarch                         | Monzo                      | Copilot                         | YNAB                            | ViNha today                                      |
| ---------------------- | ------------------------------- | -------------------------- | ------------------------------- | ------------------------------- | ------------------------------------------------ |
| Primary question       | What’s our whole picture?       | What’s in this account now? | Can I still spend?              | What should this money do?      | Home: how are we doing; Money: where is money    |
| Collaboration          | Native household, full visibility | Joint bank accounts     | Magic-link full control         | Shared subscription, method-heavy | Together Admin/Partner, ownership badges         |
| Home model             | Custom widget stack             | Balance + Pots + feed      | Spend graph + review            | Budget grid / assign            | Fixed household overview (recipe, not widgets)   |
| Money model            | Aggregated net worth + accounts | Cash in account + Pots     | Accounts + Free to Spend        | Assigned category dollars       | Ledger cash ≠ Plan intention                     |
| Attention              | Needs-review + recurring review | Feed + notifications       | To Review dots                  | Underfunded / overspent         | Inbox as attention center                        |
| Capture                | Secondary to sync               | Extremely fast banking     | Manual + exists, sync-first     | Manual-first                    | FAB capture, ~15s target                         |
| Planning               | Flexible budgets + goals        | Pots + bills calendar      | Category budgets                | Zero-based targets              | Hũ + Goals + Recurring + Ritual                  |
| Visual                 | Clean SaaS, widget-y            | Bright, friendly, coral    | Dark premium native             | Utilitarian method UI           | Calm Household Finance, 440px                    |
| Failure mode           | Dashboard overload              | Pot grid hides the number  | Solo, cinematic, Free to Spend  | Grid intimidates, ritual-heavy  | Meaning labels + capture speed still the P0 gaps |

Full area matrix: `competitive-ux-matrix.md`.

---

## 9. Best-of-four synthesis

```text
MONARCH
→ Learn: household operating picture, account inventory, assignable review,
  shared visibility without hiding money.
→ Do not learn: net worth as the headline, Advice, widget customization,
  desktop-width dashboards.

MONZO
→ Learn: one primary CTA, progressive disclosure, sheets for extra context,
  named envelopes that are easy to act on, conversational copy.
→ Do not learn: Pots as cash, hide/lock real money, bank-feed as the product.

COPILOT
→ Learn: transaction row craft, review affordances, filter chips, chart hygiene,
  medium-high scan density, one dominant number.
→ Do not learn: midnight cinematic brand, Free to Spend as cash, Home as a
  spend-pace graph, magic-link sharing.

YNAB
→ Learn: money-has-a-job questions, funding as a decision, progress as evidence,
  month ritual, anti-guilt planning copy.
→ Do not learn: category grid, Ready to Assign, Age of Money, method purity.
```

### What ViNha should become

**Emotional position:** a calm household companion. Serious about real money, gentle about ordinary variance, never a bank back office and never a tracker toy.

**Interaction philosophy:** thumb-first, required-first, consequence-proportional. Fast on groceries; ceremonial on settlement, archive, and partner-visible moves.

**Compared with the four:**

| If users want…                         | They use… | ViNha instead…                                      |
| -------------------------------------- | --------- | --------------------------------------------------- |
| All accounts + net worth + reports     | Monarch   | Household clarity without invented aggregates       |
| Instant bank actions and cash pots     | Monzo     | The same speed for capture/sheets, different money  |
| The prettiest Apple tracker            | Copilot   | The same craft on warm, bilingual, family surfaces  |
| A strict envelope operating system     | YNAB      | The philosophy on Hũ/Goals/Ritual, not the grid     |

**Target quote (already in Design DNA):**

> “Managing family money is simple and understandable.”

**Positioning statement**

ViNha is Calm Household Finance: a shared, mobile-first home for young Vietnamese families to see real money, give every đồng a job, and decide together — without dashboards, advice, or pretending estimates are cash.

---

## 10. UX patterns ViNha should ADOPT

These are already aligned with ViNha contracts. Redesign phases should treat them as non-optional quality bars.

1. **One primary question per hub** (all four, when they are at their best)
2. **One primary action per state** (Monzo; already a ViNha law)
3. **Progressive disclosure on forms** (Monzo; ViNha form-strategy)
4. **Labeled financial meaning** (ViNha design principles; Copilot/YNAB when they label Free to Spend / Available)
5. **Attention as a finishable queue** (Monarch review loop; Copilot To Review; ViNha Inbox)
6. **Household shared picture** (Monarch; ViNha Together/Home)
7. **Transaction row anatomy** (Copilot; ViNha `TransactionRow`)
8. **Confirmation before money moves** (Monzo payments review; ViNha confirmation model)
9. **Empty state with one next step** (Monzo; ViNha EmptyState)
10. **Medium density, not dashboard grid** (Copilot craft + ViNha 440px)

---

## 11. UX patterns ViNha should ADAPT

| Pattern | From | Adapt as |
| ------- | ---- | -------- |
| Widget-free but customizable importance | Monarch customize | Fixed Home recipe; **priority of sections** may follow attention, not user drag-and-drop |
| Needs-review assignment | Monarch | Inbox ownership / “who should decide” if the domain already supports actor |
| Recurring detection review | Monarch | Only if detection exists; else clearer Recurring list + Calendar |
| Pot personality (name, image, job) | Monzo | Hũ name, kind, state, planned amount — never cash lock/hide |
| Bottom sheets for extra context | Monzo | Existing `Sheet` / `ActionSheetLayout`; keep wizards as pages |
| Unified field order for similar actions | Monzo payments | Capture and pay-in flows keep a stable question order |
| Review dots / banners | Copilot / Monarch | Surface **Inbox count** and uncategorized attention; do not create a parallel review model |
| Horizontal upcoming recurrings | Copilot | Plan hub / Home preview of next Recurring, capped |
| Spend graph excluding known recurrings | Copilot | Home cash-flow already exists; do not invent Free to Spend |
| Filter chips, not desktop panels | Copilot | Transactions list (already in S8) |
| Targets: set aside vs refill | YNAB | Map onto existing Goal / Hũ plan behaviors; do not add new target types |
| Snooze without guilt | YNAB | Copy + Ritual flexibility; no new “snooze target” entity unless domain has it |
| Month ritual as a first-class moment | YNAB | Existing `/plan/ritual` — make the decision question obvious |
| In-place light edits | Copilot detail | Only where edit is already a sheet/field, not a new inline-edit platform |

---

## 12. UX patterns ViNha should REJECT

| Pattern | Why |
| ------- | --- |
| Net Worth hub / product | Explicit Design SoT + this phase. IA “future Net Worth” is not a redesign license. |
| Reports tab or reports IA | Analytics stay on Home cash-flow, Health, and existing list/detail charts. |
| Advice / credit score / referral widgets on Home | Advice forbidden; referrals are not household finance; credit score is not a domain. |
| Monzo Pots as cash | Hũ ≠ cash. Hide/lock spendable pots would lie about ledger money. |
| YNAB category grid & Ready to Assign | Different ledger. ViNha already has Hũ/Goals. |
| Age of Money | Not in domain. Do not invent a stability metric. |
| Copilot Free to Spend as accessible cash | Mixes budget leftover with money-in-account. |
| Copilot cinematic dark brand | Conflicts with Calm Household Finance. |
| Magic-link / shared-login collaboration | Together already has real membership. |
| User-customizable dashboard soup | Conflicts with one-purpose screens and anti card-soup. |
| Desktop-first multi-column finance | 440px shell is binding. |
| Chart-as-the-entire-Home | Home is household overview, not a spend-pace instrument. |
| Health recommendations to buy/sell/hold | BR-24. |
| Invented aggregates to “complete” Money | Accessible liquid total only; investments stay estimated and labeled. |

---

## 13. Anti-pattern findings

Compared with ViNha’s existing anti-pattern list (§32 of the Design SoT). New competitive evidence **reinforces** those rules; it does not replace them.

| Pattern / problem | Why it fails | Who exhibits it | Why ViNha should avoid it |
| ----------------- | ------------ | --------------- | ------------------------- |
| Dashboard overload / no takeaway | Users scan and still cannot answer “how are we?” | Monarch widgets (**Analyst** McCade 2026) | Home has a fixed recipe and one hero |
| Card soup | Nested cards compete; nothing is the story | Monarch customize; early Monzo Pot grids (**Community**) | Cards only for bounded objects |
| Too many equal metrics | Mental aggregation is dumped on the user | Monarch net worth + budget + investments + bills | One dominant number per section |
| Too many colors / candy tags | Color stops meaning money | Copilot marketing tags (**Observed UI**) | Semantic color only |
| Excessive charts | Charts without a question are decoration | Copilot-as-interface temptation (**Analyst**) | Recharts only when a question exists |
| Hidden actions | Left to Pay buried in Pot detail | Monzo Pot UI regression (**Community**) | Primary action visible; FAB for capture |
| Over-complex budgeting | Method becomes the product | YNAB grid for new users (**Analyst** 2026) | Hũ + Goals, not a spreadsheet |
| Excessive onboarding / leftover setup chrome | Completed setup still occupies Home | Monarch Getting Started widget (**Analyst**) | Two-step onboard; day-zero real empties |
| Unclear terminology | Net worth, free to spend, available disposable | All four at their worst | Canonical glossary |
| Confirmation fatigue | Users tap through irreversible actions | Any product that confirms everything | Proportional confirmation model |
| Over-dense transaction lists | Cannot identify merchant vs amount | Weak mobile Monarch (**Community**) | Copilot-like row, ViNha medium density |
| Desktop-first layouts | Phone becomes a viewport onto a dashboard | Monarch web-first habit (**Community**) | 440px shell |
| Unclear household ownership | Shared login, or “everyone sees everything” without explanation | Copilot magic link (**Verified**); Monarch cannot hide accounts (**Verified**) | Together roles + ownership badges, no fake privacy |
| Misleading aggregates | Estimates look like cash | Copilot/Monarch net worth & valuations | State-labeled amounts (already P0 in UX contract) |
| Attention mixed with growth/referral | Home sells the product to existing users | Copilot Free Months (**Verified**) | Inbox = decisions only |

---

## 14. ViNha unique UX positioning

### Emotional position

Calm, trustworthy, family-oriented, modern, premium, approachable, slightly energetic / Gen-Z, financially clear. Already specified in Design DNA and `product-personality.md`. Competitive research **does not change this**. It warns what would erase it: Monarch’s widget gravity, Copilot’s cinematic darkness, YNAB’s spreadsheet seriousness, Monzo’s cash-pot metaphor.

### Interaction philosophy

**Household-first, thumb-first, meaning-first.**

- Household context before personal inventory
- Common path in ~15 seconds
- Consequence-proportional ceremony
- Reality and intention never share a visual identity

### After using ViNha, users should say

- “I know how the household is doing.”
- “I know where the money is — and what is only a plan.”
- “Adding a purchase was obvious.”
- “We decide together without a spreadsheet.”
- “Nothing here is trying to sell me a fund.”

### Positioning (short)

**ViNha is the calm shared home for family money: real balances in Money, jobs for đồng in Plan, decisions in Inbox, people in Together — crafted with Copilot-level care and Monzo-level speed, without Monarch’s net-worth dashboard or YNAB’s grid.**

---

## 15. UX principles V2

Fourteen proposed principles live in [`vinha-ux-principles-v2.md`](./vinha-ux-principles-v2.md). They are drafts. They do not replace `artifacts/ux-redesign/CURRENT/ux-principles.md`.

Headline list:

1. Answer one household question first
2. Show meaning before complexity
3. Separate reality from intention
4. Ask for the minimum, then disclose
5. Attention is a queue, not a feed
6. Household context before personal inventory
7. Scan first, then detail
8. One hero, one primary action
9. Plan is a decision, not a tracker
10. Speed on the common path, ceremony on consequence
11. Sheets extend the screen; pages own complexity
12. Calm premium, not cinematic finance
13. Empty states invite one valid next step
14. Label the kind of money

---

## 16. Screen opportunity map summary

Full map: [`screen-ux-opportunity-map.md`](./screen-ux-opportunity-map.md).

Highest-leverage screens (P0–P1 for later phases):

| Screen | Competitive lesson | Opportunity without new domain |
| ------ | ------------------ | ------------------------------ |
| Home | Monarch household + Copilot hierarchy − widget soup | One takeaway, attention preview, no leftover onboarding |
| Money | Monarch inventory − net worth | Keep accessible-money hero; clearer module signals |
| Transactions | Copilot rows + review dots mapped to Inbox | Density, chips, return-scroll |
| Add Transaction | Monzo speed | Required-first, keyboard, ~15s |
| Plan / Hũ / Goals | YNAB questions + Monzo envelope actions | Funding/progress as decisions; Hũ ≠ cash |
| Ritual | YNAB month-turn | Obvious decision question, preview-confirm |
| Inbox | Monarch assign-review + Copilot To Review | Finishable queue, one decision |
| Together | Monarch shared view − hide-account fiction | Identity hero, responsibility not ownership |
| Investments / Health | Copilot chart craft − advice | Estimated, dated, not cash |

---

## 17. Future redesign implications

Do **not** start Phase 2 in this phase. Mapping only:

| Future phase | Competitive inputs | Adopt/adapt | Avoid | Open questions |
| ------------ | ------------------ | ----------- | ----- | -------------- |
| 2 App shell | Monzo thumb reach; Monarch 5-area IA | Compact TopAppBar, one overflow | Extra tabs, desktop chrome | Capture FAB vs header action collisions |
| 3 Home | Monarch household; Copilot hierarchy | One question, Inbox/Plan pulses | Widgets, net worth, referrals | Exact above-the-fold stack vs current Home recipe |
| 4 Money | Monarch inventory | Accessible-money meaning | Total money, charts on hub | How much attention to surface vs destination screens |
| 5 Transactions | Copilot | Row craft, chips | Desktop filters, dual review systems | Does ledger have reviewed state? If no, Inbox only |
| 6 Accounts/Cards | Monarch detail heroes | Liability-first card hero (already S4) | Card-as-cash | — |
| 7 Savings/Loans/Debts | Monarch seriousness + Monzo sheets | Maturity/due hierarchy | Fake health scores | — |
| 8 Investments | Copilot valuation craft | Estimated labels | Advice, cash-like heroes | — |
| 9 Plan | YNAB + Monarch overview | Intention pulse | Grid, Ready to Assign | — |
| 10 Hũ/Goals | Monzo interaction + YNAB progress | Named jobs, real ratios | Cash pots | Personality vs calm (photos on Hũ?) |
| 11 Recurring/Calendar/Ritual | Monzo calendar + YNAB ritual | Upcoming strip, month decisions | Auto-detect if not in domain | Detection vs manual recurring |
| 12 Inbox | Monarch/Copilot review | Queue UX | Notification feed | Member assignment if not in domain |
| 13 Together | Monarch Shared Views | Clarity of visibility | Hide accounts, shared login | How explicit to be that partners see all permitted money |
| 14 Health | Copilot charts | Read-only craft | Advice | Soften until enough facts (already contracted) |
| 15 Auth/Onboarding | Monzo conversational | Two steps, invite later | Feature tours | — |
| 16 QA | All anti-patterns | 390/440/768/1280, EN/VI, light/dark | Visual clone of any reference | — |

---

## 18. Open questions

These must not be “solved” by inventing product behavior. Later phases either use existing domain answers or **STOP**.

1. Does the ledger already have a transaction **reviewed** flag, or is Inbox the only review system?
2. Does Recurring detection exist, or only user-authored schedules?
3. What exact Home above-the-fold composition is currently implemented vs the Home visual north star?
4. Should Hũ allow user imagery (Monzo personality) or stay icon-registry only? (Icon contract currently forbids emoji/SVG persistence.)
5. How should Plan express “underfunded” without importing YNAB’s Ready to Assign math?
6. What does Together already disclose about partner visibility of personal vs household resources?
7. Is `/money/cards` a live destination or a redirect into Money hub credit accounts? (IA says removed from mental model; Design SoT still lists Cards.)
8. IA future-scalability vs Design SoT on Net Worth — product strategy question, **out of redesign scope**.

---

## 19. Final recommendations

1. Treat this package as the **decision foundation** for Phases 2–16. Do not re-litigate rejected concepts.
2. Redesign **presentation and interaction**, never domain math, APIs, or navigation architecture.
3. Prioritize P0 mechanisms: first-screen question, labeled amounts, capture speed, Inbox finishability, reality vs intention.
4. Use Copilot as the craft bar for lists and charts; Monzo for sheets and speed; Monarch for household orientation; YNAB for Plan/Ritual language.
5. Keep Calm Household Finance. If a screen could be mistaken for Monarch or Copilot at a glance, it failed the visual consistency gate.
6. Propose design-system tweaks in later phases only as documented deltas (see decision log). Do not silently edit `.agents/design-system.md` during research.
7. Next phase: **Phase 2 — App Shell / Shared Foundation**.

---

## Potential future design-system changes (do not apply now)

| Potential change | Why | Evidence | Screens | Risk | Phase |
| ---------------- | --- | -------- | ------- | ---- | ----- |
| Explicit “no dashboard customization” rule | Monarch customize conflicts with one-purpose Home | Monarch help Sep 2025; McCade 2026 | Home | Low | 2–3 |
| Clarify Cards vs Money hub credit accounts | Matrix still lists `/money/cards`; IA removed it | IA navigation vs Design SoT matrix | Cards, Money | Medium (route confusion) | 6 |
| Stronger “Inbox is the only review system” line | Prevent Copilot-dot duplication | Copilot/Monarch review vs Inbox recipe S10 | Inbox, Transactions, Home | Medium if ledger has review flags | 5, 12 |
| Note IA Net Worth as non-binding for UI | Prevent future agents from shipping net worth | IA future-scalability vs Design SoT | Money, Home | High if ignored | 4 |
| Optional Hũ personality (illustration vs icon) | Monzo Pots personality vs Hugeicons-only | Monzo Pots 2026 | Hũ | Conflicts with icon persistence rules | 10 |
