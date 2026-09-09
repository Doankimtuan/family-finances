# Screen UX Opportunity Map

Phase 1 — opportunities only. **Do not redesign these screens in this phase.**

Primary/secondary references follow `.agents/design-system.md` §13 unless a competitive finding forbids a pattern.

Priority: **P0** fundamental / **P1** workflow / **P2** polish.

---

## 1. Welcome / Auth

```text
Current UX goal: Clear entry; Create account primary, Log in secondary; value-first Welcome.
Primary competitive reference: Existing ViNha S1 recipe
Secondary competitive reference: Copilot polish (hierarchy, not dark canvas)
Strongest reference pattern: Monzo conversational auth steps (Analyst); one primary per state
Current ViNha opportunity: Already strong. Ensure social-first order and compact AuthScreenShell stay the north star in later polish.
Potential UX improvement: Quieter error copy; no marketing carousel relapse.
Risk / contract conflict: Copilot midnight Welcome would break Calm Household Finance (D-016).
Priority: P2 (Phase 15)
```

## 2. Onboarding

```text
Current UX goal: Two steps → Home; invite later; real empty Home, no seed data.
Primary competitive reference: Existing S1
Secondary competitive reference: Monzo simplicity
Strongest reference pattern: Minimum to first value (D-012)
Current ViNha opportunity: Protect against feature-tour creep inspired by Monarch Getting Started.
Potential UX improvement: Stronger “you can invite later” reassurance; completed setup must not linger on Home (D-002).
Risk / contract conflict: Extra onboarding steps or fake populated Home.
Priority: P0 for “no leftover setup chrome”; P2 for copy (Phase 15, affects Phase 3)
```

## 3. Home

```text
Current UX goal: Household overview and next best entry points.
Primary competitive reference: Monarch
Secondary competitive reference: Copilot
Strongest reference pattern: Shared household takeaway + scan hierarchy (D-001, P0-02) — not Monarch widgets, not Copilot Free to Spend
Current ViNha opportunity: Make the first question unmistakable; surface Inbox/Plan attention as a queue preview; keep FAB; drop equal-weight modules.
Potential UX improvement: One hero; attention card that launches Inbox; capped activity; cash-flow as supporting, not competing.
Risk / contract conflict: Net worth (D-003), Advice, referral blocks (D-018), widget editor (D-002), Free to Spend hero (D-013).
Priority: P0 (Phase 3)
```

## 4. Money

```text
Current UX goal: Understand available (liquid) money and what needs managing.
Primary competitive reference: Monarch inventory
Secondary competitive reference: Existing Money recipe S3
Strongest reference pattern: Account inventory without a fake total (P0-03)
Current ViNha opportunity: Hero meaning (“accessible liquid accounts”) even clearer; module rows 1–2 signals max; attention pills for due/matured.
Potential UX improvement: Composition strip remains analytics ceiling; denser than Home, still not a dashboard.
Risk / contract conflict: Net worth / total money (D-003); charts on hub (SoT); investment valuation on the hub row.
Priority: P0 (Phase 4)
```

## 5. Accounts

```text
Current UX goal: Inventory of containers; scan on Money hub; detail = one balance hero.
Primary competitive reference: Monarch
Secondary competitive reference: Existing S4
Strongest reference pattern: Detail identity in TopAppBar; one capture CTA (P1-04)
Current ViNha opportunity: Ownership/read-only explanation on-hero; no disabled-looking controls as the only signal.
Potential UX improvement: Activity preview not a nested transactions app.
Risk / contract conflict: Rebuilding a standalone `/money/accounts` index (hub owns the scan). Opening-balance framed as income.
Priority: P1 (Phase 6)
```

## 6. Transactions

```text
Current UX goal: Fast transaction understanding.
Primary competitive reference: Copilot
Secondary competitive reference: Monarch household meaning
Strongest reference pattern: Row anatomy + chips + review mapped to Inbox (D-015, D-014)
Current ViNha opportunity: Copilot-level scan inside TransactionRow; date grouping; preserve scroll; uncategorized attention without a second review product.
Potential UX improvement: Filter chips; quieter rails; amount column alignment.
Risk / contract conflict: Bulk select, similar-txn, review-status filter if not in domain (DEFER D-015).
Priority: P0 scan / P1 filters (Phase 5)
```

## 7. Add Transaction

```text
Current UX goal: Fast data entry (~15s) for familiar capture.
Primary competitive reference: Monzo
Secondary competitive reference: Copilot
Strongest reference pattern: Minimum common path + sticky confirm (D-009, D-010)
Current ViNha opportunity: Required-first; default today; optional category/note collapsed; keyboard never hides amount/CTA.
Potential UX improvement: Last-used account default if already safe in domain; pending label swap on save.
Risk / contract conflict: Changing validation, posting rules, or overlay type. Forcing category perfection.
Priority: P0 (Phase 5)
```

## 8. Cards

```text
Current UX goal: Liability clarity (outstanding, utilization, due).
Primary competitive reference: Monarch
Secondary competitive reference: Copilot
Strongest reference pattern: Liability-first hero (S4 credit pattern, P1-04)
Current ViNha opportunity: Treat credit as Money hub / account detail, not a competing Cards app (D-028).
Potential UX improvement: Utilization progress as evidence; Pay card as the single primary.
Risk / contract conflict: Card debt as spendable cash or income-green. Resurrecting `/money/cards` index against IA.
Priority: P1 (Phase 6)
```

## 9. Debts

```text
Current UX goal: Borrowed / owed tracking with neutral magnitudes.
Primary competitive reference: Monarch
Secondary competitive reference: Copilot
Strongest reference pattern: Current-state amounts, not auto-red
Current ViNha opportunity: Same row language as Money modules; Pay as explicit action with preview.
Potential UX improvement: Due-state treatment only when domain due exists.
Risk / contract conflict: Inventing collection-health scores.
Priority: P1 (Phase 7)
```

## 10. Loans

```text
Current UX goal: Repayment management — remaining principal + next payment.
Primary competitive reference: Monarch seriousness
Secondary competitive reference: Copilot density of facts
Strongest reference pattern: Separate principal/interest labels (S6)
Current ViNha opportunity: Schedule as divider rows, not card-per-installment; next actionable row emphasized.
Potential UX improvement: Pay preview with source account and split; archive ≠ payoff.
Risk / contract conflict: Adding disbursement/settlement the command does not support. Early payoff presented as a guaranteed quote if estimate-only.
Priority: P1 (Phase 7)
```

## 11. Savings

```text
Current UX goal: Maturity-first inventory — principal, rate, term, next decision.
Primary competitive reference: Monarch
Secondary competitive reference: Copilot
Strongest reference pattern: Next decision + labeled estimates (S7)
Current ViNha opportunity: Lifecycle badges (soon/matured) without painting all active savings as warnings.
Potential UX improvement: Settlement/rollover review that separates received vs new principal.
Risk / contract conflict: Savings as cash Pots. Recalculating interest in UI.
Priority: P1 (Phase 7)
```

## 12. Investments

```text
Current UX goal: Simple valuation overview; estimated, not cash; no advice.
Primary competitive reference: Copilot
Secondary competitive reference: Monarch
Strongest reference pattern: Estimated market value + freshness (S5, D-016 adapt craft only)
Current ViNha opportunity: Hero caption always “estimated / not cash”; PnL off-hero; allocation strip not a donut-for-decoration.
Potential UX improvement: Quiet incomplete-basis warning; closed holdings historical.
Risk / contract conflict: Advice, cash Balance, Copilot cinematic charts, hub showing a fake portfolio total.
Priority: P1 (Phase 8)
```

## 13. Plan

```text
Current UX goal: Intention overview — what money should do.
Primary competitive reference: YNAB
Secondary competitive reference: Monarch household overview composition
Strongest reference pattern: Planning questions + next work (D-020, D-023)
Current ViNha opportunity: Pulse of Hũ/Goals/Recurring/Ritual without pasting Home’s cash-flow chart.
Potential UX improvement: Underfunded/overspent as prompts; one intention hero max.
Risk / contract conflict: Ready to Assign, category grid, showing Hũ totals as bank (D-021, D-008).
Priority: P0 (Phase 9)
```

## 14. Hũ

```text
Current UX goal: Organize intention (not cash).
Primary competitive reference: Monzo (interaction)
Secondary competitive reference: YNAB (meaning)
Strongest reference pattern: Named envelope + sheet actions + real progress (P1-08)
Current ViNha opportunity: Scannable list (amount visible without opening); teaching copy preserved.
Potential UX improvement: Reallocate preview; archive confirms no money moves.
Risk / contract conflict: Hide/lock cash, spend-from-Hũ, photo-grid that hides planned amount (D-008, D-011).
Priority: P0 (Phase 10)
```

## 15. Goals

```text
Current UX goal: Save toward meaningful goals with real progress.
Primary competitive reference: YNAB
Secondary competitive reference: Monarch
Strongest reference pattern: Funded vs target + contribute confirm (P1-05, D-022)
Current ViNha opportunity: Progress is domain ratio; contribute is an explicit funding act.
Potential UX improvement: Anti-guilt copy if behind; do not invent snooze entity unless domain has it.
Risk / contract conflict: New target types (set aside vs refill) without plan support.
Priority: P1 (Phase 10)
```

## 16. Recurring

```text
Current UX goal: Recurring money clarity.
Primary competitive reference: Monzo
Secondary competitive reference: YNAB
Strongest reference pattern: Upcoming visibility of known schedules (P1-06)
Current ViNha opportunity: Scannable schedule rows; next occurrence obvious.
Potential UX improvement: Plan/Home capped upcoming preview.
Risk / contract conflict: Auto-detect review UI without detection (D-006 DEFER).
Priority: P1 (Phase 11)
```

## 17. Calendar

```text
Current UX goal: Projection readability.
Primary competitive reference: YNAB
Secondary competitive reference: Monarch recurring calendar
Strongest reference pattern: Time lens, not a dashboard of charts
Current ViNha opportunity: Month query already exists (`PLAN_MONTH_QUERY`); keep projection over density.
Potential UX improvement: Distinguish planned vs posted if domain already distinguishes them — labels only.
Risk / contract conflict: Fabricated forecast series.
Priority: P1 (Phase 11)
```

## 18. Ritual

```text
Current UX goal: Month close / decisions.
Primary competitive reference: YNAB
Secondary competitive reference: Monzo (simple steps)
Strongest reference pattern: Month-turn as a decision ritual (D-023)
Current ViNha opportunity: One obvious question per ritual state; preview-confirm on lock/approval.
Potential UX improvement: Receipt of what changed in plan vs ledger (ledger stays unchanged on lock — S9).
Risk / contract conflict: Importing YNAB reconcile-all or Auto-Assign math.
Priority: P0 (Phase 11)
```

## 19. Inbox

```text
Current UX goal: Shared attention / one decision per item.
Primary competitive reference: Monarch
Secondary competitive reference: Monzo
Strongest reference pattern: Finishable queue (P0-05, D-005)
Current ViNha opportunity: Summary-first; row is the target; no duplicate big CTA; return to queue position.
Potential UX improvement: Home banner → Inbox; empty “No decisions needed.”
Risk / contract conflict: Becoming a notification feed; owning Money/Savings mutations.
Priority: P0 (Phase 12)
```

## 20. Together

```text
Current UX goal: Shared financial visibility and household management.
Primary competitive reference: Monarch
Secondary competitive reference: Monzo (plain configuration)
Strongest reference pattern: Separate logins, shared picture, honest visibility (D-001, D-004)
Current ViNha opportunity: Identity hero; Admin/Partner as responsibility; pending invites ≠ members.
Potential UX improvement: Explicit copy that partners see permitted household money — no fake hide-account.
Risk / contract conflict: Magic-link sharing (D-017); describing Admin as ownership; implying household delete.
Priority: P1 (Phase 13)
```

## 21. Policies / Preferences / Settings

```text
Current UX goal: Simple configuration when relevant — not day-zero policy theater.
Primary competitive reference: Monzo
Secondary competitive reference: Monarch members/settings
Strongest reference pattern: Safe defaults; introduce complexity when needed (UX friction P1)
Current ViNha opportunity: Grouped management rows, not equal-weight link stacks (S11).
Potential UX improvement: Stage policies; keep sheets for high-consequence account lifecycle.
Risk / contract conflict: Early abstract policy onboarding; native selects as primary.
Priority: P1 (Phase 13, touches 15)
```

## 22. Health

```text
Current UX goal: Read-only household condition.
Primary competitive reference: Copilot charts
Secondary competitive reference: Monarch
Strongest reference pattern: Chart answers one question + source/freshness (D-029)
Current ViNha opportunity: Soften until enough facts; link to owning screens for action.
Potential UX improvement: Completeness labels; no optimization language.
Risk / contract conflict: Advice, writes, BR-24, Copilot “do this next” tone.
Priority: P1 (Phase 14)
```

---

## Priority roll-up

| Priority | Screens |
| --- | --- |
| P0 | Onboarding leftover-chrome guard, Home, Money, Transactions scan, Add Transaction, Plan, Hũ, Ritual, Inbox |
| P1 | Accounts, Cards, Debts, Loans, Savings, Investments, Goals, Recurring, Calendar, Together, Settings, Health |
| P2 | Welcome/Auth visual polish |

## UX benchmarks (design targets, not fake research metrics)

These are qualitative bars for later phases — not invented conversion numbers.

### Capture

- A returning user recognizes Add Transaction immediately (FAB, not a buried row).
- Familiar income/expense/transfer asks only what the common path needs.
- One primary Save; keyboard never covers amount or that Save.

### Scanability

Users can answer quickly:

- What changed?
- Where is the money?
- What needs attention?
- What needs planning?
- What is the one action?

### Navigation

- Where am I, what domain, how to go back, what is primary.

### Financial comprehension

Every important number answers: What is it? Why does it matter? Is it current state, movement, intention, or estimate?

### Household UX

Shared context, ownership, visibility, and action responsibility — without new permission products.
