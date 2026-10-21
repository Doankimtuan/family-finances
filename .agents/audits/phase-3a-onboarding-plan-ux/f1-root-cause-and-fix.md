# F1 — Pending invitation discovery

## Root cause

The onboarding route checked authentication and active household membership, then sent every remaining user directly to the household creation wizard. It never queried recipient invitations. An invitee who logged in normally therefore could not discover the household invitation unless they returned through the invitation URL.

The existing invitation model already stores pending invitations and applies recipient-email RLS. The existing `accept_household_invitation` RPC validates the token and enforces the membership rules. No parallel invitation flow or database change was needed.

## Change

- Added the tenancy application query `listUserInvitations`, which reads recipient-visible pending, unexpired invitations, checks the authenticated email, and uses the existing invitation preview contract to obtain household names.
- The browser receives only invitation IDs and household names. Tokens remain server-side.
- Added `acceptInvitationById`, which validates the UUID, rechecks recipient email, pending status, and expiry under RLS, then calls the existing token acceptance path and RPC.
- The onboarding route now presents invitations before the existing wizard. Accept and create-own-household remain explicit choices; no invite is auto-accepted.
- Added English and Vietnamese copy and unit coverage for multiple invitations, email filtering, token secrecy, acceptance, stale states, and mismatches.

## Files changed

- `app/[locale]/(onboard)/together/onboard/page.tsx`
- `app/[locale]/(onboard)/together/onboard/actions.ts`
- `app/[locale]/(onboard)/together/onboard/onboard-entry-screen.tsx`
- `modules/tenancy/application/invitation.schema.ts`
- `modules/tenancy/application/accept-invitation.ts`
- `modules/tenancy/application/list-user-invitations.ts`
- `messages/en/onboard.json`
- `messages/vi/onboard.json`
- `tests/unit/invitations.test.ts`

## User impact

Before the fix, a normally signed-in invitee saw “Name your household.” After the fix, the invitee sees the household name and can accept or continue to create a separate household. Query and acceptance failures show recoverable, non-sensitive messages. Existing household members still redirect to Home.

## Verification

- Unit tests cover multiple matching invitations, case-insensitive recipient matching, excluding other recipients, no token serialization, UUID validation, revoked/accepted status, expiry, email mismatch, and the successful existing RPC path.
- Two-account browser acceptance, normal login, refresh, existing-member redirect, and shared-household visibility passed. See [browser verification](f1-browser-verification.md).
- No migration or other database schema change was made.

## Risks

Expired and revoked invitations are rejected by the application checks and covered by unit tests. A separate browser click on an already-rendered stale invitation was not performed; the existing acceptance RPC remains the final race-safe authority.
