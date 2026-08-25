# Transaction capture screen refinement

## Summary

The supplied Vietnamese screenshots were used as the visual reference for a focused refinement of the Add Transaction capture screen. The implementation stays within the existing Family Finance stack and shared component system. It improves hierarchy, account selection clarity, optional metadata grouping, category-chip presentation, and interaction feedback without changing financial behavior, validation, data contracts, navigation, or i18n semantics.

## What changed

| Area              | Refinement                                                                                                                                                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account selection | Account tiles now have a stronger selected surface, tokenized border/shadow treatment, better text breathing room for long names, and a compact check marker. Credit-card account identity remains explicit and the existing account eligibility policy is unchanged. |
| Amount entry      | The amount field remains the first primary input but now reads as a stronger visual anchor through the existing surface and elevation tokens. Parsing, precision, privacy, and validation remain unchanged.                                                           |
| Form hierarchy    | Account and category sections now have clear labeled containers. Optional Jar and transaction-tag controls are grouped as secondary metadata rather than competing with amount/account/date.                                                                          |
| Category controls | Category chips retain the existing category list, “none” behavior, category-to-jar synchronization, and selected values while receiving a more deliberate pill treatment and clearer active/pressed states.                                                           |
| Optional Jar      | The existing explanatory hint and SelectField remain intact, but the group now reads as a quieter secondary block.                                                                                                                                                    |
| Transaction tags  | The existing selector, max-10 limit, archived behavior, and inline creation flow remain unchanged; the section gains clearer containment and hierarchy.                                                                                                               |
| Note              | The existing note field keeps its current label, placeholder, validation, and persistence while receiving a softer surface treatment.                                                                                                                                 |
| Motion            | No new decorative animation was introduced. The previous shared `MotionStep` behavior continues to handle Expense/Income/Transfer conditional continuity, respecting reduced motion.                                                                                  |
| Accessibility     | Existing radio semantics, keyboard focus rings, labels, and minimum touch targets are preserved. The selected account marker is decorative and does not replace `aria-checked`.                                                                                       |

## Behavior preserved

The implementation does not alter account filtering, credit-card semantics, category applicability, category-to-jar synchronization, date defaults, optional tags, note persistence, form validation, offline handling, receipt behavior, route targets, or financial calculations. No new fields, search behavior, delete behavior, attachment behavior, or business rules were introduced.

## Validation

| Check                      | Result                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `git diff --check`         | Passed.                                                                                                                           |
| `npm run typecheck`        | Passed.                                                                                                                           |
| `npm run lint`             | Passed.                                                                                                                           |
| Focused capture/unit tests | Passed: 5 test files, 25 tests. Existing HeroUI `PressResponder` warnings remain in test stderr but do not fail the suite.        |
| Vietnamese visual smoke    | Passed across 390, 440, 768, and 1280px; light/dark themes; full/reduced motion. Sixteen non-mutating screenshots were generated. |
| Browser route              | `/vi/money/transactions/new` rendered both `money-capture-entry` and `money-capture-form` in the authenticated visual smoke run.  |

## Focused changed files

- `shared/patterns/choice-tile.tsx`
- `app/[locale]/(product)/money/transactions/capture-transaction-form.tsx`

The repository already contained unrelated working-tree edits from earlier Family Finance work; those were preserved.

## Evidence

Representative screenshots from the visual smoke run are attached with the final response. Full generated evidence remains under `output/playwright/capture-redesign-*.png` in the project workspace.
