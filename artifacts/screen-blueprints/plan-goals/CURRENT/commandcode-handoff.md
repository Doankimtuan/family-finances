# CommandCode Handoff — Plan + Goals

Build one coherent Plan + Goals batch without reopening business decisions or rereading the repo broadly.

## Read First (only)

1. `artifacts/screen-blueprints/plan-goals/CURRENT/blueprint.md`
2. `artifacts/screen-blueprints/plan-goals/CURRENT/final-verdict.md`
3. Current files under `app/[locale]/(product)/plan/` (overview, jars, goals, ritual)
4. Application APIs already used by those screens: `modules/plan/application` (via existing imports / `client.ts`)
5. Shared patterns already calibrated: `Page`, `Section`, `BottomActionBar`, `JarCard`, `GoalCard`, `EmptyState`, `Amount`/`AmountField`, `Dialog`, `StatusAlert`

Do not read archived artifacts, legacy-v1, Money F1/F2 details beyond shared shell patterns, or unrelated domains.

## Non-Negotiable Financial Rules

From Planning + Goals money contracts (do not invent):

| Action | Effect on account balances | Ledger write | What actually changes |
|---|---|---|---|
| View plan / jars / goals / ritual | None | None | Read models only |
| Upsert jar plan (allocate) | None | None | Virtual allocation |
| Reallocate jar capacity | None | None (must stay 0) | Virtual capacity + optional Inbox emergency item |
| Month ritual preview/approve/lock/correct | None | None | Planning period status only |
| Create / update goal | None | None | Goal intention fields |
| Contribute to goal | None | None | Intention `fundedAmount` / progress |
| Pause / resume / complete / cancel goal | None | None | GoalStatus only |
| Jar pause / archive | None | None | JarState only |

If money must move in real life, send the user to Money transaction flows. Never create income/expense/transfer from Plan/Goals UI.

Copy rules:

- Planned / capacity / funded / progress = intention language, never “balance”
- Contribution = progress update, never transfer/payment/withdrawal
- Ritual lock = planning lock, never ledger lock
- Emergency reallocate = plan adapted, money unchanged

## Build Order

1. **Plan overview ready state**
   - One composition: period/intention pulse → teaching → jar preview → goals entry → ritual CTA
   - Prefer `Page` + `Section` + existing `JarCard` preview
   - Keep emergency inbox banner when present
   - Do not redesign Recurring/Calendar; keep links if already present

2. **Jar allocate + reallocate**
   - Allocate via existing `upsertJarPlanAction`
   - Reallocate via existing `reallocateJarCapacityAction`
   - On success: show short receipt — Plan changed, Real money unchanged; include amount, source jar, target jar; surface Inbox link only when `inboxItemId` returned
   - Keep overspend WARN acknowledge + emergency note behavior
   - Fail closed if action ever reports non-zero ledger impact (domain already rejects)

3. **Ritual polish (approved month review only)**
   - Preserve existing wizard gates (divergence block, emergency ack, preview → approve)
   - Preview-confirm before lock
   - Success: planning locked/reviewed; no balance change claim

4. **Goals list + create**
   - Keep `GoalCard` list + empty state
   - Create via `createGoalAction`; prefer navigate to `planGoalPath(goalId)` on success

5. **Goal detail + contribute + lifecycle**
   - Label progress as intention; contribute copy must deny transfer meaning
   - Contribute via `contributeToGoalAction` → refresh progress
   - Edit allowed fields via `updateGoalAction`
   - Complete/cancel require confirmation naming “no payment/purchase created”
   - Pause/resume without inventing Archive (GoalStatus has no archive)
   - Hide mutations for completed/cancelled

6. **States + i18n**
   - Empty, offline, locked-period, validation, permission
   - EN + VI for every new/changed string
   - Light/dark usable; 390 and 440 no critical breakage

## Implementation Notes

- Owner module: `plan`. Routes via `APP_PATH` / `planJarPath` / `planGoalPath` only.
- Constants: `modules/plan/application/plan-constants.ts` (`JarState`, `JarPlanKind`, `GoalStatus`, `PLAN_MOVEMENT_LEDGER_IMPACT`, ritual constants). No magic strings for statuses/kinds/routes.
- Prefer existing application commands; do not fork financial logic into UI.
- Create category on jars page is ledger-owned meaning; leave as-is unless it blocks jar UX — do not expand category redesign.
- Savings association is context-only and optional; do not build savings funding or product mutation here.
- Goal↔jar association is deferred — do not add.
- Promote `ConfirmDialog` / FinancialPreview only if `Dialog` + `StatusAlert` cannot express confirm/receipt cleanly.

## Exact Touch Set (expected)

```
app/[locale]/(product)/plan/page.tsx
app/[locale]/(product)/plan/jars/**
app/[locale]/(product)/plan/goals/**
app/[locale]/(product)/plan/ritual/**
app/[locale]/(product)/plan/plan-offline-banner.tsx
app/[locale]/(product)/plan/emergency-inbox-banner.tsx
messages/en/plan.json
messages/vi/plan.json
```

Do not change:

- `modules/ledger/**` write semantics
- Plan/Goal command financial guarantees (only consume them)
- Routes listed in IA for Plan
- Recurring/Calendar product behavior
- Home/Money/Inbox/Together screens except existing cross-links

## Done Means

- Plan overview, jars allocate/reallocate, ritual lock path, goals CRUD+contribute+lifecycle match blueprint
- Every Plan/Goals mutation in this batch is financial-effect **NONE**
- Browser evidence: Plan ready, allocate, reallocate (balances unchanged), goals overview/detail, create/update, contribute (balances unchanged)
- Typecheck + lint + focused Plan/Goals tests pass

## Highest-Risk Gaps To Fix

1. Goal contribute UX readable as real funding → force intention/progress language + optional confirm when completing.
2. Reallocate success silent → add plan/money-unchanged receipt.
3. Goal lifecycle via unconstrained status select → explicit pause/resume/complete/cancel with confirms for terminal actions.
4. Jar/goal amounts without not-balance labeling on detail → keep labels consistent with BR-01.
