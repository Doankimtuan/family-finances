# Authentication Enhancement — CURRENT

**Status:** `AUTH_READY_FOR_IMPLEMENTATION` (strategy frozen; **ADOPTED** into official SoTs)
**Adoption run:** `run_sot_auth_v2_adoption_20260802T014716Z`
**Change log:** `artifacts/change-log/authentication-v2-adoption.md`  
**Board:** Authentication Enhancement Board  
**Version:** `v1.0.0`  
**Run:** `run_auth_enhancement_20260802T014240Z`

## Purpose

Freeze Authentication Strategy v2: Google + Apple + Email/Password via Supabase Auth, account linking, security review, and sprint impact proposals.

## Constraints

- `sot_untouched: true` — does **not** mutate frozen Product / Technical / Screen Blueprint / Sprint Planning CURRENT packs.
- `implementation_started: false` — strategy only; no app code in this freeze.
- Guest mode is not allowed.

## Documents

1. [authentication-v2.md](./authentication-v2.md) — Authentication Flow v2  
2. [oauth-flow.md](./oauth-flow.md) — Google / Apple PKCE + blueprint/tech deltas  
3. [account-linking.md](./account-linking.md) — Same verified email → one user  
4. [security-review.md](./security-review.md) — OAuth, session, linking, logout, delete, routes  
5. [sprint-impact.md](./sprint-impact.md) — Proposed ST-E02-004…006 + SoT checklist  
6. [FREEZE.json](./FREEZE.json)

## Immutable copy

`artifacts/auth-enhancement/v1.0.0/`

## Pointer

`artifacts/LATEST_AUTH_ENHANCEMENT.json`
