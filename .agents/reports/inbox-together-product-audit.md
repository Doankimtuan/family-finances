# Family Finance — Inbox & Together Product/Architecture Audit

**Status:** Discovery only. No production code, schema, migration, RPC, UI, or test was modified.
**Date:** 2026-08-17
**Scope:** Inbox, Together, and the boundaries they share with Money, Plan, Goals, Savings, Investments, Loans/Cards, and Health.

---

## 1. Executive summary

Inbox and Together have stronger *documented intent* than *implemented behavior*. The repository contains a mature, approved product definition for both domains under `artifacts/current/domains/`. The implementation partially realizes that definition, but several decisions in the database and UI have made the two modules harder to reason about than the specification requires.

**Inbox today** is a single-household review queue with 12 storage kinds, but only a small subset has a complete decision path. It is modeled closer to the intended "decision-bearing financial attention queue" than a generic notification feed, which is good. The main risks are: (1) too many `kind` strings without a matching typed contract or UI action for every kind, (2) unclear unread/read semantics because status is used for both lifecycle and attention state, (3) an implicit ownership model in which almost every financial object is household-wide, leaving no safe way to model partially shared or personal finance, and (4) multiple source domains write directly into `inbox_items` instead of going through a single Inbox domain gateway.

**Together today** is effectively a household-management shell: one household, one or two active members, Admin/Partner roles, invitations, policies, preferences, and settings. It does *not* currently model shared vs personal resources, member-specific visibility, dependents, or joint accounts as a first-class concept. The implemented privacy model is broad household visibility: any active member can read all household-scoped records, and either partner can execute most money actions. That is acceptable for a fully-shared-couple MVP, but it is not a general family/roommate/multi-generation model.

The most important finding is a **product assumption gap**, not a small UI bug: the current data model and RLS collapse "household member" into "has full financial visibility and write authority over all household-scoped objects." There is no explicit `owner`, `visibility`, or `personal` dimension on transactions, accounts, savings, investments, loans, goals, or plans. That makes the current product well suited to a fully-shared couple but structurally unable to represent partially shared couples, parents with children, roommates, or multi-generation households without rework.

A shared domain-event/activity model would help, but should **not** be built as a generic event bus now. The correct next step is to finish the Inbox decision-queue contract and the Together scope/permission contract first, then introduce a minimal event registry only where source domains already write directly into `inbox_items`.

---

## 2. Current Inbox

### 2.1 Architecture

**Application module:** `modules/inbox`

Relevant files:

- `modules/inbox/application/inbox-constants.ts`
- `modules/inbox/application/inbox-types.ts`
- `modules/inbox/application/inbox-display.ts`
- `modules/inbox/application/inbox-resolution-policy.ts`
- `modules/inbox/application/review-item-schemas.ts`
- `modules/inbox/application/queries/review-items.ts`
- `modules/inbox/application/commands/review-items.ts`
- `modules/inbox/application/commands/savings-workflow.ts`
- `modules/inbox/application/workers/resolve-stale-inbox-items.ts`
- `modules/inbox/application/mappers/inbox-item.mapper.ts`
- `modules/inbox/application/inbox-error.ts`
- `modules/inbox/application/index.ts`

**Route surface:**

- `/inbox` — open or archived queue.
- `/inbox/[id]` — detail and decision screen.

**Supporting components:**

- `app/[locale]/(product)/inbox/page.tsx`
- `app/[locale]/(product)/inbox/[id]/page.tsx`
- `app/[locale]/(product)/inbox/actions.ts`
- `app/[locale]/(product)/inbox/inbox-queue-list.tsx`
- `app/[locale]/(product)/inbox/inbox-queue-tabs.tsx`
- `app/[locale]/(product)/inbox/inbox-decision-panel.tsx`
- `app/[locale]/(product)/inbox/inbox-source-link.tsx`
- `app/[locale]/(product)/inbox/inbox-offline-banner.tsx`

**Database surface:**

- Table: `public.inbox_items`
- RPCs:
  - `resolve_inbox_item_to_jar`
  - `dismiss_inbox_item`
  - `acknowledge_inbox_item`
  - `auto_resolve_inbox_item`
  - `run_inbox_staleness_worker`
- Direct-write producers found in migrations:
  - `record_transaction` creates `unmapped_expense` and `income_suggest`
  - `record_installment_payment` creates `emi_complete`
  - `record_loan_payment` creates `emi_complete`
  - `reallocate_jar_capacity` creates `emergency_declaration`
  - `enqueue_savings_maturity` / maturity cascade workers create savings maturity kinds
  - `detect_matured_savings` creates `savings_matured`
  - loan/card payment helpers create `emi_complete`
  - month ritual autolock auto-resolves `unmapped_expense`

### 2.2 Inbox data model

```text
entity: inbox_items
purpose: household financial attention queue
important fields:
  household_id
  kind
  status
  source_type
  source_id
  amount
  currency
  title
  suggested_jar_id
  suggested_category_id
  context_json
  expires_at
  auto_resolved
  confidence_score
  assigned_to_user_id
  resolved_jar_id
  resolved_by
  resolved_at
relationships:
  household_id -> households
  source_id -> domain-specific, not constrained (transaction, savings, plan movement, loan, card)
  suggested_jar_id -> jars
  suggested_category_id -> categories
  assigned_to_user_id -> auth.users
created by: source-domain RPCs or Inbox/savings workflow
consumed by: Inbox queries/commands, owning domain after resolution
lifecycle:
  pending -> resolved | dismissed | acknowledged | auto_resolved | expired | archived
```

Important nuance: `source_id` is not a true foreign key anymore. The migration dropped the original FK so that `guided` and `plan_movement` sources could use non-transaction IDs.

### 2.3 Inbox item kinds actually supported

Storage kinds currently present in the DB check constraints and app constants:

```text
unmapped_expense
income_suggest
savings_maturity
savings_matured
renewal_required
early_withdrawal_confirmation
penalty_warning
rate_changed_suggestion
package_expired
emi_complete
emergency_declaration
payment_reminder
```

Spec `ReviewItemType` values are fewer and cleaner:

```text
UnmappedExpense
MaturityDecision
SavingsMaturityDecision
EarlyWithdrawalConfirmation
PaymentReminder
InstallmentComplete
EmergencyDeclaration
```

The app maps storage kind → spec type in `toReviewItemType`. Several storage kinds (`income_suggest`, `penalty_warning`, `rate_changed_suggestion`, `package_expired`) have no spec type and currently map to `null`.

### 2.4 Inbox UX

Current UI:

- Open/Archived tabs.
- Kind filter chips for a subset:
  - all
  - unmapped_expense
  - income_suggest
  - savings_maturity
  - emi_complete
  - emergency_declaration
  - payment_reminder
- Client-side search.
- Review cards with amount and localized context.
- Detail screen shows:
  - kind-specific "why" question
  - amount context
  - source link where resolvable
  - decision panel for pending items
  - archived status for non-pending items
- Actions:
  - resolve to jar for `unmapped_expense` / `income_suggest`
  - dismiss
  - acknowledge for savings maturity, early withdrawal, EMI complete
  - payment reminder and emergency declaration are informational panels with dismiss available

**Missing UX concepts:**

- No read/unread distinction. `status = pending` is treated as both "active" and "needs attention."
- No severity grouping beyond the kind-specific panel.
- No timestamp in the queue list itself; only source detail can imply time.
- No "Needs attention / Updates / Reminders / System" grouping.
- No archive/dismiss lifetime policy beyond 7-day expiry for payment reminders.
- No explicit duplicate-suppression experience for ordinary volume.
- No delegation or assignment UI despite `assigned_to_user_id` existing for emergency alerts.
- Filtering is client-side and only by a hardcoded subset of kinds; some kinds cannot be filtered.

### 2.5 Supported Inbox workflows

Supported:

- Unmapped expense -> resolve to jar.
- Income placement suggestion -> resolve to jar.
- Savings maturity decision -> confirm configured / switch / withdraw / remind tomorrow.
- Early withdrawal confirmation -> confirm / cancel.
- EMI/loan complete acknowledgement -> celebrate / later.
- Emergency reallocation declaration -> partner-visible alert / solo audit.
- Payment reminder -> informational + expiry.

Partially supported:

- Payment reminder only surfaces context; it does not route to an actionable payment flow.
- Emergency declaration is visible to partner but not otherwise actionable beyond dismiss.
- Several storage kinds have no explicit decision panel path (`penalty_warning`, `rate_changed_suggestion`, `package_expired`).

Not supported:

- Goal events, asset valuation events, plan review events, member invitations, role changes, or policy changes inside Inbox.
- Budget exhaustion, unusually high spending, low cash balance, or goal falling behind as decision items.

### 2.6 What Inbox actually is

The implementation is mostly **C: Action center**, with a small amount of **A: Notification center** for payment reminders and emergency alerts.

It is **not** currently:

- A true activity feed. There is no durable household activity log.
- A communication inbox. There are no messages/comments.
- A broad notification center. Many awareness-only events are deliberately absent, which is correct.

However, the presence of `payment_reminder`, `emergency_declaration`, and `emi_complete` pulls Inbox slightly toward "notification center + action center." The conceptual ambiguity is real but manageable if the rule is enforced: **an Inbox item exists only when there is a valid household outcome.**

---

## 3. Current Together

### 3.1 Architecture

**Application module:** `modules/tenancy` implements Together. There is no separate `modules/together` application module.

Relevant application files:

- `modules/tenancy/application/create-household.ts`
- `modules/tenancy/application/resolve-active-membership.ts`
- `modules/tenancy/application/require-together-membership.ts`
- `modules/tenancy/application/list-household-members.ts`
- `modules/tenancy/application/create-invitation.ts`
- `modules/tenancy/application/accept-invitation.ts`
- `modules/tenancy/application/revoke-invitation.ts`
- `modules/tenancy/application/list-pending-invitations.ts`
- `modules/tenancy/application/get-invitation-preview.ts`
- `modules/tenancy/application/change-household-role.ts`
- `modules/tenancy/application/get-household-policies.ts`
- `modules/tenancy/application/update-household-policies.ts`
- `modules/tenancy/application/get-household-preferences.ts`
- `modules/tenancy/application/update-household-preferences.ts`
- `modules/tenancy/application/list-policy-events.ts`
- `modules/tenancy/application/assert-money-action-allowed.ts`

**Route surface:**

- `/together` — overview.
- `/together/members` — member list and role management.
- `/together/invitations` — pending invitations.
- `/together/invitations/new` — create invitation.
- `/together/policies` — household policies.
- `/together/preferences` — locale, timezone, base currency.
- `/together/settings` — profile/settings.
- `/together/settings/account` — sign out / delete account.
- `/together/onboard` — household creation wizard.
- `/invite/[token]` — invitation acceptance preview flow.

### 3.2 Together domain model

```text
households
  id
  name
  base_currency
  locale
  timezone
  overspend_policy
  month_close_mode
  income_allocate_mode
  created_by
  created_at / updated_at

household_members
  id
  household_id
  user_id
  role (admin | partner)
  is_active
  email snapshot
  display_name snapshot
  joined_at / created_at / updated_at

household_invitations
  id
  household_id
  email
  token
  status (pending | accepted | declined | revoked | expired)
  expires_at
  invited_by
  accepted_by
  created_at / updated_at

household_policy_events
  id
  household_id
  actor_user_id
  event_type (policy.updated)
  payload
  created_at

household_configuration_events
  id
  household_id
  actor_user_id
  target_membership_id
  event_type (preferences.updated | role.changed)
  payload
  created_at
```

### 3.3 Screens and actions

| Screen | Function | Available actions |
| --- | --- | --- |
| Overview | Shows role, household name, member count | Invite CTA if below capacity, links to all sections |
| Members | Lists active members | Admin can toggle Partner/Admin; no remove/leave |
| Invitations | Lists pending non-expired invitations | Create, copy link, revoke |
| Invitation new | Email form | Send invitation |
| Policies | Overspend / month close / income allocation | Admin edit; Partner read-only; policy audit |
| Preferences | Locale, timezone, currency | Admin edit; Partner read-only |
| Settings | Profile and app preferences | Sign out, navigate to account settings |
| Account settings | Account lifecycle | Sign out, delete account |
| Onboard | 3-step household creation | Name, awareness step, account + plan preset |

### 3.4 What Together currently means

Together is closest to **A: Household management** plus a thin slice of **B: Shared financial space via household scope**.

It owns:

- Who the household is.
- Who belongs to it.
- Partner/Admin responsibility.
- Invitation consent.
- Household policies and preferences.

It does **not** own or model:

- Shared vs personal accounts.
- Member-specific balances or contributions.
- Dependents/children.
- Shared goals vs personal goals.
- Shared debts vs personal debts.
- Activity feed or social collaboration.
- Financial relationship dashboard.

The product definition is clear for a **two-partner fully-shared household**, but ambiguous for broader household structures.

---

## 4. Household ownership/privacy matrix

### 4.1 Current evidence

The dominant ownership pattern is:

- Every major financial table carries `household_id`.
- RLS almost universally allows `public.is_household_member(household_id)`.
- `assertMoneyActionAllowed()` returns only `userId` and `householdId`; it does not return role.
- Money mutation RPCs generally check household membership, not Admin role.
- The only Admin-only mutations found are Together policy/preference/role mutations.

This means "active member" is effectively equivalent to "full financial participant" for most product domains.

### 4.2 Matrix

| Domain object | Personal | Shared | Ownership clear? | Privacy risk |
| --- | --- | --- | --- | --- |
| Transaction | No | Yes, household-wide | Clear but coarse | Medium-high for partial sharing |
| Account | No | Yes, household-wide | Clear but coarse | High for personal accounts |
| Savings | No | Yes, household-wide | Clear but coarse | High |
| Investment holding | No | Yes, household-wide | Clear but coarse | High |
| Loan/debt | No | Yes, household-wide | Clear but coarse | High |
| Credit card | No | Yes, household-wide | Clear but coarse | High |
| Goal | No | Yes, household-wide | Clear but coarse | Medium |
| Plan/jars | No | Yes, household-wide | Clear by design | Low for fully-shared couples |
| Category | System or household | Household | Clear | Low |
| Inbox item | Household, optional assignee | Mostly household | Partially clear | Medium |
| Household policy | Household | Household | Clear | Low |
| Member email/name | Shared within household | Shared | Clear | Low |
| Investment `visibility_context` | No true personal; only `household` / `unclear` | Household | Partial | Medium |

The only table that begins to model a finer boundary is `investment_holdings.visibility_context`, but its valid values are `household` and `unclear`, not `personal` or `member_specific`. Savings providers/packages are also household or system.

---

## 5. Roles & permissions audit

### 5.1 Current roles

```text
admin
partner
```

There are no:

- owner
- viewer
- child
- dependent
- manager
- custom roles

The product decision documents explicitly reject granular roles and owner/viewer/guest/legal-spouse roles.

### 5.2 Capability matrix

| Capability | Admin | Partner | Notes |
| --- | --- | --- | --- |
| View household data | Yes | Yes | RLS uses membership |
| Create transactions | Yes | Yes | RPC checks membership |
| Edit/delete transactions | Yes | Yes | Membership only |
| Manage accounts | Yes | Yes | Membership only |
| Manage savings/investments | Yes | Yes | Membership only |
| Manage loans/cards | Yes | Yes | Membership only |
| Manage plan/jars | Yes | Yes | Membership only |
| Manage goals | Yes | Yes | Membership only |
| Invite members | Yes | Yes | Any active member can invite if under limit |
| Revoke invitation | Yes | Yes | Any active member can revoke pending invite |
| Change role | Yes | No | Admin-only RPC |
| Update household policies | Yes | No | Admin-only RPC |
| Update household preferences | Yes | No | Admin-only RPC |
| Remove members | No | No | Not implemented |
| Leave household | No | No | Not implemented |
| Change permission/visibility | No | No | Not modeled |

### 5.3 Gaps / concerns

1. **Partner equality is broad.** Either partner can modify most household money objects. This matches the documented "partner-equal" design, but it is too broad for anything beyond a fully-shared couple.
2. **Invitation management is not Admin-gated.** Both roles can create and revoke invitations. This may be intentional, but it is inconsistent with Admin-only policy management.
3. **No member removal.** Once joined, there is no supported path to remove a member, which is a governance gap.
4. **No ownership transfer.** Deleting an account or losing the only Admin is not covered by the UI.
5. **RLS is mostly coarse.** It protects non-members, but not member-to-member privacy. That is the core privacy risk.

---

## 6. Inbox ↔ Together relationship

The intended relationship is documented well:

- Together produces household scope and material policy-change context.
- Inbox consumes household scope and can expose partner-visible shared attention.
- Together must not create partner surveillance or performance analytics.
- Inbox must not create generic partner-visible notification noise.

The implementation partially realizes this:

- Inbox queries enforce household membership via `assertMoneyActionAllowed()`.
- Emergency reallocation creates partner-assigned Inbox items.
- Household policy changes create `household_policy_events`, but those events are **not** surfaced in Inbox.
- Role changes and preference changes create `household_configuration_events`, but those are **not** surfaced in Inbox.
- Invitation accepted/declined events are not surfaced in Inbox.
- Member joins/removals are not surfaced in Inbox.

There is no clean, reusable event model linking Together lifecycle events to Inbox. Each source currently writes `inbox_items` ad hoc in its own RPC, with duplicated insert shapes and duplicated `context_json` event names such as `EmergencyDeclaredEvent` and `PaymentReminderCreated`.

---

## 7. Real-world household finance scenarios

### 7.1 Financial awareness

| Scenario | Status | Notes |
| --- | --- | --- |
| Large expense occurred | Partially supported | Not an Inbox item; visible only in Money/Health if implemented |
| Budget category nearly exhausted | Partially supported | Plan/Health can show; not an Inbox decision |
| Monthly spending unusually high | Not supported in Inbox | Health may interpret; no alert contract |
| Loan payment approaching | Partially supported | Payment reminder exists for cards; loan due/overdue contract is incomplete |
| Goal falling behind | Not supported in Inbox | Goals are not an Inbox producer yet |
| Cash balance too low | Not supported in Inbox | Health/Home may show; no decision item |

### 7.2 Household collaboration

| Scenario | Status | Notes |
| --- | --- | --- |
| Partner added large expense | Partially supported | No member attribution / activity event |
| Member edited shared budget | Not surfaced | Plan mutations are not household events |
| Someone requested money | Not supported | No request/contribution model |
| Someone contributed to goal | Not surfaced | Goal contribution is not an Inbox event |
| Shared account changed | Not surfaced | Account mutation is not an Inbox event |

### 7.3 Decisions requiring action

| Scenario | Status | Notes |
| --- | --- | --- |
| Approve large expense | Not supported | No approval workflow |
| Accept household invitation | Supported in Together | Outside Inbox |
| Review budget adjustment | Partially supported via Plan/ritual | Not as Inbox decision |
| Confirm contribution | Not supported | No contribution workflow |
| Review unusual transaction | Partially supported | `unmapped_expense` covers mapping, not unusual-amount review |

### 7.4 Useful reminders

| Scenario | Status | Notes |
| --- | --- | --- |
| Credit card due date | Partially supported | Payment reminder exists, but source link and action are weak |
| Loan repayment | Partially supported | Completion acknowledgement exists; due/overdue not complete |
| Recurring bill | Not supported in Inbox | Recurring is a Plan concern; no reminder contract |
| Goal contribution | Not supported in Inbox | No scheduled contribution reminders |
| Monthly financial review | Partially supported | Plan ritual exists; not an Inbox item |

---

## 8. Competitor/reference patterns

### 8.1 Honeydue

**What it does:** Couple-focused shared expense tracking, bill reminders, chat, and per-account privacy controls.

**Why it works:** It assumes partners may want to hide some personal accounts while sharing household bills.

**Fit for Family Finance:** Partially fits. The per-account privacy concept is exactly what the current schema lacks.

**Recommendation:** **Adapt selectively.** Add explicit visibility boundaries later, but do not add couple chat or social features.

### 8.2 Monarch Money

**What it does:** Household members share one subscription and get a joint view. Current behavior is broadly full visibility; members can add accounts and transactions.

**Why it works:** Simple joint financial visibility with separate logins.

**Fit:** High for the current fully-shared MVP.

**Recommendation:** **Adopt the separate-login + shared-space model**; do not adopt broad "any member can delete anything" without stronger audit.

### 8.3 Copilot Money

**What it does:** Magic-link account sharing; shared device/account access has full control.

**Why it works:** Very low-friction partner access, but coarse permissions.

**Fit:** Low-moderate. Family Finance already has proper invitation-based membership, which is better.

**Recommendation:** **Reject magic-link full-account sharing**; keep consent-based invitations.

### 8.4 Splitwise

**What it does:** Group/shared expense splitting, balances, notifications, and activity.

**Why it works:** Solves reimbursement and bill-splitting, not household money operating system.

**Fit:** Low. Family Finance is intentionally not an expense tracker or splitwise clone.

**Recommendation:** **Reject** the social feed and reimbursement-centric model.

---

## 9. Problems found

### 9.1 Inbox problems

| ID | Priority | Problem | Evidence | Real-world impact | Recommended direction | Complexity |
| --- | --- | --- | --- | --- | --- | --- |
| INB-1 | P1 | Too many storage kinds without matching typed decision path | `penalty_warning`, `rate_changed_suggestion`, `package_expired` have no UI action/spec type; `toReviewItemType` returns null | Dead or confusing queue items | Collapse to a smaller decision taxonomy or add explicit typed contracts only where action exists | Low-medium |
| INB-2 | P1 | No read/unread state | Queue uses `status = pending`; archived tab uses non-pending statuses | Users cannot distinguish "seen but undecided" from "new" | Separate `attention_state` (unread/read) from `status` (lifecycle), or keep minimal and document intentionally | Medium |
| INB-3 | P1 | Inbox sources write directly into `inbox_items` with duplicated shapes | Multiple migrations insert `inbox_items` in domain RPCs | Drift, inconsistent context, difficult contract testing | Introduce one Inbox producer gateway/helper or a typed event contract | Medium |
| INB-4 | P1 | Payment reminder is informational but enters decision queue | DB kind + UI panel show info only | Notification fatigue risk | Move awareness-only reminders out of Inbox or require explicit acknowledgement only when decision-bearing | Low-medium |
| INB-5 | P2 | No grouping/priority model | Filter chips only; no severity grouping | Long-term queue becomes flat and noisy | Add minimal "Needs attention / Reminders / History" grouping only after volume evidence | Medium |
| INB-6 | P2 | No archive/dismiss lifetime for most items | Only payment reminders expire; others remain archived indefinitely | Archived tab may grow unbounded | Define retention/archive policy per kind | Low |
| INB-7 | P2 | No duplication control for non-unique sources after unique constraint changed | `inbox_items_unique_source_assignee` exists but source producers are ad hoc | Duplicate alerts possible across domains | Centralize idempotency/dedupe in Inbox gateway | Medium |
| INB-8 | P3 | Filter list hardcodes a subset of kinds | `InboxQueueList` kind filter does not include all 12 kinds | Users cannot filter all item types | Derive filters from constants or collapse kinds | Low |

### 9.2 Together problems

| ID | Priority | Problem | Evidence | Real-world impact | Recommended direction | Complexity |
| --- | --- | --- | --- | --- | --- | --- |
| TGT-1 | P0 | Product assumes one household per user with max two active members | `household_members_one_active_per_user`; `HOUSEHOLD_MEMBER_LIMIT = 2`; RPCs reject more | Blocks parents+children, multi-generation, roommates | Decide explicitly: keep two-partner MVP now, but do not bake limit deeper into domain | Medium-high later |
| TGT-2 | P1 | No personal/shared/member-specific ownership | No owner/visibility columns on transactions, accounts, savings, investments, loans, goals, plans | Cannot model partial sharing or children | Add explicit ownership/visibility model before scaling Together | High |
| TGT-3 | P1 | Active membership equals full financial authority | RLS and RPCs use membership only | Partner can modify all household data | For MVP acceptable; must add role/permission contracts before broader households | Medium-high |
| TGT-4 | P1 | No member removal / leave / lifecycle | No RPC/UI for remove or leave | Household cannot safely change membership after join | Add minimal remove/leave governance after product decision | Medium |
| TGT-5 | P2 | Invitation management not Admin-gated | Any active member can create/revoke invites | Inconsistent with Admin-only policy management | Decide invite authorization policy | Low |
| TGT-6 | P2 | Household events not linked to Inbox | Policy/role/preference events stored but not surfaced in Inbox | Material changes may go unnoticed | Add only material policy changes to Inbox | Medium |
| TGT-7 | P2 | `visibility_context` concept is underdeveloped | Only `household` / `unclear` on investments | No real privacy control | Extend carefully after ownership decision | Medium-high |
| TGT-8 | P3 | `household_policy_events` and `household_configuration_events` duplicate event concepts | Two tables with similar purpose | Event model drift | Consolidate into a minimal household activity/event model | Medium |

---

## 10. Missing workflows

Evaluated against the current product and real household behavior:

| Workflow | Should implement now? | Reason |
| --- | --- | --- |
| Household invitation: invite/pending/accept/decline/expire/revoke | Mostly implemented; expire UI is incomplete | Core consent flow exists; expiry is enforced but not surfaced |
| Shared expense workflow: expense created/members notified/optional approval/budget updated | Not yet | Current system is fully shared; approval would be premature |
| Shared goal contribution: member contributes/progress updated/family notified/history visible | Not yet | Goal contribution is not an Inbox/event producer |
| Large expense awareness | Not yet | No anomaly/alert threshold model |
| Monthly household review | Partially implemented in Plan ritual | Should not be forced into Inbox; keep review in Plan |

**Do not implement now:**

- Likes, reactions, chat, badges, gamification.
- Partner engagement analytics.
- Legal family registry.
- Dispute-resolution workflows.
- Provider-message classification.
- Cross-provider transaction matching.
- Household export/deletion audit unless required by data governance.

---

## 11. Proposed target Inbox model

```text
Inbox exists to:
  collect, preserve, and resolve unresolved household financial attention.

Inbox should contain:
  decision-bearing ReviewItems only:
    - transaction meaning gaps
    - product/lifecycle decisions (savings maturity, early withdrawal)
    - completion acknowledgements where required
    - time-sensitive reminders only when a valid outcome is required
    - emergency attention with source-defined urgency

Inbox should NOT contain:
  generic activity
  marketing/system announcements
  awareness-only information
  chat or comments
  partner surveillance
  items that cannot be resolved, acknowledged, dismissed, deferred, expired, or auto-resolved

Primary user actions:
  review
  resolve
  acknowledge
  defer (later phase)
  dismiss
  archive/history

Core item types:
  UnmappedExpense
  IncomeSuggest (internal rewrite-only)
  SavingsMaturityDecision
  EarlyWithdrawalConfirmation
  PaymentReminder (only when actionable/acknowledgement-required)
  InstallmentComplete
  EmergencyDeclaration
```

Implementation rule: if a `kind` has no valid user outcome, it should not exist in Inbox.

---

## 12. Proposed target Together model

```text
Together exists to:
  define and protect the household trust boundary.

Together should contain:
  household identity and preferences
  active members
  Partner/Admin responsibilities
  invitation lifecycle
  household policies
  household configuration events
  household scope for all money/plan domains

Together should NOT contain:
  money movement
  legal family registry
  relationship adjudication
  granular custom roles
  partner engagement analytics
  social feed or chat
  shared/personal account ownership decisions belonging to Money domains

Primary user actions:
  create household
  invite/accept/decline/revoke invitation
  view members
  change Partner/Admin responsibility
  update policies (Admin)
  update preferences (Admin)
  sign out / delete own account

Core concepts:
  household
  membership
  role (Partner/Admin)
  invitation
  policy
  preference
  household scope
```

Relationship to domains:

- `household` is the shared financial scope.
- `members` are the people allowed inside that scope.
- `permissions` are deliberately coarse for the two-partner MVP.
- `shared finances` are household-scoped money objects.
- `personal finances` are **not yet modeled** and require an explicit product decision before implementation.

---

## 13. Proposed domain/event model

Current architecture already has an implicit event-like pattern: source RPCs directly mutate `inbox_items`, and Together has `household_policy_events` plus `household_configuration_events`. There is no canonical event registry.

Recommendation: **do not build a generic event bus now.** Instead, introduce a minimal, typed handshake:

```text
Source domain action
        |
        v
Domain fact / event (owned by source domain)
        |
        v
Inbox eligibility check (should an item exist?)
        |
        v
Inbox item (if decision-bearing)
        |
        v
Household outcome
        |
        v
Owning domain consumes outcome
```

Separate these concepts explicitly:

- **Domain event:** immutable source-domain fact, e.g. `TransactionRecorded`, `SavingsCycleMatured`, `HouseholdPolicyUpdated`.
- **Activity feed entry:** optional human-readable historical context. Not required for MVP.
- **Notification:** awareness-only surface. Not the same as Inbox.
- **Action request / Inbox item:** decision-bearing attention only.

Lifecycle:

```text
Transaction created
        ↓
Domain event (source truth)
        ↓
Activity entry (optional)
        ↓
Notification rule (optional)
        ↓
Inbox item only if valid outcome exists
```

A first practical step is to create a small **Inbox producer contract** rather than a full event system:

```text
produceInboxItem({
  householdId,
  sourceType,
  sourceId,
  kind,
  title,
  amount,
  currency,
  context,
  eligibility,
  dedupeKey,
})
```

This would consolidate the repeated `insert into public.inbox_items` blocks scattered across domain RPCs.

---

## 14. NOW / NEXT / LATER

### NOW

Necessary before Inbox/Together should be considered production-quality for the current two-partner scope:

1. Freeze the Inbox decision taxonomy: remove or complete `penalty_warning`, `rate_changed_suggestion`, `package_expired`.
2. Add an Inbox producer gateway and stop domain RPCs from directly inserting `inbox_items`.
3. Separate Inbox lifecycle state from read/unread attention state, or explicitly document why one state is enough.
4. Decide and document the current product assumption: **one household, max two fully-shared partners**.
5. Add an explicit ownership/visibility decision for personal vs household finances, even if the decision is "not yet supported."
6. Fix invitation expiry and member-removal/leave governance, or explicitly defer them with a product sign-off.
7. Add typed integration tests for the Inbox ↔ source-domain boundaries that already exist.

### NEXT

High-value after foundations:

1. Minimal household activity/event table with typed event names and source-domain ownership.
2. Material Together policy changes surfaced as Inbox items.
3. Loan/card due and overdue Inbox contracts.
4. Goal and plan decision contracts where a genuine decision exists.
5. Member-specific ownership/visibility model for accounts, savings, investments, and loans.
6. Minimal grouping in Inbox after volume evidence.

### LATER

Deliberately not implemented yet:

1. Dependents/children and allowances.
2. Multi-household switching.
3. Separation/divorce workflows.
4. Shared expense approval workflows.
5. Provider-message classification.
6. Cross-provider matching.
7. Household export/deletion audit.
8. Intelligent summaries / AI-generated alerts.

---

## 15. Recommended roadmap

### Phase A — Correctness / domain cleanup

**Goal:** Make the current two-partner model internally consistent.

**Scope:**

- Clean Inbox kind/type mapping.
- Introduce Inbox producer contract.
- Separate lifecycle and read state.
- Audit direct `inbox_items` writers.
- Add invitation expiry/leave/remove decision.
- Document household scope assumption.

**Dependencies:** None.

**Risk:** Low-medium; requires product sign-off on taxonomy.

**Expected UX impact:** Calmer, more predictable Inbox; fewer dead kinds.

### Phase B — Inbox foundation

**Goal:** Make Inbox a real decision queue.

**Scope:**

- Typed source contracts for existing sources.
- Dedupe/idempotency.
- Archive/retention policy per kind.
- Minimal severity/grouping if needed.

**Dependencies:** Phase A.

**Risk:** Medium.

**Expected UX impact:** Better trust; less noise; recoverable history.

### Phase C — Together foundation

**Goal:** Make Together a real trust boundary.

**Scope:**

- Explicit role authorization for invitation and member management.
- Member removal/leave lifecycle.
- Material event visibility.
- Minimal ownership/visibility decision.

**Dependencies:** Phase A, product decision on household structures.

**Risk:** Medium-high.

**Expected UX impact:** Safer shared access; clearer governance.

### Phase D — Collaboration workflows

**Goal:** Add only financial workflows that solve concrete household problems.

**Scope:**

- Shared goal contribution history.
- Large-expense or unusual-transaction attention only if research supports it.
- Material household policy changes in Inbox.

**Dependencies:** Phases A-C.

**Risk:** Medium.

**Expected UX impact:** More useful collaboration without becoming social.

### Phase E — Intelligent alerts / summaries

**Goal:** Add alerts/summaries only after foundations are stable.

**Scope:**

- Loan/card due reminders.
- Goal falling behind.
- Budget/cashflow anomalies.
- Monthly review summarization.

**Dependencies:** Phases A-D plus real usage evidence.

**Risk:** High if premature.

**Expected UX impact:** Potentially high, but only after trust is established.

---

## 16. Proposed implementation prompts

These are prompts to run later, not executed in this audit.

```text
Prompt 13A — Freeze and document the Inbox kind/type taxonomy.
Prompt 13B — Introduce an Inbox producer gateway/helper and migrate existing direct-writers.
Prompt 13C — Separate Inbox lifecycle status from read/unread state (or document the current single-state contract).
Prompt 13D — Add Inbox source-domain integration tests for current producers.

Prompt 14A — Decide and encode the current household scope: one household, max two fully-shared partners.
Prompt 14B — Add explicit role authorization for invitation management.
Prompt 14C — Add minimal member removal/leave lifecycle with RLS and RPC changes.
Prompt 14D — Add typed tests for Together membership transitions and policy events.

Prompt 15A — Introduce a minimal household activity/event registry, not a generic event bus.
Prompt 15B — Surface material Together policy changes as Inbox items.
Prompt 15C — Add loan/card due and overdue typed Inbox contracts.
Prompt 15D — Add goal/plan decision contracts only where a valid outcome exists.
```

Ordering:

```text
domain/schema
→ security/RLS
→ application/service
→ UI
→ test
→ migration validation
```

---

## 17. Open questions / decisions requiring product-owner input

1. **PRODUCT DECISION REQUIRED:** Is the product currently scoped to a two-partner fully-shared household, or must it support parents/children, roommates, or multi-generation households soon?
2. **PRODUCT DECISION REQUIRED:** Should personal and shared finances be modeled separately now, or is household-wide visibility acceptable for the current MVP?
3. **PRODUCT DECISION REQUIRED:** Should Inbox include awareness-only payment reminders, or should those live outside Inbox?
4. **PRODUCT DECISION REQUIRED:** Is either partner allowed to create and revoke invitations, or should invitation management be Admin-only?
5. **PRODUCT DECISION REQUIRED:** Is member removal/leave required before production, or can it be explicitly deferred?
6. **PRODUCT DECISION REQUIRED:** Should role changes, preferences, and policy changes produce Inbox items, or only material policy changes?
7. **PRODUCT DECISION REQUIRED:** What is the archive/retention lifetime for resolved, dismissed, acknowledged, expired, and auto-resolved Inbox items?
8. **PRODUCT DECISION REQUIRED:** Should the product model children/dependents as household members with limited visibility later, or as a separate non-member concept?

---

## 18. Key evidence index

Implementation evidence reviewed:

- `modules/inbox/**`
- `app/[locale]/(product)/inbox/**`
- `modules/tenancy/**`
- `app/[locale]/(product)/together/**`
- `app/[locale]/(onboard)/together/**`
- `supabase/migrations/*` covering households, members, invitations, policies, preferences, inbox, transactions, savings, loans, cards, investments, plan movements
- Unit tests: `tests/unit/inbox-*.test.ts`
- E2E tests: `tests/e2e/inbox-decisions.smoke.spec.ts`, `tests/e2e/together-*.smoke.spec.ts`
- Current artifacts: `artifacts/current/domains/inbox/**`, `artifacts/current/domains/together/**`, `artifacts/current/architecture/**`
