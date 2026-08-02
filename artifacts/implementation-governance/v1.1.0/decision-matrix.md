---
document: Decision Matrix
implementation_governance: v1.1.0
status: OFFICIAL_IMPLEMENTATION_GOVERNANCE
run_id: run_implementation_governance_20260802T153000Z
created_at: 2026-08-02T15:30:00Z
board: Implementation Governance Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
engineering_patterns_sot: artifacts/engineering-review/CURRENT
localization_sot: artifacts/localization/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
---

# Decision Matrix

Every reuse/create/refactor decision must record: **Reason · Trade-off · Examples · Counter-examples**.

Default bias: **reuse first**, **Rule of Three** before extracting, **no speculative abstractions**.

## 1. Reuse Component vs Create Component

| | Reuse | Create |
|---|-------|--------|
| **When** | Same UI primitive/pattern exists in `shared/ui` or `shared/patterns` (or Engineering Review inventory) | No existing component covers the interaction after honest search; need appears in ≥2 features or is a Design System ID not yet built |
| **Reason** | Consistency, smaller surface | Fill a real gap with clear ownership |
| **Trade-off** | May need small props extension | Risk of parallel primitives |
| **Examples** | Use `AmountField` pattern for money inputs | Create `OtpInput` when blueprint requires it and none exists |
| **Counter-examples** | Copy-paste a Button with new colors | New `MyButton` wrapping HeroUI differently from `shared/ui` |

## 2. Reuse Hook vs Create Hook

| | Reuse | Create |
|---|-------|--------|
| **When** | Logic already in `shared/hooks` or module application helpers | Same stateful logic would be copy-pasted ≥3 times OR encapsulates non-trivial browser/query protocol |
| **Reason** | One behavior, one place | Reduce drift |
| **Trade-off** | Hook API must stay focused | Over-general hooks become god objects |
| **Examples** | Reuse media-query / online-status hook | `useIdempotentMutation` for money writes |
| **Counter-examples** | New hook that only toggles one boolean once | `useEverything` |

## 3. Reuse Utility vs Create Utility

| | Reuse | Create |
|---|-------|--------|
| **When** | Formatter/schema helper exists (`shared/i18n`, `shared/lib`) | Pure function needed across modules with stable contract |
| **Reason** | Avoid divergent money/date formatting | Shared pure logic |
| **Trade-off** | Utility API churn | Premature utils for one call site |
| **Examples** | Use shared currency formatter | Extract `parseAmountInput` after 3rd copy |
| **Counter-examples** | New `formatMoney2` beside existing formatter | Utility that imports React |

## 4. Refactor vs Leave As-Is

| | Refactor | Leave As-Is |
|---|----------|-------------|
| **When** | Blocks the Story, duplicates cause defects, or violates Constitution | Working code outside Story blast radius; cosmetic only |
| **Reason** | Prevent drift / fix boundary violation | Scope control |
| **Trade-off** | Larger PR | Debt remains |
| **Examples** | Move Supabase call from feature UI into repository | Rename private vars unrelated to Story |
| **Counter-examples** | “While here” redesign of Design System | Ignore folder violation in touched file |

## 5. Inline Logic vs Extract Logic

| | Inline | Extract |
|---|--------|---------|
| **When** | Single-use, readable &lt; ~30 lines, domain-local | Repeated, test-worthy, or obscures component |
| **Reason** | YAGNI | Testability / reuse |
| **Trade-off** | Duplication risk later | Indirection |
| **Examples** | One-off className join in a page | Extract Zod schema used by form + Server Action |
| **Counter-examples** | Inline RLS-sensitive authz in JSX | Extract one-liner to `shared/utils` |

## 6. Create Pattern vs Avoid Pattern

| | Create Pattern | Avoid Pattern |
|---|---------------|---------------|
| **When** | Cross-feature composite with stable UX (AppViewport, ConfirmMoneyDialog) | Feature-specific layout used once |
| **Reason** | Encode product interaction language | Avoid false shared layer |
| **Trade-off** | Pattern ownership cost | Feature duplication until Rule of Three |
| **Examples** | `shared/patterns/EmptyState` | Auth-only card stack stays in `features/auth` |
| **Counter-examples** | Pattern that wraps one screen | Avoiding a pattern while copying BottomNav |

## Decision record template (required in PR when creating shared code)

```text
Decision: Create | Reuse | Refactor | Inline | Extract
Target: <path>
Reason:
Trade-off:
Examples considered:
Counter-examples rejected:
Engineering Review refs:
```
