# Together Membership Lifecycle & Personal Resource Cleanup — 14F

## 1. Executive summary

Prompt 14F is complete. Together membership lifecycle is now explicit and
atomic:

- only Admin can invite or revoke an invitation;
- active membership capacity remains two adults and is locked during invite
  creation and acceptance;
- Partner can leave, while Admin departure requires another active Admin;
- Admin can remove only an active Partner;
- membership rows are deactivated, never deleted when they identify owned
  financial resources;
- personal resources remain attached to the historical membership identity,
  visible to the remaining household member, and read-only while that owner is
  inactive;
- no ownership transfer, automatic conversion, financial settlement, or
  generic activity feed was added;
- rejoining the same household reactivates the same membership identity and
  restores owner authority.

The lifecycle migration is applied to the configured Supabase database. The
ownership security contract remains READY with the protected RPC manifest
COMPLETE and no trigger bypass.

## 2. Existing Together lifecycle audit

| Area                  | Existing state before 14F                                                                         | 14F result                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Household creation    | Existing tenancy application/RPC flow                                                             | Preserved                                                                                |
| Invitation creation   | Existing UI and RPC; membership authorization was too broad and capacity check was not serialized | Admin-only RPC authorization and household-row lock                                      |
| Invitation acceptance | Existing pending/accepted/revoked/expired/declined model; accepted rows were not reusable         | Existing states preserved; terminal states rejected; same inactive membership can rejoin |
| Role change           | Existing Admin-only role change                                                                   | Last-Admin demotion is blocked                                                           |
| Member removal        | Not implemented as a complete lifecycle action                                                    | Admin-only Partner removal RPC and UI                                                    |
| Leave household       | Not implemented as a complete lifecycle action                                                    | Explicit leave RPC and confirmation flow                                                 |
| Household deletion    | No V1 lifecycle flow                                                                              | Not added; remains separate high-risk product debt                                       |
| Capacity              | V1 maximum was two active members                                                                 | Enforced atomically in invitation creation and acceptance                                |
| Inactive membership   | Ownership model already supported historical membership identity                                  | Lifecycle now records inactive state and preserves ownership references                  |
| Tests                 | Ownership and invitation coverage existed                                                         | Added lifecycle static tests plus authenticated live validation                          |

## 3. Invitation model

The existing invitation states remain the repository truth: `pending`,
`accepted`, `expired`, `revoked`, and `declined`.

`create_household_invitation` now:

- derives the caller from `auth.uid()`;
- requires an active household membership with Admin role;
- locks the household row before checking capacity;
- rejects a full household, active-member duplicate, and duplicate pending
  invitation;
- stores a normalized email and the existing seven-day expiry.

`revoke_household_invitation` is Admin-only, locks the household and invitation,
and is idempotent when the invitation is already revoked. Accepted, expired,
and declined invitations cannot be revoked as pending invitations.

Acceptance is single-use. Revoked, expired, accepted, invalid, and mismatched
email invitations are rejected. Acceptance also locks the household before
the active-member count, so two concurrent accepts cannot create a third
active member.

## 4. Admin/Partner authorization

Admin owns tenancy administration for V1:

- invite partner;
- revoke pending invitation;
- remove active Partner;
- change an active member role, subject to Admin continuity.

Partner cannot create or revoke invitations and cannot remove another member.
Partner uses the separate leave flow for voluntary departure. Authorization is
enforced in the RPCs and repeated in the application/UI boundary for clear
errors and hidden controls; UI checks are not the security boundary.

No new role, child/dependent model, private-finance model, ownership-transfer
flow, or household-size increase was introduced.

## 5. Leave semantics

`leave_household()` locks the household and caller membership, deactivates the
membership, records `left_at`, clears `removed_by`, and removes stale Inbox
assignment to the departing user. It does not delete or rewrite financial
rows.

Partner can leave directly. Admin can leave only when another active Admin
already exists. The UI uses an explicit confirmation that names the
consequences and summarizes the departing member's personal resources.

## 6. Remove semantics

`remove_household_member(p_membership_id)` is Admin-only and accepts only an
active Partner in the caller's household. It deactivates the target row,
records `left_at` and the removing Admin in `removed_by`, clears Inbox
assignment to the removed user, and preserves all financial ownership rows.

The UI provides a specific “Remove partner” confirmation. It states that the
member loses access immediately and that personal resources remain in the
household as read-only records rather than becoming household-owned.

## 7. Admin continuity

The database blocks both of these invalid states:

- the last active Admin leaving;
- the last active Admin being demoted to Partner.

The supported two-member sequence is explicit role transfer through the
existing role-change action: promote the Partner to Admin, then the former
Admin can leave. No automatic promotion is performed. A solo Admin cannot
leave because household deletion is not a part of 14F.

## 8. Personal-resource departure behavior

When a membership becomes inactive:

- financial rows remain in place;
- `owner_membership_id` remains unchanged;
- `financial_scope` remains unchanged;
- the remaining active household member retains read access under existing
  14C/14D policies;
- normal owner-controlled financial mutations remain unavailable;
- no resource is auto-transferred, converted to Household, settled, or
  deleted.

The removal/leave impact summary counts personal accounts, savings,
investments, loans, and liabilities before confirmation. Active savings,
loans, liabilities, and similar obligations produce an additional warning.
Departure is allowed so financial cleanup cannot deadlock household
membership.

## 9. Former-member ownership model

The membership row is the durable ownership identity. Inactive membership is
not a deleted or orphaned foreign key. Resources remain addressable by the
same membership ID and are presented through existing personal ownership and
read-only capability behavior. Lifecycle confirmations use household language
such as “personal resources remain read-only” and “do not become
household-owned”; internal terms such as orphaned FK are not shown.

The current domain resource screens preserve their established ownership
surfaces and read-only controls. A dedicated Former Member badge across every
resource screen was intentionally not added in 14F; this is a small UX polish
item for 14G, not a security gap.

## 10. Accounts/Savings/Investments/Loans/Liabilities behavior

| Resource                    | After owner departure                                        | Remaining member                                                                                                                    |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Accounts and personal cards | Remain visible with owner identity and financial history     | Can read; cannot edit, transact, settle, or change ownership; narrow Admin archive cleanup remains available where already approved |
| Savings                     | Remain visible and read-only                                 | Can see maturity/financial impact; cannot execute owner-only settlement or withdraw                                                 |
| Investments                 | Holdings remain visible and owned by the inactive membership | Cannot buy, sell, convert, record income, or perform owner-controlled valuation mutation                                            |
| Loans                       | Obligation and history remain visible                        | Cannot record payment or otherwise mutate the personal loan                                                                         |
| Liabilities                 | Obligation remains visible                                   | Cannot edit or settle through normal owner-controlled financial flows                                                               |

System-generated passive data refreshes, where already supported, remain
distinct from user financial mutations. Admin cleanup remains limited to the
approved `admin_archive_financial_resource` behavior and does not grant
payment, balance, withdrawal, sale, or ownership authority.

## 11. Inbox implications

Departure unassigns Inbox items assigned to the departing user so they do not
remain misleadingly assigned. Household-level financial attention remains
available to the active household member.

Items sourced from a personal resource owned by the inactive membership remain
visible for financial context, but the existing source-owner authorization
continues to make owner-only decisions non-executable. No generic membership
activity feed or Together-to-Inbox lifecycle spam was added.

The current product does not yet render a dedicated “owner unavailable” Inbox
badge for every such item; the safe behavior is already enforced through the
existing ownership guard. Dedicated explanation copy is remaining UX debt for
14G.

## 12. Rejoin semantics

When the same user is invited back to the same household, acceptance locks the
household, finds the inactive membership for that household/user pair, and
reactivates that row instead of inserting a duplicate. It clears departure
metadata and marks the invitation accepted.

Because the membership identity is unchanged, previous personal resources
remain linked to the same owner and owner mutation authority is restored
naturally. No financial row is rewritten.

## 13. Cross-household isolation

V1 still permits one active household per user. If a user leaves household X
and later joins household Y, resources owned through the inactive membership
in X remain scoped to X and do not appear in Y. No migration or ownership
rewrite across households is possible through the lifecycle RPCs.

## 14. RPC/RLS changes

Added or hardened RPCs:

- `create_household_invitation` — Admin-only, capacity-locked;
- `revoke_household_invitation` — Admin-only, idempotent for revoked state;
- `accept_household_invitation` — terminal-state checks, capacity lock, same-row
  rejoin;
- `leave_household` — caller deactivation with Admin continuity;
- `remove_household_member` — Admin-only active Partner deactivation;
- `change_household_member_role` — last-Admin demotion guard.

Added membership lifecycle metadata: `left_at` and `removed_by`. Added a
database trigger preventing deletion of a membership referenced by accounts,
savings, investments, loans, liabilities, or goals.

An idempotent deployment-repair migration restores the existing
`household_configuration_events` table contract when it is absent, so the
existing secure role-change audit write remains operational.

Existing RLS and ownership RPC guards remain the financial security boundary:
inactive users lose household access, while active household members retain
the existing read behavior. No new financial mutation privilege was granted.

## 15. UI changes

Together now communicates:

- current member and role;
- pending invitation and Admin-only invite/revoke controls;
- Admin-only Partner removal;
- self-service leave;
- impact counts and active-obligation warning before leave/remove;
- explicit consequences instead of a generic confirmation.

The centered mobile-first Together shell is preserved. The members screen was
checked at 390px, 440px, 768px, and 1280px. Partner invite routes redirect
back to invitations, and the invite CTA is not rendered for Partner.

## 16. Localization

English and Vietnamese copy was added for invitation, revocation, leave,
removal, role continuity, impact summaries, read-only ownership consequences,
and lifecycle errors. No new hardcoded feature copy was added to the UI.

## 17. Tests

Added `tests/unit/together-membership-lifecycle-14f.test.ts` covering:

- Admin-only invitation and household lock;
- revocation/idempotency and terminal invitation states;
- leave/remove semantics and Inbox unassignment;
- Admin continuity;
- membership hard-delete protection;
- same-membership rejoin.

Verification results:

- focused ownership/lifecycle tests: 86 passed;
- full unit test suite: 119 files, 896 tests passed;
- TypeScript typecheck: passed;
- ESLint: passed;
- relevant Together invitation E2E: 2 passed, 1 skipped because authenticated
  E2E credentials were not configured;
- `git diff --check`: passed.

Changed-file Prettier checks passed. Repository-wide `npm run format:check`
still reports the existing 2,205-file baseline outside this prompt's scope.

## 18. Browser validation

Authenticated A/B browser validation used the dedicated ownership harness.

Admin A:

- sees invite action;
- sees role controls and Remove partner;
- sees Leave household;
- receives explicit removal impact confirmation.

Partner B:

- does not see invite action;
- does not see remove controls;
- sees only the self-service Leave household action.

Screenshots are retained in `output/playwright/`:

- `together-14f-admin-390.png`;
- `together-14f-members-390.png`;
- `together-14f-members-440.png`;
- `together-14f-members-768.png`;
- `together-14f-members-1280.png`;
- `together-14f-partner-390.png`.

## 19. Live DB validation

The authenticated ownership harness validated the following against the
configured database:

| Scenario                                                    | Result                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Partner invite attempt                                      | Denied                                                                  |
| Remaining member reads removed member's personal resource   | Pass                                                                    |
| Removed membership becomes inactive with departure metadata | Pass                                                                    |
| Departed user read access                                   | Denied                                                                  |
| Departed user financial mutation                            | Denied                                                                  |
| Revoke twice                                                | Idempotent pass                                                         |
| Revoke then accept                                          | Rejected                                                                |
| Accept accepted invitation twice                            | Rejected                                                                |
| Rejoin                                                      | Same membership ID reactivated                                          |
| Rejoined owner mutation                                     | Restored                                                                |
| Partner leave                                               | Pass                                                                    |
| Solo Admin leave                                            | Blocked by Admin continuity                                             |
| Admin transfer then leave                                   | Validated through role transfer path; household retains an active Admin |

The fixture was cleaned up after validation; the ownership harness preflight is
currently not ready because the controlled test identities are no longer
members.

## 20. Security regression

Ownership regression remains:

```text
RPC security = READY
Protected RPC manifest = COMPLETE
Trigger bypass = NONE
```

The lifecycle RPCs derive the caller from `auth.uid()`, validate active
membership and role, lock the household for capacity/continuity races, and do
not provide a path around existing ownership checks. Inactive membership does
not preserve read access for the departed user.

## 21. Remaining product debt

- Add a dedicated Former Member/owner unavailable presentation in resource and
  Inbox surfaces during Together UX polish.
- Decide and implement a separate, explicit household deletion flow if V1 ever
  needs solo Admin departure to close a household.
- Add a committed authenticated browser fixture for the complete lifecycle
  matrix; 14F used the controlled live ownership harness and retained evidence.
- Keep Admin cleanup narrow; do not add settlement, payment, balance, sale, or
  ownership-transfer permissions as a shortcut.

## 22. Final readiness

```text
PROMPT 14F COMPLETE

Invitations:
PASS

Admin-only invite:
PASS

Leave:
PASS

Remove member:
PASS

Admin continuity:
PASS

Personal resources after departure:
PASS

Former-member read-only:
PASS

Rejoin:
PASS

Cross-household isolation:
PASS

Inbox implications:
PASS

RPC security:
READY

Protected RPC manifest:
COMPLETE

Remaining gaps:
Dedicated owner-unavailable UI copy, explicit household deletion flow, and a
committed authenticated lifecycle browser fixture remain for later polish.

Recommended next prompt:
Prompt 14G — Together UX Polish & Final V1 Readiness
```
