# Prompt 08.2.1 — Savings Provider/Product Management

**Author:** Manus AI  
**Status:** Complete  
**Scope:** Focused correction pass for Savings Provider/Product management only. Savings Overview/Detail from Prompt 08.3 was not redesigned in this pass.

## Executive Summary

The provider-management experience now uses typed domain rules, curated icon selection, mobile-first Sheets, grouped product configuration, responsive card actions, localized copy, and conditional motion reveals. The implementation also removes the invalid nested-button structure in HeroUI dropdown triggers, keeps tax defaults in the domain layer, and persists custom early-withdrawal rates through the complete product/package path.

## Early Withdrawal

Early-withdrawal behavior is represented by the canonical `EarlySettlementRule` enum and its aliases: `NOT_ALLOWED`, `PRINCIPAL_ONLY`, `CUSTOM_INTEREST_RATE`, and `PRODUCT_RULE`.[^1] The editor presents these as accessible policy choices instead of loosely typed strings. Selecting **Custom interest rate** reveals a percentage input constrained to 0–100 percent; selecting **Principal only**, **Not allowed**, or **Product rule** clears the custom rate and removes the field after the exit transition.[^2]

The database migration adds nullable `early_settlement_rate_percent` storage with a numeric range constraint.[^3] The value is propagated through catalog reads, package mapping, product create/update commands, creation-selector state, and saved product snapshots.[^4]

## Tax Configuration

Tax policy and tax rate are separate controls. `getSavingsProductDefaults(family)` owns the family defaults: **PLATFORM defaults to 5% tax on interest**, while **BANK defaults to no tax**.[^1] The editor receives `taxRateDefault` from those domain defaults; the UI does not embed a hardcoded `5`, `0.05`, or a user-facing “5% option.” Choosing the tax-on-interest policy reveals the percentage field, while choosing no tax clears the effective rate.

A source scan of the corrected Savings UI, shared patterns, and Savings domain modules found no `taxRateDefault: 5`, `taxRate: 5`, or `0.05` magic values in the implementation path.[^2]

## Provider Icon Picker

The provider icon is no longer a free-form text input. `SAVINGS_PROVIDER_ICONS` exposes ten curated, stable keys: `bank`, `wallet`, `building`, `piggy_bank`, `coins`, `chart`, `smartphone`, `shield`, `vault`, and `finance`.[^5] The picker provides localized labels, selected-state feedback, accessible menu semantics, and a compact two-column menu suitable for mobile. Persisting a stable key keeps localization separate from stored data.

## Provider Form

Provider create/edit uses a focused mobile-first Sheet containing name, family, and icon selection. The footer keeps cancel and save actions close to the active form. Successful saves use a localized toast and `router.refresh()` rather than persistent success copy or a full-page reload.[^2]

## Product Form

Product create/edit also uses a focused Sheet. The former dense three-column arrangement was replaced with grouped sections:

| Section | Main controls |
| --- | --- |
| Basic | Product name, duration, unit, method |
| Interest | Interest rate and calculation method |
| Tax | Tax policy, then conditional tax rate |
| Early withdrawal | Policy selection, then conditional custom rate |
| Currency | Read-only default currency summary |

The duplicate `Kỳ hạn` labels were corrected to **Thời lượng** and **Đơn vị** in Vietnamese, with corresponding English copy.[^6] Percentage controls use the shared canonical `PercentageField` wrapper.[^7]

Conditional reveals use `AnimatePresence` with keyed direct children, explicit enter and exit states, and `motionTokens.duration.fast`. The implementation uses `motion/react`, avoids inline durations, and was exercised with a reduced-motion browser context.[^2]

## Package Cards and Actions

Provider and product cards now use responsive stacks at narrow widths and avoid action overlap. Product/package actions are consolidated into a localized More menu. Provider actions use the same hierarchy with Edit and Archive items, improving scanability and touch targets without adding a persistent action row.[^2]

The HeroUI `Dropdown.Trigger` elements now render one native trigger button with direct span content. The previous shared `Button` wrappers were removed, eliminating nested buttons and the associated hydration mismatch during browser verification.[^8]

## Localization

Vietnamese and English message bundles cover the editor sections, policy labels, icon labels, validation messages, action menus, duration/unit wording, and save states.[^6] Raw policy identifiers, mixed English/internal strings, and implementation-oriented labels were removed from the management UI.

## Browser Verification

The authenticated browser evidence flow ran against `http://localhost:3001` using the supplied E2E account. The flow used reduced motion, verified the icon picker and conditional policy behavior, and captured light/dark responsive evidence.

| Verification | Result |
| --- | --- |
| Provider management at 390, 440, 768, and 1280 px | Passed; screenshots captured |
| Curated provider icon picker | Passed; 10 menu items detected |
| Provider Sheet | Passed |
| Product Sheet | Passed |
| Tax-on-interest reveal | Passed; tax field became visible |
| Custom early-rate reveal | Passed; early-rate field became visible |
| Switch to principal-only policy | Passed; early-rate field reached count 0 after the exit timeout |
| Dark-mode 390 px evidence | Passed |
| Reduced-motion context | Passed |
| Browser page errors after trigger correction | None emitted |

Evidence is stored in `artifacts/savings-0821/`:

- [`providers-390.png`](./providers-390.png), [`providers-440.png`](./providers-440.png), [`providers-768.png`](./providers-768.png), and [`providers-1280.png`](./providers-1280.png)
- [`provider-icon-picker-390.png`](./provider-icon-picker-390.png)
- [`product-sheet-bank-390.png`](./product-sheet-bank-390.png)
- [`product-policies-selected-390.png`](./product-policies-selected-390.png)
- [`providers-dark-390.png`](./providers-dark-390.png)

## Code Review

**Critical findings:** None remaining.

**Important findings:** None remaining. The nested-button hydration issue was corrected, custom early-rate unmount behavior was verified with a timeout-aware assertion, and the final browser flow passed.

**Polish findings:** The implementation is ready for the requested scope. A future improvement could add dedicated visual-regression snapshots to CI, but that is outside this focused correction pass.

## Validation

| Command/check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | Passed — 66 test files and 382 tests |
| `npm run build` | Passed — Next.js 16.1.6 production build completed |
| Savings catalog CRUD Playwright flow | Passed — 1 test |
| Authenticated responsive/theme evidence script | Passed — all four viewport captures and 10 icon items |

## Acceptance Criteria Summary

| Criterion | Status |
| --- | --- |
| Provider icon uses picker | Met |
| Product editor avoids dense three-column layout | Met |
| Duplicate duration labels corrected | Met |
| Tax policy and rate separated | Met |
| PLATFORM defaults to 5% tax from domain builder | Met |
| BANK defaults to no tax | Met |
| No scattered magic `5`/`0.05` values in corrected UI path | Met |
| Custom early-withdrawal rate uses `PercentageField` | Met |
| Provider and product forms use focused Sheets | Met |
| Package/provider actions use More menu hierarchy | Met |
| Management title is not duplicated | Met |
| Mixed English/internal strings removed | Met |
| 390 px responsive layout verified | Met |
| Light/dark verified | Met |
| Tests and production build pass | Met |

## References

[^1]: [`modules/savings/application/savings-domain-rules.ts`](../../modules/savings/application/savings-domain-rules.ts) — typed rules, defaults, and schema validation.
[^2]: [`app/[locale]/(product)/money/savings/savings-catalog-manager.tsx`](../../app/[locale]/(product)/money/savings/savings-catalog-manager.tsx) — provider/product Sheets, picker, policies, actions, and motion reveals.
[^3]: [`supabase/migrations/20260815160000_savings_early_withdrawal_rate.sql`](../../supabase/migrations/20260815160000_savings_early_withdrawal_rate.sql) — persisted early-withdrawal rate column and constraint.
[^4]: [`modules/savings/application/commands/manage-savings-catalog.ts`](../../modules/savings/application/commands/manage-savings-catalog.ts), [`modules/savings/application/savings-provider-registry.ts`](../../modules/savings/application/savings-provider-registry.ts), and [`modules/savings/application/savings-types.ts`](../../modules/savings/application/savings-types.ts) — catalog command, read path, and snapshot propagation.
[^5]: [`shared/ui/icon-registry.ts`](../../shared/ui/icon-registry.ts) — curated Savings provider icon registry.
[^6]: [`messages/vi/money.json`](../../messages/vi/money.json) and [`messages/en/money.json`](../../messages/en/money.json) — localized management strings.
[^7]: [`shared/patterns/percentage-field.tsx`](../../shared/patterns/percentage-field.tsx) — canonical percentage field wrapper.
[^8]: Browser evidence from the authenticated run in [`artifacts/savings-0821/`](.) — no page errors after the direct-trigger correction.
