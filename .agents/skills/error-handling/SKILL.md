---
name: error-handling
description: Typed Result patterns, domain error codes, expected vs unexpected errors, Supabase/RPC/server-action errors, and user-facing messages. Use for any task that handles failures, defines error contracts, calls Supabase, or surfaces errors to users.
---

# Error Handling

## Classify First

Every failure is either:

```text
expected (domain)      -> a typed outcome the caller must handle
                        (insufficient balance, allocation over limit,
                         ritual already run, unauthorized)
unexpected (fault)     -> an exception: bugs, network, infrastructure
```

Expected business failures are values, not exceptions. Unexpected failures
propagate with context and are logged.

## Typed Results

Module commands/queries return explicit result types instead of throwing for
expected outcomes:

```ts
type ReallocateJarResult =
  | { ok: true; jar: JarPlan }
  | { ok: false; code: ReallocateJarErrorCode; detail?: string };

type ReallocateJarErrorCode =
  "JAR_NOT_FOUND" | "INSUFFICIENT_CAPACITY" | "ALLOCATION_EXCEEDS_LIMIT";
```

Error codes are domain constants (no-magic-strings law), one as-const object
per module next to its other constants, and the union derived from it.

Avoid `UNKNOWN` for everything — an unknown branch may exist for truly
unexpected cases, but it must not swallow the classification work.

## Never Swallow

Forbidden:

```ts
catch {}
try { ... } catch { /* ignore */ }
```

When catching at a boundary:

- classify (map to a code or rethrow)
- log with structured context (operation, ids, code) — `console.error` is the
  allowed logger per ESLint config
- return the typed result or a user-facing message contract

Explicit review rule: flag `catch {}`, empty catches, and catches that discard
the original exception without a documented reason. A safe `UNKNOWN` result is
only valid when the unexpected failure is logged with operation context.

## Supabase and RPC Errors

- Treat `supabase-js` / PostgREST errors as infrastructure input: map to your
  domain error codes at the data-access boundary; components never see raw
  Supabase error objects.
- Read structured fields (`code`, `details`, `hint`) from the error object —
  do not parse `error.message` strings.

```ts
const { data, error } = await query;
if (error) {
  return { ok: false, code: LEDGER_ERRORS.READ_FAILED, detail: error.code };
}
```

- Consult the `supabase` skill for product-specific guidance.

## Server Actions

Actions validate input with the module Zod schema and translate command
results into a stable client contract:

```ts
type ActionState =
  | { status: "success"; data: ... }
  | { status: "validation"; fieldErrors: ... }
  | { status: "domain-error"; code: DomainErrorCode }
  | { status: "unexpected" };
```

Unexpected throws are caught at the action boundary, logged, and surfaced as
`unexpected` — never as raw stack traces or English exception prose in the UI.

## User-Facing Messages

- Users see i18n messages keyed by error code (`messages/en`, `messages/vi`) —
  never `error.message`, never hardcoded strings (i18n law in `AGENTS.md`).
- Map code -> message key via a registry; both English and Vietnamese must
  exist.
- Serious warnings get no decorative motion (Motion Foundation law).

## Smells to Remove

- `catch {}` or catch-and-return-`null` without classification
- `error.message.includes("...")` branching (fragile string matching) — unless
  no structured contract exists at all; if so, isolate it at one boundary with
  a comment
- throwing for expected business outcomes
- leaking Supabase/Postgres error objects into components
- one giant `UNKNOWN` error code covering every case

When a legacy RPC exposes only human-readable text, isolate the compatibility
fallback behind one semantic classifier. Structured `code`, `details`, and
`hint` metadata always takes precedence; do not scatter `message.includes`,
`message.startsWith`, or regular expressions over consumers.

Result ownership: expected domain failures use typed domain codes; unexpected
failures are logged at the boundary and mapped to a safe public code. The UI
receives stable codes and translates them; it never interprets raw database or
infrastructure errors.

## Related Skills

- `code-quality`, `typescript-quality` — always apply
- `nextjs-architecture` — action boundaries and revalidation
- `supabase` — database client usage
