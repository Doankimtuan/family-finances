---
document: Account Linking
pack: auth-enhancement
version: v1.0.0
status: AUTHENTICATION_STRATEGY_V2
run_id: run_auth_enhancement_20260802T014240Z
created_at: 2026-08-02T01:42:40Z
frozen: true
sot_untouched: true
---

# Account Linking

## Goal

Users signing in with **different providers** but the **same verified email** must resolve to the **same** Supabase Auth user (and therefore the same app identity) where Supabase identity linking supports it. **Do not create duplicate user profiles.**

Proposed business rule: **`BR-02b`** — One Auth user per verified email across linked identities.

## Canonical identity

| Layer | Key |
|-------|-----|
| Auth | `auth.users.id` |
| App / RLS | Foreign keys and memberships reference that UUID |
| Email | Verified email is the linking signal Supabase uses for automatic linking |

There is no separate “ViNha user id” parallel to Auth for MVP. Household membership rows attach to the Auth user id (S2 schema). Duplicate Auth users ⇒ duplicate membership risk ⇒ forbidden when linking can prevent it.

## Supabase capabilities (strategy)

### Automatic identity linking

- Prefer enabling **automatic linking** in the Supabase project for same verified email across providers.
- When a user completes Google/Apple/email sign-in with an email that already belongs to an existing user (verified), Supabase should attach the new identity to that user instead of creating a second user.
- Product copy must not promise linking if the project leaves automatic linking off.

### Manual linking (authenticated)

- For an already signed-in user adding another provider: `linkIdentity({ provider })` (future command).
- Use from a future Account / Security settings surface (not S1 email stories); proposed under `ST-E02-005`.

### Unlink

- `unlinkIdentity` only when at least one identity remains; never leave a user with zero recovery path.
- Out of scope for initial OAuth login story; document in security + account settings later.

## Conflict matrix

| Scenario | Expected outcome |
|----------|------------------|
| New Google sign-in, email matches existing verified email user, auto-link on | Same `auth.users.id`; session for that user |
| New Google sign-in, email matches, auto-link off | Supabase may create a second user or error — **product rejects duplicate profiles**; surface error and instruct support/link path; do not seed a second membership |
| OAuth email unverified / withheld (e.g. Apple Hide My Email vs prior password email) | Treat as distinct emails; may create distinct users; UX should explain; optional later “claim/link” when emails prove equal |
| Password user later Continues with Google (same verified email, auto-link on) | Identities merge to one user |
| Two existing users already created (historical duplicate) | Manual remediation / support; no automatic silent merge of household data in app code |
| `linkIdentity` while another account owns that identity | Fail closed with Alert; no overwrite |

## Application rules

1. Never invent a client-side “merge profiles” that copies ledgers between `auth.users` rows without an explicit admin/migration story.
2. After any successful OAuth or password session, resolve membership with the **session user id** only (`resolveActiveMembership` / S2).
3. Register (`signUp`) with an email that already exists → existing `already_registered` behavior; prefer directing user to Login (including OAuth).
4. Money gates (`REQ-002`) apply identically regardless of provider.

## Product / Tech deltas (proposal only)

| Artifact | Proposal |
|----------|----------|
| Business Catalog | Add `BR-02b` linked to `F-Auth` |
| Requirements | Add `REQ-002a` (providers) referencing linking via `BR-02b` |
| Technical tenancy | Commands `linkIdentity`, optional `unlinkIdentity`; document auto-link project setting as ops prerequisite |
| Acceptance | New AC row or extend `AC-002` verification notes for “same email → same user” smoke |

## Testing expectations (future)

- Unit: mapping of Supabase linking / conflict errors to stable action codes.
- E2E: optional manual checklist (real Google/Apple test users); automated e2e may remain env-gated like password happy path.
- Regression: email login/register/forgot unchanged when OAuth buttons present.
