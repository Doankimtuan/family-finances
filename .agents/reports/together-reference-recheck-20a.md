# TOGETHER 20A — Final Reference Recheck

Date: 2026-08-24

## Verdict

`TOGETHER AUDIT COMPLETE`

`TOGETHER-20A-P2-001` is closed. The existing `OWNERSHIP_TEST_A/B` users were
not used, moved, rewritten, removed, or attached to the disposable household.

## Disposable fixture recovery

- Reused dedicated Auth identities `ownership-20a1-a@example.com` and
  `ownership-20a1-b@example.com`; Auth users are retained for deterministic
  reruns and their test-owned password state is reset by setup.
- Setup creates the owner household through
  `create_household_with_essentials`; it does not insert or rewrite membership
  rows directly.
- B becomes active only through the browser invitation/accept path.
- Service-role setup seeds only the disposable B-owned account and Inbox source
  after acceptance; service role is used for fixture data and scoped cleanup.
- Cleanup refuses a household containing any non-disposable user, removes only
  the named disposable household data, deletes the local credential file, and
  retains the two Auth users.
- Post-cleanup remote check: 2 disposable Auth users, 0 membership rows, and 0
  `Together 20A Disposable Fixture` households.

## Focused contract checks

17 focused unit files passed, 229 tests total:

- Together membership lifecycle and invitation terminal/idempotent behavior
- ownership RLS/RPC/schema/UI contracts and RPC ACL hardening
- former-member/rejoin ownership behavior
- Inbox capability, producer, error, and integration contracts
- privacy masking and Money IA privacy
- English/Vietnamese catalog checks and tenancy error handling

The existing contract suite covers fail-closed active-membership predicates,
cross-household isolation, unchanged personal ownership, former-member access,
Inbox read-state independence, and unauthorized role escalation.

## Remote Supabase verification

Project: `bbzffxvgocjwsdbujvgn`

Read-only catalog verification passed for the affected Together paths:

- `households`, `household_members`, and `household_invitations` have RLS
  enabled.
- `create_household_with_essentials`, invitation create/accept, leave, remove,
  and role-change RPCs are `SECURITY DEFINER`, derive identity from
  `auth.uid()`, and have pinned `search_path` (`public`, with the role-change
  RPC pinned to the empty path).
- Those lifecycle mutations are executable by `authenticated` only; anon and
  public execution are false.
- `get_invitation_preview(uuid)` is the sole anonymous exception and returns
  only `household_name`, `invite_email`, `status`, `expires_at`, and
  `is_expired`.
- Household and membership reads are scoped to `is_household_member(...)`.
- Security advisors showed only the expected authenticated SECURITY DEFINER
  notices, the intentional anonymous invitation-preview notice, and unrelated
  pre-existing project findings (`market_sync_locks` without policies and Auth
  leaked-password protection disabled).

## Browser certification

Command:

```text
E2E_BASE_URL=http://localhost:3100 E2E_PORT=3100 npm run test:e2e -- tests/e2e/together-lifecycle.authenticated.spec.ts
```

Result: **1 passed** in the final run. The disposable flow covered:

- owner setup, invitation creation, token-scoped preview, revoke, accept, and
  retry rejection with exactly one active B membership;
- household access, B personal ownership (`Personal · You`), no B mutation
  controls, remove, former-member read-only account, owner-unavailable Inbox,
  rejoin, role promotion, Admin continuity, and final owner leave;
- 390px VI/light with reduced motion and privacy ON/OFF masking;
- 440px EN/dark role/admin/remove/leave/rejoin state with no raw i18n keys;
- 768px and 1280px regression member surfaces;
- no horizontal overflow in the certified viewport checks.

Evidence files:

- `output/playwright/together-20a-members-390.png`
- `output/playwright/together-20a-members-440.png`
- `output/playwright/together-20a-members-768.png`
- `output/playwright/together-20a-members-1280.png`

## Validation

- Focused unit checks: **17 files / 229 tests passed**.
- Focused authenticated Together E2E: **1 passed**.
- Changed-file ESLint: **passed**.
- Typecheck: **passed**.
- Build: **passed**.
- Full unit suite and repository-wide lint: **not run**, per 20A.1.
- Product semantics: unchanged; only the disposable fixture/harness and focused
  certification were updated.

No further work remains for 20A.1. Future Together certification should use
the fresh dedicated identities and preserve the existing membership safety rule.
