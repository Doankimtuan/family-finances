---
name: react-quality
description: React 19 component quality — component responsibility, state ownership, derived state, effect discipline, composition, client boundaries, and rendering. Use for any task that creates or modifies React components in app/, shared/, modules/, or providers/.
---

# React Quality

React 19. Server-first Next.js application with a mobile-first 440px shell
(HeroUI v3 + design tokens). See the UI Constitution in `AGENTS.md` for visual
and component-system law; this skill covers component code quality.

## Component Responsibility

- One clear responsibility per component; render + orchestration only.
- Business/domain calculations do not live in JSX — call the module
  application layer (`modules/<bc>/application`) instead.
- Do not split components solely because of line count. Split when a distinct
  responsibility, reused piece, or independent state emerges.

## State Ownership

Classify every value before adding state:

```text
form state      -> React Hook Form owns it (see form-architecture)
server state    -> server components / queries own it
derived state   -> compute during render, do not store
UI state        -> local useState, the only real local-state home
```

Strong rules:

```text
Do not use useEffect to compute derived state.

Do not duplicate server state into local state without a clear reason.

Do not add useMemo/useCallback automatically — add them for measured or
obvious cost (large lists, genuinely expensive computation, referential
stability required by memoized children or hooks deps).

Do not split components solely because of line count.
```

Derive during render:

```tsx
// BAD
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.amount, 0));
}, [items]);

// GOOD
const total = items.reduce((sum, item) => sum + item.amount, 0);
```

## Effect Discipline

Effects synchronize with external systems (DOM APIs, subscriptions, focus
management, analytics). They are not for: deriving values, responding to user
events (use handlers), or orchestrating data fetching owned by the server or
query layer. Every effect needs a correct dependency array and a cleanup
function when it subscribes.

## Composition and Client Boundaries

- Keep the `"use client"` boundary as small as possible: push interactivity to
  leaf components and pass data down from server components.
- Compose with children/slots before reaching for configuration props or
  render-prop indirection.
- Colocate variants with `tailwind-variants`; consume design tokens, never
  arbitrary values (see UI Constitution).
- Motion components stay client leaves; initial server output must match the
  hydrated first render (see Motion Foundation in `AGENTS.md`).

## Rendering Performance

- Stable `key`s from domain identity; never array index for reorderable lists.
- List rendering: map domain objects to rows that receive prepared view data;
  avoid per-row recomputation of shared values.
- Avoid object/array literals in props of memoized subtrees when it defeats
  the memo.
- Consult the `vercel-react-best-practices` skill for deep performance work.

## Event Handlers

- Handlers orchestrate; they do not embed domain rules. Call the application
  layer.
- Name handlers for intent (`handleAllocationConfirm`), not mechanism
  (`handleClick`).
- Keep optimistic/rollback logic in the command layer, not in the component.

## Related Skills

- `code-quality`, `typescript-quality` — always apply
- `nextjs-architecture` — server/client boundaries and data access
- `form-architecture` — React Hook Form + Zod
- `vercel-react-best-practices` — performance deep-dive
