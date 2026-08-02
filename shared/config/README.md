# `shared/config/`

Home for environment-driven and feature-flag configuration read at runtime — as opposed to `shared/constants/`, which holds fixed literal values with no environment dependency.

See [Coding Standards — Constants Policy](../../artifacts/coding-standards/CURRENT/constants-policy.md) and [Magic String Policy](../../artifacts/coding-standards/CURRENT/magic-string-policy.md) (feature flag names must never be hardcoded at call sites).

## What belongs here

- Feature flag name constants (`FeatureFlag.NEW_INBOX_UI`) and their typed accessor, once this product introduces feature flagging.
- Typed wrappers around `process.env.*` reads that are consumed from more than one module.

## What does NOT belong here

- Supabase client construction / secrets handling — that remains in its existing `modules/platform` / infrastructure location per Architecture rules.
- Domain constants with no environment dependency — those are `shared/constants/` or `modules/<bc>/application/*-constants.ts`.

## Current status

Empty by design at freeze time — the repository audit found **no active feature-flag module** in the rewrite. Do not invent a feature-flag system speculatively; add one only when a Story requires it, per YAGNI (`artifacts/implementation-governance/CURRENT/anti-patterns.md`).
