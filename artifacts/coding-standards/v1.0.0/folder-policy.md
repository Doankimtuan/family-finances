---
document: Folder Policy
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
---

# Folder Policy

This document adds Staff-Engineer detail on top of the Constitution's [folder-rules.md](../../developer-constitution/CURRENT/folder-rules.md) (mandatory tree — unchanged and extended, not replaced).

## Addition to the mandatory tree

The Constitution tree is extended with two new leaf folders under `shared/` to give [Constants Policy](./constants-policy.md) a concrete home. This is an **addition**, not a restructure:

```text
shared/
  ui/                   # unchanged — primitives only
  patterns/             # unchanged — cross-feature composites
  hooks/                # unchanged
  lib/                  # unchanged
  utils/                # unchanged
  constants/            # NEW — cross-cutting as-const objects (RoutePath alias, StorageKey, QueryKey, MutationKey, ThemeMode, Locale)
  config/                # NEW — env/feature configuration (feature flags)
```

Domain-scoped constants (statuses, roles specific to one Bounded Context) still belong in `modules/<bc>/application/*-constants.ts` — do **not** move them to `shared/constants/`. `shared/constants/` is for values with no single owning module (routes spanning modules, storage keys, query/mutation keys, theme/locale).

## One responsibility per file

A file exports one cohesive concern: one component, one hook, one constants group, one set of related types, or one utility module. If a file mixes "component + its hook + its types + its constants" and starts growing, split along those lines before it crosses the line size below.

## File size — soft cap ~300-400 lines

A file approaching 300-400 lines is a signal to split, not a hard error. At audit time:

| Lines | File | Verdict |
|------:|------|---------|
| 394 | `app/[locale]/(product)/money/transactions/[id]/edit/edit-transaction-form.tsx` | Over cap — extract shared form shell with capture form (manual review, see [audit-report.md](./audit-report.md)) |
| 311 | `app/[locale]/(auth)/register/register-screen.tsx` | At cap — acceptable, monitor |
| 298 | `app/[locale]/(product)/together/policies/policies-form.tsx` | At cap — acceptable |
| 298 | `app/[locale]/(product)/money/transactions/capture-transaction-form.tsx` | At cap — pairs with edit form above |

When splitting, split along these lines, in this order of preference:

1. **Types** -> co-located `*.types.ts` or the module's `*-types.ts` file.
2. **Constants** -> the appropriate Constants Policy home.
3. **Utils/formatters** -> `shared/utils` (cross-cutting) or a local `*-utils.ts` (single-consumer).
4. **Hooks** -> `shared/hooks` (reused ≥3 times) or co-located `use-*.ts` (single feature).
5. **Sub-components** -> co-located files in the same directory, composed by the parent.

Do not split purely to hit a line count if the result creates indirection with no reuse or readability benefit — the cap is a smell detector, not a mechanical rule.

## Review gate

- A new file exceeding ~400 lines without a split plan or explicit justification in the PR fails review.
- A new constants file placed outside the three approved homes (`shared/constants`, `shared/config`, `modules/*/application`) fails review.
