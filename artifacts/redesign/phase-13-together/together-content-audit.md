# Phase 13 — Together content audit

## Current Together purpose

Together is the household identity and collaboration surface. It answers:

> Who is in our household, how do we work together, and what shared settings should we manage?

It is not a financial dashboard, social feed, messaging system, or advice surface. Home / Money / Plan / Inbox remain the financial destinations. Health remains read-only context.

## Canonical routes

Discovered from `modules/shared-kernel/app-path.ts` (re-exported as `APP_PATH` / `TOGETHER_PATH`). Not assumed from the prompt.

| Surface | Path | Helper |
| --- | --- | --- |
| Hub | `/together` | `TOGETHER_PATH.ROOT` / `APP_PATH.TOGETHER` |
| Members | `/together/members` | `TOGETHER_PATH.MEMBERS` |
| Invitations | `/together/invitations` | `TOGETHER_PATH.INVITATIONS` |
| New invite | `/together/invitations/new` | `TOGETHER_PATH.INVITATIONS_NEW` |
| Policies | `/together/policies` | `TOGETHER_PATH.POLICIES` |
| Preferences | `/together/preferences` | `TOGETHER_PATH.PREFERENCES` |
| Settings | `/together/settings` | `TOGETHER_PATH.SETTINGS` |
| Account settings | `/together/settings/account` | `TOGETHER_PATH.SETTINGS_ACCOUNT` |
| Onboard (out of hub scope) | `/together/onboard` | `APP_PATH.ONBOARD` |
| Invite accept (public) | `/invite/[token]` | `invitePath(token)` |

No Together query parameters. Five-tab navigation is unchanged. Together remains the collaboration tab.

## Household identity model

`listHouseholdMembers()` returns:

- `household: { id, name } | null`
- `members: HouseholdMemberRow[]`

UI uses `household.name`, falling back to `together.householdLabel` (“Household” / “Hộ gia đình”). Household IDs are not shown. No household avatar asset exists in the read model; initials from display name / email are used.

Member count is the actual `members.length` rendered as existing ICU copy (`header.meta`). No invented household score, wealth, streak, or activity metric.

## Member model

`HouseholdMemberRow`:

- `id` — membership id (actions only, not displayed)
- `userId` — not displayed
- `role` — `HOUSEHOLD_ROLE.ADMIN` \| `HOUSEHOLD_ROLE.PARTNER`
- `email`
- `displayName`
- `isSelf`

Display name order: `displayName` → `email` → translated `unnamedMember`. User IDs are not used as a visual fallback.

## Role model

Unchanged. Presentation labels remain Admin / Partner (`roleAdmin` / `rolePartner`). Capability hints:

- Admin: can manage the household
- Partner: member access

Roles are shown as text badges plus hints. Avatar tone is supplementary, not the only identifier. Admin is never described as financial ownership.

## Invitation model

`listPendingInvitations()` returns pending, non-expired rows:

- `id`, `email`, `token`, `expiresAt`, `createdAt`

UI shows email, pending status, and server `expiresAt`. Token is used only to build the existing share URL on the invitations page. No client-side status invention. Empty pending list does not render a fake invitation card on the hub.

Statuses in `INVITATION_STATUS` are unchanged. Hub and invitations page only present pending (the existing query).

## Collaboration / policy model

Existing household policies (`getHouseholdPolicies`):

- overspend policy
- monthly review assistance (`monthCloseMode`)
- income allocation mode
- partner-visible policy audit (`listPolicyEvents`)

Admin can edit; Partner is read-only. Saving does not move money (existing copy).

## Settings / preferences

Household preferences (`getHouseholdPreferences`): locale, timezone, base currency. Only locale is editable; timezone and currency are displayed as stored.

App settings (`/together/settings`): signed-in email, role, device appearance/language (`TogetherPreferences`), account lifecycle (`/together/settings/account`). These already lived under Together; they were not moved from another domain.

## Existing actions

| Action | Function | Payload |
| --- | --- | --- |
| Create invite | `createInvitationAction` | `{ email }` |
| Revoke invite | `revokeInvitationAction` | `invitationId` |
| Change role | `changeRoleAction` | `{ membershipId, role }` |
| Leave | `leaveHouseholdAction` | none |
| Remove partner | `removeHouseholdMemberAction` | `membershipId` |
| Save policies | `updatePoliciesAction` | `{ overspendPolicy, monthCloseMode, incomeAllocateMode }` |
| Save preferences | `updatePreferencesAction` | `{ locale, timezone, baseCurrency }` |
| Delete account | `deleteAccountAction` | existing account flow |
| Sign out | existing form POST | existing adapter path |

Authorization remains server-side. UI may hide Admin-only controls; hiding is not authorization.

## Terminology decisions

- Destination name stays Together / Cùng nhau (navigation label).
- Hub headline is household identity (“Our household” / “Hộ của chúng ta”), not marketing.
- “Policies & roles” → “Shared rules” / “Quy tắc chung” (presentation only).
- Prefer household, members, invited, shared, preferences, settings.
- Keep Admin / Partner; do not rename internal roles.

## Hard rejects

Not added: social/chat/feed, household financial score, member rankings, leaderboards, gamification, Net Worth / Reports / Total Money, extra tabs, fake members/invitations/permissions, magic-link/public household links, new roles, contract changes.
