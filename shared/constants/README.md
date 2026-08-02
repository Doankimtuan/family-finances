# `shared/constants/`

Home for **cross-cutting** `as const` constant objects that have no single owning Bounded Context — i.e. values used by two or more `modules/*` or by `app/**` directly, where no one module is the natural owner.

See [Coding Standards — Constants Policy](../../artifacts/coding-standards/CURRENT/constants-policy.md) for the required shape and full decision tree.

## What belongs here

- App-wide storage/query/mutation key namespaces shared across modules.
- Theme/locale constant namespaces, if a cross-module need arises that `i18n/locales.ts` and `next-themes` config do not already cover.

## What does NOT belong here

- Route paths — the source of truth is `modules/tenancy/application/app-path.ts` (`APP_PATH` / `RoutePath`). Do not create a second route map here.
- Domain-scoped constants owned by one Bounded Context (transaction status, account type, invitation status, household role) — those live in `modules/<bc>/application/*-constants.ts`.
- Environment/feature configuration — that belongs in `shared/config/`.

## Current status

Empty by design at freeze time — every constant audited so far already has a clear single-module owner (see `modules/tenancy/application/auth-constants.ts`, `tenancy-constants.ts`). Do not add a file here speculatively; add one only when a genuine cross-module constant is introduced by a Story, per the Rule of Three / [Abstraction Policy](../../artifacts/implementation-governance/CURRENT/abstraction-policy.md).
