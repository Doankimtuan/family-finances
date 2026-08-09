# Phase E7: Lean Health, Settings, and Household Blueprint

## Status and authority

This is a minimum implementation blueprint. It does not change application behavior.

Authority order:

1. `artifacts/information-architecture/CURRENT/`
2. `artifacts/ux-redesign/CURRENT/`
3. `artifacts/design-system-evolution/CURRENT/`
4. Health and Together domain contracts under `artifacts/current/domains/`
5. Current source only as an implementation boundary

If this blueprint and a canonical contract differ, the canonical contract wins.

## Non-negotiable boundaries

| Area | Owner | Allowed write effect | Required boundary |
|---|---|---|---|
| Health | `health` | `NONE` | Compute on read from approved summaries. Never expose a command, persistence path, source edit, Inbox resolution, notification creation, or money write. |
| User app settings | `tenancy` plus existing client theme and locale infrastructure | `PREFERENCE_ONLY` | Theme and UI locale use existing canonical behavior. They do not change household financial facts. |
| Household preferences | `tenancy` | `PREFERENCE_ONLY` | Only Admin may change approved forward-looking household locale, timezone, and base currency. Historical facts are never rewritten. |
| Household membership | `tenancy` | `MEMBERSHIP_ONLY` | Only Partner and Admin roles exist. Invitations, role changes, and actor attribution stay in canonical tenancy APIs. |

Additional exclusions:

- Product authorization uses Together's current Partner/Admin membership model. Legacy Owner/Viewer labels in the Health permission matrix do not create product roles or broaden source visibility.
- Do not add notification preference toggles. Together defines approved notification events and recipients, not configurable notification settings.
- Do not add ownership transfer, custom roles, Viewer, Owner, Guest, Approver, legal relationship fields, or per-domain permissions.
- Do not add leave, remove, close-household, or transfer flows. Household leave/close is deferred by `TGT-PD-030`, and no current removal action contract authorizes an interactive removal flow.
- Keep profile email read-only. `TGT-PD-015` approves recognition identity but does not define a profile mutation action. Do not infer one.
- Keep household name and descriptive metadata read-only until a contract defines the editable field, validation, attribution, and persistence behavior. `Clarify Household Meaning` is not enough to infer a household-name edit.

## 1. Current surface audit

At most eight implementation-relevant issues are in scope.

| # | Current issue | Why it matters | Minimum correction |
|---:|---|---|---|
| 1 | Health uses only `starting`, `steady`, and `strong`; an empty household currently receives a positive numeric pulse. | Canonical Health also requires No Visible Facts, Partial, Stale, Unavailable, and Invalid Attempt. Missing facts must not be read as low risk or a valid positive score. | Add the canonical assessment state and completeness result around the existing approved metric. Render a score only when the assessment is grounded and assessable. Do not invent a new metric. |
| 2 | `getHealthDetail()` calls `assertMoneyActionAllowed()` and maps every denied or failed read to `null`. | A read-only Health permission check must not be expressed as a money-action gate, and the UI cannot distinguish permission, missing facts, stale data, and infrastructure failure. | Use a read-specific household/source visibility result with typed Health states. Preserve last valid data only when explicitly marked stale. |
| 3 | Health insight and scenario cards contain no source-domain destination or source metadata. | The canonical Health flow requires source drill-through and origin-aware return. Health must explain facts without owning their action. | Attach an approved source kind and canonical owner route to each grounded factor. Render a short source link only when the actor can view it. Preserve Health origin and factor context on return. |
| 4 | Together `/together` is implemented as the member list and has two actions with the same Invitations destination. | Canonical IA defines a household overview hub plus separate Members, Invitations, Preferences, Policies, and Settings screens. Duplicate navigation obscures the primary action. | Make `/together` a lean overview. Move the full list to `/together/members`. Keep one invite action and one separate invitations-management link. |
| 5 | `/together/invitations` combines invitation creation, pending list management, share-link feedback, and revoke actions. | Canonical IA defines `/together/invitations/new`; the current screen has multiple competing purposes. | Keep pending invitation list and revoke on `/together/invitations`. Move email entry and send success to `/together/invitations/new`. |
| 6 | `/together/preferences` mixes read-only profile, app theme/locale, and destructive account lifecycle, while `/together/settings` and `/together/settings/account` are absent. | Identity, app preferences, household preferences, and dangerous account actions have different permissions and write effects. | Put user identity and app theme/UI locale on `/together/settings`; put account lifecycle on `/together/settings/account`; reserve `/together/preferences` for household locale/timezone/base currency with Admin edit and Partner read-only presentation. |
| 7 | Household roles are displayed, but no approved role-change path exists in current source. | Role change is approved only for an active Admin, only between Partner and Admin, and must remain attributable without changing money ownership. | Add one tenancy-owned role action with server-side Admin, same-household, active-member, and allowed-role checks. Never render ownership language. |
| 8 | Current household and Health screens do not expose the full canonical main states. | Generic empty/error behavior hides permission, partial, stale, capacity, and terminal invitation meaning. | Add owner-specific loading, empty, partial, permission, recoverable error, and success states using shared state patterns. Keep mutation controls absent when forbidden, not merely disabled. |

## 2. Main UX

### Health

| Field | Blueprint |
|---|---|
| Purpose | Reflect the household's current financial condition using approved, grounded, read-only derived data. |
| Information hierarchy | Health state and completeness, factor explanation, source/freshness context, approved insights or read-only scenarios, return path. Condition and factors appear together. |
| Primary action | Inspect insights on the overview; view the factor's source on an insight. Both are navigation only. |
| Secondary actions | Refresh, return to Home or Health, inspect another factor. |
| Component mapping | `Page`, `TopAppBar`, `Section`, existing `HealthCard` or module-local assessment summary, `HealthInsight`, `StatusAlert`, `EmptyState`, `ErrorState`, `Skeleton`, canonical `Link`. |
| Navigation destination | `/health` to `/health/insights`; factor links to the owning canonical Money, Plan, or Inbox route; back restores `/health/insights` factor context and then `/health`. |
| Permission condition | Active membership plus visibility of each source factor. A hidden factor is omitted or causes Partial context. Do not expose data because a role label alone permits it. |
| Write effect | `NONE` |

Approved source mapping for the current derived facts:

| Health factor | Owner route | Rule |
|---|---|---|
| Account setup | `APP_PATH.MONEY_ACCOUNTS` | Link only when Accounts context is visible. |
| Recent activity | `APP_PATH.MONEY_TRANSACTIONS` | Link to the transaction list until a specific grounded transaction ID exists. |
| Plan presence/rhythm | `APP_PATH.PLAN_JARS` or the exact grounded Plan owner route | Never describe plan value as cash. |
| Unresolved decision pressure and EMI completion | `APP_PATH.INBOX` or a grounded review detail route | Health does not resolve the item. |
| AI grounding guardrail | No source route | Informational explanation only. It is not a financial factor or action. |

Health main states:

- Unavailable or permission blocked: explain the read boundary and provide only retry or a safe route out.
- No Visible Facts: explain that no usable facts are visible. Do not show a positive score and do not imply no risk.
- Partial: show visible factors, completeness, missing categories, and only allowed source links.
- Starting, Steady, Strong: show the existing approved score only with grounded factors and completeness.
- Stale: label the prior assessment and source freshness. Refresh is navigation/read recomputation only.
- Invalid Attempt: return to the last valid state and expose no repeated forbidden action.

### Settings

| Field | Blueprint |
|---|---|
| Purpose | Show account identity and change only approved user app preferences or approved household interpretation preferences. |
| Information hierarchy | Identity, app appearance and UI language, link to household preferences, account lifecycle last and separated. |
| Primary action | Immediate theme/UI-locale choice for app settings, or Save for a dirty household-preference form. Never show both as competing primary actions in one state. |
| Secondary actions | Open household preferences, open account lifecycle, cancel dirty household-preference changes, return to Together. |
| Component mapping | `SettingsPage` composition, `Section`, `Form`, `FormField`, `SelectField`, `SegmentedField`, existing `ThemeToggle`, existing `LocaleSwitcher`, `SubmitAction`, `BottomActionBar` for a dirty long form, `Toast` for harmless saved preference, `StatusAlert` for permission or failure. |
| Navigation destination | `/together/settings`, `/together/preferences`, `/together/settings/account`, back to `/together`. |
| Permission condition | Any active Partner/Admin may change their app theme and current UI locale. Any active member may view shared household preferences. Only Admin may persist household locale, timezone, or base currency. |
| Write effect | `PREFERENCE_ONLY` |

Settings semantics:

- Theme continues through `next-themes`; retain system, light, and dark. Do not add another theme preference store.
- UI locale continues through locale-aware navigation and preserves the current pathname. It is a user app preference, not an implicit household-locale write.
- Household locale, timezone, and base currency are separate shared preferences. Valid Admin changes apply going forward and do not rewrite historical transactions, stored currency codes, or dates.
- Profile email remains a read-only identity fact. No display-name edit ships until a canonical update action exists.
- No notification configuration appears in this phase.

### Household

| Field | Blueprint |
|---|---|
| Purpose | Orient members to the active household boundary and provide only approved member, invitation, role, policy, preference, and account-settings destinations. |
| Information hierarchy | Household identity, membership summary, one next household action, pending invitation state, management links. Members screen shows active members and roles without performance or ownership meaning. |
| Primary action | Invite partner when capacity permits. When capacity is full, no invite command is rendered. |
| Secondary actions | View members, manage pending invitations, view policies/preferences/settings, and Admin-only approved role change. |
| Component mapping | `OverviewPage`, `ListPage`, `TopAppBar`, `Section`, `MemberList`, `ActionRow`, `MenuAction`, `EmptyState`, `StatusAlert`, `ConfirmDialog` for role change only when the role change is partner-visible and consequential enough to require review. Keep invitation create feature-local. |
| Navigation destination | `/together`, `/together/members`, `/together/invitations`, `/together/invitations/new`, `/together/policies`, `/together/preferences`, `/together/settings`. |
| Permission condition | Active Partner/Admin may view members and invite within capacity. Only active Admin may change Partner/Admin responsibility. Non-members and inactive members see no household data. |
| Write effect | `MEMBERSHIP_ONLY` for invite, accept, decline, revoke, or role change; `PREFERENCE_ONLY` for approved household preference changes; otherwise `NONE`. |

Household state rules:

- Only Partner and Admin labels render.
- Role change changes policy responsibility only. It never changes financial ownership or daily household participation.
- Every successful invitation and role action records the actual actor through the canonical server/database boundary. The client never supplies trusted actor identity.
- Pending invitation actions disappear for accepted, declined, revoked, or expired invitations.
- Household capacity is enforced on the server. UI hiding is only a convenience.
- Leave, remove, close, and ownership transfer do not render.

## 3. Main flows

### Health flows

| Flow | Entry | Permission | Write effect | Success destination | Failure behavior |
|---|---|---|---|---|---|
| View Health | Home or direct `/health` | Active membership and household Health visibility | `NONE` | Health overview in one canonical Health state | Unauthenticated to Login; no membership to Onboard; denied source context to permission/Partial state; unavailable read to recoverable Health error. |
| Inspect insight | Health overview to `/health/insights` | Same Health permission; per-factor visibility applied | `NONE` | Focusable insight list with condition, factor, completeness, source/freshness | Omit ungrounded factors; show Empty, Partial, Stale, or Unavailable rather than invented facts. |
| Navigate to source domain | Source link on a grounded factor | Actor may view that exact source context | `NONE` | Canonical owner list/detail with Health origin and factor identifier | Keep user in Health and show source unavailable or permission blocked. Never substitute a mutation. |
| Return to Health | Owner screen back action or browser back | Existing Health access still valid | `NONE` | Prior insight/factor context and scroll position | If access changed, return to Health permission/Partial state without leaking prior hidden content. |

### Settings flows

| Flow | Entry | Permission | Write effect | Success destination | Failure behavior |
|---|---|---|---|---|---|
| View settings | Together to `/together/settings` | Active Partner/Admin | `NONE` | Settings with identity, app preferences, household preferences link, account settings link | Login/Onboard redirects through the shared Together gate; load error recovers in place. |
| Update profile/preference | Settings or Household Preferences | Profile remains read-only; user may change own app settings; Admin may change shared household preferences | `PREFERENCE_ONLY` | Same screen with saved state; household preference save confirms forward-only effect | Invalid value keeps prior confirmed value; Partner household edit controls are absent; no financial facts change. |
| Switch UI locale | Existing `LocaleSwitcher` | Active session; no Admin requirement | `PREFERENCE_ONLY` | Same canonical pathname under selected locale | Preserve prior locale and pathname on navigation failure. Do not write household locale implicitly. |
| Switch theme | Existing `ThemeToggle` | Client app access | `PREFERENCE_ONLY` | Same screen in system/light/dark selection | Retain last confirmed theme or system fallback; no server/domain write. |
| Save approved configuration | Dirty `/together/preferences` form | Active Admin | `PREFERENCE_ONLY` | Same screen with current household locale/timezone/base currency and polite saved feedback | Inline validation; server permission/state failure preserves the current database values and entered draft; no partial success. |

### Household flows

| Flow | Entry | Permission | Write effect | Success destination | Failure behavior |
|---|---|---|---|---|---|
| View household | Bottom navigation, Home, or direct `/together` | Active Partner/Admin | `NONE` | Household overview | Non-member to Onboard; read failure does not render an empty household as if it were valid. |
| View members | Overview to `/together/members` | Active Partner/Admin | `NONE` | Active member list with actual identity and Partner/Admin role | Permission denial discloses no membership; load failure offers retry/back. |
| Invite member | Overview or Invitations to `/together/invitations/new` | Active Partner/Admin, active household, capacity available | `MEMBERSHIP_ONLY` | `/together/invitations` with Pending invitation receipt/share path | Inline invalid contact; duplicate, already-member, full-household, unauthenticated, and unknown errors preserve prior valid state. |
| Revoke pending invitation | `/together/invitations` pending item | Active Partner/Admin for same household; invitation still Pending | `MEMBERSHIP_ONLY` | Same list with revoked confirmation and item removed from active list | State mismatch explains invitation is no longer active; no duplicate submission or partial success. |
| Change approved member role | `/together/members` member action | Active Admin; target active in same household; new role Partner or Admin | `MEMBERSHIP_ONLY` | Same member list with updated role and actor-attributed confirmation | Partner sees no control. Any additional constraint must come from a canonical contract; do not infer self-lockout or ownership rules. Failure preserves the prior role. |
| Leave/remove member | No entry in E7 | Not approved | `NONE` | Not applicable | Do not render. Reference `TGT-PD-030` instead of inferring behavior. |
| Update household metadata | Household identity remains read-only in E7 | No exact mutation contract | `NONE` | Not applicable | Do not render an edit control. Reference `Clarify Household Meaning` until field semantics are defined. |

## 4. Component reuse

Use the current App Shell, locale navigation, semantic design tokens, and existing shared primitives. The implementation should reuse:

- `shared/patterns/page.tsx`
- `shared/patterns/top-app-bar.tsx`
- `shared/patterns/section-header.tsx`
- `shared/patterns/empty-state.tsx`
- `shared/patterns/card.tsx` only for bounded content
- `shared/patterns/health-card.tsx` after it can represent canonical non-score states, or keep the new state summary Health-local until stable
- `shared/patterns/theme-toggle.tsx`
- `shared/patterns/locale-switcher.tsx`
- `shared/ui/button.tsx`
- `shared/ui/form/index.ts`
- `shared/ui/status-alert.tsx`
- `shared/ui/text.tsx`

Rules:

- Prefer sections and rows over additional cards.
- Keep `HealthInsight`, source-factor link, invitation-create form, member role action, and household-preference form feature-local until reuse is proven.
- Do not create a speculative generic settings framework.
- Add missing route, state, role, preference, source-kind, and query-key constants at their documented application homes before use. No raw route strings or visible strings in components.
- All visible copy belongs in both `messages/en/` and `messages/vi/` namespace files.

## 5. Implementation boundary

Implement as separate coherent coding tasks. Do not combine all three flows in one code task.

### Slice A: Health read-only states and source drill-through

Existing source paths likely to change:

- `app/[locale]/(product)/health/page.tsx`
- `app/[locale]/(product)/health/health-overview-card.tsx`
- `app/[locale]/(product)/health/insights/page.tsx`
- `modules/health/application/health-pulse.ts`
- `modules/health/application/get-health-detail.ts`
- `modules/health/application/get-health-overview.ts`
- `modules/health/application/build-health-insights.ts`
- `modules/health/application/index.ts`
- `modules/tenancy/application/app-path.ts`
- `messages/en/health.json`
- `messages/vi/health.json`

New feature-local or application paths only if required:

- `app/[locale]/(product)/health/insights/health-source-link.tsx`
- `modules/health/application/health-constants.ts`

Tests likely to change or be added:

- `tests/unit/health-pulse.test.ts`
- `tests/unit/health-insights.test.ts`
- `tests/unit/get-health-detail.integration.test.ts`
- `tests/unit/health-readonly-shield.test.ts`
- `tests/e2e/health-insights.smoke.spec.ts`

Do not weaken `modules/health/application/health-readonly-contract.ts` or remove the source scan that forbids writes.

### Slice B: Settings and approved preferences

Existing source paths likely to change:

- `app/[locale]/(product)/together/preferences/page.tsx`
- `shared/patterns/together-preferences.tsx`
- `shared/patterns/locale-switcher.tsx`
- `shared/patterns/theme-toggle.tsx`
- `modules/tenancy/application/app-path.ts`
- `modules/tenancy/application/tenancy-constants.ts`
- `messages/en/settings.json`
- `messages/vi/settings.json`
- `messages/en/together.json`
- `messages/vi/together.json`

New paths likely required:

- `app/[locale]/(product)/together/settings/page.tsx`
- `app/[locale]/(product)/together/settings/account/page.tsx`
- `app/[locale]/(product)/together/preferences/household-preferences-form.tsx`
- `app/[locale]/(product)/together/preferences/actions.ts`
- `modules/tenancy/application/get-household-preferences.ts`
- `modules/tenancy/application/update-household-preferences.ts`
- `modules/tenancy/application/household-preferences.schema.ts`

Database boundary:

- The project uses imperative migrations. The coding task must create any required migration with `supabase migration new <descriptive-name>` rather than inventing a filename.
- Preference mutation must be server-authorized for the current `auth.uid()`, active household, and Admin membership. Do not trust client-supplied household ID, actor ID, or role.
- If an RPC uses `security definer`, revoke default `PUBLIC` execute, grant only the required role, set a safe search path, check `auth.uid()` inside the function, and verify RLS/advisors. Do not add `security definer` merely to bypass a policy error.

Tests likely to change or be added:

- `tests/unit/theme/theme.test.ts`
- `tests/unit/household-preferences.test.ts`
- `tests/e2e/together-preferences.smoke.spec.ts`
- `tests/e2e/together-settings.smoke.spec.ts`

Move `app/[locale]/(product)/together/account-lifecycle-card.tsx` into the account settings route only if import ownership becomes unclear. Do not change its account-deletion business behavior in this slice.

### Slice C: Household overview, members, invite route, and approved role action

Existing source paths likely to change:

- `app/[locale]/(product)/together/page.tsx`
- `app/[locale]/(product)/together/member-list.tsx`
- `app/[locale]/(product)/together/invitations/page.tsx`
- `app/[locale]/(product)/together/invitations/invitations-panel.tsx`
- `app/[locale]/(product)/together/invite-actions.ts`
- `modules/tenancy/application/list-household-members.ts`
- `modules/tenancy/application/tenancy-constants.ts`
- `modules/tenancy/application/app-path.ts`
- `messages/en/together.json`
- `messages/vi/together.json`

New paths likely required:

- `app/[locale]/(product)/together/members/page.tsx`
- `app/[locale]/(product)/together/members/member-role-action.tsx`
- `app/[locale]/(product)/together/members/actions.ts`
- `app/[locale]/(product)/together/invitations/new/page.tsx`
- `app/[locale]/(product)/together/invitations/new/invitation-form.tsx`
- `modules/tenancy/application/change-household-role.ts`
- `modules/tenancy/application/change-household-role.schema.ts`

Database boundary:

- Generate a migration through the project's imperative Supabase workflow only if no existing RPC can enforce role change.
- The server/database derives actor identity from `auth.uid()`, verifies active Admin membership, verifies the target is an active member of the same household, accepts only `HOUSEHOLD_ROLE.PARTNER` or `HOUSEHOLD_ROLE.ADMIN`, and records actor attribution where the canonical audit/notification contract requires it.
- The action must not edit ledger, plan, inbox, savings, Health, account ownership, or historical membership facts.

Tests likely to change or be added:

- `tests/unit/invitations.test.ts`
- `tests/unit/household-role.test.ts`
- `tests/unit/household-policies.test.ts` only if shared Admin-gate behavior is reused
- `tests/e2e/together-invites.smoke.spec.ts`
- `tests/e2e/together-members.smoke.spec.ts`

### Routes that remain canonical

Do not rename or repurpose these routes:

- `/health`
- `/health/insights`
- `/together`
- `/together/members`
- `/together/invitations`
- `/together/invitations/new`
- `/together/policies`
- `/together/preferences`
- `/together/settings`
- `/together/settings/account`
- `/together/onboard`
- `/invite/[token]`

Add missing `APP_PATH` or `TOGETHER_PATH` constants first. Visible navigation must use constants and localized navigation helpers.

### Canonical business and permission code to preserve

- Health remains compute-on-read and imports only approved read summaries from owner modules.
- `resolveActiveMembership()` and `requireTogetherMembership()` remain the shared active-household gates.
- Invitation create, accept, decline, revoke, expiry, identity match, duplicate, and capacity behavior remains canonical.
- `HOUSEHOLD_ROLE` remains exactly Partner/Admin.
- Household policy and preference writes remain Admin-only.
- Actor identity is derived on the server. Client fields never establish authorization or attribution.
- Existing theme and locale switching behavior remains canonical for user app preferences.
- The no-magic-strings rule applies to routes, roles, states, preference values, query keys, and visible copy.

### Unrelated modules that must not change

Do not modify business behavior in:

- `modules/ledger/`
- `modules/plan/`
- `modules/inbox/`
- `modules/savings/`
- Money, Plan, or Inbox route actions and forms
- Auth behavior except moving the existing account-lifecycle composition to its canonical route
- Home behavior except an existing Health/Together navigation link if a route constant is missing

Health may consume their approved read APIs and link to their canonical routes. It must not add commands or duplicate their domain models.

## 6. Minimal acceptance criteria

### Health

- `/health` renders exactly one canonical Health state.
- An assessable condition renders with grounded factors and completeness.
- No Visible Facts, Partial, Stale, Unavailable, and permission behavior do not imply a positive current score.
- `/health/insights` renders approved insights/read-only scenarios and an owner-domain source link where grounded and visible.
- Returning from a source preserves Health factor context and scroll position.
- Static and runtime tests prove Health exposes no insert, update, delete, RPC command, money write, plan write, Inbox resolution, membership write, or notification creation.
- Source domains remain the owners of facts and actions.

### Settings

- `/together/settings` renders read-only identity, existing theme selection, existing UI locale selection, and links to household preferences/account settings.
- Theme supports system, light, and dark using current persistence behavior.
- UI locale switches English/Vietnamese while preserving the canonical pathname and does not silently mutate household locale.
- `/together/preferences` shows household locale, timezone, and base currency to active members.
- Admin can save only valid approved household preferences; Partner sees read-only values and no save control.
- Preference changes apply going forward and change no historical transaction, balance, plan, Inbox, savings, Health, or ownership fact.
- No profile mutation or notification setting is introduced.

### Household

- `/together` renders a household overview, not the full member-management screen.
- `/together/members` renders active members with actual identity and only Partner/Admin role presentation.
- `/together/invitations/new` completes the invite happy path and returns to Invitations with a Pending result.
- Pending invitations can be revoked by an allowed household actor; terminal invitations expose no active mutation.
- Admin can perform the approved Partner/Admin role change; Partner cannot see or call the control successfully.
- Role and invitation actions are attributable to the actual server-derived actor.
- No ownership transfer, custom role, leave, remove, close, or household-name edit appears.

### UI and verification

- Each coding slice is verified in a real browser before completion.
- Main flows render without critical breakage at 390px and the canonical 440px app viewport.
- English and Vietnamese render without clipped labels or wrapped primary actions that obscure intent.
- Light and dark modes preserve hierarchy, focus rings, dividers, state meaning, and WCAG AA contrast.
- All interactive targets are at least 44px, keyboard reachable, and screen-reader labelled.
- Loading never implies success; failures preserve the last confirmed valid state; mutation submission prevents duplicates.
- Browser evidence covers ready plus the changed empty, permission, error, or success state for each implemented slice.
