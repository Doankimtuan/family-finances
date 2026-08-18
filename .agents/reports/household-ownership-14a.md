# Family Finance — Household Ownership & Personal/Shared Finance Contract

**Status:** Decision contract only. No production code, schema, migration, RPC, UI, or test was modified.
**Date:** 2026-08-18
**Scope:** Together foundation — canonical ownership/visibility contract across Money (accounts, transactions, categories, cards, loans/debts), Savings, Investments, Plan/Jars, Goals, Inbox, and Health.
**Predecessors:** `inbox-together-product-audit.md`, `inbox-taxonomy-13a.md`, `inbox-producer-13b.md`, `inbox-integration-13d.md`.

---

## 1. Executive summary

Family Finance today models all financial data as household-wide: every major table carries `household_id` and RLS/RPCs gate on `is_household_member(household_id)`. That equates *active membership* with *full financial visibility* and *full financial participation*. It is a correct, simple model for a fully-shared couple (Scenario A), but it cannot represent the most common real household — a partially-shared couple (Scenario B) where partners keep some personal accounts/assets/debts alongside shared finances — without structural rework.

This prompt defines the ownership and visibility contract **before** any implementation. The recommendation is deliberately small:

**Adopt a single `financial_scope` dimension — `household | personal` — owned at the resource root (Account / Savings / Investment holding / Loan / Debt / Goal / Jar set), with `owner_membership_id` recorded only for `personal` resources, and with `household` visibility implicit for everything in the household.**

No separate visibility dimension, no per-transaction ownership, no per-member ACL, no new roles, no social/permission matrices. Ownership lives at the account/resource level; transactions, cycles, holdings, payments, valuations, billing items, and funding links **inherit** it from their parent. Household Health includes everything the household can see, which — because V1 makes all personal resources `household`-visible — equals everything in the household. Personal resources are **visible to the household** but **mutable only by their owner** (with Admin override for delete-only operational cleanup).

Existing development data is reset-able, and any existing rows are interpreted as `household`-scope — the default — so migration is a backfill of the default plus a narrow set of ownership-aware policy/RPC guards that are opt-in per domain.

The current state and target contract are summarized in the matrix below; the full reasoning follows.

---

## 2. Current household scope model

**Storage model.** Every financial table carries `household_id` as a required FK. The canonical membership gate is `public.is_household_member(p_household_id)` (security definer, checks active membership against `household_members`). Tables observed:

| Table group | Tables | Scoped by |
| --- | --- | --- |
| Tenancy | `households`, `household_members`, `household_invitations`, `household_policy_events`, `household_configuration_events` | `is_household_member` |
| Ledger | `accounts`, `transactions`, `categories`, `jar_plans`, `plan_movements`, `credit_card_settings`, `card_billing_months`, `card_billing_items`, `transaction_tags`, `transaction_tag_assignments`, `liabilities`, `debt_payments`, `loans`, `loan_payments`, `loan_schedule_entries`, `loan_interest_rate_periods`, `card_payments`, `card_payment_applications`, `credit_card_installment_schedule`, `credit_card_installment_legacy_archive` | `is_household_member` |
| Savings | `savings`, `saving_cycles`, `early_withdrawals`, `saving_providers`, `saving_packages` | `is_household_member` (providers/packages: authenticated-read, active) |
| Investments | `investment_holdings`, `investment_operations`, `investment_fees`, `investment_valuations`, `investment_providers`, `investment_instruments`, `investment_accounts`, `investment_events`, `investment_lots` | `is_household_member` |
| Plan | `jars`, `jar_plans`, `goal_funding_links`, `goal_period_funded_snapshots`, `jar_period_rule_snapshots`, `jar_period_adjustments`, `month_ritual_runs`, `recurring_rules` | `is_household_member` |
| Goals | `goals`, `goal_contributions` | `is_household_member` |
| Inbox | `inbox_items` | `is_household_member` |
| Health | (read-only projection over ledger/plan/inbox) | `assertMoneyActionAllowed()` |

**RLS semantics.** Nearly every policy is:
- `select`/`insert`/`update` to `authenticated` with `using/with check (public.is_household_member(household_id))`.
- Mutations for high-integrity domains (`plan_movements`, investments v2, `inbox_items` post-gateway) are revoked from `authenticated` and exposed only via security-definer RPCs that check membership inside.

**RPC semantics.** Mutation RPCs (`record_transaction`, `create_debt`, `record_debt_payment`, `create_loan_with_schedule`, `record_loan_payment`, `settle_card_payment`, `create_saving_with_transfer`, `settle_saving_cycle`, `early_withdraw_saving`, `record_investment_*`, `contribute_to_goal`, `reallocate_jar_capacity`, `produce_inbox_item`) all resolve the caller's active household via `household_members` and then operate on objects **filtered by that household_id**. None check object-level ownership — there is no owner column to check.

**Application gate.** `assertMoneyActionAllowed()` (React cache, server-only) returns `{ userId, householdId }` for an active member; money queries and mutations use it as the fail-closed gate. `is_household_admin` exists in the DB (`20260802120000`) but is used only by Together policy/preference/role RPCs — no money domain consults it.

**Exceptions to the uniform model:**
- `investment_holdings.visibility_context` — values `household | unclear` only; it is a data-quality/import-context marker, not a privacy control. No RLS or query branch reads it to restrict anything. Confirmed in `modules/investments/application/investment-constants.ts`.
- `inbox_items.assigned_to_user_id` — an attention-routing hint (emergency declarations), not an ownership boundary; any member may resolve any household item (partner-equal, confirmed in 13D).
- `accounts.created_by`, `transactions.created_by`, `loans.created_by`, etc. — a creator audit field, not ownership. RLS never consults it.

**Bottom line:** `member ≈ full visibility ≈ full participation` is the implemented invariant, and no column currently encodes ownership, personal scope, or visibility.

---

## 3. Current domain ownership matrix

| Domain | Object | Scope today | Creator/actor | Read | Write | Delete | Ownership repr. | Visibility repr. | Source-account ownership known? | Aggregation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Money | `accounts` | household | `created_by` (audit only) | member | member | member (via update/archive) | No | No | n/a | `getRealPosition` sums opening ± deltas; Money hub groups by type |
| Money | `transactions` | household | `created_by` | member | member | member (`delete_transaction`) | No | No | via `account_id` (but account has no owner) | classify → jar budgets / monthly totals / income-expense |
| Money | `categories` | system or household | none | member (system: all auth) | member (household cats) | member | No | No | n/a | jar mapping |
| Money | `credit_card_settings`/`card_billing_months`/`card_billing_items`/`card_payments` | household | settings: none | member | member (via RPC) | member | No | No | via `card_account_id` | card utilization/outstanding |
| Debts/Loans | `liabilities` (borrowed/lent) | household | `created_by` | member | member (via RPC) | member | No | No | `origin_account_id` | remaining balances |
| Debts/Loans | `loans`, `loan_payments`, `loan_schedule_entries`, `loan_interest_rate_periods` | household | `created_by` | member | member (via RPC) | member | No | No | via `account_id` on payments | remaining principal, amortization |
| Savings | `savings`, `saving_cycles`, `early_withdrawals` | household | `created_by` | member | member (via RPC) | member | No | No | `funding_account_id`/`settlement_account_id` | maturity/interest accrual |
| Investments | `investment_holdings` | household | `created_by` | member | member (via RPC) | member | No | `visibility_context` (`household|unclear` only) | `cash_account_id` on ops | cost basis, valuations |
| Investments | `investment_operations`, `investment_fees`, `investment_valuations`, `investment_events`, `investment_lots` | household | `created_by` | member | member (via RPC) | member | No | No | via holding/`cash_account_id` | inherit holding basis |
| Plan | `jars`, `jar_plans`, `plan_movements`, `jar_period_*` | household | `executed_by_user_id` on movements | member | member (movements via RPC) | member | No | No | n/a | jar budgets, capacity |
| Goals | `goals`, `goal_contributions`, `goal_funding_links`, `goal_period_funded_snapshots`, `recurring_rules` | household | `created_by` | member | member (via RPC) | member | No | No | funding links to savings/account/holding/loan/debt | funded vs target |
| Inbox | `inbox_items` | household | `produce_inbox_item` | member | member (via RPC) | member | No (assignee only) | No | via `source_id` (weak, untyped) | dedupe_key queue |
| Health | (projection) | household | n/a | member | read-only | n/a | No | No | n/a | pulse/completeness from visible facts |

---

## 4. Real household scenarios

**Scenario A — Fully shared couple (V1 default, must stay simple).** Both incomes, shared accounts/savings/investments/debts/plan. The current model satisfies this exactly: one household, two active members, both fully see and act on everything. The target model must not regress this — hence `household` scope remains the default and the common path unchanged.

**Scenario B — Partially shared couple (the primary driver).** Partner A has personal salary + personal investment account; Partner B has personal salary + personal savings; together they have a shared checking, shared plan, shared emergency fund, shared mortgage, shared goals. The target model must represent this as: some resources carry `scope = personal` with an owner; the shared resources stay `scope = household`. Both partners continue to see everything (visibility = household for all V1 personal items), but only the owner may mutate their personal items. Plan stays household-only; personal transactions are simply marked (by inheritance) and can be excluded from household plan classification.

**Scenario C — Personal asset, household-aware.** A owns an investment account personally but includes its value in family net worth. In the recommended model: `scope = personal`, `owner_membership_id = A`. Visibility to B is `household` (B sees it in the list and in Health). Health includes it because Health includes everything visible. This collapses *ownership* (A owns), *visibility* (household sees), and *include-in-household-health* (yes, automatically) into one concept — three separate dimensions would only be needed if we wanted "personal, hidden from partner, still counted in family net worth," which is a contradiction we deliberately reject. No separate `include_in_household_health` flag in V1.

**Scenario D — Personal liability affecting household health.** A has a personal loan. Recommended V1: B sees full details (visibility = household) and it counts in Health. The alternative — "B sees total impact only" — would require a second visibility tier (`summary_only`) that adds real complexity (summary values, RLS projection, Health double-count rules) with no evidence a V1 household needs it. Flagged as a PRODUCT DECISION; the safe V1 is full visibility because the two-partner household already shares the household, and the future "hidden personal" option is preserved by adding one value later without schema redesign (see §20).

---

## 5. Ownership vs visibility analysis

The three candidate models from the prompt:

- **Model 1 — personal → visible only to owner.** This is Honeydue-style privacy. It *requires* two dimensions (owner + visibility) because "personal but visible to household" (Scenario C) must still be expressible. It also forces Health to define "hidden" semantics now.
- **Model 2 — personal → owned by one member, visible to household.** One dimension suffices: `scope = personal` implies owner records it, and the household sees it. This is what Scenario B/C actually need.
- **Model 3 — ownership + visibility as independent axes.** Full generality (owner=A, visibility=household / owner=A, visibility=owner-only / owner=A, visibility=summary), but every axis multiplies RLS predicates, UI controls, and Health semantics. No V1 workflow justifies it.

**Decision: Model 2.** For V1, *everything in the household is visible to the household*. Ownership is the only new dimension. The future "hidden personal" option is a later single-value extension of the same `visibility` concept, not a redesign. This keeps the permission contract to exactly two rules (see §8) and avoids an enterprise ACL.

The `investment_holdings.visibility_context` column is the only existing candidate for a visibility dimension. It should **not** be repurposed as a privacy control: it is a data-import marker (`household | unclear`) with no read-path usage. Keep it as-is for import provenance; the new scope model is separate.

---

## 6. Proposed canonical ownership vocabulary

Single, domain-wide vocabulary (defined once in `modules/tenancy/application/` or a shared-kernel constants file, consumed by every domain — no per-domain synonyms):

```text
financial_scope   text  -- 'household' | 'personal'   (NOT NULL, DEFAULT 'household')
owner_membership_id uuid -- references household_members.id
                         -- NULL when financial_scope = 'household'
                         -- NOT NULL when financial_scope = 'personal'
```

Terminology (used everywhere, including UI copy in en/vi):

```text
household   → "Household" / "Gia đình"
personal    → "Personal" / "Cá nhân"
owner       → the household_member who owns a personal resource
```

Why `financial_scope` + `owner_membership_id` (not `shared/personal` booleans, not `owner_user_id`):

1. **One field, one semantic.** `financial_scope` is a single enum; `is_shared boolean` would leave "personal but whose?" unanswered, and a bare `owner_user_id` would leave "household but auto-defaulted owner?" ambiguous.
2. **Membership id, not user id.** Ownership must survive an account deletion / re-login boundary and is per-household. `household_members.id` is the stable, household-scoped identity (matches existing patterns like `target_membership_id` in `household_configuration_events`). `owner_user_id` would break if a user ever joins a second household (LATER), and would need an extra join to prove membership anyway.
3. **Nullability encodes the rule.** `owner_membership_id` is NULL exactly when scope is `household`; a CHECK constraint makes illegal states unrepresentable.
4. **Future-ready without extra columns.** Children/dependents (LATER) reuse the same pair: a dependent-owned personal resource is `scope=personal, owner=<dependent membership>` — no new vocabulary. Multiple households (LATER) already keyed by `household_id`.
5. **Avoids "shared" terminology collision.** "Shared" is overloaded in UX copy; `household` scope is the unambiguous product term (a jar is "household," a personal account is "personal").

DB shape (illustrative — not executed in 14A):

```sql
-- one shared pattern, applied per resource table in 14B
scope      text NOT NULL DEFAULT 'household'
           CHECK (scope IN ('household','personal')),
owner_membership_id uuid REFERENCES public.household_members(id),
CHECK (
  (scope = 'household' AND owner_membership_id IS NULL)
  OR (scope = 'personal'  AND owner_membership_id IS NOT NULL)
)
```

---

## 7. Proposed V1 ownership model

**Canonical statement:** *Every financial resource belongs to the household. A resource may be marked `personal`, in which case exactly one active household member owns it. All resources are visible to all active household members. Only the owner (or Admin, for deletion/operational cleanup) may mutate a personal resource; any member may mutate a household resource.*

| Question | Answer |
| --- | --- |
| What is household-owned? | Everything by default: accounts, transactions, jars/plan, goals, savings, investments, loans/debts, cards, inbox items, categories |
| What can be personal? | Accounts, Savings products, Investment holdings/accounts, Loans, Debts/Liabilities, Goals (see §12), and — inherited through the parent — their transactions, cycles, payments, valuations, billing records, funding links |
| Who owns personal resources? | Exactly one `household_members.id` |
| Who can see personal resources? | All active household members (visibility = household for V1) |
| Who can edit them? | Only the owner (create transactions against a personal account, update, record payments); Admin may delete/archive for operational cleanup |
| How do transactions inherit scope? | From the account; transfers carry explicit cross-scope semantics (§10) |
| How does household Health calculate? | Everything visible = everything in the household (§14) |
| Does Plan remain household-only? | Yes (§11) |
| How do Goals behave? | Household goals now; personal goals deferred, but the schema slot exists (§12) |
| How will existing data migrate? | Backfill default `household`; dev data reset is acceptable (§19) |

**Why this model:**
- It is the **smallest model that accurately represents Scenario B/C/D**: one enum + one nullable FK on the resource root.
- It **never regresses Scenario A**: the household path (create → RLS `is_household_member` → mutate) is unchanged for `scope = household`, which is the default and the backfilled value for all existing data.
- It **matches the codebase's existing inheritance pattern**: `saving_cycles` RLS already scopes "through the parent savings → household." Ownership inheritance is the same mechanism, one level up.
- It deliberately **does not** build: per-transaction ACL, viewer/editor roles, approval chains, social/activity feeds, or a separate visibility axis.

---

## 8. Read/write permission contract

**Read rules (all domains):**
- `scope = household` → readable by any active member (`is_household_member(household_id)`).
- `scope = personal` → readable by any active member (V1 visibility = household). Owner-only-read is the reserved future value, not V1.

**Write rules (create/update/delete):**
- `scope = household` → any active member (today's partner-equal contract unchanged).
- `scope = personal` → owner only. Enforcement at two layers:
  - **RLS:** `owner_membership_id = <caller's membership id>` for update/delete.
  - **RPC:** the security-definer mutation resolves the caller's membership and rejects when `target.owner_membership_id <> caller_membership.id`, except the Admin override below.
- **Admin override (narrow):** Admin may *archive/delete* any resource (operational cleanup — removing a departed member's orphaned data) but may **not** edit transactions/balances against someone else's personal resource, and may **not** transfer ownership. This keeps Admin meaningful without making Admin a full editor. (Edge: a personal loan payment *to a household account* is a cross-scope mutation — see §10.)
- **Ownership transfer** is out of scope for 14A; a LATER prompt can add it with consent semantics.

**Explicit non-equations:**
- *Can see ≠ can edit.* Personal resources are visible to both partners but mutable by one.
- *Creator ≠ owner.* `created_by` remains an audit field; ownership is `owner_membership_id`.

**V1 minimum contract (what 14C/14D implement):**
```text
household resource:  any member may read/create/update/delete
personal resource:   any member may read
                     owner may create/update/delete (and record against)
                     Admin may archive/delete
                     nobody may transfer ownership (deferred)
```

---

## 9. Account ownership strategy

**Account is the ownership root for the Money domain.** Rationale:
- Accounts are the natural place a user *thinks* about ownership ("my salary account," "our checking").
- Transactions already point at `account_id`; inheritance is one join away and requires no per-row storage.
- The existing ledger aggregation (`getRealPosition`, Money hub, jar budgets) is account-centric; owner-scoping the root flows through every consumer unchanged.

**Inheritance map (account → children):**
| Child | Inherits from | Mechanism |
| --- | --- | --- |
| `transactions` | `account_id` | scope/owner copied at insert (denormalized, guarded) or resolved by join (preferred in RLS) |
| `credit_card_settings`, `card_billing_months`, `card_billing_items`, `card_payments` | `card_account_id`/`account_id` | parent scope |
| `debt_payments`, `loan_payments`, `saving_cycles` funding/settlement legs | the paying account + the resource | see §10 |
| `investment_operations` cash legs | `cash_account_id` | see §10 |

**Rule:** personal ownership never lives on `transactions`; it lives on `accounts`. If a personal account is deleted/archived, its children are cascade-restricted today (`on delete restrict`) — that stays correct.

**Compare vs per-transaction ownership:** carrying `owner_membership_id` on every transaction would make every insert/update/aggregation carry two extra columns, invite drift (a transfer leg, a savings leg, a loan payment, a refund — each would need consistent owner), and provide no read-path value since reads are account-joined anyway. Rejected.

**Resources that are themselves roots (not under `accounts`):** `savings` (funding/settlement accounts are references, not parents), `investment_holdings` (+ `investment_accounts`, `investment_events`, `investment_lots`), `loans`, `liabilities`, `goals`. Each of these gets `scope`/`owner_membership_id` directly in 14B. Their child rows (cycles, payments, schedule entries, rate periods, contributions, funding links, valuations, operations, fees) inherit from the parent resource — same mechanism as `saving_cycles` today.

---

## 10. Transaction inheritance model

**Default:** a transaction's scope = scope of its `account_id`. All ordinary cases fall out:

| Transaction shape | Scope source |
| --- | --- |
| Cash / account-backed income & expense | `account_id` |
| Manual transaction against a personal account | inherited personal, owner = account owner |
| Unmapped-expense / income-suggest Inbox items | inherit from the originating transaction → account |
| Debt borrowing/lending (`create_debt` money_moved) | `origin_account_id` / paying account |
| Loan payment / debt payment / card settlement | the paying account (`account_id`) |
| Investment buy/sell/income/fee cash legs | `cash_account_id` |
| Savings funding/settlement/early-withdraw legs | the movement account |

**Transfers (documented now, not implemented):** `record_owned_account_transfer` already creates two legs sharing `transfer_group_id`. With scopes, a transfer's legs can differ in scope:

```text
personal A → household   : out leg scope = personal A, in leg scope = household
household → personal A   : out leg household, in leg personal A
personal A → personal B  : out leg personal A, in leg personal B
```

Rules to define in 14D (semantics only; no code in 14A):
- Each leg inherits from **its own account** — no single "transaction owner."
- Authorization = caller may mutate **both** accounts (i.e., owner of each personal account involved, or household accounts are always writable by members). Personal→personal cross-owner transfers require **consent/acknowledgement** (B can't silently pull from A's personal account) — a LATER product decision.
- Aggregation never double-counts: the two legs still cancel via `transfer_group_id` regardless of scope.
- Inbox `produce_inbox_item` for an unmapped expense produced by a personal-account transaction keeps the item household-visible (Inbox is a household queue) but the resolve action must check the underlying transaction's ownership.

**Why inheritance beats per-transaction scope:** one source of truth (the account/resource), no drift, and the transfer case is *handled by leg-level inheritance*, which per-transaction ownership would actually make harder to reason about.

---

## 11. Plan behavior

**Decision: Plan/Jars remain household-only for V1.** Jars, `jar_plans`, `plan_movements`, `jar_period_*`, `month_ritual_runs`, and recurring rules stay `scope = household` and unchanged. Reasons:
- Plan V2 (allocation, capacity, ritual, emergency, review snapshots) is the most entangled architecture; personalizing it now would ripple through the month ritual, autolock, and jar budget snapshots.
- The real need from Scenario B is **exclusion of personal spending from household plan classification**, which the transaction model already solves: a transaction on a personal account is scope-personal; Plan consumption queries can filter `scope = household` transactions. No jar-level change required.
- "Optional inclusion" (a personal expense counted against a household jar) is a **LATER** refinement; the data (scope + jar_id) already supports it without schema change.

**Jar budget/ritual behavior:** `enforce_active_jar_on_transaction` and monthly income qualification remain household-scoped; personal income is not household qualifying income (14D adds the scope filter to the qualifying-income query).

---

## 12. Goal behavior

**Decision: Goals become the first domain to support both scopes — but household goals remain the only V1 creation path.**

- `goals` receives `scope`/`owner_membership_id` in 14B (same columns as resources). This is cheap and keeps the schema honest.
- V1 UI exposes **household goals only**; `scope = personal` is `PRODUCT DECISION REQUIRED` for whether personal goals (e.g., "Partner A's laptop") ship in V1 at all.
- Personal goals, if approved later, are: owner-only-create, household-visible, owner-only-fund via household-visible contributions (any member may contribute to a household goal; only the owner contributes to a personal goal), and **excluded from household Plan funding** (goal funding links already require same-household; scope adds same-owner).
- Goal funding links inherit scope from the goal; a personal goal cannot link to a household savings product, and vice versa, for V1 (14D guard).

---

## 13. Savings / investments / loans / cards behavior

Domain-by-domain proposal (all consistent with the account-root rule, except where the resource is itself the root):

| Domain | Household-owned? | Member-owned? | Children inherit? | Contributes to household net worth? | Other partner sees? | Other partner modifies? |
| --- | --- | --- | --- | --- | --- | --- |
| Savings (`savings`, `saving_cycles`, `early_withdrawals`) | yes (default) | yes (`scope` on `savings`) | cycles/withdrawals inherit | yes (market value = principal + accrued) | yes (household visibility) | no (owner only; Admin archive) |
| Investment holdings/accounts/events/lots | yes (default) | yes (`scope` on `investment_accounts` and/or `investment_holdings`) | operations/fees/valuations/events/lots inherit | yes (valuation value) | yes | no (owner only; Admin archive) |
| Loans (`loans`, `loan_payments`, `loan_schedule_entries`, `loan_interest_rate_periods`) | yes (default) | yes (`scope` on `loans`) | payments/schedule/rate periods inherit | yes (outstanding principal) | yes | no (owner only; Admin archive) |
| Debts/liabilities (`liabilities`, `debt_payments`) | yes (default) | yes (`scope` on `liabilities`) | payments inherit | yes (net of borrowed/lent) | yes | no (owner only; Admin archive) |
| Credit cards (`accounts type=credit_card` + `credit_card_settings`/billing) | yes (default) | yes (account root) | settings/billing inherit | yes (outstanding) | yes | no (owner only) |

**Consistency rule:** for each domain, the *resource root* carries `scope`/`owner_membership_id`; every child row carries **zero new columns** and derives scope from the parent (same pattern `saving_cycles` RLS already uses). Aggregation for Health/net-worth filters by nothing extra (V1: everything visible counts); aggregation for per-owner reporting (LATER) joins the parent.

---

## 14. Household Health / Net Worth implications

**Decision: Household Health = everything visible = everything in the household.** Because V1 visibility is household-wide, Health needs no scope filter — a personal account/loan is part of the family's net worth by definition, and the Health pulse (account count, jar count, inbox load) is unaffected by scope.

This is the honest tradeoff, stated explicitly: **in V1, the moment a partner adds a personal asset, it is visible to and counted in the household's financial picture.** If a household wants true hidden-finance, that requires the later `owner_only` visibility value, at which point Health must adopt the "all declared household-impacting items" definition — but *that* is the complexity we are explicitly deferring, and it cannot be built safely on the current model anyway.

Future options (not V1):
- `owner_only` visibility → Health uses "household + declared household-impacting personal" (adds an explicit include flag — rejected for V1, see §5).
- Per-owner Health breakdown (A's personal health vs household health) — LATER, after the ownership data exists.

---

## 15. Together responsibilities

**Together owns:** `household`, `membership`, `role` (admin|partner), `invitation`, `policy`, `preference`, and the **trust boundary** — who is allowed inside the household. It also owns the canonical vocabulary constants (`financial_scope`, `owner_membership_id`) and the shared permission gate shape, because those are household-level contracts.

**Together does NOT own:** per-domain financial ownership rules, visibility preferences, or a permission matrix. Money, Savings, Investments, Loans/Debts, Goals, and Inbox each own their `scope` semantics and their own RPC guards, consuming the shared constants. This keeps Together from becoming a giant permission service and matches the existing separation (money domains already own their RPC authorization).

**Concrete additions to Together (later prompts, not 14A):** an `owner` capability helper (`isResourceOwner(resource, membership)`) and, for 14F, the member-lifecycle hooks that personal resources need (a leaving/departed member's personal resources: block writes, surface for reassignment/archive). No new roles; `admin|partner` remains sufficient because personal-scope write authority is expressed via ownership, not role.

---

## 16. RLS impact matrix

For each major table, the future RLS classification and the current-policy risk if personal data were introduced **today**:

| Table | Future RLS class | Current policy today | If personal introduced with today's policies |
| --- | --- | --- | --- |
| `accounts` | `owner + household-visible` (write) / `household-readable` (read) | member r/w | **P0** — partner could edit/delete A's personal account |
| `transactions` | inherited through parent (`account_id`) | member r/w | **P0** — partner could mutate personal-account transactions |
| `savings` | owner + household-visible | member r/w | **P0** — partner could settle/early-withdraw A's personal saving |
| `saving_cycles`, `early_withdrawals` | inherited through parent (`savings`) | member r/w (through parent) | **P1** — parent check doesn't include owner |
| `investment_holdings`, `investment_accounts` | owner + household-visible | member select-only (r/w via RPC) | **P1** — RPCs are member-gated, not owner-gated |
| `investment_operations`, `investment_fees`, `investment_valuations`, `investment_events`, `investment_lots` | inherited through parent (holding/account) | member select-only | **P1** — RPC path member-gated |
| `loans`, `liabilities` | owner + household-visible | member r/w | **P0** — partner could record payments against A's personal loan |
| `loan_payments`, `debt_payments`, `loan_schedule_entries`, `loan_interest_rate_periods` | inherited through parent | member r/w | **P1** — parent check lacks owner |
| `credit_card_settings`, `card_billing_months`, `card_billing_items`, `card_payments` | inherited through parent (card account) | member r/w | **P0** — partner could settle A's personal card |
| `goals`, `goal_funding_links` | owner + household-visible (write) | member r/w | **P1** — partner could fund/alter A's personal goal |
| `jars`, `jar_plans`, `plan_movements`, `jar_period_*` | household-readable (unchanged) | member r/w | none (Plan stays household-only) |
| `inbox_items` | household-readable (unchanged) | member (via RPC) | none — but resolve RPC must re-check tx ownership (P1) |
| `categories`, `transaction_tags`, `transaction_tag_assignments`, `recurring_rules` | household-readable | member r/w | none (no personal categories/tags in V1) |

**Ranking summary:**
- **P0 (security — must change before any personal row can exist):** `accounts`, `transactions`, `savings`, `loans`, `liabilities`, `credit_card_*`.
- **P1 (correctness — guard via parent):** cycles, withdrawals, investment children, loan/debt payment children, goals/funding links, inbox resolve path.
- **P2 (future flexibility):** a shared helper (e.g., `can_mutate_resource(scope, owner_membership_id)`) so future domains reuse the pattern; no P2 RLS change is required for V1.

---

## 17. RPC impact matrix

Every mutation RPC below currently resolves the caller's household and operates on `household_id`-filtered rows — i.e., assumes **member → may mutate all objects in the household**. With personal data, each needs an owner guard. Classification:

| RPC | Domain | Membership check today | Owner-guard required? | Class |
| --- | --- | --- | --- | --- |
| `record_transaction` | Ledger | `household_members` → household | yes (against `account_id`) | P0 |
| `update_transaction`, `delete_transaction`, `refund_transaction`, `correct_transaction` | Ledger | membership (RPC/RLS) | yes | P0 |
| `record_owned_account_transfer` | Ledger | membership | yes (both legs) | P0 |
| `settle_card_payment` | Cards | membership | yes (card + source) | P0 |
| `create_debt`, `record_debt_payment` | Debts | membership | yes (debt + account) | P0 |
| `create_loan_with_schedule`, `record_loan_payment`, `update_loan_interest_rate`, `set_loan_status` | Loans | membership | yes (loan + account) | P0 |
| `create_saving_with_transfer`, `settle_saving_cycle`, `renew_saving_cycle`, `early_withdraw_saving`, `rollover_saving_cycle`, `record_saving_renewal_decision` | Savings | membership | yes (saving + funding/settlement account) | P0 |
| `record_investment_opening_position`, `record_investment_initial_purchase`, `record_investment_buy`, `record_investment_sell`, `record_investment_conversion`, `record_investment_income`, `record_investment_valuation` | Investments | `investment_active_household()` | yes (holding/account + cash account) | P0 |
| `contribute_to_goal`, `reassign_goal_funding_source`, `change_goal_lifecycle` | Goals | membership (via `is_household_member`) | yes when goals go personal | P1 |
| `reallocate_jar_capacity` | Plan | membership | none (household-only) | — |
| `produce_inbox_item`, `resolve_inbox_item_to_jar`, `dismiss_inbox_item`, `acknowledge_inbox_item`, `auto_resolve_inbox_item` | Inbox | membership | resolve path must re-check source-tx owner | P1 |
| `create_household_with_essentials`, `create_household_invitation`, `accept_household_invitation`, `update_household_policies`, `update_household_preferences`, `change_household_member_role` | Together | membership / admin | none (ownership lives outside) | — |

**Migration impact map (14D):** introduce one shared SQL helper `public.is_resource_owner(p_scope text, p_owner_membership_id uuid)` (or a TS `assertResourceOwner` in the application gate) and thread it through the P0 RPCs first; the P1 RPCs second. Do **not** rewrite every RPC in 14A — only the P0 set in 14D, then the P1 set in a later prompt.

---

## 18. UI impact

The smallest set of user-facing concepts (no redesign, no permission terminology):

| Surface | V1 change |
| --- | --- |
| Account creation (`AddAccountForm`) | One "Household / Personal" segmented control (default Household). Personal requires choosing which member owns it (only one active member possible to be the owner besides self in a 2-member household, so it's a two-option picker: "Me" / "Partner" when the caller is a member). |
| Transaction creation (Money capture) | No new field — scope inherited from the account. |
| Asset / loan / savings / investment / goal creation | Same single ownership control as account creation (personal = "Me"/"Partner"). |
| Money lists (Money hub, account detail, transaction list) | A subtle scope badge ("Household"/"Personal" or a person glyph) on personal accounts/rows; no filters required in V1. |
| Health | No change (everything visible counts). |
| Together | Members screen unchanged (roles remain admin|partner); no permission UI. A small "Personal items" ownership note only if a member leaves (14F). |

**Rule:** never show "scope," "owner_membership_id," or RLS language to users. The copy is "Household" / "Personal" (en) and "Gia đình" / "Cá nhân" (vi). Personal items owned by the other partner are visible but show read-only affordances (disabled edit/delete) when appropriate — driven by `ownerMembershipId === activeMembershipId` in the client view model, not by permission jargon.

---

## 19. Migration strategy

**Default interpretation:** all existing rows are `household` scope. This is safe, requires no data invention, matches Scenario A as the V1 default, and any dev data can be reset (per the prompt).

Sequencing (each step a bounded prompt, none executed in 14A):

1. **Schema (14B):** add `scope`/`owner_membership_id` columns + CHECKs to the six resource roots (`accounts`, `savings`, `investment_accounts` + `investment_holdings`, `loans`, `liabilities`, `goals`) and backfill `scope = 'household'`, `owner_membership_id = NULL`. No RLS change yet — data is inert.
2. **RLS (14C):** rewrite the P0 table policies to the target classes (read = member; write = household OR owner; Admin archive override). Keep P1 inherited-child policies aligned. `plan_movements`/`inbox_items`/`jars` untouched.
3. **RPC (14D):** thread `is_resource_owner` through the P0 mutation RPCs; add the scope filter to qualifying-monthly-income (Plan) and any Plan-consumption query; add the Inbox resolve ownership re-check (P1).
4. **Application (14E):** expose `scope`/`ownerMembershipId` in view models (accounts, money hub, goals, savings, investments, loans); add the ownership segmented control to create forms; enforce owner-only in client affordances (server still authoritative).
5. **Test (14E/14F):** ownership-unit tests per domain (create personal → partner cannot mutate → owner can; household default unchanged; transfer cross-scope legs; Health counts personal; plan excludes personal spending), plus E2E for the ownership control.
6. **Rollout:** because all new columns default `household`, deploy schema → RLS → RPCs → app → tests incrementally; nothing breaks mid-flight. Dev data may be reset at any point.

**Deliberately avoided:** one big migration that changes RLS + RPC + app simultaneously (P0 risk), and any ownership transfer/backfill of guessed owners.

---

## 20. Future compatibility

- **Children/dependents (LATER):** a dependent is another `household_members` row (role could gain `dependent` later); a dependent-owned personal resource is `scope = personal, owner = <dependent membership>` — the same two columns, zero schema redesign. Dependents with *restricted* visibility would be the first consumer of the `owner_only` visibility value (also a value-only extension).
- **More than two adults (LATER):** `HOUSEHOLD_MEMBER_LIMIT = 2` and `household_members_one_active_per_user` are the only blockers; ownership itself is membership-keyed and scales. 14B must not bake "2" anywhere deeper (the existing limit already doesn't).
- **Multiple households (LATER):** everything is keyed by `household_id`; `owner_membership_id` is household-scoped by construction. The `one_active_per_user` unique index is the only structural change needed.

The V1 model does not make any of these impossible; it only lacks the *visibility* and *role* extensions they would later add.

---

## 21. Product decisions required

1. **PRODUCT DECISION REQUIRED — Personal goal support in V1.** *Recommended:* defer; household goals only in V1 (schema slot exists). *Alternative:* ship personal goals in V1. *Tradeoff:* deferral keeps Goal UI/Plan funding untouched; shipping adds the funding-link same-owner guard and ownership UI to Goals sooner.
2. **PRODUCT DECISION REQUIRED — Scenario D visibility (personal liability).** *Recommended:* full detail visible to both partners (V1). *Alternative:* summary-only visibility. *Tradeoff:* full visibility is one rule and keeps Health simple; summary-only adds a second visibility tier and Health projection complexity with no demonstrated V1 need.
3. **PRODUCT DECISION REQUIRED — Personal→personal transfers.** *Recommended:* disallow cross-owner personal transfers in V1 (out-of-scope error). *Alternative:* allow with partner acknowledgement. *Tradeoff:* disallow is simplest and safest; allow adds a consent flow that belongs in a collaboration prompt.
4. **PRODUCT DECISION REQUIRED — Admin override scope.** *Recommended:* Admin archive/delete only (no edit, no transfer). *Alternative:* full Admin override. *Tradeoff:* narrow override preserves personal integrity; full override recreates the "member ≈ full authority" problem under a new name.
5. **PRODUCT DECISION REQUIRED — hidden personal finances at all.** *Recommended:* not in V1 (visibility = household). *Alternative:* Honeydue-style owner-only visibility. *Tradeoff:* current model stays one-dimension and honest about Health; hidden finances require the visibility axis, owner-only RLS, and Health redefinition — a later prompt.

These are flagged because they change product semantics; the rest of the contract is decided above.

---

## 22. NOW / NEXT / LATER

**NOW (14B-14F, per §19):** ownership schema on six roots → P0 RLS → P0 RPC guards → app/UI ownership control → tests; Plan stays household-only; Health unchanged; Together gains an `isResourceOwner` helper, no new roles.

**NEXT (post-14F):** P1 RPC guards (goals, inbox resolve), qualifying-income scope filter validation, member-removal hooks for personal resources (14F covers the lifecycle), product decision on personal goals.

**LATER:** visibility axis (`owner_only`) + Health "declared household-impacting" definition; personal goals; cross-owner transfers with consent; per-owner Health breakdown; dependents; >2 adults; multiple households.

---

## 23. Proposed implementation prompts

```text
Prompt 14B — Ownership schema foundation
  Add scope + owner_membership_id (with CHECKs) to accounts, savings,
  investment_accounts, investment_holdings, loans, liabilities, goals;
  backfill household default; domain constants + vocabulary; unit tests.

Prompt 14C — Ownership-aware RLS
  Rewrite P0 table policies (read member / write owner-or-household / admin
  archive); align P1 inherited-child policies; policy tests.

Prompt 14D — Ownership-aware domain mutations
  Thread is_resource_owner through P0 RPCs (ledger, cards, debts, loans,
  savings, investments); scope filter on qualifying income; inbox resolve
  ownership re-check; RPC tests.

Prompt 14E — Ownership UI
  Household/Personal control on create forms; scope badge in lists;
  owner-only client affordances; en/vi copy; browser verification.

Prompt 14F — Together membership lifecycle
  isResourceOwner helper; member-leave/remove handling for personal
  resources (block writes, reassign/archive surfacing); invite/role
  authorization consistency.
```

Ordering matches the migration sequence (schema → RLS → RPC → app → UI → test) and each prompt is independently shippable because the `household` default keeps every step non-breaking.

---

## Completion criteria check

- [x] What is household-owned? → everything by default; resources may be marked personal
- [x] What can be personal? → accounts, savings, investments, loans, debts, goals (children inherit)
- [x] Who owns personal resources? → exactly one `household_members.id`
- [x] Who can see personal resources? → all active household members (V1)
- [x] Who can edit them? → owner only; Admin archive/delete override only
- [x] How do transactions inherit scope? → from account; transfers per-leg
- [x] How does household Health calculate? → everything visible = everything in household
- [x] Does Plan remain household-only? → yes
- [x] How do Goals behave? → household-only V1; schema slot for personal
- [x] How will current household-wide data migrate? → backfill `household` default; dev reset OK
- [x] No broad ownership implementation executed; RLS/RPC/UI changes mapped, not made
