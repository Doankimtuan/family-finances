# Phase 3 — Implementation notes

**Status:** Implemented. Does not overwrite `.agents/design-system.md`.

## What this phase did

Redesign Home into the household financial command center: one question, one current-state hero, one high-frequency action, and a finishable attention preview. Competitive products were used as principle sources only.

Home’s question:

> How is our household money doing right now, and what should I pay attention to next?

## Current implementation that was kept

Inspected before changing. Left in place unless noted:

- `getHomeDashboard` read model, period math, product summaries, and Inbox/Plan counts
- Capture FAB → `APP_PATH.MONEY_ADD` / Add account when none exist
- Day-zero trio (Add account → Plan → Invite) and its destinations
- Cash-flow chart (income vs expense over the selected period) and capped spending rows
- Status lanes: offline, partial, error, retry
- Five-tab IA, 440px shell, existing routes and overlay types
- `HomeHealthChip` remains unused (Health is secondary; adding it would compete with the hero)

## Final composition (top → bottom)

1. **TopAppBar** — household name (or “Household overview”), greeting, supporting line, account/Inbox meta
2. **Status lanes** — offline always; error or partial when the read model says so
3. **Day-zero** *or* populated:
   - **Hero** — total assets (`calculateMoneyAssetOverview`: accounts + savings + valued investments)
   - **Inbox preview** — summary → reason → Inbox (not a second queue)
   - **Plan pulse** — jar count + allocation mode; labeled as intention, not cash
   - **This period** — period control, net movement, income/expense, trend chart, spending in one elevated card
   - **Also in Money** — compact savings / investments / loans / debts scan
4. **FloatingAction** — Add transaction (or Add account)

## Major UX decisions

### Hero is Total assets

The hero uses the existing `calculateMoneyAssetOverview` (accounts + savings + valued investments). That is the household’s current-state total, labeled **Total assets** / **Tổng tài sản**. Partial investment coverage stays a quiet note on the hero. Home does not invent net worth, Free to Spend, Ready to Assign, or Age of Money. Money still owns inventory and the allocation strip.

### View transactions sits on the hero

The activity path is an on-hero `HeroPillLink` to `APP_PATH.MONEY_TRANSACTIONS` — the same quiet pill Money uses. It is not a section-header action on “This period,” because the destination is the full ledger, not this period’s chart.

### Attention sits above period analytics

Inbox preview moved above cash flow so 390px above-the-fold answers: where I am, what we have, what needs a decision. Period charts no longer compete with the first question.

### Period control left the hero

Month/quarter does not change account money. The control now lives with the period story, at 44px targets, on a surface (not hero-on-hero).

### Inbox is a preview

Pending: the whole warning surface navigates to Inbox. Clear: quiet “No decisions needed.” No duplicate review actions.

### Cash-flow chart stays

It answers a real question: how income vs spending moved this period. Hidden when there is no income or spending. Sparse/zero/table fallbacks in `HomeCashFlowChart` are unchanged.

### Transaction rows were not added

Home does not currently expose a recent-transaction list on the read model. Adding `TransactionRow` would require expanding `getHomeDashboard`. Documented as a limitation; spending categories plus “View transactions” remain the activity path.

## Competitive principles applied

- **Monarch:** household takeaway first; shared attention as a queue preview; no widget soup
- **Monzo:** FAB stays the fast capture; sheets/pages of connected flows untouched
- **Copilot:** scan hierarchy (hero → preview rows → supporting chart); not cinematic dark finance
- **YNAB:** Plan remains intention (“jars are a plan for money, not cash”)

## ViNha-specific adaptations

- Hũ/Plan never look like cash
- Investment values on the Money-products scan use `estimate` kind
- Warm-stone canvas, one teal hero, semantic color only on movement
- Centered 440px shell at every viewport

## Shared components reused

`Page`, `TopAppBar`, `Card`, `Section`, `Balance`, `HeroPillLink`, `FinancialDeltaValue` / `FinancialDeltaBadge`, `FloatingAction` / `FloatingActionButton`, `EmptyState`, `Skeleton`, `StatusAlert` / `HomeStatusLane`, `MotionReveal`, `FinancialPrivacyToggle`, `AppIcon` / `IconContainer`

## New components (Home-local, not shared primitives)

| Component | Why |
| --- | --- |
| `HomeMovementStrip` | Extracted period net from the hero so movement is not a second hero |
| `HomePeriodStory` | Period control + movement + cash flow / empty |
| `HomePlanPulse` | Intention preview extracted from `page.tsx` |

## Contract safety

- Database / API / RPC / auth / validation / ledger math: unchanged
- `getHomeDashboard` shape: unchanged
- Routes and five-tab IA: unchanged
- 440px shell: unchanged
- No mock or seed data
- Extra read: existing `getHouseholdPreferences()` for household name only (parallel with dashboard)

## Known limitations / contract notes

1. **Recent transactions on Home** would need the dashboard to return transaction rows. Not invented.
2. **Health chip** is still unused; Health remains a secondary destination.
3. **Product summaries** stay as a last P2 scan so those destinations remain one tap from Home. Full inventory stays on Money.
4. **Authenticated live Home** may be blocked without a session in this environment (same as Phase 2).

## Recommended next phase

**PHASE 4 — MONEY: Financial Reality Hub**
