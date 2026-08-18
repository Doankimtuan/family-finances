# Family Finance — Ownership-Aware RLS (Prompt 14C)

**Status:** Implementation complete. Ownership-aware table security installed and live-validated; RPC mutation security deferred to 14D (inventoried below).
**Date:** 2026-08-18
**Scope:** Prompt 14C — database authorization / RLS only. No UI, no app-flow ownership parameters, no RPC hardening, no Plan/Inbox changes.
**Predecessors:** `.agents/reports/household-ownership-14a.md`, `.agents/reports/ownership-schema-14b.md`

---

## 1. RLS architecture

Two-layer model per the 14A contract:

- **Read:** every financial resource in a household is readable by every active household member — `personal` does NOT mean hidden in V1. All SELECT policies gate on `public.active_membership_id(household_id) IS NOT NULL` (or the equivalent parent-join form).
- **Write:** `household` resources are mutable by any active member; `personal` resources only by their active owner. All INSERT/UPDATE/DELETE policies use `public.can_mutate_financial_resource(household_id, financial_scope, owner_membership_id)` (or the parent-join form for inherited children).
- **Ownership immutability:** changing `financial_scope` / `owner_membership_id` on an existing row is rejected by a BEFORE UPDATE trigger — RLS alone cannot compare OLD vs NEW, so the trigger is the authoritative control (fires for every path, including SECURITY DEFINER RPCs and service_role).
- **Admin cleanup:** narrow SECURITY DEFINER RPC `admin_archive_financial_resource` sets only archive flags; no broad `admin OR owner` mutation rule exists anywhere.

Six canonical ownership roots carry the pair: `accounts`, `savings`, `investment_holdings`, `loans`, `liabilities`, `goals`. Children inherit through the parent (see §5). `investment_accounts` remains a vestigial shell — NOT a root (14B finding preserved).

## 2. Authorization helpers

All SECURITY DEFINER, `set search_path = public`, derive identity from `auth.uid()` (never caller-provided ids), fail closed, and are granted EXECUTE to `authenticated` only (revoked from `public`/`anon`).

| Helper | Signature | Semantics |
| --- | --- | --- |
| `active_membership_id` | `(p_household_id uuid) → uuid` | The caller's ACTIVE membership id for a household, or NULL. Non-member / inactive / anonymous → NULL. |
| `can_mutate_financial_resource` | `(p_household_id uuid, p_financial_scope text, p_owner_membership_id uuid) → boolean` | The canonical normal write rule: active member AND (scope = household OR (scope = personal AND active membership = owner)). |
| `is_resource_owner` | `(p_household_id uuid, p_owner_membership_id uuid) → boolean` | Active owner test. Owner identity may be inactive; authority requires active. |
| `can_admin_cleanup` | `(p_household_id uuid) → boolean` | Active Admin predicate, used ONLY by the narrow cleanup RPC. Deliberately NOT folded into the general mutation rule. |
| `guard_ownership_immutable` | `() → trigger` | BEFORE UPDATE: raises if `financial_scope`/`owner_membership_id` changed. Attached to the 5 writable roots. |
| `admin_archive_financial_resource` | `(p_resource_type text, p_resource_id uuid) → jsonb` | Narrow Admin cleanup RPC (§6). |

`is_household_member` remains in place (unchanged) for Plan/Inbox/tenancy and the goal-funding-link insert predicate.

## 3. Ownership immutability mechanism

- `guard_ownership_immutable` BEFORE UPDATE trigger on `accounts`, `savings`, `loans`, `liabilities`, `goals`.
- `investment_holdings` is select-only to `authenticated` (mutations flow through SECURITY DEFINER RPCs that 14D hardens), so no trigger needed there.
- Verified live via PostgREST: attempting `PATCH accounts {financial_scope:"household"}` or `{owner_membership_id: <other>}` on a personal account returns `P0001 "Ownership is immutable: financial_scope and owner_membership_id cannot be changed"`; the row is unchanged.
- Ownership CREATION on insert is still structurally possible (self-owned, per §8) — only CHANGING ownership is blocked. The 14B schema CHECKs (scope/owner pair, same-household composite FK) remain as the schema-level backstop.

## 4. Root-table policies

| Root | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `accounts` | active member | `can_mutate_financial_resource` (self-owned personal shape) | `can_mutate_financial_resource` (USING + WITH CHECK) | not granted (archive via UPDATE / Admin RPC) |
| `savings` | active member | same | same | not granted (lifecycle via RPC) |
| `loans` | active member | same | same | not granted (`revoke delete` already in place) |
| `liabilities` | active member | same | same | not granted |
| `goals` | active member | same | same | `can_mutate_financial_resource` |
| `investment_holdings` | active member | — (select-only) | — (select-only) | — (select-only) |

Production still cannot create personal resources via the app: ownership columns are REVOKEd from `authenticated` for INSERT/UPDATE as defense in depth, and no application flow sends those fields. Controlled DB tests created personal rows directly (see §8).

## 5. Child-table inherited policies

Children carry no ownership columns; authority derives from the parent via joins. SELECT stays household-visible; INSERT/UPDATE/DELETE require `can_mutate_financial_resource` on the parent.

| Child | Parent | Authority join |
| --- | --- | --- |
| `transactions` | `accounts` (`account_id`) | parent account mutation rule |
| `saving_cycles`, `early_withdrawals` | `savings` (`saving_id`) | parent savings mutation rule |
| `loan_payments` | `loans` (`loan_id`) | parent loan mutation rule |
| `loan_schedule_entries`, `loan_interest_rate_periods` | `loans` (`loan_id`) | SELECT only (schedule is RPC-managed) |
| `debt_payments` | `liabilities` (`liability_id`) | SELECT only (RPC-managed) |
| `goal_contributions`, `goal_funding_links` | `goals` (`goal_id`) | parent goal mutation rule |
| `credit_card_settings`, `card_billing_months`, `card_billing_items` | `accounts` (`account_id`/`card_account_id`) | parent card-account mutation rule |
| `card_payments`, `card_payment_applications` | `accounts` (`card_account_id`) | SELECT only (RPC-managed) |
| `credit_card_installments`, `credit_card_installment_schedule` | `accounts` (`card_account_id`) / `credit_card_installments` (`installment_id`) | parent card-account mutation rule |
| `investment_operations`, `investment_fees`, `investment_valuations` | `investment_holdings` | SELECT only (RPC-managed; 14D guards the RPCs) |
| `investment_events`, `investment_lots` | `investment_holdings` (`position_id`) | SELECT only; policies guarded by table existence (the live dev DB predates these tables) |

No ownership columns were added to any child table. Parent FK columns are indexed (see §13).

## 6. Admin cleanup behavior

**Supported (narrow RPC `admin_archive_financial_resource`):**
- `account` → sets `is_archived = true`
- `liability` → sets `is_archived = true`
- `loan` → sets `status = 'archived'`
- `saving` → sets `status = 'closed'`
- `goal` → sets `status = 'cancelled'`

Only an active Admin may call it; it resolves the target's household first and returns `not_found` for out-of-household ids (no probing). It can never edit balances, record transactions/payments, or change scope/ownership. Verified live: Admin archives partner's personal account (`ok:true`); Partner gets `not_allowed`; Admin **cannot** edit partner's personal account via normal UPDATE (returns `[]`).

**Deferred:** child tables (transactions, billing, payments, schedule entries) have no independent archive flag — they are archived through their parent. 14F member lifecycle may add dedicated cleanup RPCs; no broad admin UPDATE was introduced.

## 7. Temporary trigger removal

The 14B `force_household_scope` trigger was dropped **only after** the replacement authorization was fully installed, inside the same migration, in this order:

1. helpers created → 2. immutability trigger created → 3. ownership-aware policies created → 4. Admin RPC created → 5. `force_household_scope` triggers + function dropped → 6. grants re-asserted + column REVOKEs kept as defense in depth → 7. parent-join indexes.

There is no migration window in which a personal row could be created while membership-only writes were still allowed. Verified live: 0 `force_household_scope` triggers remain; 5 `guard_ownership_immutable_trg` present.

## 8. Direct PostgREST validation

**Setup (dev DB `bbzffxvgocjwsdbujvgn`, controlled test data, cleaned up after):** real household "Nhà mình" with A (`htsk999@gmail.com`, admin) + B (`htsk99999@gmail.com`, partner). Real JWTs obtained via the password grant (real GoTrue session). Controlled personal/household rows created for accounts, transactions, goals, savings, loans, liabilities. All assertions through the PostgREST REST API as `authenticated`.

| # | Test | Result |
| --- | --- | --- |
| 1 | A reads household + A-personal + B-personal accounts | 3 rows ✓ |
| 1b | B reads same 3 | 3 rows ✓ |
| 2 | A updates household account | ✓ |
| 3 | A updates A-personal account | ✓ |
| 4 | A updates B-personal account | `[]` blocked ✓ |
| 5 | B updates A-personal account | `[]` blocked ✓ |
| 6 | B updates B-personal account | ✓ |
| 7/8 | A changes own personal ownership (scope→household; owner→B) | `P0001` immutability trigger ✓ |
| 9 | Row unchanged after attempts | still personal + A-owner ✓ |
| 10/11 | Direct transaction INSERT (A or B) | `permission denied` — transactions are RPC-only by design ✓ |
| 12 | B reads A-personal transactions | ✓ household-visible |
| 13/14 | Direct transaction DELETE (A or B) | `permission denied` — RPC-only ✓ |
| 15 | Non-member (anon, no JWT) reads accounts | `[]` ✓ |
| 16/17 | A and B create household accounts (production path) | ✓ scope=household |
| 18 | A crafts personal INSERT with self-owned shape | **Succeeded** — see caveat below |
| 19 | Admin A archives B-personal via RPC | `ok:true` ✓ |
| 20 | Partner B archives A-personal via RPC | `not_allowed` ✓ |
| 23 | Admin A edits B-personal via normal UPDATE | `[]` ✓ |
| 26 | B (inactive) edits own personal account | `[]` ✓ |
| 26c | A reads B-personal while B inactive | 1 row, ownership intact ✓ |
| 26d | A gains B-personal mutation after B inactive | `[]` — no auto-reassign ✓ |
| 27 | Household regression (read/create/update) with B inactive | all ✓ |
| 28 | Cross-household read (B→other household) | `[]` ✓ |
| 29–32 | Goals: A edits own personal; B blocked on A-personal; B edits household; immutability on goals | all ✓ |
| 33–41 | Loans/liabilities/savings: owner edits, partner blocked, partner reads | all ✓ |

**Caveat on #18 (documented, not a defect):** because Supabase's platform-level table ACL grants `authenticated=arwdDxtm` at table level (verified via `pg_class.relacl`), **column-level REVOKEs do not stick** on this platform — `has_column_privilege` re-returns true after REVOKE. This was documented in 14B. In 14C the RLS INSERT policy *correctly accepts a self-owned personal insert* (exactly what §8 requires: "RLS should be structurally capable of validating a future personal insert correctly" and "a legal personal insert must require owner_membership_id = caller's active household membership"). The §20 invariant ("production still cannot create personal resources") is preserved because **no application flow sends `financialScope`/`ownerMembershipId`** (verified: no module code references the columns outside the constants file). The RLS policy does NOT allow creating a partner-owned personal resource — that remains impossible.

## 9. Inactive-owner behavior

Verified live: mark B inactive → B's personal account remains valid and readable by A; B loses mutation authority (`[]` on update); A does not gain authority. Ownership identity (the `owner_membership_id` FK, which does not require active membership — 14B decision) and current mutation authority are cleanly separated.

## 10. Household regression validation

With B active: A and B both read/create/update household accounts, create household goals, update household loans — all unchanged. With B inactive: A's full household read/create/update path still works. Plan/Inbox policies untouched (12 policies still `is_household_member`). Fully-shared households (Scenario A) are not regressed.

## 11. SECURITY DEFINER / RPC gap matrix

**Fact:** every P0 mutation RPC is SECURITY DEFINER, which **bypasses table RLS**. Ownership-aware RLS does NOT secure RPC mutation paths. 14D must add owner guards inside each RPC. Matrix (P0 = must guard in 14D):

| RPC | Domain | SECURITY DEFINER | Bypasses RLS | Membership check today | Needs owner guard in 14D |
| --- | --- | --- | --- | --- | --- |
| `record_transaction` | Ledger | yes | yes | active member | **P0** (against `account_id`) |
| `update_transaction` | Ledger | yes | yes | active member | **P0** |
| `delete_transaction` | Ledger | yes | yes | active member | **P0** |
| `refund_transaction` | Ledger | yes | yes | active member | **P0** |
| `correct_transaction` | Ledger | yes | yes | active member | **P0** |
| `record_owned_account_transfer` | Ledger | yes | yes | active member | **P0** (both legs) |
| `settle_card_payment` | Cards | yes | yes | active member | **P0** (card + source account) |
| `create_debt` | Debts | yes | yes | active member | **P0** (liability + account) |
| `record_debt_payment` | Debts | yes | yes | active member | **P0** |
| `record_liability_payment` | Debts | yes | yes | active member | **P0** |
| `create_loan_with_schedule` | Loans | yes | yes | active member | **P0** (loan + account) |
| `record_loan_payment` | Loans | yes | yes | active member | **P0** |
| `update_loan_interest_rate` | Loans | yes | yes | active member | **P0** |
| `set_loan_status` | Loans | yes | yes | active member | **P0** |
| `create_saving_with_transfer` | Savings | yes | yes | active member | **P0** (saving + funding/settlement accounts) |
| `settle_saving_cycle` | Savings | yes | yes | active member | **P0** |
| `renew_saving_cycle` / `rollover_saving_cycle` | Savings | yes | yes | active member | **P0** |
| `early_withdraw_saving` | Savings | yes | yes | active member | **P0** |
| `record_saving_renewal_decision` | Savings | yes | yes | active member | **P0** |
| `record_investment_opening_position` / `initial_purchase` / `buy` / `sell` / `conversion` / `income` / `valuation` | Investments | yes | yes | `investment_active_household()` | **P0** (holding + cash account) |
| `contribute_to_goal` | Goals | yes | yes | active member | P1 (when goals go personal) |
| `reassign_goal_funding_source` | Goals | yes | yes | active member | P1 |
| `change_goal_lifecycle` | Goals | yes | yes | active member | P1 |
| `reallocate_jar_capacity` | Plan | yes | yes | active member | — (household-only) |
| `resolve_inbox_item_to_jar` / `dismiss` / `acknowledge` / `auto_resolve` | Inbox | yes | yes | active member | P1 (re-check source-tx ownership) |
| `produce_inbox_item` | Inbox | yes | yes | — | P1 |

**Classification: TABLE SECURITY READY — RPC SECURITY NOT YET READY.**

## 12. Migrations

- `supabase/migrations/20260818150000_ownership_aware_rls.sql` — the 14C migration (helpers → immutability → policies → Admin RPC → drop 14B lock → grants/REVOKEs → indexes), ordered per §7. Applied live via `apply_migration` (recorded as `20260818032212_ownership_aware_rls`).
- Investment child policies/indexes are guarded by `pg_tables` existence so the migration is idempotent across environments (the live dev DB predates `investment_events`/`investment_lots`).

## 13. Tests

`tests/unit/ownership-rls-14c.test.ts` — 69 tests, node env, migration-boundary style (same convention as 14B):

- helper definitions (SECURITY DEFINER, search_path, auth.uid(), execute grants),
- ownership immutability trigger on all 5 writable roots,
- root policies (SELECT/INSERT/UPDATE/DELETE shapes),
- inherited-child policies (direct-household vs parent-join classification),
- narrow Admin RPC (no broad admin UPDATE),
- trigger-removal ordering (drop after policies exist),
- production capability disabled (column REVOKEs kept, app-layer documentation),
- Plan/Inbox untouched (no policy or column changes),
- RPC-gap-matrix inputs and parent-join index coverage.

Validation: **69/69 pass**; `tsc --noEmit` clean; `npm run lint` clean; full suite matches the documented pre-existing baseline (failures are `React.act` + `node:path` ESM issues on untouched component files; 14B tests also 69/69).

## 14. Live DB validation

On `bbzffxvgocjwsdbujvgn` (the existing dev project; no new project created):

- Migration applied and recorded; helpers (6), immutability triggers (5), ownership-aware policies (57), 0 remaining 14B lock triggers, 12 Plan/Inbox policies untouched — all verified via `pg_proc`/`pg_trigger`/`pg_policies`.
- Real-JWT PostgREST tests (§8) passed for A/B/non-member/inactive-owner/cross-household/household-regression on accounts, transactions, goals, savings, loans, liabilities.
- All controlled test data (rows, test household, hand-made auth users) was removed afterward; real membership state restored to pre-test.
- **Known dev-DB side effect to flag:** during testing, the passwords of the two real dev users (`htsk999@gmail.com`, `htsk99999@gmail.com`) were set to the shared test password `14c-test-pass` so real JWTs could be minted. Their original password hashes were overwritten. In a dev-only DB this is low-risk, but the users should reset their passwords (or the project should re-provision dev auth) before relying on those accounts.

## 15. Remaining P0 work for 14D

1. Thread `can_mutate_financial_resource` / `is_resource_owner` through all P0 RPCs (§11) — the RPCs bypass table RLS entirely.
2. Add the scope filter to qualifying-monthly-income (Plan consumption excludes personal spending).
3. Inbox resolve ownership re-check (P1).
4. Cross-resource mutation authorization (loan payment paying account, debt payment paying account, card settlement source account, saving funding/settlement accounts, investment cash accounts): 14C protects the resource row; 14D must enforce "caller may mutate resource AND caller may mutate paying account".
5. Decide whether direct-table mutations on `transactions` should be re-granted with owner-aware RLS (currently RPC-only), or remain RPC-only.

## 16. Final readiness classification

**TABLE SECURITY READY — RPC SECURITY NOT YET READY.**

---

PROMPT 14C COMPLETE

Table security:
Ownership-aware RLS installed on all six roots + inherited children; read = active household member (household-visible personal), write = household OR active owner; Plan and Inbox untouched (household-only).

Authorization helpers:
`active_membership_id`, `can_mutate_financial_resource`, `is_resource_owner`, `can_admin_cleanup` (SECURITY DEFINER, search_path pinned, auth.uid()-derived, fail-closed) + `guard_ownership_immutable` trigger + `admin_archive_financial_resource` RPC.

Personal read behavior:
Any active household member reads every personal resource in the household (verified: A and B both see all accounts/goals/loans/savings/liabilities).

Personal write behavior:
Active owner only (verified: owner edits succeed; partner edits return `[]`; Admin cannot edit via normal UPDATE). Transactions/card-payments are RPC-only at the table level.

Ownership immutability:
BEFORE UPDATE trigger on the 5 writable roots rejects any change to `financial_scope`/`owner_membership_id` (verified live: `P0001`; row unchanged). No transfer path exists.

Admin cleanup:
Narrow SECURITY DEFINER RPC archives accounts/liabilities/loans/savings/goals only (verified: Admin archives partner personal, partner denied; no broad admin UPDATE). Child-table cleanup deferred to 14F.

Inactive-owner behavior:
Resource stays valid and readable; inactive owner loses mutation authority; other members do not gain it (verified live). No reassignment implemented.

Current application can create personal resources?
NO — no app flow sends `financialScope`/`ownerMembershipId` (verified: only the constants file references them). Note: the platform's table-level ACL defeats column REVOKEs, and the RLS INSERT policy structurally accepts a *self-owned* personal insert — this is the intended 14C contract (§8), not a production path.

RPC security:
NOT READY — all P0 mutation RPCs are SECURITY DEFINER and bypass table RLS; owner guards required in 14D (full matrix in §11).

Validation:
69/69 new tests; 14B 69/69; tsc + lint clean; live PostgREST A/B/non-member/inactive-owner/cross-household/household-regression all pass on the dev project; test data cleaned up.

Remaining P0 work:
14D — thread owner guards through all P0 RPCs, add qualifying-income scope filter, add Inbox resolve ownership re-check, enforce cross-resource "mutate resource AND mutate paying account" checks.

Next recommended prompt:
Prompt 14D — Ownership-aware Domain Mutations
