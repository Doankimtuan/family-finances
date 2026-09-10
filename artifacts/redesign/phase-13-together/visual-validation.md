# Phase 13 — Visual validation

## Environment

- App: local Next.js on `http://127.0.0.1:3000` (dev server already running)
- Auth: **not bypassed**
- No fake household members, invitations, roles, or settings were seeded
- No destructive member mutations were submitted

## Authentication result

**Did not reach an authenticated Together hub or nested Together screen.**

`/en/together` redirected to `/en/login`. On login, `Log in` (and OAuth buttons) stayed `disabled` because the login screen gates submit on client hydration (`isDisabled={busy || !hydrated}`). After navigation completed, a further wait still left `Log in` `states: [disabled]` in the Cursor IDE browser.

- Cursor browser accessibility tree: `Log in` `states: [disabled]`
- `/en/together` redirected to `/en/login` (expected unauthenticated gate)
- Auth was not skipped. No session cookie was injected.

Evidence:

- `artifacts/redesign/phase-13-together/evidence/login-disabled-cursor.png`
- `artifacts/redesign/phase-13-together/evidence/notes.json`

## Real data availability

Unknown for this session. Live household name, member list, pending invitations, policies, and preferences could not be inspected in a browser.

Those states were verified in unit tests with fixtures — not against the household database.

## Together verification (live)

| Route | Result |
| --- | --- |
| `/en/together` | Redirected to `/en/login` (unauthenticated) |
| `/en/together/members` | Not reached live |
| `/en/together/invitations` | Not reached live |
| `/en/together/invitations/new` | Not reached live |
| `/en/together/policies` | Not reached live |
| `/en/together/preferences` | Not reached live |
| `/en/together/settings` | Not reached live |
| Invite / role / leave / remove sheets | Not submitted (destructive or mutating; not run) |

## Viewports

| Viewport | Live result |
| --- | --- |
| 390 | Not captured on Together |
| 440 | Login chrome visible (centered auth shell). Together surfaces not reached |
| 768 | Not captured |
| 1280 | Not captured |

The 440px app shell CSS was not changed in this phase. Desktop Together was not turned into a multi-column admin console.

## Light / dark

Not captured on Together. Login was observed in the default light auth shell only.

## States verified

| State | How |
| --- | --- |
| Loading skeleton composition | Implementation + unit source checks |
| Empty members copy | Message files + hub `EmptyState` |
| Populated member rows + You + role/hint | Unit (`phase-13-together`, `together-ui-polish`) |
| Unnamed member fallback (no user id) | Unit |
| Pending invitation preview | Unit |
| No invitation card when empty | Unit (`TogetherInvitationPreview` returns null) |
| Invitation scan + revoke sheet | Unit (`together-invitation-scan`) |
| Leave/remove confirmation | Unit (`together-lifecycle-confirmation`) |
| Mutation payload strings | Unit (source characterization) |
| Authenticated Together in a real browser | **Blocked** |

## Browser blockers

Existing login hydration gate: `Log in` disabled because `busy || !hydrated`. Same limitation as Phase 12. This is an environment/auth limitation, not permission to weaken authentication.

## Known limitations

- Authenticated Together visual validation is incomplete.
- Invitation Copy/Revoke remain visible on the invitations page for any signed-in member; server authorization is unchanged.
- Onboard and public invite-accept were not redesigned in this phase.
