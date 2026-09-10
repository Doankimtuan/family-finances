# Phase 13 — Implementation notes

**Status:** Presentation implemented. Authenticated browser validation is blocked by the existing login hydration gate (`Log in` stays `disabled` because `busy || !hydrated`). Does not overwrite `.agents/design-system.md`. Next phase is Health — not started.

## What this phase did

Make Together answer:

> Who is in our household, how do we work together, and what shared settings should we manage?

without turning it into a financial dashboard, admin console, social network, or messaging surface.

## Files changed

### Hub

- `app/[locale]/(product)/together/page.tsx` — identity-first TopAppBar + hero, members, pending invitations when present, collaboration group, settings group
- `app/[locale]/(product)/together/together-loading-skeleton.tsx` — mirrors hero / members / two destination groups
- `app/[locale]/(product)/together/together-member-preview.tsx` — scan rows with role + capability hint
- `app/[locale]/(product)/together/together-member-row.tsx` **new** — shared member anatomy
- `app/[locale]/(product)/together/together-invitation-preview.tsx` **new** — hub pending preview (no empty card)
- `app/[locale]/(product)/together/together-member-identity.ts` — unnamed fallback; no user-id display
- `app/[locale]/(product)/together/together-presentations.ts` **new** — role/label/aria helpers

### Members / invitations / settings

- `app/[locale]/(product)/together/member-list.tsx` — scan-first rows, 44px actions, existing test ids
- `app/[locale]/(product)/together/members/page.tsx` — unnamed fallback passed through
- `app/[locale]/(product)/together/invitations/invitations-panel.tsx` — accessible row labels; still elevated (not warning cards)
- `app/[locale]/(product)/together/invitations/new/invitation-form.tsx` — concise form + `BottomActionBar`; payload unchanged
- `app/[locale]/(product)/together/settings/page.tsx` — grouped account destination

### Copy / tests

- `messages/en/together.json` / `messages/vi/together.json`
- `tests/unit/phase-13-together.test.tsx` **new**
- `tests/unit/together-ui-polish.test.tsx` — unnamed fallback coverage

Not changed: queries, commands, RPCs, mappers, server-action contracts, invitation TTL, member-role semantics, RLS, navigation architecture, onboard wizard, public invite-accept screen.

## Route / helper usage

- `TOGETHER_PATH.ROOT`, `MEMBERS`, `INVITATIONS`, `INVITATIONS_NEW`, `POLICIES`, `PREFERENCES`, `SETTINGS`, `SETTINGS_ACCOUNT`
- Invite share URLs still use `invitePath(token)`

## Read models reused

- `listHouseholdMembers` / `HouseholdMemberRow`
- `listPendingInvitations` / `PendingInvitation`
- `listMembershipImpactSummaries`
- `getHouseholdPolicies` / `listPolicyEvents`
- `getHouseholdPreferences`
- `requireTogetherMembership`

## Mutations reused

`createInvitationAction({ email })`, `revokeInvitationAction(id)`, `changeRoleAction({ membershipId, role })`, `leaveHouseholdAction()`, `removeHouseholdMemberAction(id)`, existing policy/preference/account actions.

## Shared components reused

`TopAppBar`, `Page`, `Card`, `SectionHeader`, `EmptyState`, `StatusBadge`, `StatusAlert`, `Sheet`, `ActionSheetLayout`, `SheetActionFooter`, `BottomActionBar`, `TogetherNavGroup`, `TogetherNavRow`, `TogetherPrimaryLink`, `TogetherStatusStrip`, `MotionReveal`, `AppIcon`, `IconContainer`, `Button`, `Input`/`TextField`, `ChoiceTile`, `SelectField`, `Skeleton`, `HeaderPill`.

## New local components

- `TogetherMemberRow`
- `TogetherInvitationPreview`
- presentation helpers in `together-presentations.ts` (not a new data layer)

## Presentation decisions

- TopAppBar is the Together destination (`t("title")`); household name is meta, not a technical id.
- Hero is identity: name, member-count prose, role context. No giant dashboard numeral.
- Hub order: identity → members → invite CTA (Admin, under limit) → pending invitations (only if any) → collaboration (invitations + shared rules) → preferences/settings.
- Pending invitations on the hub are scan-only and link to the existing invitations page. Copy/Revoke stay on that page.
- Invitation list remains `tone="elevated"` with a warning status badge (existing B15 contract forbids warning-card restyle).
- Current user is labeled “You” / “Bạn” with role text.
- Solo-Admin continuity warning is unchanged.

## Privacy / accessibility

- No user IDs, tokens, or session data in member copy.
- Invitation tokens are not rendered.
- Row `aria-label` includes name, You when self, and role/status text.
- Role meaning uses badge text + hint, not color alone.
- Interactive targets at `min-h-11` (44px) or `min-h-12` / `min-h-14` for rows.
- Sheets keep existing Escape / focus behavior (HeroUI owns motion).
- No new financial values on Together.

## Refactor review

- Role checks go through `HOUSEHOLD_ROLE` / `isHouseholdAdmin`.
- Test ids that E2E already uses are preserved (`together-invite-cta`, `together-*-link`, `together-member-*`, `together-role-*`, `invite-copy` / `invite-revoke`).
- `householdRoleLabel` / `householdRoleHint` stay separate because they consume different copy maps.
- Invite form still uses the existing local email check + `createInvitationAction`; it was not converted to a new RHF schema.

## Deferred

- Authenticated 390/440/768/1280 + light/dark Together verification (login hydration gate).
- Public invite-accept and onboard wizard were left as existing flows (not the Together hub).
- Partners still see Copy/Revoke on the invitations page; the server remains authoritative if those mutations are denied.
