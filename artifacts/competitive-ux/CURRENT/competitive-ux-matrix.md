# Competitive UX Matrix

Phase 1 comparison. Principles only — not a feature checklist to clone.

**Legend:** Verified = official docs. Observed = documented UI. Community/Analyst = secondary. Inference = ViNha reading.

Best Principle is the **mechanism**, not the product name.

---

## Product-level

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Information architecture | Household OS: Dashboard, Accounts, Transactions, Budget, Recurring, Goals, Reports, Investments (**Verified** marketing) | Bank IA: Home, Payments, Help; Pots live on Home (**Verified**) | Dashboard locked as Home; rearrange other tabs (**Verified** Apr 2026) | Budget-first; Reflect/Accounts around the plan (**Verified** method) | Five tabs: Home, Money, Plan, Inbox, Together. Health secondary (**Contract**) | Domain-separated hubs, not one mega-dashboard | Keep five tabs. Improve *clarity of each hub’s question*, not the tab set |
| Navigation | Strong web sidebar; mobile adequate (**Community**) | Thumb-first, few destinations (**Observed**) | iOS tabs; Dashboard immovable (**Verified**) | Plan is the home (**Verified**) | Bottom nav + compact TopAppBar + 440px shell | Where am I / back / one primary action | Compact chrome; never import sidebar or extra tabs |
| Hierarchy | Often many equal widgets (**Analyst** 2026) | Balance then actions then feed | Free to Spend then review then budgets (**Verified**) | Ready to Assign then categories | One hero max, one primary action (**SoT**) | One question, one hero, one primary | Enforce on every hub; Home is the riskiest |
| Onboarding | Connect accounts first; Getting Started widget lingers (**Analyst**) | ~10 min apply; conversational steps (**Analyst**) | Connect institutions; 30-day trial (**App Store**) | Method education; 34-day trial (**Analyst**) | Two steps: household name → cash account + starter Hũ (**S1**) | Minimum to first useful Home | Keep two steps; never reintroduce tours |
| Personalization | Drag-drop dashboard; web ≠ mobile (**Verified** Sep 2025) | Pot names/images; hide/lock (**Verified**) | Tab order except Dashboard; category colors (**Verified**/Observed) | Category structure is the personalization | Fixed recipes per screen family | Personalize *objects*, not the shell | Allow named Hũ/Goals; reject Home widget editors |
| Household collaboration | Native members, Shared Views, full visibility, no hide (**Verified**) | Joint accounts (real bank sharing) (**Verified**) | Magic link = full control of one login (**Verified**) | Shared subscription; method-heavy (**Analyst**) | Together: members, invites, Admin/Partner (**S11**) | Separate identities, shared picture, explicit visibility | Strengthen Together/Home household framing; reject shared-login |
| Notification / review model | Needs-review assignable to a member; swipe loop; recurring review badge (**Verified**) | Feed + payment status | To Review + blue dots + bulk R (**Verified**) | Underfunded / overspent as the alert | Inbox is the attention center (**S10**) | Finishable queue of decisions | Home/Money may preview counts; Inbox owns the work |

---

## Home

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| First-screen hierarchy | Custom widget stack (**Verified**) | Card/balance, Add money, Pots, feed (**Analyst**/Observed) | Spend graph → To Review → budgets → upcoming → net (**Verified**) | Assign money / category grid | Household overview recipe; FAB capture (**S2**, matrix) | Answer one question above the fold | Make the takeaway unmistakable; hide completed setup |
| Primary question | What’s our whole picture? | What’s in Monzo right now? | Can I still spend this month? | What still needs a job? | How is the household doing / what needs attention (**UX principles**) | One question per product | Do not replace with Free to Spend or Net Worth |
| Hero | Often net worth or budget widget (**Verified** widget list) | Account balance + card | Free to Spend on a spend-pace chart (**Verified**) | Ready to Assign | Period + household financial hero (Home north star) | One labeled dominant number | Keep household/period meaning; never unlabeled aggregate |
| Metrics | Many optional | Left to spend / pot progress | Net vs last month; budget left | Category available | Cash flow + category analysis exist on Home; Money has its own hero | Supporting metrics quieter than hero | Reduce equal-weight KPI blocks |
| Activity | Recent transactions widget | Live feed | To Review list | Spending against categories | Previews that route to owners | Activity is a preview, not a second ledger | Cap rows; link to Transactions/Inbox |
| Insights | Advice widget (**Verified**) | Spotlights (**Community** history) | Graph interpretation via color vs ideal pace | Age of Money on Reflect | Health is secondary, read-only | Insights are factual and sourced | No advice. Health links back to owners |
| Quick actions | Not the brand; sync-first | Add money, send, Pots | `+` on Transactions more than Home | Add transaction / assign | `FloatingAction` Add Transaction on Home/Money (**S2**) | One high-frequency create always in thumb reach | Keep FAB; don’t duplicate per section |
| Progressive disclosure | Customize hides cards | Sheets for extra payment info | Tap chart/category to drill | Category detail | Hubs orient; details disclose (**page-patterns**) | Hubs ≠ details | Don’t paste detail charts onto Home |

---

## Money

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Accounts | Full aggregation inventory (**Verified**) | One (or few) bank accounts + Pots | Connected accounts list | On-budget vs tracking | Money hub scan + detail (**S3–S4**) | Inventory of containers with ownership | Keep scan cap + show-all; identity in TopAppBar on detail |
| Balances | Mixed with net worth | Cash is the product | Account balances + net worth (**Analyst**) | Working balance ≠ category available | Accessible liquid total only; no total money (**S3**) | Label which balance is spendable | Never complete the hub with net worth |
| Cards | Credit accounts in the inventory | Flex / physical card UX | Credit utilization in tracking | Credit as categories | Credit structurally separate; liability-first hero (**S4**) | Outstanding ≠ cash | Keep utilization/due semantics |
| Debt | Tracked as accounts | Overdraft / borrowing products | Tracked | Payoff via categories | Debts module (**catalog**) | Neutral current-state amounts | Never auto-red debt |
| Loans | Liability accounts | Bank products | Tracking | Loan pairing in YNAB (help) | Remaining principal hero + schedule (**S6**) | Next payment + remaining principal | Keep principal/interest separate labels |
| Savings | Goals + accounts | Savings Pots with interest (**Verified**) | Goals + accounts | Categories as savings | Maturity-first savings (**S7**) | Term, rate, next decision | Don’t present as generic deposit CRUD |
| Investments | Performance widgets (**Verified**) | Not the job | Strong valuation UI (**Analyst**) | Generally out of scope | Estimated market value, not Balance (**S5**) | Estimates dated and not cash | Copilot craft, Monarch not-advice |

---

## Transactions

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| List density | Can lag on huge lists (**Community**) | Feed density, banking-style | Best-in-class scan (**Analyst** 2026) | Adequate, plan-centric | `TransactionRow` medium density (**S8**) | Stable row: identity, meaning, amount | Copilot-level craft inside ViNha tokens |
| Grouping | Date / category / account filters | Date feed | Date + filters | Date / category | Date grouping already; don’t invent axes (**S8**) | Group by time for history | Keep |
| Search | Strong on web | Merchant/feed search | Type-ahead merchant + chips (**Verified**) | Search exists | Chips / filter bar, not desktop panel (**S8**) | Search + few chips | P2 polish after P0 capture |
| Filtering | Powerful, desktop-skewed | Simple | Account/Category/Date/Recurring/Review/Tag/Type (**Verified**) | Account/category | Shared chips | Mobile chips, not filter pages | Don’t add review-status filter unless domain has it |
| Transaction row | Expandable on web | Feed item | Icon, name, category, amount, review dot (**Verified** dots) | Payee + category + outflow | Icon + title + meta + tabular tone | Amount column aligned; color + label | Ensure chevron/rail don’t add noise |
| Transaction detail | Full metadata + review assignment | Receipt-like | Tap-to-edit name/date; split; similar txns (**Verified**) | Category/account | Amount dominant; account, jar, date, audit (**S8**) | Detail is meaning + allowed actions | Similar-txn is DEFER (new capability) |
| Editing | Rules + bulk | Limited (it’s a bank) | Bulk + keyboard (**Verified** 2026) | Edit is core | Edit/refund/correct routes + confirmation levels | Don’t silent-save consequential edits | Preserve overlay type |
| Categorization | Rules; one category, many tags (**Help**) | Custom categories on paid plans | AI + learning (**Analyst**) | Category is the plan | Category optional on capture; Inbox for unresolved (**S8**, mobile-interaction) | Don’t block save on perfection | Keep |
| Review | Assignable needs-review; swipe (**Verified**) | Implicit via feed | To Review + blue dots | Reconciliation | Inbox | One review system | Map banners to Inbox, don’t fork |
| Bulk operations | Edit multiple review/category (**Verified**) | Rare | First-class on iOS long-press (**Verified**) | Select/assign | Not a advertised bulk UX | Bulk only if domain supports | DEFER; don’t fake multi-select |

---

## Capture

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Add Transaction | Secondary (sync-first); exists on account (**Help**) | Add money / pay is the product | `+` on Transactions (**Verified**) | Manual-first | FAB → `/money/transactions/new` | Always reachable create | Keep global FAB |
| Amount entry | Form field | Numeric-first payments (**Verified** Delightful Payments) | Native amount | Amount-centric | `MoneyInput` / `AmountField` | Numeric keyboard; amount unobstructed | Keyboard vs CTA is P0 |
| Account selection | Required for manual | Source selector in flow | Account on manual create | Account on entry | Account(s) required | Source before optional meaning | Stable order |
| Category selection | Important for budget | Optional / paid extras | Fast recategorize | Required for the method | Optional; Inbox recovers | Don’t force perfection | Keep optional |
| Date | Editable | Immediate / scheduled | Tap to edit | Editable | Default today | Today as default | Keep |
| Note | Optional | Reference field | Name/merchant | Memo | Optional note | Optional | Keep collapsed |
| Confirmation | Light for categorize; heavier for deletes | Explicit payment review (**Verified**) | Save on detail | Assign is the confirm | Preview-if-consequential (**S8**) | Proportional | Don’t downgrade |
| Keyboard | Web-first | Mobile-native | Native | Mixed | Must not hide amount/submit (**S8**, mobile-interaction) | Sticky submit | Phase 5 verification |
| Time-to-complete | Not the metric (sync) | Seconds for pay/add | Fast recategorize; slower manual | Fast for experts, slow for learners | ~15s familiar capture (**UX principles**) | Common path < thinking about the form | Required-first |

---

## Planning

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Budgets | Flexible categories; rollover praised (**Community** 2026) | Pots + Left to Pay | Adaptive category budgets (**Verified** snapshot) | Zero-based | Hũ planned vs actual | Intention ≠ cash | Don’t show Hũ as bank |
| Hũ / Jars | Goals + categories, not jars | **Pots = cash** (**Verified**) | Goals + categories | Categories *are* the envelopes | Hũ = intention envelope (**S9**) | Named job + progress | Monzo interaction, YNAB meaning |
| Goals | Goal tracking + account linking (**Marketing**) | Savings Pots | Savings goals (**App Store**) | Targets on categories (**Verified** Sep 2026) | `GoalCard` funded vs target | Real ratio, contribute flow | Snooze copy without new entity |
| Recurring | Detection + review + calendar (**Verified**) | Bills calendar + Bills Pots (**Verified**) | Upcoming strip + Recurrings tab (**Verified**) | Scheduled transactions | Plan Recurring | Upcoming visibility | Preview on Plan/Home; no fake detection |
| Calendar | Recurring calendar | Bills calendar | Upcoming horizontal | Not the center | `/plan/calendar` projection | Projection over dashboard | Readability |
| Monthly planning | Budget period | Calendar month bills | Month-to-date graph | Month-turn ritual (**Verified** blog) | Ritual + calendar month query | Period as a decision cycle | Ritual as the YNAB lesson |
| Funding | Move between categories | Move to Pots (cash) | Less explicit | Assign / Underfunded (**Verified**) | Reallocate Hũ; contribute Goal | Funding is an explicit act | Preview remaining intention |
| Progress | Bars on budget/goals | Pot fill | Category left-to-spend | Color-coded target bars (**Verified**) | Real `Progress` only | Evidence, not decoration | No fake ratios |

---

## Household

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Members | Own logins, equal visibility (**Verified**) | Joint account holders | Same account via magic link (**Verified**) | Up to 6 on one sub (**Analyst**) | Members list, Admin/Partner (**S11**) | Separate people, shared household | Keep |
| Invitations | Settings > Members | Bank joint-account flow | Forward email link | Invite to subscription | `/together/invitations` | Pending ≠ active | Warning-toned pending surface |
| Shared visibility | Cannot hide accounts (**Verified**) | Joint = shared cash | All or nothing | Shared plan | Ownership badges; former-member read-only | Tell the truth about who sees what | Copy, not new ACL |
| Permissions | Full for members; ownership is a *view* filter | Bank legal roles | Full control if logged in | Shared edit of the plan | Admin vs ordinary member hints (**S11**) | Responsibility ≠ ownership | Don’t import hide-account |
| Notifications | Review/recurring notify (**Verified**) | Instant bank notify | Custom alerts (**App Store**) | Target / overspent | Inbox + policies | Decisions in-product | Don’t become a push-notification product |
| Continuity | One household budget | Joint account continuity | None (solo) | Shared plan survives | Solo-Admin warning; no household delete in V1 (**S11**) | Don’t imply deletion/transfer of money | Keep |

---

## Feedback

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Loading | Can feel slow at scale (**Community**) | Instant native | Native skeletons | Mixed | Skeletons mirror composition (**S26**) | Mirror loaded layout | No fake numbers |
| Empty | Getting Started as empty-ish (**Analyst**) | Inviting next action | Minimal empty | Method empty (assign something) | Compact empties + one CTA | One valid next step | Day-zero Home essentials |
| Partial | Sync gaps | Pot vs main split | Missing price / unreviewed | Unreconciled | Label freshness; never fake zero (**S3, S26**) | Stale/partial labeled | Keep |
| Error | Sync reconnect UX | Payment warnings with CoP (**Verified**) | Connection issues | Import/reconcile errors | StatusAlert + recovery | Say what failed + next action | Keep |
| Offline | Weak if sync-dependent | Cached feed-ish | Sync-dependent | Manual still works | Read-only review; block unsafe mutations | Don’t pretend you can post | Capture disabled offline (already) |
| Success | Quiet | Feed item appears | Dismiss from To Review | Available updates | Receipt when money/plan/decision changed (**UX exec**) | Receipt ≠ toast spam | Journey receipts P0 |
| Confirmation | Rules vs deletes | Payment review sheet | Save on edit | Assign is confirm | none / light / preview-confirm | Match consequence | Don’t confirm harmless edits |

---

## Visual system

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Typography | Product sans, dashboard | Friendly, bold amounts | Thin Matter + large display (**Observed** marketing/system) | Utilitarian | Geist; tabular money; hero 36px | Tabular numbers, meaning in type | Don’t copy Copilot thin-on-dark |
| Spacing | Card padding, widget gaps | Comfortable mobile | Tight-premium | Spreadsheet-adjacent | 4–48 scale; medium density | Rhythm > decoration | Tighten lists, not hubs |
| Density | Widget-medium; web dense | Medium | Highest craft density | Grid-dense | Medium daily-app | Scan without panic | Transactions denser than Home |
| Cards | Widget cards everywhere | Card as brand object | Contextual cards, not soup (**Analyst**) | Rows more than cards | Tones in `card.tsx`; no nested soup | Card = one story | Enforce |
| Borders / elevation | Soft SaaS | Flat + coral accents | Inset depth on dark (**Observed**) | Light chrome | Token elevations 0–2 | Tonal separation first | No new shadows |
| Colors | Calm + charts | Hot Coral | Semantic brights on midnight | Blue/purple method + red overspend | Deep teal + semantic money | Color = meaning | No module rainbow |
| Iconography | Standard product icons | Friendly custom | Category color language | Simple | Hugeicons via AppIcon | One family | No emoji, no second set |
| Charts | Many report charts | Sparse | Primary interface (**Analyst**) | Sparse | Home cash-flow; no hub charts on Money | One question per chart | Exclude distorting recurrings only if modeled |
| Motion | Mild | Fast sheet/pay | Native 60fps charts (**Analyst**) | Mild | `shared/motion`; HeroUI owns overlays | Feedback, not decoration | No counting digits |

---

## UX writing

| UX Area | Monarch | Monzo | Copilot | YNAB | ViNha Today | Best Principle | ViNha Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Terminology | Budget, net worth, household, needs review | Pots, Left to Pay, Add money | Free to Spend, Recurrings, To Review | Ready to Assign, targets, snooze | Account, Transaction, Jar/Hũ, ReviewItem, Ritual, Estimated value | Glossary over slang | Never ship “Free to Spend” or “Net Worth” |
| CTA language | Customize, Review, Connect | Add money, Send, Set up | Mark as reviewed | Assign, Underfunded | Short bilingual CTAs (**SoT §27**) | Verb + object, short | “Thêm tiền” not “Initialize” |
| Empty-state copy | Getting started checklists | Human, next-step | Sparse | Coaching | One next action, no guilt | Invite, don’t lecture | Day-0 essentials |
| Errors | Sync-heavy | CoP field-level (**Verified**) | Connection | Reconcile | Field errors + StatusAlert | Next action included | Keep |
| Confirmations | Review status | Payment review | Save | Cover overspending | Consequence language | What changes, is it cash | Receipts |
| Reassurance | Collaboration copy | FSCS, 24/7 | Design confidence | Anti-guilt spendfulness (**Verified**) | “Estimated, not cash”; “No decisions needed” | Calm facts | Keep YNAB anti-guilt, drop method jargon |
| Financial language | Aggregation language | Banking language | Lifestyle tracking | Planning language | Household + labeled states | Plain, bilingual | Avoid Disposable Income, Outstanding amortized liability |
