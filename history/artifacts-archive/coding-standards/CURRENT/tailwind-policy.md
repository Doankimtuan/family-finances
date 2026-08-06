---
document: Tailwind Policy
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
design_system_sot: artifacts/design-system/CURRENT
---

# Tailwind Policy

## Rule

Always use the canonical Tailwind utility for a token when one exists. Never wrap a theme variable in an arbitrary-value bracket when the plain utility resolves to the exact same CSS.

## Radius (mandatory fix — canonical form exists)

`styles/globals.css` registers `--radius-sm|md|lg|xl|full` inside `@theme inline`, which means Tailwind's own `rounded-*` scale **already resolves to these exact values**. There is never a reason to write the variable explicitly.

| Forbidden | Required |
|-----------|----------|
| `rounded-[var(--radius-sm)]` | `rounded-sm` |
| `rounded-[var(--radius-md)]` | `rounded-md` |
| `rounded-[var(--radius-lg)]` | `rounded-lg` |
| `rounded-[var(--radius-xl)]` | `rounded-xl` |
| `rounded-[var(--radius-full)]` | `rounded-full` |

This exact pattern appeared ~66 times across ~34 files at audit time (see [safe-refactor-log.md](./safe-refactor-log.md)) and has been mechanically fixed as part of this freeze. Any new instance is a **regression**, not a stylistic choice.

## Spacing — CSS custom properties are the approved interim, with a canonical scale in `@theme`

`styles/globals.css` defines `--space-0` through `--space-16` inside `@theme inline`. The codebase consistently uses Tailwind v4's `<utility>-(--space-N)` syntax (e.g., `px-(--space-4)`, `gap-(--space-2)`) rather than the bracket form `px-[var(--space-4)]`. This is the **approved interim convention** for this codebase — it is shorter, still token-backed, and not an arbitrary value in the Tailwind sense (Tailwind v4 treats `(--var)` as a theme reference, not a raw arbitrary value).

- Do not write `px-[16px]`, `gap-[12px]`, or any raw pixel/rem arbitrary value when a `--space-N` token covers it.
- Do not write `px-[var(--space-4)]` (bracket form) — use `px-(--space-4)` (paren form) for consistency with existing code.
- New spacing values must map to an existing `--space-N` token. If no token fits, escalate to the Design System board — do not invent a one-off arbitrary value in feature code.

Mass-converting the ~274 existing `(--space-N)` usages to plain numeric utilities (`px-4`, `gap-2`) is **out of scope** for this freeze (see [audit-report.md](./audit-report.md)) because Tailwind's default numeric spacing scale is not guaranteed to equal these token values 1:1 across future design changes — the paren form keeps spacing under the design token, not the framework default. Do not "fix" this without a Design System-driven decision.

## Colors

Never write a raw hex/rgb value or an arbitrary color bracket (`bg-[#0f766e]`, `text-[rgb(...)]`) in feature code. Every color must come from a `--color-*` token registered in `styles/globals.css` (`bg-accent`, `text-text-primary`, `border-border-subtle`, etc.), consumed via its Tailwind utility, never the bracket/paren form for colors (colors are already exposed as first-class utilities, unlike radius/spacing which use the paren form above).

## Arbitrary values — last resort only

Arbitrary values (`text-[15px]`, `text-[2.75rem]`, `max-w-[18rem]`) are permitted **only** when:

1. No existing token/scale value is close enough for the specific one-off case (e.g., a single hero numeral size), **and**
2. The value is not repeated more than once — if it recurs, promote it to a token via the Design System, not a second arbitrary literal.

Every arbitrary value in a PR diff must be justifiable in review with reason (1) above; unjustified arbitrary values fail review.

## CSS variables in `className`

Do not expose a raw CSS variable in a `className` string unless it is one of the two approved forms above (`rounded-*` canonical utility, or `(--space-N)` paren spacing). In particular:

- Do not write `style={{ borderRadius: "var(--radius-md)" }}` — use the `rounded-md` class.
- Do not introduce new inline `style` props to work around a missing utility; register the token and use a class.

## Review gate

- Any `rounded-[var(--radius-*)]` in a diff fails review — use the plain `rounded-*` class.
- Any raw hex/rgb color or arbitrary color bracket fails review.
- Any arbitrary value without a one-line justification comment or PR note fails review.
- Duplicated long Tailwind class strings (5+ identical utility chains) across 3+ files should be extracted into a shared pattern/variant rather than copy-pasted again — see [react-patterns.md](./react-patterns.md) and [audit-report.md](./audit-report.md) for the current CTA/segmented-control duplication.
