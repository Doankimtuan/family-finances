# Family Finance — RPC ACL & SECURITY DEFINER Hardening (15B)

Date: 2026-08-18
Target: live Supabase project family-finances-2 (bbzffxvgocjwsdbujvgn)

## 1. Executive summary

Prompt 15B is complete. The P0 was an ACL/default-privilege problem, not a need to rewrite RPC bodies: all 84 public application SECURITY DEFINER functions were owned by postgres, and the live postgres/public default function ACL granted anon and authenticated to newly-created functions.

The focused migration revoked PUBLIC and anon execution for every current public SECURITY DEFINER overload, removed authenticated execution from the explicit internal/trigger manifest, preserved service-role worker execution, and changed the future default ACL. The only remaining anonymous function is the intentional read-only invitation preview.

## 2. Original P0

15A found 58 anonymous-executable public SECURITY DEFINER functions, including unguarded loan schedule writers, savings-product account creation, and month-ritual workers. This could expose or mutate household financial state before authentication.

## 3. SECURITY DEFINER inventory

The live catalog query returned 87 functions:

- 84 public application functions, the V1 ACL surface;
- pgbouncer.get_auth(text) and two vault functions, platform-managed and not exposed through the public Data API.

Every overload was queried separately using pg_get_function_identity_arguments and effective has_function_privilege checks. The 84 public records all have a pinned search_path: public or the intentionally empty pinned path. The three platform records use the platform-owned empty path.

The post-deployment public inventory is below. anon/auth/service/public are effective privileges after migration; every public application row has public=no, and every row not listed as auth=no retains its existing authenticated grant. All rows retain service-role execution where it existed.

### Class A — public unauthenticated API

| Signature | Caller | Auth / scope | Mutation | Effective ACL |
|---|---|---|---|---|
| public.get_invitation_preview(p_token uuid) | invite page before login | token-scoped read only; no household/user identity is trusted | no | anon=yes, auth=yes, service=yes, public=no |

This is the sole anonymous allowlist entry. It returns only the invitation preview associated with the supplied token. Invitation accept/decline remain authenticated functions and reject a null auth.uid().

### Class B — authenticated application RPCs

These are directly used by signed-in application commands or are deliberately retained as authenticated compatibility RPCs. Their bodies either check auth.uid() directly, derive the household from the authenticated membership, or fail closed through the existing ownership/trigger path. No Class B function is anonymous after migration.

| Signature inventory | Intended caller / authorization |
|---|---|
| public.accept_household_invitation(p_token uuid); public.decline_household_invitation(p_token uuid) | signed-in invitation lifecycle; email/token and active-membership checks |
| public.acknowledge_inbox_item(p_inbox_item_id uuid, p_action text); public.auto_resolve_inbox_item(p_inbox_item_id uuid); public.dismiss_inbox_item(p_inbox_item_id uuid); public.resolve_inbox_item_to_jar(p_inbox_item_id uuid, p_jar_id uuid) | signed-in Inbox decisions; source household/member checks |
| public.admin_archive_financial_resource(p_resource_type text, p_resource_id uuid); public.can_admin_cleanup(p_household_id uuid) | authenticated household-admin path |
| public.change_goal_lifecycle(p_goal_id uuid, p_action text); public.contribute_to_goal(p_goal_id uuid, p_amount numeric, p_note text); public.reallocate_jar_capacity(p_source_jar_id uuid, p_target_jar_id uuid, p_amount numeric, p_is_emergency boolean, p_intent_note text) | signed-in Plan/goal operations with existing ownership/trigger checks |
| public.change_household_member_role(p_membership_id uuid, p_role text); public.create_household_invitation(p_email text); public.leave_household(); public.remove_household_member(p_membership_id uuid); public.revoke_household_invitation(p_invitation_id uuid) | signed-in Together lifecycle and admin paths |
| public.create_category(p_name text, p_kind text, p_jar_id uuid); public.create_household_with_essentials(p_name text, p_account_name text, p_plan_preset text, p_base_currency character, p_locale text, p_timezone text) | signed-in setup/reference-data paths; onboarding derives the user from auth.uid() |
| public.create_debt(p_name text, p_counterparty text, p_direction text, p_creation_mode text, p_principal_amount numeric, p_start_date date, p_due_date date, p_note text, p_account_id uuid, p_idempotency_key text, p_financial_scope text) | signed-in debt creation and ownership boundary |
| public.create_loan_with_schedule(p_name text, p_lender text, p_loan_type text, p_principal numeric, p_annual_interest_rate numeric, p_repayment_method text, p_interest_strategy text, p_promo_fixed_rate numeric, p_promo_fixed_months integer, p_promo_floating_rate numeric, p_promo_rate_effective_on date, p_term_months integer, p_start_date date, p_first_payment_date date, p_monthly_payment numeric, p_total_interest numeric, p_total_repayment numeric, p_expected_end_date date, p_note text, p_currency character, p_schedule jsonb, p_rate_periods jsonb, p_financial_scope text) | signed-in loan creation; household and financial-scope ownership derived from the session |
| public.create_saving_with_transfer (10-, 11-, and 13-argument overloads) | signed-in Savings compatibility/current lifecycle paths; wrappers delegate to the authenticated implementation |
| public.detect_matured_savings(p_household_id uuid); public.enqueue_savings_maturity_cascade(p_household_id uuid); public.enqueue_savings_maturity(p_savings_id uuid); public.early_withdraw_saving(p_cycle_id uuid, p_principal numeric, p_accrued_interest numeric, p_eligible_interest numeric, p_penalty_amount numeric, p_net_returned numeric, p_penalty_strategy text, p_settlement_account_id uuid); public.rollover_saving_cycle(p_cycle_id uuid, p_action text, p_target_package_id uuid, p_settlement_account_id uuid, p_cycle_start_date date, p_cycle_end_date date, p_idempotency_key text); public.settle_saving_cycle(p_cycle_id uuid, p_settlement_account_id uuid) | signed-in Savings lifecycle; membership and source ownership checks |
| public.correct_transaction(...); public.delete_transaction(uuid); public.record_transaction(...); public.refund_transaction(...); public.set_transaction_tags(uuid, uuid[]); public.update_transaction(...) | signed-in ledger commands; immutable/fail-closed functions and ownership triggers remain intact |
| public.record_debt_payment(...); public.record_liability_payment(...); public.record_loan_payment(uuid, uuid, text, date) | signed-in payment commands and protected ownership RPCs |
| public.record_investment_buy(...); public.record_investment_conversion(...); public.record_investment_income(...); public.record_investment_initial_purchase(...); public.record_investment_opening_position(...); public.record_investment_sell(...); public.record_investment_valuation(...) | signed-in investment lifecycle; active-household and ownership checks |
| public.record_owned_account_transfer(...); public.settle_card_payment(...) | signed-in protected transfer/card RPCs |
| public.produce_inbox_item(...); public.enqueue_payment_reminder(...); public.run_inbox_staleness_worker() | authenticated Inbox producer/user-scoped worker paths; gateway and membership checks |
| public.run_month_ritual_autolock_worker(); public.set_loan_status(uuid, text); public.update_household_policies(...); public.update_loan_interest_rate(...) | signed-in Plan/loan policy paths with household checks |

### Class C — internal privileged helpers

The following explicit manifest is in the migration. All have PUBLIC=no, anon=no, and authenticated=no after deployment. Parent SECURITY DEFINER RPCs invoke them as the function owner; triggers invoke trigger functions through their existing database architecture.

_loan_insert_rate_periods(...), _loan_insert_schedule_entries(...), _loan_replace_upcoming_schedule(...), autolock_resolve_unmapped_for_period(...), ensure_miscellaneous_jar(...), enforce_goal_funding_link_integrity(), get_or_create_savings_product_account(uuid), guard_cross_resource_mutation(), guard_financial_root_mutation(), guard_goal_funding_link_mutation(), guard_historical_jar_period_rule_snapshot(), guard_inbox_source_mutation(), guard_ownership_immutable(), guard_transaction_mutation(), prevent_owned_membership_delete(), assert_financial_mutation(...), and run_month_ritual_autolock_for_household(uuid, date).

The loan helpers are called by create_loan_with_schedule and update_loan_interest_rate. The Savings helper is called by Savings parent RPCs. The autolock per-household helper is called by the user-scoped worker and the all-household worker. Trigger helpers are only attached to database triggers; no direct application caller exists.

### Class D — scheduled / operational workers

run_month_ritual_autolock_worker_all() is service-role/pg_cron-only: anon=no, authenticated=no, public=no, service_role=yes. The existing cron definition remains unchanged. The user-scoped run_month_ritual_autolock_worker() remains Class B because it derives one household from the signed-in user.

The four service-only investment projection helpers retain service-role-only execution: investment_active_household(), investment_add_holding(uuid, uuid, numeric, numeric), investment_consume_holding(uuid, uuid, numeric), and investment_operation_receipt(uuid, boolean).

### Class E — safe helpers required by RLS/authorization evaluation

active_membership_id(uuid), can_admin_cleanup(uuid), can_mutate_financial_resource(uuid, text, uuid), household_base_currency(uuid), is_household_admin(uuid), is_household_member(uuid), and is_resource_owner(uuid, uuid) remain authenticated because RLS policies and the certified ownership path execute them for authenticated queries. They are not anonymous, are pinned, and do not become public APIs. Removing their authenticated grants would break policy evaluation rather than improve least privilege.

## 4. Classification model

Classification was based on live definitions, effective ACLs, migration call graphs, application rpc() callers, trigger attachments, and scheduler definitions. Function names alone were not used. Overloads were queried and revoked by their full identity signatures.

## 5. Anonymous allowlist

| Function | Reason |
|---|---|
| public.get_invitation_preview(uuid) | pre-login invite page needs a token-scoped, read-only preview; no caller-supplied household or user identity is trusted |

No anonymous financial mutation function remains.

## 6. Authenticated RPC allowlist

The post-migration live catalog has 62 authenticated-executable public SD functions. This includes the direct application RPCs in Class B and the RLS helpers in Class E. The 18 Class C/D internal entries were removed from authenticated execution. Four investment projection functions remain service-role-only.

## 7. Internal helper ACL changes

The migration dynamically enumerates every current public SECURITY DEFINER identity signature, revokes PUBLIC and anon, then applies the explicit internal manifest revocation from authenticated. This covers all three loan helpers and all other underscore/trigger/internal helpers without changing their signatures or bodies.

## 8. Worker ACL changes

run_month_ritual_autolock_worker_all() is now service-role/cron-only. The authenticated user-scoped worker remains available and still calls the same per-household implementation. No cron schedule or worker body was rewritten.

## 9. Auth-check changes

No production RPC body was mass-refactored. The existing authenticated parent checks and ownership/trigger boundary were preserved. ACL closure now prevents unauthenticated execution before any body can run. The legitimate authenticated parent paths were then exercised with real password sessions.

## 10. search_path hardening

All 84 public SECURITY DEFINER functions already had a pinned search_path (public or empty). The migration also fixed the known P1: transactions_set_is_reversal() now has search_path=public. The current security advisor reports no mutable-search-path warning.

## 11. Default privilege strategy

Live inspection showed the owner and default ACL exactly:

- function owner: postgres;
- postgres/public default function ACL before: anon, authenticated, and service_role;
- after: only postgres and service_role.

The migration uses ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated. Future client-callable functions must explicitly grant their intended role.

## 12. Migration changes

Added supabase/migrations/20260818160000_rpc_acl_security_hardening_15b.sql with only ACL/default-privilege/search-path changes. No function was moved between schemas and no unrelated SQL was rewritten.

Added tests/unit/rpc-acl-hardening-15b.test.ts with an explicit internal manifest, anonymous allowlist, default-ACL invariant, and search-path invariant.

## 13. Anonymous live negative tests

Using the real publishable client, representative calls to all six named P0 functions returned 42501 permission denied for function:

- _loan_insert_rate_periods
- _loan_insert_schedule_entries
- _loan_replace_upcoming_schedule
- get_or_create_savings_product_account
- run_month_ritual_autolock_for_household
- run_month_ritual_autolock_worker_all

The representative Savings-product account count was unchanged before/after the matrix (1 to 1). No function body ran.

## 14. Authenticated internal-helper negative tests

With the real signed-in ownership test identity, all six named helpers/workers also returned 42501 permission denied. This proves direct helper execution is denied for both anonymous and ordinary authenticated clients.

## 15. Parent-path positive tests

With a real authenticated fixture and service-role-only fixture setup, the following parent paths passed, then the controlled household was removed:

- loan creation and schedule generation: PASS, one schedule entry created;
- loan payment: PASS;
- transaction creation: PASS, returned transaction_id and Inbox item;
- account transfer: PASS;
- Savings create: PASS;
- Savings lifecycle/early withdrawal: PASS;
- Plan/month ritual user-scoped worker: PASS.

No service-role caller was used to impersonate the user for these RPCs.

## 16. Ownership/Together/Inbox regression

- ownership-rpc-manifest-14d1.test.ts: PASS;
- ownership schema/RLS/14D tests: PASS;
- Together 14F lifecycle unit tests: PASS;
- Inbox producer/gateway/decision/source tests: PASS;
- latest 14G report's certified RPC security = READY, Protected RPC manifest = COMPLETE, and Trigger bypass = NONE remain intact;
- current authenticated parent-path smoke passed without changing trigger definitions.

The broader browser/E2E stabilization backlog was intentionally not started, per Prompt 15B scope.

## 17. Advisor before/after

| Advisor | 15A before | 15B after |
|---|---:|---:|
| anon_security_definer_function_executable | 58 | 1, intentional invitation preview |
| authenticated_security_definer_function_executable | 80 | 62, classified/required |
| mutable search_path | 1 | 0 |
| leaked-password protection | 1 | 1, unrelated existing Auth setting |

Result: PASS WITH EXPLAINED ALLOWLIST. There is no unexplained anonymous privileged-function exposure.

## 18. Financial integrity

The bounded live integrity query returned zero violations for ownership_contract, cross_household_owner, duplicate_active_users, active_capacity, admin_continuity, loan_bounds, goal_links, inbox_sources, saving_cycle_dates, and goal_legacy_mismatch.

## 19. Migration/deployment verification

- migration applied live: PASS;
- local/remote migration list: aligned through 20260818160000;
- supabase db push --linked --dry-run: clean / remote up to date;
- live effective ACL query: PASS (84 public SD, anon=1, public=0);
- default privileges query: PASS (postgres and service_role only);
- transactions_set_is_reversal search path: PASS.

Repository gates: full unit suite PASS (120 files, 901 tests), typecheck PASS, lint PASS, build PASS, changed TypeScript formatting PASS, and git diff --check PASS. Full-repo format:check still reports the pre-existing archive formatting backlog; SQL has no configured Prettier parser.

## 20. Remaining security debt

- invitation preview remains an intentional anonymous SECURITY DEFINER warning and must stay in the explicit allowlist;
- 62 authenticated SD advisor warnings are expected and classified, not treated as zero-warning debt;
- leaked-password protection remains an unrelated Auth setting;
- longer-term private-schema placement for internal helpers remains P2;
- full clean local-schema replay and browser critical-flow stabilization remain outside Prompt 15B.

## 21. P0 closure decision

P0-001 CLOSED. No internal helper is executable by PUBLIC, anon, or ordinary authenticated users. Anonymous execution is limited to the justified read-only invitation preview.

## 22. Final readiness

PROMPT 15B COMPLETE

P0-001 anonymous SECURITY DEFINER exposure: CLOSED
SECURITY DEFINER functions: 87 live catalog / 84 public application
Anon-executable before: 58
Anon-executable after: 1
Unintended anon-executable: 0
Internal helpers exposed to PUBLIC: 0
Internal helpers exposed to authenticated: 0
Anonymous allowlist: get_invitation_preview(uuid) — token-scoped read-only invite preview
transactions_set_is_reversal search_path: FIXED
Anonymous negative matrix: PASS
Authenticated internal-helper negative matrix: PASS
Legitimate parent-path regression: PASS
RPC security: READY
Protected RPC manifest: COMPLETE
Supabase security advisor: PASS WITH EXPLAINED ALLOWLIST
Financial integrity: PASS
Migration alignment: PASS
Remaining P0 blockers: NONE
Can proceed to V1 critical-flow stabilization: YES

