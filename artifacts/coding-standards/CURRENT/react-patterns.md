---
document: React Patterns
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
---

# React Patterns

This document adds Staff-Engineer detail on top of the Constitution's `coding-standards.md` React section (functional components, composition over inheritance, single responsibility — unchanged and restated by reference).

## Composition and small components

Prefer several small, named, single-purpose components composed by a parent over one large component branching on props/state. If a component's JSX has more than ~2 levels of conditional branching for structurally different output, extract each branch into its own component.

The edit-transaction and capture-transaction forms already do this correctly for their top-level `confirmDelete` / `confirmSave` states (early-return a dedicated block) — keep using early-return-to-a-focused-block for mutually exclusive screen states, rather than nesting ternaries inside the main return.

## Avoid nested ternaries

A ternary nested inside another ternary's branch is forbidden. Two acceptable alternatives:

```tsx
// Forbidden
const tone = type === "income" ? "credit" : type === "expense" ? "debit" : "neutral";

// Required — lookup table
const TONE_BY_DIRECTION: Record<TransactionDirection | "neutral", Tone> = {
  income: "credit",
  expense: "debit",
  neutral: "neutral",
};
const tone = TONE_BY_DIRECTION[type];

// Or — early return / if-chain when it's control flow, not a value map
```

A single, un-nested ternary for a genuinely binary choice (`isPending ? t("saving") : t("save")`) remains fine.

## Avoid repeated inline objects and functions in JSX

Do not construct a new object or arrow function literal inside JSX on every render for props that a memoized child depends on for equality, and do not repeat the same inline class-string logic in multiple call sites.

```tsx
// Avoid — repeated inline ternary class string, duplicated across capture + edit forms
className={direction === value ? "min-h-11 rounded-md bg-accent px-(--space-3) ..." : "min-h-11 rounded-md border ..."}

// Prefer — a small local helper or shared variant
const segmentClass = (active: boolean) =>
  cn(SEGMENT_BASE_CLASS, active ? SEGMENT_ACTIVE_CLASS : SEGMENT_INACTIVE_CLASS);
```

This exact duplication (identical long class-ternary blocks for direction/category segmented controls) exists today between `capture-transaction-form.tsx` and `edit-transaction-form.tsx` — flagged for manual extraction in [audit-report.md](./audit-report.md) because it should become a shared `SegmentedControl` pattern in `shared/patterns`, which is a design-system-adjacent decision, not a pure mechanical move.

## Hooks — derived state over `useEffect`

Compute values during render (derived state) instead of syncing them into `useState` via `useEffect`. Reach for `useEffect` only for true side effects (subscriptions, imperative DOM/browser APIs, logging) — never to keep one piece of state in sync with another that is already available.

```tsx
// Avoid
const [tags, setTags] = useState(expenseTags);
useEffect(() => {
  setTags(direction === "income" ? incomeTags : expenseTags);
}, [direction]);

// Prefer — already the pattern in edit-transaction-form.tsx
const tags = direction === "income" ? incomeTags : expenseTags;
```

## Memoization only when measured

Do not wrap every value in `useMemo`/`useCallback` by default. Memoize only when:

1. Profiling (React DevTools Profiler or a user-reported jank) shows a measurable re-render cost, **or**
2. The value is a dependency of another hook's dependency array and recreating it would cause an infinite loop or genuinely wasted expensive work (e.g., `useMemo` already used correctly in `edit-transaction-form.tsx` for `parsedAmount`, which does real parsing work per keystroke).

Follow the repository's React Compiler guidance if/when enabled; do not pre-optimize with manual memoization that the compiler would otherwise handle.

## Avoid duplicated hooks

Before writing a new hook, search `shared/hooks` and Engineering Review's `reusable-hooks.md`. `shared/hooks/use-online-status.ts` already exists and is the canonical connectivity hook — do not re-implement `navigator.onLine` polling anywhere else.

## Review gate

- A nested ternary in a diff fails review.
- A new `useEffect` that only mirrors derived state into `useState` fails review.
- A new `useMemo`/`useCallback` with no stated performance justification in the PR fails review.
- A new hook duplicating an existing `shared/hooks` hook fails review.
