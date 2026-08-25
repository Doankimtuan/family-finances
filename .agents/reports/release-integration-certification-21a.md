# Release 21A.1 — Schema Alignment + Security + Release Harness Recovery

Date: 2026-08-24

## Verdict

**INTEGRATION RECERTIFICATION READY**

## Results

### Migration history

PASS.

- `supabase migration fetch --linked` imported the three remote-only migration
  files: `20260824043331`, `20260824045908`, and `20260824062441`.
- Their SQL effects were compared with the corresponding local migrations and
  the live catalog; no blind duplicate schema change was applied.
- Semantically duplicate local-only migration entries were repaired as
  `applied` in the linked migration ledger. This changed migration metadata
  only; it did not reset the database, drop data, or rewrite certified modules.
- `supabase migration list --linked`: local and remote histories aligned.
- `supabase db push --linked --dry-run`: `Remote database is up to date.`

### SECURITY DEFINER search paths

PASS.

Migration `supabase/migrations/20260824155343_release_21a_security_path.sql`
explicitly pins the three release targets to the narrowest safe path:

| Function                                         | Remote status                        | ACL status                                 |
| ------------------------------------------------ | ------------------------------------ | ------------------------------------------ |
| `change_goal_lifecycle(uuid, text)`              | `SECURITY DEFINER`, `search_path=""` | anon/public denied; authenticated retained |
| `change_household_member_role(uuid, text)`       | `SECURITY DEFINER`, `search_path=""` | anon/public denied; authenticated retained |
| `reassign_goal_funding_source(uuid, uuid, uuid)` | `SECURITY DEFINER`, `search_path=""` | anon/public denied; authenticated retained |

All referenced objects are schema-qualified. The remote catalog reports 99/99
public SECURITY DEFINER functions with an explicit `search_path` setting, no
public execution grants, and exactly one anonymous execution grant:
`get_invitation_preview(uuid)`, the intentional token-scoped read-only
exception.

### Together role-change root cause

PASS — stale refresh/revalidation, not a backend state defect.

The remote RPC was reproduced directly. After changing the partner role, the
remote membership rows contained two active Admins. The members page read the
correct rows, but the Server Action did not invalidate the localized members
route before the client refresh/navigation sequence. The minimal fix adds
scoped `revalidatePath` for the current locale’s Together members route.

`tests/e2e/together-lifecycle.authenticated.spec.ts`: **1 passed**,
including the previously failing role-change assertion and cleanup.

### Release E2E

PASS.

`tests/e2e/v1-critical-flow.release.spec.ts`: **11 passed, 0 failed, 0
skipped** in serial mode.

The completed journey covered account/opening position, Income/Expense,
transfer, Savings, Investments, Loans, Debt, Plan, Inbox, Together/ownership,
privacy/navigation, test-ID integrity, and responsive single-column states.

The separate non-destructive credit-card smoke passed its four canonical
account-control checks at 390px, 440px, 768px, and 1280px. Its optional
existing-card installment inspection skipped because the configured E2E
household has no card account; the certified focused card checks remained
green and no card defect was found.

The release fixture was updated to select the current account Select variant
when five accounts exist. Other stale expectations were updated to current
canonical test contracts (`capture-mode-income`, Inbox heading, and Money page
root test ID). Production UI and certified financial semantics were not
redesigned or changed.

### Remote security/RLS

PASS.

- Public tables: **55/55 RLS-enabled**, 0 disabled.
- Public SECURITY DEFINER functions: **99/99 pinned**.
- Anonymous executable SECURITY DEFINER functions: **1**, only
  `get_invitation_preview(uuid)`.
- Public executable SECURITY DEFINER functions: **0**.
- Target mutation RPCs retain authenticated execution and deny anon/public
  execution.

Unrelated advisor findings remain outside 21A.1 scope, including performance
index notices, the existing Auth leaked-password-protection notice, and any
non-SECURITY-DEFINER advisor item. They were not changed.

### Cleanup

PASS.

The controlled release and Together households were removed. A final remote
catalog check found **0 controlled households** and **0 controlled Inbox
fixture rows**. Controlled memberships and fixture-owned rows were removed;
test auth users were retained by the existing harness policy. The Together 20A
credential file was removed after cleanup. Unrelated development data was not
touched.

### Validation

PASS.

- Focused migration/security/Plan/Together/RPC contracts: **7 files, 92 tests
  passed**.
- Together authenticated lifecycle E2E: **1 passed**.
- Release E2E: **11 passed**.
- Credit-card canonical controls: **4 passed**, optional no-card inspection
  skipped.
- Remote migration dry-run: **up to date**.
- Remote RPC/RLS catalog verification: **passed**.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.

Stop after 21A.1.
