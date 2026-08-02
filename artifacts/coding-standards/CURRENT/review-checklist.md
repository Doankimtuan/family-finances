---
document: Review Checklist
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
implementation_governance_sot: artifacts/implementation-governance/CURRENT
---

# Review Checklist (Coding Standards Merge Gate)

This checklist is additive to the Constitution's [code-review-checklists.md](../../developer-constitution/CURRENT/code-review-checklists.md) and the Governance [code-review-guide.md](../../implementation-governance/CURRENT/code-review-guide.md). It codifies the specific AI-generated code smells this pack exists to eliminate. **Any single unchecked row below is a merge-blocking fail**, not a suggestion.

## Merge-fail gates

| # | Check | Fail condition | Policy |
|---|-------|-----------------|--------|
| 1 | No magic strings | A route, storage key, query/mutation key, API path, event name, permission/role, transaction type/status, feature flag, cookie name, theme name, or locale name is hardcoded instead of imported from a constant | [magic-string-policy.md](./magic-string-policy.md) |
| 2 | No duplicated literals | The same string/number with product meaning appears as a literal in 2+ files instead of one shared constant | [constants-policy.md](./constants-policy.md) |
| 3 | No duplicated Tailwind blobs | An identical (or near-identical, 5+ utility) class string is copy-pasted across 3+ call sites instead of a shared pattern/variant | [tailwind-policy.md](./tailwind-policy.md), [react-patterns.md](./react-patterns.md) |
| 4 | No hardcoded routes | Any `href`/`router.push`/`redirect` target is a literal string instead of `RoutePath`/`APP_PATH` or a typed path builder | [magic-string-policy.md](./magic-string-policy.md) |
| 5 | No hardcoded query/mutation keys | Any TanStack Query `queryKey`/`mutationKey` array contains literal strings instead of `QueryKey`/`MutationKey` constants | [magic-string-policy.md](./magic-string-policy.md) |
| 6 | No unjustified arbitrary Tailwind | An arbitrary value bracket (`[...]`) is used when a canonical utility or existing `--space-N`/`--color-*`/`--radius-*` token covers it, with no one-line justification | [tailwind-policy.md](./tailwind-policy.md) |
| 7 | No duplicated interfaces | Two files independently declare the same shape instead of sharing one type / `z.infer<...>` | [typescript-policy.md](./typescript-policy.md), [enums-policy.md](./enums-policy.md) |
| 8 | No duplicated utilities | A formatting/mapping/calculation function is re-implemented instead of reused from `shared/utils`, `shared/i18n`, or the owning module | [folder-policy.md](./folder-policy.md) |
| 9 | No `any` | `any` appears anywhere in the diff outside `archive/legacy-v1` | [typescript-policy.md](./typescript-policy.md) |
| 10 | No new native `enum` without justification | A TypeScript `enum` is introduced without a documented platform-API reason | [enums-policy.md](./enums-policy.md) |
| 11 | No relative imports deeper than 2 levels | A `../../../` (or deeper) import is used instead of an `@/` alias | [import-policy.md](./import-policy.md) |
| 12 | No unused imports | An import in the diff is not referenced | [import-policy.md](./import-policy.md) |
| 13 | No abbreviated identifiers | A new identifier matches a forbidden abbreviation pattern | [naming-policy.md](./naming-policy.md) |
| 14 | No nested ternaries | A ternary is nested inside another ternary's branch | [react-patterns.md](./react-patterns.md) |
| 15 | No effect-based derived state | A `useEffect` only mirrors state already derivable during render | [react-patterns.md](./react-patterns.md) |

## How to run this checklist

1. For every changed file in the diff, scan against rows 1-15.
2. Any row that fails must either be fixed before merge, or the PR description must cite the exact [audit-report.md](./audit-report.md) manual-review item deferring it (pre-existing debt untouched by this PR is not a new failure — only *new* violations introduced by the diff block merge).
3. Record the outcome in the PR using the Governance [pull-request-template.md](../../implementation-governance/CURRENT/pull-request-template.md) "Constitution / Governance" section, adding a line: `Coding Standards v1.0.0: Pass` (or the specific rows failed and why they are pre-existing debt, not new).

## Relationship to other gates

This checklist does not replace the Constitution's architecture/React/Next/TypeScript/Design/Accessibility/Security/Testing/Performance checklists, or Governance's Implementation Checklist STOP gate — it runs **in addition to** them, focused specifically on the mechanical smells this board was chartered to eliminate.
