# Consolidated improvement plan — Implementations 01–04

This plan merges the seven findings from the earlier in-chat hardening review with the current [senior code-quality review](./senior-code-quality-review.md). The requested earlier `review-01-04/` files were not present in this checkout, so no additional prior findings could be verified. IDs are deduplicated across both reviews. Severity follows the requested P0–P3 rubric; stage gates reflect when an otherwise P2 defect would spread into product callers.

**Total:** 18 recommendations: P0 0, P1 5, P2 11, P3 2. Each action should preserve current financial domain behavior and the existing 440px shell. Implement one coherent flow at a time, with the project's required real-browser evidence for any UI change.

## 1. Must Fix Before Implementation 05

Implementation 05 should consume stable shared controls; these issues would otherwise become repeated product defects.

### CQ-01 — Consolidate duplicate shared component entry points

- **Severity / Area:** P1 / shared UI architecture and dependency direction.
- **Problem:** New `shared/ui` sheet, dialog, toast, empty, and error surfaces parallel established `shared/patterns` implementations. A `shared/ui` filter chip reexports from the higher pattern layer.
- **Why it matters:** Two implementations of the same control can diverge in accessibility, tokens, and fixes; the reverse dependency weakens the intended layer boundary.
- **Recommended change:** Select one implementation per concept. Preserve old imports as compatibility exports, move the lower-level implementation to `shared/ui` where appropriate, and keep only genuinely different pattern composition above it. Compare props and product callers before deleting either side.
- **Expected benefit:** One maintenance path without a mass caller migration.
- **Risk:** Accidental visual/API change for existing screens; audit each wrapper's props and inspect one representative flow in a real browser.
- **Estimated scope:** MEDIUM.
- **Dependency / order:** First architectural task; complete before new screens import either version.

### CQ-02 — Make RadioGroup's default value real

- **Severity / Area:** P2 / controlled and uncontrolled state.
- **Problem:** `defaultValue` is public but unused, leaving uncontrolled radios unchecked.
- **Why it matters:** A form can appear to ignore its initial selection and user changes.
- **Recommended change:** Use internal group state only when `value` is absent, or remove the unsupported prop if no caller needs uncontrolled behavior. Confirm disabled and `name` behavior.
- **Expected benefit:** A predictable radio API and correct first render.
- **Risk:** Changing selection behavior for any caller that relied on the present defect; search callers and add a default-value interaction check.
- **Estimated scope:** SMALL.
- **Dependency / order:** Before any new RadioGroup form; independent of CQ-01.

### CQ-03 — Unify checkbox native, visual, and mixed state

- **Severity / Area:** P2 / state and accessibility.
- **Problem:** Native checked state uses `resolvedChecked`, while the custom visual uses `checked`; indeterminate is visually drawn but not exposed as mixed.
- **Why it matters:** `defaultChecked` and user interaction can disagree with what is shown, and assistive technology misses mixed state.
- **Recommended change:** Render both input and visual from one resolved value and set the native indeterminate state/appropriate accessibility semantics. Check controlled and uncontrolled paths, including a group.
- **Expected benefit:** Consistent visible and announced state.
- **Risk:** CSS checked-state differences; check focus, disabled, and both themes in a browser.
- **Estimated scope:** SMALL.
- **Dependency / order:** Before new checkbox forms; coordinate with the current uncommitted checkbox/group work.

### CQ-04 — Honor disabled SearchableSelect options

- **Severity / Area:** P2 / selectable item API.
- **Problem:** Options declare `disabled`, but the state is not passed into `Select.Item`.
- **Why it matters:** A caller's forbidden choice remains selectable.
- **Recommended change:** Forward disabled state through the HeroUI item adapter and add one mouse/keyboard selection check.
- **Expected benefit:** Public API matches behavior.
- **Risk:** Existing lists may contain values previously selectable despite being flagged; inspect callers.
- **Estimated scope:** SMALL.
- **Dependency / order:** Before new searchable selections; independent of CQ-01.

### CQ-05 — Complete keyboard semantics for tabs and segments

- **Severity / Area:** P1 / accessibility architecture.
- **Problem:** Tablist roles are used without matching arrow-key navigation and focus management.
- **Why it matters:** Keyboard users encounter a tab interface that does not behave like tabs.
- **Recommended change:** Prefer the installed accessible tab primitive where it fits; otherwise implement roving focus and arrow/Home/End behavior for the declared role. Keep the current visual contract.
- **Expected benefit:** Correct keyboard and assistive-technology behavior.
- **Risk:** Focus regressions; run focused keyboard tests and a real-browser pass.
- **Estimated scope:** MEDIUM.
- **Dependency / order:** Before product flows adopt these components.

### CQ-06 — Give SearchInput a programmatic name

- **Severity / Area:** P1 / accessibility API.
- **Problem:** Placeholder is the only naming affordance; the input has no associated label or ARIA name.
- **Why it matters:** Screen readers cannot identify the search field reliably after text entry.
- **Recommended change:** Require a label or accessible-name prop and wire it to the native input, while allowing a visually hidden label.
- **Expected benefit:** Discoverable search control in both languages.
- **Risk:** Newly required prop may affect demo/callers; update those in the same change.
- **Estimated scope:** SMALL.
- **Dependency / order:** Pair with CQ-08 for translated labels, before product adoption.

### CQ-07 — Expand auxiliary button hit areas

- **Severity / Area:** P1 / touch accessibility.
- **Problem:** Clear, reveal, date shortcut, amount chip, and MAX buttons have 24–32px interactive boxes, below the project's 44px rule.
- **Why it matters:** Mobile users may miss actions even where the primary field is large enough.
- **Recommended change:** Make the actual focusable button area at least 44px, with spacing/overlay treatment that retains the 440px layout. Measure actual rendered targets.
- **Expected benefit:** Reliable touch interaction and project-rule compliance.
- **Risk:** Tight layouts can wrap or overlap; inspect at 390, 440, 768, and 1280px in light/dark modes.
- **Estimated scope:** MEDIUM.
- **Dependency / order:** Before new mobile forms use these controls.

### CQ-08 — Localize shared control copy at the boundary

- **Severity / Area:** P1 / i18n and shared component API.
- **Problem:** Several shared controls hardcode Vietnamese labels/defaults, and `CurrencyInput` speaks Vietnamese by default even on English routes.
- **Why it matters:** English screens can contain Vietnamese controls and inaccessible names; a generic component implies behavior it cannot deliver.
- **Recommended change:** Use the existing message system or explicit required copy props for shared controls. Make VND word preview explicit or locale-correct, without changing stored numeric values.
- **Expected benefit:** Predictable English/Vietnamese UI and clearer component contracts.
- **Risk:** Missing translations or changed defaults; check both locales and accessible names.
- **Estimated scope:** MEDIUM.
- **Dependency / order:** Before domain screens adopt new controls; coordinate with CQ-06 and CQ-14.

### CQ-09 — Align ActionMenu variants with canonical button styles

- **Severity / Area:** P2 / variant system and token correctness.
- **Problem:** Trigger accepts the whole `ButtonVariant` type but implements a partial string-keyed map and falls back silently; some referenced utility tokens are undefined.
- **Why it matters:** Valid variants render incorrectly, and unresolved classes lose intended interaction colors.
- **Recommended change:** Reuse the existing button style mapping or narrow the accepted variants with an exhaustive typed map. Replace undefined token names with defined semantic tokens and inspect generated CSS.
- **Expected benefit:** Fewer style maps and correct trigger states.
- **Risk:** Appearance can shift for existing menus; compare each used variant in both themes.
- **Estimated scope:** SMALL.
- **Dependency / order:** Before ActionMenu becomes a common product action; preserve current button aliases with live callers.

## 2. Should Fix Before Domain Migration

These changes prevent the first domain forms from locking in avoidable architecture or wrong behavior.

### CQ-10 — Reuse existing numeric field behavior

- **Severity / Area:** P2 / form composition and duplication.
- **Problem:** New currency, number, percentage, and quantity fields repeat behavior already in `MoneyInput`, `AmountField`, and `NumberField`.
- **Why it matters:** Validation, formatting, focus, and numeric persistence fixes will need several edits.
- **Recommended change:** Keep the existing field primitive as the behavior owner. Build only product-specific words/chips/MAX/preview as small wrappers where used; avoid a generic form engine.
- **Expected benefit:** Fewer divergent monetary and numeric paths.
- **Risk:** Existing primitives may not cover every visual affordance; compare value contracts and one representative form before consolidation.
- **Estimated scope:** MEDIUM.
- **Dependency / order:** After CQ-08/CQ-14, before migrating domain forms.

### CQ-11 — Keep domain policy out of generic UI primitives

- **Severity / Area:** P2 / separation of concerns.
- **Problem:** `PercentageInput` embeds a threshold tied to Vietnamese suffix text, and generic `EmptyState` includes debt/product states.
- **Why it matters:** Localization or a domain rule change can silently change generic UI behavior.
- **Recommended change:** Let the application layer compute warning state and pass display props. Put product-specific empty-state presets in `shared/patterns` or the feature caller.
- **Expected benefit:** Stable primitives and explicit business ownership.
- **Risk:** Removing defaults could change a demo; preserve displayed behavior through caller props.
- **Estimated scope:** SMALL.
- **Dependency / order:** Before those primitives enter domain flows; can follow CQ-01.

### CQ-12 — Type confirmation rows explicitly and restore layer direction

- **Severity / Area:** P2 / privacy, type safety, dependency direction.
- **Problem:** Confirmation rows may omit `kind`, also carry legacy `financial`, and then default to masking; `shared/ui` imports `FinancialValue` from `shared/patterns`.
- **Why it matters:** Nonfinancial values can disappear under privacy mode, while the lower UI layer depends on the higher pattern layer.
- **Recommended change:** Move the composite to patterns; use a required `text | financial` row discriminant. Adapt any legacy caller at the boundary rather than keeping two optional flags indefinitely.
- **Expected benefit:** Explicit privacy behavior and one-way dependencies.
- **Risk:** A caller that relied on conservative default masking must be identified and classified correctly.
- **Estimated scope:** MEDIUM.
- **Dependency / order:** After CQ-01 dependency cleanup, before confirmation screens migrate.

### CQ-13 — Fix theme state when storage writes fail

- **Severity / Area:** P2 / provider reliability.
- **Problem:** A failed `localStorage.setItem` updates a fallback, but successful reads still return the old stored value.
- **Why it matters:** Context and document theme can disagree, so controls can show the wrong selected theme.
- **Recommended change:** Let the in-memory override win after failed write and reconcile it on later successful storage events/writes. Add one storage-failure check.
- **Expected benefit:** Consistent theme UI under quota/private-storage failure.
- **Risk:** Cross-tab synchronization interactions; keep and exercise the existing `useSyncExternalStore` design.
- **Estimated scope:** SMALL.
- **Dependency / order:** Independent; complete before theme controls are relied on in domain flows.

### CQ-14 — Replace quick-chip regex with locale formatting

- **Severity / Area:** P2 / formatting utility and i18n.
- **Problem:** Chained suffix replacements mislabel one million as `1.000k` and fail on English separators.
- **Why it matters:** A money affordance displays misleading magnitudes.
- **Recommended change:** Use `Intl.NumberFormat` compact notation or extend the existing shared locale formatter; keep the numeric chip delta unchanged.
- **Expected benefit:** Correct labels across supported locales with less code.
- **Risk:** Locale-specific abbreviation style may differ from today's intended visual; verify Vietnamese and English examples.
- **Estimated scope:** SMALL.
- **Dependency / order:** With CQ-08 before currency controls enter product flows.

### CQ-15 — Replace arbitrary control palette values with tokens

- **Severity / Area:** P2 / design-token consistency.
- **Problem:** Inline alert, skeleton, and sticky action styles contain hardcoded colors/shadows.
- **Why it matters:** Theme updates and dark-mode contrast can drift from the semantic palette.
- **Recommended change:** Use existing semantic color/elevation tokens, adding a documented token at its canonical home only if no current token fits.
- **Expected benefit:** One source of visual truth across themes.
- **Risk:** Contrast or appearance changes; inspect both themes and WCAG AA states.
- **Estimated scope:** SMALL.
- **Dependency / order:** During migration of those controls, after token selection; no dependency on domain logic.

## 3. Can Improve During Later Domain Work

### CQ-16 — Remove proven-unused token mirrors and test rendered behavior

- **Severity / Area:** P2 / source of truth and test quality.
- **Problem:** JavaScript dimension registries mirror CSS values and are mainly tested against their own literals; scanned `--vn-*` aliases have no in-repo runtime consumers.
- **Why it matters:** Passing tests can conceal incorrect real controls, while mirrored values drift.
- **Recommended change:** Keep CSS as runtime source. Remove JS mirrors that have no real caller, verify external consumers before deleting CSS aliases, and assert rendered target sizes/token behavior instead of copied literals.
- **Expected benefit:** Less duplicated configuration and more useful regression checks.
- **Risk:** External design/tooling may consume an alias; check references outside the scanned source before deletion.
- **Estimated scope:** MEDIUM.
- **Dependency / order:** After CQ-07 browser target checks and token consumers are known.

### CQ-17 — Narrow unnecessary client boundaries where measured useful

- **Severity / Area:** P3 / server and client component boundaries.
- **Problem:** Several presentation-only form layout files carry `"use client"` without hooks or event handlers.
- **Why it matters:** They can unnecessarily pull passive layout code into client graphs when imported from server pages.
- **Recommended change:** Remove the directive from safe leaves as their importing routes are touched. Keep interactive components client-side. Measure bundle effect before broad changes.
- **Expected benefit:** Simpler server rendering and possibly less hydration cost.
- **Risk:** A transitive import may still require a client boundary; check the module graph and build.
- **Estimated scope:** SMALL.
- **Dependency / order:** During later route work; no Implementation 05 gate.

## 4. Optional Cleanup

### CQ-18 — Make SkeletonText width typing honest

- **Severity / Area:** P3 / API clarity.
- **Problem:** A union containing `string` accepts arbitrary widths, but unknown inputs silently render as 90%.
- **Why it matters:** Callers receive a false sense that their custom width will render.
- **Recommended change:** Restrict the type to supported values, or implement arbitrary width if a real caller needs it.
- **Expected benefit:** A smaller, accurate API.
- **Risk:** Type errors in undocumented callers; search usage first.
- **Estimated scope:** SMALL.
- **Dependency / order:** Any later skeleton touch; no gate.

## DO NOT CHANGE

1. Keep the centered 440px app shell and existing navigation/portal structure. Implementation 04 was documentation-only; a shell rewrite would add churn without evidence.
2. Keep HeroUI v3 as the control system, the existing application/domain boundaries, and numeric financial values as numbers. Do not add a second UI library, another provider tier, or a generic form engine.
3. Keep product-used button variant aliases and existing `shared/patterns` imports until compatibility exports cover them. Avoid an all-at-once route migration.
4. Keep theme hydration via `useSyncExternalStore`; fix its failure branch rather than replacing the provider architecture.
5. Do not rewrite the `shared/ui` barrel for assumed bundle savings. No bundle-cost regression was measured in this review.

## Acceptance sequence

1. Resolve CQ-01 and the new shared-control behavior gates CQ-02 through CQ-09 before Implementation 05 adds callers.
2. Address CQ-10 through CQ-15 before moving financial/domain forms onto these controls.
3. Verify each changed screen in a running browser at 390, 440, 768, and 1280px in light/dark modes, plus keyboard and reduced-motion states where relevant. Keep tests focused on observable behavior.
4. Take CQ-16 through CQ-18 when their affected files are otherwise touched; do not turn this review into a speculative rewrite.

## Resolution record — 2026-09-27

CQ-01 through CQ-18 are addressed in the current working tree. CQ-16 removes the unused JavaScript mirrors and changes token checks to inspect CSS-backed behavior; the `--vn-*` CSS aliases remain until consumers outside this repository can be checked.

Verification completed:

- `npm run lint` and `npm run typecheck` passed.
- `npm run test -- --maxWorkers=2` passed: 238 files, 1,537 tests.
- Prettier passed for the changed-file set. The repository-wide format check still reports 192 pre-existing files outside this change set.
- Real-browser checks on `/en/design-foundations` and `/vi/design-foundations` at 390, 440, 768, and 1280px found no horizontal overflow in light or dark mode. Auxiliary control targets measured at least 44×44px, including the quantity MAX action.
- Browser checks confirmed arrow-key tab movement, translated search names, reduced-motion emulation, and date-popover open/Escape dismissal. The product transaction route redirects to login in this browser session, so that authenticated flow was not available for a direct browser check.
