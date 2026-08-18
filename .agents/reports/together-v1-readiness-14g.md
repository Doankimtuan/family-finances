# Together V1 Readiness — Prompt 14G

## 1. Executive summary

Prompt 14G is complete. Together membership lifecycle behavior remains unchanged and certified security boundaries remain authoritative. The polish adds a shared former-member presentation state, removes misleading Inbox execution affordances for inactive personal owners, clarifies solo-Admin behavior, and commits an authenticated A/B browser lifecycle fixture.

No ownership transfer, deletion, new role, hidden finance, or financial authorization path was added.

## 2. Former-member presentation

Personal resources whose `owner_membership_id` points to an inactive membership now resolve to the shared presentation state `ownerStatus: "former"`.

User-facing presentation is:

- English: `Personal · Former member`
- Vietnamese: `Cá nhân · Thành viên cũ`
- Detail explanation: the item belongs to a former household member, remains viewable, and financial changes are unavailable.

The UI does not expose membership IDs, foreign keys, inactive-membership terminology, or “orphaned resource” language.

The active Together screen continues to show active members and pending invitations only. Former identity appears where needed on financial resources and lifecycle context rather than as a full membership-history list.

## 3. Shared ownership presentation model

`FinancialCapabilities` now includes the minimal presentation field `ownerStatus` with `active` and `former` values. `canMutate` remains derived from ownership and active membership state; no generic permission framework was introduced.

Resource queries resolve active owner membership IDs within the current household. The scope is household-filtered, so ownership history from another household cannot affect presentation.

## 4. Financial resource UX

The reusable ownership badge is applied to account, savings, investment, loan, and liability list/detail surfaces. Former-member detail surfaces show the short read-only explanation.

For former-owner personal resources, normal mutation affordances are absent:

- accounts: no transaction/edit/transfer/settlement controls;
- savings: no withdraw/renew/rollover/settlement controls;
- investments: no buy/sell/income/conversion controls;
- loans: no payment/edit/status mutation controls;
- liabilities: no payment or ordinary edit controls.

The existing server/RPC authorization remains authoritative if a stale client attempts a mutation. Admin cleanup remains an operational capability only; no cleanup UI was added or presented as financial control.

## 5. Inbox owner-unavailable behavior

Inbox source capability is derived once from the underlying source resource. Personal transaction items resolve through the source account; savings maturity and early-withdrawal items resolve through the source saving. The shared state is:

```text
sourceOwnerActive
ownerUnavailable
canExecuteOutcome
```

An inactive personal owner produces a visible, non-actionable attention card:

- English: `Owner unavailable · read-only`
- Vietnamese: `Chủ sở hữu không còn trong hộ · chỉ xem`

The detail panel shows an informational explanation and no normal Confirm/Resolve CTA. The item is not auto-dismissed.

Household informational items preserve their existing semantics. `emi_complete` is not marked owner-unavailable merely because its loan had a former owner. Emergency and other household attention items remain household-level.

## 6. Savings/loan edge cases

`savings_maturity` and `early_withdrawal_confirmation` are blocked when their personal saving owner is inactive. The UI does not imply that the remaining partner can renew, withdraw, settle, or roll the saving.

Existing expiry/staleness behavior remains the terminal path for stale or unresolvable Inbox items. No financial override or reassignment was added.

Loan and liability former-owner detail pages retain view-only presentation. Household informational EMI acknowledgement remains available according to its existing contract.

## 7. Together UX polish

Leave/remove confirmations retain concise, explicit copy:

- access is lost immediately;
- personal resources remain in the household record;
- resources remain personal and do not transfer;
- active savings, loans, and liabilities may still need follow-up;
- leaving does not settle obligations.

The normal Together member screen focuses on current active members and pending invitations. Former members are not added to the primary member list.

## 8. Household deletion V1 decision

Household deletion is explicitly deferred from V1. There is no Delete Household CTA.

When a solo Admin attempts to leave, the UI explains that household closure is not available yet. The Admin remains blocked from leaving, consistent with the certified lifecycle contract.

## 9. Role transfer UX

For a two-member household with one Admin, the Admin’s leave control is replaced by an explicit explanation to promote another member to Admin first. The existing `Make Admin` control on the other member provides the path. No auto-promotion occurs.

## 10. Rejoin UX

The authenticated lifecycle test verifies that a removed partner can be reinvited and accept the invitation. The same membership lifecycle contract restores the prior membership identity: the former-member badge disappears, the resource returns to `Personal · You`, and owner capabilities are restored without rewriting the resource row.

## 11. Authenticated E2E fixture

Committed files:

- `tests/e2e/fixtures/together-lifecycle.ts`
- `tests/e2e/together-lifecycle.authenticated.spec.ts`

The fixture loads dedicated A/B credentials, runs the existing `scripts/ownership-test-harness.mjs` setup/cleanup, and authenticates both browser contexts through the normal login flow. Service-role access is limited to isolated fixture provisioning and cleanup; it is never used for browser user actions. Dedicated Auth identities remain persistent under the existing harness policy.

Covered browser flow:

- Admin controls versus Partner controls;
- remove/leave access lifecycle;
- former-member resource badge and read-only detail;
- owner-unavailable Inbox item;
- invite pending and revoke;
- rejoin and owner restoration;
- Admin promotion and Admin continuity.

## 12. Browser validation

Passed:

```text
npm run test:e2e -- tests/e2e/together-lifecycle.authenticated.spec.ts
1 passed
```

Captured browser evidence:

- `output/playwright/together-14g-members-390.png`
- `output/playwright/together-14g-members-440.png`
- `output/playwright/together-14g-members-768.png`
- `output/playwright/together-14g-members-1280.png`
- `output/playwright/together-14g-remove-confirmation-440.png`
- `output/playwright/together-14g-former-member-detail-440.png`
- `output/playwright/together-14g-owner-unavailable-inbox-440.png`

The former-member detail and Inbox screenshots were visually inspected after the authenticated run. The state-change UI is static and explanatory; no additional motion was needed, so no Motion Foundation token or animation change was introduced.

## 13. Localization/accessibility

English and Vietnamese copy was added for former-member, owner-unavailable, solo-Admin closure, and Admin-transfer states. Former-member badges have an accessible label. Blocked Inbox items are rendered as non-links with explicit text rather than a color-only disabled state. Leave/remove confirmations retain explicit titles. Existing HeroUI controls provide keyboard-accessible role transfer and lifecycle actions.

## 14. Security regression

Validation completed:

```text
npm run typecheck       PASS
npm run lint            PASS
npm run test            PASS — 119 files, 898 tests
```

The full unit run includes the ownership schema, RLS, RPC manifest, Together lifecycle, Inbox, Plan, and Health suites. No migration or RPC authorization behavior was changed by 14G.

Required certified state remains:

```text
RPC security = READY
Protected RPC manifest = COMPLETE
Trigger bypass = NONE
```

The repository-wide Prettier check still reports the pre-existing formatting backlog across unrelated files; changed 14G files pass targeted formatting and lint checks.

## 15. Final V1 readiness matrix

| Area                                       | Status   | Evidence                                                       |
| ------------------------------------------ | -------- | -------------------------------------------------------------- |
| Household creation                         | PASS     | Existing 14F lifecycle and full regression suite               |
| Invite / revoke                            | PASS     | Authenticated lifecycle E2E                                    |
| Role management                            | PASS     | Authenticated lifecycle E2E and lifecycle unit tests           |
| Leave / remove                             | PASS     | Authenticated lifecycle E2E and lifecycle unit tests           |
| Rejoin                                     | PASS     | Authenticated lifecycle E2E; same membership contract retained |
| Capacity                                   | PASS     | Existing Together constants and lifecycle tests                |
| Admin continuity                           | PASS     | Authenticated lifecycle E2E and explicit blocked UI            |
| Household / Personal creation              | PASS     | Shared ownership model and existing 14E tests                  |
| Owner-derived security                     | PASS     | Existing certified RPC/RLS tests; no auth redesign             |
| Partner read-only                          | PASS     | Existing ownership application tests and UI                    |
| Former-member read-only                    | PASS     | New owner status model, UI, and browser evidence               |
| Rejoin authority restoration               | PASS     | Authenticated lifecycle E2E                                    |
| Household Inbox attention                  | PASS     | Existing Inbox regression suite                                |
| Personal-source Inbox ownership            | PASS     | Shared source capability derivation and E2E fixture            |
| Inactive-owner explanation                 | PASS     | Inbox UI and browser evidence                                  |
| No generic activity feed                   | PASS     | No feed introduced                                             |
| Plan remains household-only                | PASS     | Existing Plan regression suite                                 |
| Health includes visible personal resources | PASS     | Existing Health contract and regression suite                  |
| RPC security                               | READY    | Certified 14F state retained                                   |
| Protected RPC manifest                     | COMPLETE | Certified 14F state retained                                   |
| Trigger bypass                             | NONE     | Certified 14F state retained                                   |

## 16. Deferred V1 scope

Explicitly deferred and not release blockers:

- household deletion;
- ownership transfer;
- personal goals;
- personal Plan/jars;
- hidden/private personal finances;
- children/dependents;
- generic member activity history/feed;
- more than two household members.

## 17. Remaining non-blocking debt

- Admin cleanup remains operational-only and has no dedicated UI; this is intentional for V1.
- Former-owner status depends on the active-membership enrichment query; a transient enrichment failure fails safe without granting mutation authority, and a refresh restores the current presentation.
- The existing repository-wide formatting backlog remains outside 14G scope.

## 18. Final verdict

PROMPT 14G COMPLETE

Former-member UX: PASS

Owner-unavailable Inbox UX: PASS

Leave/remove confirmations: PASS

Admin continuity UX: PASS

Rejoin UX: PASS

Household deletion V1 policy: PASS

Authenticated lifecycle E2E: PASS

Localization/accessibility: PASS

RPC security: READY

Protected RPC manifest: COMPLETE

V1 readiness: READY

Remaining blocking gaps: None.

Remaining non-blocking debt: Operational-only Admin cleanup UI; transient enrichment fallback; existing repository-wide formatting backlog.

Recommended next prompt: Prompt 15A — Final Product Readiness / Release Audit
