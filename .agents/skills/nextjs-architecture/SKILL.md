---
name: nextjs-architecture
description: Next.js 16 App Router architecture — Server Components by default, minimal use client boundaries, Server Actions, route responsibility, data access, revalidation, parallel data loading, and error/loading boundaries. Use for any task touching app/ routes, layouts, server actions, or server-side data access.
---

# Next.js Architecture

Next.js 16 App Router with next-intl locales under `app/[locale]/`.

## Rendering Model

- Server Components by default. Add `"use client"` only where interactivity
  genuinely requires it, and keep the boundary at the deepest practical leaf.
- Do not force Server Components when a piece genuinely needs client
  interactivity — and do not pull an entire route client-side for one control.
- Client leaves must be hydratable: initial server output matches the first
  client render (also required by the Motion Foundation law).

## Route Responsibility

- Routes and layouts orchestrate: authenticate, authorize, fetch, and render
  module components. Business logic lives in `modules/<bc>/application`.
- `page.tsx` stays thin; push composition into module/domain components.
- Keep parallel route/segment structure consistent with the existing IA
  (`artifacts/information-architecture/CURRENT/` is authoritative for UI
  structure; do not redesign routes).

## Data Access

- Server-side data access goes through module application queries/commands —
  not raw Supabase calls scattered in components (see `supabase` skill for
  client usage rules; Health is read-only per BR-24 and must not open clients
  or import commands).
- Server Actions validate input with the module's Zod schemas and return
  typed results; they do not throw for expected business failures.

## Loading, Errors, Waterfalls

- Load data in parallel at the level where it is consumed (top-level `await`
  sequencing creates waterfalls — fetch independent data concurrently).
- Every meaningful route segment has `loading.tsx` (suspense boundary) and an
  `error.tsx` boundary consistent with existing patterns.
- Request deduplication: React caches identical server requests within a
  render; do not build ad-hoc caching layers around it.

## Revalidation

- After mutations (Server Actions), revalidate the affected paths explicitly
  and narrowly (`revalidatePath` / `revalidateTag` with constants — no magic
  route strings; use `app-path.ts` builders).
- Do not over-revalidate the whole app for a scoped change.

## Server Actions

- Actions are thin adapters: parse input with the shared Zod schema, delegate
  to the module command, map the typed result to the client contract.
- No secrets, keys, or privileged assumptions in client components; actions
  re-authorize on the server.

## Verification

For changes in `app/`, run `npm run lint` and `npm run typecheck`; verify
rendered screens in a real browser at 390/440/768/1280 for substantial UI
changes (UI law in `AGENTS.md`).

## Related Skills

- `code-quality`, `typescript-quality` — always apply
- `react-quality` — component internals
- `error-handling` — action/result contracts
