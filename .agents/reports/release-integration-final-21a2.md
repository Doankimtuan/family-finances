# RELEASE 21A.2 — Final Integration Re-certification

Date: 2026-08-24  
Scope: final integration gate after RELEASE 21A.1  
Verdict: **INTEGRATION REFERENCE READY**

## Severity summary

- P0: 0
- P1: 0
- P2: 0 release blockers

## Financial semantics and position consistency

PASS. The focused cross-module suite passed **43 files / 486 tests**. The
certified module reports and focused contracts remain consistent for:

- opening balance as account position, without synthetic opening transactions;
- Income/Expense, transfer, and credit-card purchase/payment semantics;
- Savings principal, interest, tax, fee, settlement, and rollover;
- Investment buy/sell/fee/income/valuation;
- Loan principal/interest and Debt principal direction;
- Accounts, Money summaries, Home summaries, specialized positions, and Inbox
  source/read models.

No sign-based classification was introduced. Unrealized valuation is not cash
or Income, and UNKNOWN/stale/manual/partial valuation is not converted to zero.
No double-counting or missing specialized position was found in the focused
contracts or release journey.

## Lifecycle, ownership, privacy, and navigation

PASS. Focused lifecycle and ownership contracts, the latest reference-ready
module reports, and browser journeys cover Savings, Investments, Loans, Debt,
Plan, Inbox, Together, former-member/owner-unavailable states, and privacy
ON/OFF behavior. Partial-failure contracts preserve unaffected Home, Money,
Inbox, and typed valuation states. Query-shape contracts remain green for
summary reads, bounded transaction/Inbox pagination, and Plan linked-source
access.

The Together role-change root cause was a stale dynamic-page refresh path, not
a backend ownership defect. Remote reproduction showed the RPC left both
active memberships as `admin`, and an authenticated read returned both rows.
The smallest fix explicitly revalidates the Together members page; the E2E
uses a real page reload and visible canonical controls. Admin continuity and
ownership rules were preserved.

## Migration and remote security

PASS.

- Linked migration history is aligned, including the previously remote-only
  versions `20260824043331`, `20260824045908`, and `20260824062441`.
- `supabase db push --linked --dry-run` reports **Remote database is up to
  date**.
- No linked database reset, unrelated data drop, or blind schema duplication
  was used.
- All **55/55** public tables have RLS enabled.
- All **99/99** public SECURITY DEFINER functions have an explicit pinned
  `search_path`; the unpinned set is empty.
- `change_goal_lifecycle(uuid,text)`,
  `change_household_member_role(uuid,text)`, and
  `reassign_goal_funding_source(uuid,uuid,uuid)` use
  `search_path=""`, retain `SECURITY DEFINER`, preserve authenticated and
  service-role grants, and have no anon/public execute grant.
- No public executable SECURITY DEFINER function remains except the documented
  anonymous read-only `get_invitation_preview(uuid)` exception.
- Protected mutation RPC ACL verification has zero violations; ownership and
  membership predicates remain covered by the ownership contract suite.

The additional ACL migration removes two unintended anonymous read grants from
`get_investment_home_summary_inputs()` and `is_month_ritual_locked(uuid,date)`;
authenticated access and function behavior remain unchanged.

## Browser release certification

PASS.

- Complete release journey: **11/11 passed** serially.
- Together authenticated lifecycle: **1/1 passed**, including invite,
  ownership, former-member, role change, privacy, navigation, and cleanup.
- Credit-card canonical account controls: **4/4 passed** at 390, 440, 768,
  and 1280px. One optional existing-card inspection was skipped because the
  configured household has no existing card; production UI was not changed to
  restore radio controls.
- Release coverage passed account/opening position, Income/Expense, transfer,
  Savings, Investments, Loans, Debt, Plan, Inbox, health, privacy/navigation,
  raw-key, duplicate-test-id, and horizontal-overflow checks.

## Validation

- Focused cross-module suite: **43/43 files, 486/486 tests passed**.
- Full unit suite: **158/158 files, 1113/1113 tests passed**.
- Repository lint: passed.
- Typecheck: passed.
- Production build: passed.
- `git diff --check`: passed.

## Fixture cleanup

PASS. Final remote cleanup query returned zero controlled households,
memberships, accounts, transactions, Inbox rows, and invitations for the
release/Together fixture names. The harness retained only its dedicated auth
identities for repeatable test use; no unrelated development data was touched.

## Unrelated advisor notices

No unrelated advisor finding was changed in 21A.2. Existing module reports
retain their separate notes about market-data deployment prerequisites,
performance/index advisors, and Auth-provider password-protection advice.
