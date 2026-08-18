# Family Finance — Ownership Schema Foundation

**Status:** Implementation complete. Schema capability added; application capability remains disabled.
**Date:** 2026-08-18
**Scope:** Prompt 14B — ownership schema foundation only. No ownership-aware RLS (14C), no ownership-aware RPCs (14D), no UI controls (14E), no Plan/Inbox changes.
**Predecessor:** `.agents/reports/household-ownership-14a.md`

---

## 1. Ownership roots selected

**Six true ownership roots** carry the canonical `financial_scope` / `owner_membership_id` pair:

| Root | Why a true root |
| --- | --- |
| `accounts` | The user-facing place ownership is decided; transactions/billing/card data inherit |
| `savings` | Independent aggregate (provider, cycles, funding/settlement accounts are references, not parents) |
| `investment_holdings` | The real investment aggregate — holdings are created directly by RPCs; operations/fees/valuations/events/lots inherit |
| `loans` | Independent obligation aggregate; payments/schedule/rate periods inherit |
| `liabilities` | Independent obligation aggregate (borrowed/lent); debt payments inherit |
| `goals` | Independent intention aggregate; contributions/funding links inherit |

## 2. Ownership roots rejected / inherited

**Rejected as a root: `investment_accounts`.** Repo evidence: the table is defined in `20260815180000_investment_domain_foundation.sql` but is *never written or read* by any RPC or application flow (verified by full-repo grep: only the defining migration references it). Holdings are created directly via `record_investment_opening_position` / `record_investment_initial_purchase` without any `investment_accounts` row, and holdings can exist without an investment account. Adding ownership to both would create drift with no consumer. **`investment_holdings` is the single investment root.**

**Inherited (no duplicate columns):** `transactions` (from account), `saving_cycles`, `early_withdrawals` (from savings), `investment_operations`, `investment_fees`, `investment_valuations`, `investment_events`, `investment_lots` (from holding), `loan_payments`, `loan_schedule_entries`, `loan_interest_rate_periods` (from loan), `debt_payments` (from liability), `credit_card_settings`, `card_billing_months`, `card_billing_items`, `card_payments` (from the card account), `goal_contributions`, `goal_funding_links` (from goal).

**Household-only (no ownership columns, by contract):** `jars`, `jar_plans`, `plan_movements`, `jar_period_rule_snapshots`, `jar_period_adjustments`, `month_ritual_runs`, `inbox_items` (assignee ≠ owner).

## 3. Final DB vocabulary

```text
financial_scope       text NOT NULL DEFAULT 'household'
owner_membership_id   uuid NULL
```

- `scope` rejected as too generic; `financial_scope` + `owner_membership_id` used on **every** root identically.
- No per-domain synonyms (`account_scope`, `personal_scope`, etc.).
- Canonical application constants: `modules/shared-kernel/application/financial-scope.ts` (`FINANCIAL_SCOPE`, `FinancialScope`, `FINANCIAL_SCOPE_VALUES`, `isFinancialScope`, column-name constants). Placed in shared-kernel because ownership is a cross-domain household contract; the project pattern imports shared-kernel files directly (no barrel).

## 4. Schema changes

Migration `supabase/migrations/20260818100000_ownership_schema_foundation.sql`:

- `ADD COLUMN financial_scope text NOT NULL DEFAULT 'household'` + `ADD COLUMN owner_membership_id uuid` on all six roots.
- Scope CHECK `financial_scope IN ('household','personal')` per root.
- Scope/owner pairing CHECK per root (household→NULL, personal→NOT NULL; no other state).
- Six partial indexes `(financial_scope, owner_membership_id) WHERE owner_membership_id IS NOT NULL` for future 14C lookups.
- **No columns added to any child/Plan/Inbox table.**

## 5. Constraint model

Per root, three constraints:

```text
financial_scope_check       scope IN ('household','personal')
scope_owner_pair_check      (household AND owner IS NULL) OR (personal AND owner IS NOT NULL)
owner_membership_fk         (household_id, owner_membership_id) → household_members(household_id, id)
```

Postgres `CHECK` constraints chosen over enum/domain: additive-friendly (a future `owner_only` visibility value is a new CHECK value, not a migration of a type), and consistent with the project's existing CHECK-constraint convention. Verified live for all invalid states:

| State | Result |
| --- | --- |
| `household` + owner | REJECTED (pair check) |
| `personal` + null owner | REJECTED (pair check) |
| unknown scope (`'shared'`) | REJECTED (scope check) |
| cross-household owner | REJECTED (composite FK) |
| same-household personal | ACCEPTED (legal shape) |

## 6. Membership integrity model

**Composite FK** `(household_id, owner_membership_id) REFERENCES household_members(household_id, id)` — chosen over a plain single-column FK (which cannot express same-household) and over a trigger (FK is declarative, index-backed, and impossible to violate). Required adding `household_members_household_id_id_key UNIQUE (household_id, id)` (the PK is on `id` alone).

**Active-membership decision:** the FK intentionally does **not** require `is_active = true`. Ownership identity may reference a member who later leaves (historical ownership must survive); mutation authority (14C/14D) will require active membership. This separation is documented in the migration header and validated against Together: `household_members.is_active` already exists for authority gating, and Together RPCs check it; the ownership FK deliberately does not.

## 7. Existing-data backfill

Deterministic, idempotent backfill on all six roots:

```sql
update public.<root>
set financial_scope = 'household', owner_membership_id = null
where financial_scope is distinct from 'household' or owner_membership_id is not null;
```

No ownership inference from `created_by`, email, actor, or name. Verified live: **all 32 rows** across the six roots are household + null owner.

## 8. Production-path safety

**The P0 gap found and closed.** `accounts`, `savings`, `loans`, `liabilities`, `goals` grant INSERT/UPDATE to `authenticated` with membership-only RLS. Without a countermeasure, a crafted PostgREST request could set `financial_scope='personal'` or change `owner_membership_id` immediately after 14B.

**First attempt (column-level REVOKE) failed — verified live:** Supabase default privileges (`ALTER DEFAULT PRIVILEGES` owned by `postgres`/`supabase_admin`) grant ALL to `authenticated` on new relations, and `ADD COLUMN` re-grants the new column to table-level grantees. `has_column_privilege` confirmed INSERT/UPDATE remained after REVOKE.

**Durable lock (implemented): a `BEFORE INSERT OR UPDATE` trigger** `public.force_household_scope()` (security definer, search_path pinned) that force-overrides `financial_scope := 'household'`, `owner_membership_id := null` on every write, on all five writable roots. The trigger is privilege-independent — no PostgREST path, crafted or not, can create or change a personal row. Verified live: a `personal` insert returns `household`/null. Column REVOKEs are kept as defense-in-depth (documented as non-authoritative). `investment_holdings` needs no trigger (select-only to authenticated; mutations flow through security-definer RPCs).

## 9. Read-model changes

**None.** Query/read models do not yet expose `financialScope` / `ownerMembershipId` (would create churn; deferred to 14E per the prompt's allowance). The constants file is the only new application code.

## 10. Migrations

`supabase/migrations/20260818100000_ownership_schema_foundation.sql` — single migration, ordered:

1. Add columns (six roots) → 2. scope value CHECKs → 3. `household_members(household_id, id)` unique (guarded by DO-block, idempotent) → 4. composite owner FKs → 5. scope/owner pair CHECKs → 6. backfill → 7. trigger lock → 8. defense-in-depth column REVOKEs → 9. partial indexes.

**Migration replay caveat (documented):** `apply_migration` wrote two history entries during iteration (a failed first attempt left a stale entry). The stale entry was deleted; the single remaining entry (`20260818020952`) matches the committed file. The live schema was also reconciled directly where `apply_migration` recorded history without creating triggers.

## 11. Tests

`tests/unit/ownership-schema-14b.test.ts` (69 tests, node env, migration-boundary style):

- Constants: canonical values, `isFinancialScope`, column names.
- Per root (6×6): column existence + household default, nullable owner, scope CHECK, composite FK, pair CHECK, backfill.
- Children (18): no ownership columns added.
- Plan + Inbox (7): no ownership columns.
- Lock: `force_household_scope` function + 5 trigger attachments + defense-in-depth REVOKEs + select-only note.
- Production paths: no module code references the vocabulary except the constants file; no write flow sets the columns.

Validation: 69/69 pass; `tsc --noEmit` clean; `npm run lint` clean; full suite = 16 failed/98 passed — **identical to the documented pre-existing baseline** (React.act environment + node:path ESM failures on untouched files).

## 12. Live DB validation

**Live remote** (`bbzffxvgocjwsdbujvgn`, the active dev project used by 13D):

- Columns, defaults, and nullability verified via `information_schema`.
- All 18 constraints (6 scope checks + 6 FKs + 6 pair checks) verified via `pg_constraint`.
- Backfill verified: 32/32 rows household-owned.
- Shape tests (transactional, rolled back): same-household personal ACCEPTED; household+owner REJECTED; personal+null REJECTED; bad scope REJECTED; cross-household owner REJECTED (FK violation observed).
- Trigger lock verified: `personal` insert → returned `household`/null; normal household insert unchanged.
- Column-privilege gap confirmed and closed via the trigger (REVOKE alone defeated by default privileges — documented).
- Migration history cleaned to a single entry.

## 13. Security gap after 14B

| Attack | Status |
| --- | --- |
| Authenticated member sets `financial_scope='personal'` directly | **Blocked** — trigger force-overrides to household/null |
| Assign `owner_membership_id` to another member | **Blocked** — trigger nulls it; pair CHECK + FK would also reject |
| Change an existing resource household→personal | **Blocked** — trigger force-overrides on UPDATE |
| Cross-household owner | **Impossible** — composite FK |

**No supported production path can create or change personal ownership.** The trigger is the authoritative control until 14C replaces it with ownership-aware policies (at which point 14C drops the triggers and revokes remain).

## 14. Remaining work for 14C

1. Drop the `force_household_scope` triggers (or repurpose) and replace with ownership-aware RLS: read = member, write = owner-or-household, Admin archive override.
2. Add the `is_resource_owner(scope, owner_membership_id)` helper (DB + application gate).
3. Rewrite the P0 table policies (`accounts`, `transactions`, `savings`, `loans`, `liabilities`, card tables) and align P1 inherited-child policies.
4. Preserve the same-household FK and pair CHECKs unchanged (they become the schema-level backstop for RLS).
5. Extend `household_members_household_id_id_key` usage and re-verify default-privilege behavior under the new policies.

---

PROMPT 14B COMPLETE

Ownership roots:
`accounts`, `savings`, `investment_holdings`, `loans`, `liabilities`, `goals`

Inherited domains:
`transactions`, `saving_cycles`, `early_withdrawals`, `investment_operations`/`fees`/`valuations`/`events`/`lots`, `loan_payments`, `loan_schedule_entries`, `loan_interest_rate_periods`, `debt_payments`, `credit_card_settings`/`billing`, `goal_contributions`, `goal_funding_links`

DB columns:
`financial_scope text NOT NULL DEFAULT 'household'`, `owner_membership_id uuid NULL`, identical on all six roots

Membership integrity:
Composite FK `(household_id, owner_membership_id) → household_members(household_id, id)`; does not require `is_active` (historical ownership survives; authority requires active membership later)

Existing data:
Backfilled deterministically — 32/32 rows household + null owner; no inference from creator/email/actor

Can production create personal resources yet?
NO — `force_household_scope` BEFORE INSERT/UPDATE trigger force-overrides to household/null on all five writable roots (REVOKE alone was defeated by Supabase default privileges; verified and documented)

Validation:
Live remote (`bbzffxvgocjwsdbujvgn`) — schema, 18 constraints, backfill, shape tests, cross-household rejection, trigger lock all verified; 69/69 new tests; typecheck + lint clean; full suite matches pre-existing baseline

Security gap:
Closed — no path (PostgREST, RPC, or direct) can create or change personal ownership; trigger is authoritative until 14C replaces it with ownership-aware RLS

Next recommended prompt:
Prompt 14C — Ownership-aware RLS
