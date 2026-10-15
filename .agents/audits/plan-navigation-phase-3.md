# Plan Performance Phase 3 — Progressive Jar Detail Rendering

**Date:** 2026-10-11  
**Status:** Structural changes complete; runtime performance unverified.

## Previous dependency graph

```text
Session and active-membership gate
  └─ Promise.all(
       translations,
       getJar(id),
       listActiveJars(),
       getHouseholdPolicies(),
       listOpenInboxItems(),
       listJarCategories(),
       getCurrentJarBudgets()
     )
       └─ Entire Jar Detail route
            ├─ header and identity
            ├─ budget, spending, remaining and overspending
            ├─ action controls
            ├─ Inbox attention
            └─ linked categories
                 └─ JarRecentActivity had its own Suspense boundary
```

The route returned no Jar Detail content until every top-level read completed.
The selected Jar already supplied header identity, but it was serialized behind
policies, Inbox enrichment, categories, active Jar options, and the current
budget read.

## Dependency matrix

| Read                      | Consumers                                                                            | Needed for the financial hero?                                      |
| ------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `getJar(id)`              | Header name/type, selected Jar state, plan/rollover/currency, action identity        | Yes; establishes that the selected Jar is authorized and available. |
| `getCurrentJarBudgets()`  | Period, `JarBudgetMetrics`, qualifying income, reallocation amount, edit-form income | Yes; supplies all authoritative current financial values.           |
| `listJarCategories()`     | Linked-category chips and icon; edit-form category options                           | No; category presentation and edit references only.                 |
| `listActiveJars()`        | Reallocation targets, edit-form Jar options, category-create Jar options             | No; action references only.                                         |
| `getHouseholdPolicies()`  | Reallocation overspend policy                                                        | No; action behavior only.                                           |
| `listOpenInboxItems()`    | Emergency Inbox banner                                                               | No; attention only.                                                 |
| `JarRecentActivity` reads | Existing bounded recent activity section                                             | No; remains under its existing separate Suspense boundary.          |

The category-create action itself waits for active Jar options; the category
chips wait only for category data. The hero’s category icon has its own nested
boundary and uses the existing Jar icon fallback while the category read is
pending.

## New dependency graph

```text
Session and active-membership gate
  └─ translations + getJar(id)
       ├─ missing or household-mismatched Jar
       │    └─ existing unavailable state; do not start secondary reads
       └─ authorized selected Jar
            ├─ header and identity ─────────────────────────────── ready
            ├─ current-budget promise
            │    ├─ financial hero + metrics ── Suspense
            │    └─ action references ───────── Suspense
            ├─ categories ── category presentation ────────────── Suspense
            │                 └─ icon and category-create sub-boundaries
            ├─ active Jars + policies ── action references ────── Suspense
            ├─ Inbox items ── attention banner ────────────────── Suspense
            ├─ JarRecentActivity ──────────────────────────────── existing Suspense
            └─ selected-Jar lifecycle controls
```

After `getJar()` succeeds, the five existing secondary reads start together.
The same current-budget promise is shared by the financial presentation and
action controls; no second budget read was added. The UI order and existing
spacing hierarchy are preserved. Lifecycle controls remain at the bottom of
the detail flow; they use only the authorized Jar id/status and their existing
server action reauthorization, so they do not wait on unrelated option reads.

## Financial integrity

- `getJar()` remains the selected-Jar source. No Jar identity, plan, type,
  rollover, status, currency, or allocation calculation was changed.
- `getCurrentJarBudgets()` remains the sole current-budget source. The page
  passes through the existing `JarBudgetMetrics` values for budget, spending,
  remaining amount, usage, and state. It adds no balance calculation or
  client-side financial fetch.
- The period label uses the returned `periodMonth`; the existing Vietnam
  timezone formatting and current-period fallback for an unavailable budget
  are unchanged. The budget query derives the current period from the household
  timezone and verifies that the raw RPC household matches its authorized
  household.
- Rollover, signed adjustments, qualifying income, spending corrections,
  negative remaining values, and overspending state continue to come from the
  existing budget query and `JarBudgetMetrics`. The overspending regression
  test confirms a negative remaining amount is still presented as “over by”
  its absolute value. Existing budget/calculation tests pass.
- No Jar, category, policy, transaction, balance, migration, or RLS mutation
  was performed.

## Authorization and missing Jar behavior

The route still checks the user and active membership before `getJar()`. It
then fails closed if the selected Jar is absent or its `householdId` differs
from that membership. In either case, it returns the existing unavailable
state and does not start active-Jar, policy, Inbox, category, or budget reads.

The financial read uses `assertMoneyActionAllowed()`. Its session/membership
resolution and the route’s `resolveActiveMembership(user.id)` share the
request-scoped React cache; `getJar()` returns the authorized household id,
and the budget RPC parser checks its raw household id against that same
authorized context. The deterministic route test covers the explicit
household-mismatch guard. No data is exposed from secondary reads before the
selected Jar passes authorization.

Inactive, paused, and archived selected Jars retain their prior detail
behavior. Existing status checks still control which reallocation/lifecycle
actions are offered; a Jar absent from the current budget map continues to
show the existing unavailable/plan fallback presentation rather than invented
metrics.

## Action readiness

- Reallocation and edit controls render only after active Jars, policies,
  categories, and current budgets settle. These provide target Jars,
  overspend policy, category options, remaining capacity, and qualifying
  income.
- Null action-reference results retain the previous safe defaults: empty
  option arrays, the existing warning-policy fallback, and no positive
  reallocation capacity inferred from missing data. Server commands remain the
  authority for eligibility and mutations.
- Lifecycle controls require only the already-authorized selected Jar id and
  status. Their server action continues to reauthorize each mutation.
- The create-category action waits only for its active-Jar options, while
  linked-category presentation does not wait for policies or Inbox.

## Suspense and fallbacks

- Header and selected Jar identity render after the selected Jar authorization
  read, before budget or secondary references resolve.
- The financial hero and metrics wait for `getCurrentJarBudgets()`; they never
  show partial budget/spending/remaining values.
- Inbox attention, linked categories, action controls, and recent activity
  each have independent boundaries. The category icon and inline category
  action use smaller nested boundaries.
- Skeleton fallbacks reserve token-sized dimensions. `JarRecentActivity` and
  its implementation remain unchanged under the existing separate boundary.

## Request topology

Source-derived only; no hosted request trace or duration was collected.

- The route performs its existing sequential user then membership gate.
- After the selected Jar is authorized, `getCurrentJarBudgets()` is invoked
  once. Its existing implementation makes the `JAR_BUDGET_RAW_INPUTS` RPC;
  the resulting promise feeds both the financial and action boundaries.
- `listActiveJars()` remains a separate existing read because action forms need
  named target options. The budget summary exposes metrics, not that option
  list. Policies, categories, and Inbox retain their existing application
  queries and household authorization.
- `getJar()` still reads the selected Jar and household settings together.
  No SQL RPC, index, domain-query rewrite, or new remote read was introduced.
- `JarRecentActivity` retains its existing bounded event query and cursor
  behavior. Grouping, transfer completion, loan semantics, pagination, and
  amounts were not changed.

## Deterministic validation

`tests/unit/plan-jar-detail-progressive-rendering.test.tsx` uses deferred
promises to verify:

1. The authorized Jar header renders while all secondary reads are pending.
2. Financial content remains pending until the current budget resolves, then
   renders while active Jars, policies, Inbox, and categories remain pending.
3. Category presentation resolves independently of action references.
4. Reallocation/edit controls wait for every required reference and receive the
   same budget result as the financial section.
5. Missing and household-mismatched Jars start no secondary reads.
6. Null secondary results keep the Jar visible and omit unavailable metrics.

These are source and promise/component readiness tests, not proof of RSC chunk
order or browser-visible reveal time.

Validation results:

- Final post-adjustment focused run (progressive Jar Detail, reallocation reset,
  budget, calculation, and pure-read files): **29 tests passed across five
  files**.
- `npm run lint` and `npm run typecheck`: **passed after the final markup
  adjustment**.
- Prettier check for the changed implementation files and this audit, plus
  `git diff --check`: **passed**.
- `npm run build`: **passed** before the final spacing-only markup wrapper; all
  111 static pages generated.
- Full `npm run test -- --reporter=dot` before that wrapper: **264/267 files and
  1,834/1,839 tests passed**. Five failures remain in unrelated existing areas:
  English/Vietnamese savings message-key parity
  (`money.savingsPage.summaryCaption`), a Money privacy assertion expecting
  `break-words` instead of `truncate`, and three Phase 6 account presentation
  tests without `NextIntlClientProvider`.
- Full `npm run format:check` reports 192 files outside this task's changed-file
  set; the changed files pass their targeted Prettier check.
- E2E fixture setup was not run because it writes records to the shared
  Supabase database.

## Runtime limitation

The security gate from the Phase 0–2 audits remains in force: the previously
exposed E2E password is not confirmed rotated, and no safe authenticated test
account has been established. No credentials were entered and no login was
attempted. A local browser probe unexpectedly rendered an existing authenticated
application shell for an intentionally invalid Jar id; inspection stopped at
the not-found state, the browser tab was closed, and no Jar record, financial
metrics, or action was accessed. That malformed-id probe is not performance or
screen evidence.

No authenticated Brave viewport checks at 390/440/768/1280px, theme/focus
checks, RSC chunk inspection, or baseline/after timing trace were collected.
The changed Jar screen therefore has no browser-visible first-content
measurement, and no runtime performance improvement is claimed.

**PLAN PHASE 3 STRUCTURALLY COMPLETE — RUNTIME PERFORMANCE UNVERIFIED**
