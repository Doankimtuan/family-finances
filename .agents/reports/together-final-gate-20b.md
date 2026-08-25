# TOGETHER 20B — Final Reference Gate

Date: 2026-08-24

## Verdict

`TOGETHER REFERENCE READY`

No concrete Together blocker remains in the audited scope.

## Fixture and cleanup

- Dedicated disposable identities were used:
  `ownership-20a1-a@example.com`, `ownership-20a1-b@example.com`, and
  `ownership-20b-c@example.com`.
- A/B use the rerunnable 20A fixture and existing lifecycle RPCs. C uses a
  separate disposable household created through
  `create_household_with_essentials`.
- Existing unrelated memberships were never moved or rewritten.
- C cross-household probe passed: no cross-household read, no cross-household
  mutation, token-minimal anonymous preview, and unrelated invitation accept
  rejected.
- Final cleanup retained only the three test-owned Auth users and verified:
  **0 disposable membership rows** and **0 disposable households**.

## Membership lifecycle

PASS for invite, token-scoped preview, revoke, accept, retry/idempotency,
leave, remove, role change, Admin continuity, rejoin, and former-member state.

Evidence:

- Together authenticated browser certification: **1 passed**.
- The flow verified exactly one active B membership after accept, rejected
  accept retry, reached the canonical accepted invitation state, removed B,
  rejoined B, promoted B, and completed final Admin-continuity leave.
- Focused lifecycle/invitation contracts: passed.
- No duplicate active memberships were left by setup, retry, remove, rejoin,
  or cleanup.

## Ownership and authority

PASS for personal owner, active household non-owner, household-owned resource,
former member, and owner-unavailable behavior.

- Active non-owner personal resources remain readable only where policy allows
  and expose read-only UI; no mutation authority is granted.
- Accounts, Savings, Investments, Loans, Debt, Inbox-linked personal sources,
  Goals, Jars, recommendations, and funding links retain canonical ownership.
- Leave/remove preserves `owner_membership_id`; rejoin restores only the
  intended membership state and does not reassign personal ownership.
- Household resources remain household-scoped and usable by active members;
  personal ownership rules are not applied to household-owned resources.
- Inbox owner-actionable, active non-owner read-only, former-member,
  unavailable-source, read-state independence, and no-mutation-bypass
  contracts passed.
- Plan does not elevate Money authority through Goals, Jars, recommendations,
  or linked funding sources.

The current ownership, Inbox, Plan, Accounts, Savings, Investments, Loans, and
Debt reference reports were read as supporting evidence; their final verdicts
are reference-ready for their respective scopes.

## Remote Supabase security

Project: `bbzffxvgocjwsdbujvgn`

Live read-only catalog verification passed:

- RLS is enabled on all audited Together/ownership-linked tables:
  `households`, `household_members`, `household_invitations`, `accounts`,
  `savings`, `investment_holdings`, `loans`, `liabilities`, `goals`,
  `inbox_items`, `jars`, and `goal_funding_links`.
- Lifecycle SECURITY DEFINER RPCs derive the caller from `auth.uid()`, use
  pinned search paths, and are authenticated-only: create household,
  invitation create/accept/revoke, leave, remove, and role change.
- `get_invitation_preview(uuid)` is read-only, token-scoped, minimal, and the
  only anonymous SECURITY DEFINER function. It exposes only
  `household_name`, `invite_email`, `status`, `expires_at`, and `is_expired`.
- Current policy snapshot uses active-membership predicates for household
  reads and canonical ownership predicates plus `USING`/`WITH CHECK` for
  personal financial mutations.
- No unintended anonymous/public Together mutation execution was found.
- Advisor output contains the intentional invitation-preview notice, expected
  authenticated application-RPC notices, and unrelated pre-existing project
  notices outside Together scope.

## Browser certification

The deterministic authenticated Together flow passed with:

- 390px VI/light, reduced motion, privacy OFF/ON, no horizontal overflow;
- 440px EN/dark, role/admin, remove/leave, former-member, rejoin,
  owner-unavailable Inbox, no raw i18n keys, no horizontal overflow;
- 768px regression;
- 1280px regression.

Covered surfaces include Together home, member list, invitation create/revoke,
preview, accept, active member state, personal read-only state, household
access, remove, leave, former-member state, rejoin, role promotion, Admin
continuity, Inbox capability, and privacy-aware financial output.

The browser fixture assertion was narrowed to the canonical
`#app-viewport-root` after an unscoped test locator encountered duplicate
transition surfaces. This is test-harness scope only; no product semantics or
UI behavior was changed.

Evidence files:

- `output/playwright/together-20a-members-390.png`
- `output/playwright/together-20a-members-440.png`
- `output/playwright/together-20a-members-768.png`
- `output/playwright/together-20a-members-1280.png`

## Validation

Focused Together/ownership/integration/privacy/i18n checks:

- **33 files / 396 tests passed**.
- Included Together lifecycle, invitations/idempotency, ownership RLS/RPC,
  Accounts, Savings, Investments, Loans, Debt, Inbox, Plan, privacy, i18n,
  tenancy, and RPC ACL contracts.

Final-gate validation:

- Full unit suite: **158 files / 1,113 tests passed**.
- Repository lint: **passed**.
- Typecheck: **passed**.
- Production build: **passed**.
- No repository-wide format cleanup was run.

## Final decision

`TOGETHER REFERENCE READY`
