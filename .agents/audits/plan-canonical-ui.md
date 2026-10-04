# Plan monthly budgeting flow — canonical UI audit

Verified 2026-10-04 with the authenticated local app in Brave.

Jar Detail was subsequently rebuilt to the exact supplied Stitch section structure; the latest evidence and validation are in [jar-detail-stitch-rebuild.md](jar-detail-stitch-rebuild.md).

Scope: the six Plan screens in `.agents/design-redesign/handoff/route-screen-map.md`: overview, Jar Detail, create/edit Jar, capacity adjustment, historical month, and Monthly Review. Existing create/edit and adjustment sheets retain their current route contracts. Goals and Recurring are outside this flow.

## Design authority

ViNha information architecture, UX contracts, design tokens, and the canonical Stitch project `16826760243481546078` remain authoritative. Ponytail and ui-ux-pro-max were used for minimal implementation and accessibility review. Stitch references were retrieved through MCP; no reference sample values were introduced into the household.

| Screen              | Canonical light                    | Canonical dark                     |
| ------------------- | ---------------------------------- | ---------------------------------- |
| Overview            | `70749ca2e350497f9def0dadf235d3ba` | `893e91e4bced4fa4af9f44b8cd967316` |
| Jar Detail          | `1c9f17d0b9ff44c3a988310b1f13daec` | `d53a3a351eff4bceaa992e4e154250da` |
| Create/edit         | `abd6bc2e24f449098cdd79b64b85b0f1` | `907d9c2775204f2fb92d82bbb2dd7b85` |
| Capacity adjustment | `db081d524cfc40318019a024b3fceb6c` | `3c2907ce6f8e4f95af9c55872ad47b99` |
| History             | `c15a411ada2a445b8951052037285f3b` | `7101eef820d146599d09686fa420cf5a` |
| Monthly Review      | `61019aa422fc48888d3e286cf1c3b82b` | `23731f925c4c4c44ac46757bb7314a7c` |

## Changes

- Overview Jar names wrap; status and type have their own row. Compact progress is 4px. The heading counts all active budget Jars, and a complete-list link appears when the preview is capped.
- Period labels and status can wrap onto separate rows, preserving the full historical month/year. History uses the canonical lock artwork.
- Jar Detail uses a neutral surface with a visible privacy control, readable metric columns, the intention invariant before actions, linked categories, and four recent ledger activities. Ledger reads reuse the existing application API. Empty and unavailable states differ.
- The adjustment draft shows source, target, amount, and unchanged real money. Closing clears the form, preview, receipt, validation, and mutation feedback.
- Existing create/edit conflict confirmation, Monthly Review facts, and historical read-only behavior were retained.

## Brave evidence

Screenshots are local, ignored artifacts in `output/playwright/plan-canonical/`. Filenames use `<screen>-<locale>-<theme>-<width>.jpg`; viewport height is 844px. They are viewport captures, not an assertion that all content fits above the fold. Supporting Jar context was separately scrolled and captured.

| Screen              | Responsive evidence                                              | Interaction evidence                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview            | English/Vietnamese, light/dark, 390/440/768/1280                 | Complete-list link; current period; singular English countdown                                                                                        |
| Jar Detail          | English/Vietnamese, light/dark, 390/440/768/1280                 | Linked categories and real ledger links; visible surface privacy control                                                                              |
| Create/edit         | Create: English light/dark at all four widths; Vietnamese at 440 | Category conflict exposes explicit confirmation; cancel/reopen clears create name and conflict; edit reopen restores persisted name; Escape dismisses |
| Capacity adjustment | English/Vietnamese, light/dark, 390/440/768/1280                 | Draft preview; cancel/reopen empties amount and removes preview; target selector receives visible keyboard focus                                      |
| Historical month    | English/Vietnamese, light/dark, 390/440/768/1280                 | Locked September; no Allocate action; partial-history warning preserved                                                                               |
| Monthly Review      | English/Vietnamese, light/dark, 390/440/768/1280                 | Existing facts, variances, and non-blocking reassurance inspected; review mutation not submitted                                                      |

The app shell measured 390px/440px at the corresponding mobile widths and 440px at 768px/1280px. Checked layouts had no horizontal page overflow. Reduced-motion emulation was enabled for responsive captures. No create, edit, reallocation, pause, archive, or review mutation was submitted in browser verification.

The development server required a restart to invalidate stale rendered modules. Loading frames were replaced after the corresponding content had rendered. Browser theme and viewport emulation were temporary and restored at the end.

## Code verification

- Scoped Plan tests: **48 passed**, eight files, including draft/preview reset and unavailable-versus-empty ledger reads.
- Full ESLint: passed. Changed-file Prettier and `git diff --check`: passed.
- Full Vitest: **1682 passed, 5 failed**. Failures are Money message key parity (`savingsPage.summaryCaption`), Money account wrapping/privacy, and three existing credit-card presentation cases missing an intl provider.
- Typecheck: two existing `HomeTranslator` incompatibilities in `home-streaming-sections.tsx`, caused by differing `use-intl` type paths. No Plan errors.
- Repository-wide format check: existing formatting issues in 195 files; unrelated files were left unchanged.
- Automated browser suite was not rerun after the earlier fixture-based attempt. Read-only manual Brave evidence above covers this flow; saved financial mutations and post-save receipts remain outside the browser check.

## Final self-review

Reviewed the changed Plan files, compact shared Jar row, icon-registry addition, catalogs, and tests against code-quality, typescript-quality, refactor-review, and Ponytail. Reused HeroUI/shared primitives, semantic tokens, canonical Stitch icons, shared formatters, application reads, and route constants. Added the activity limit at the Plan constants home. No new dependencies or business command behavior. Removed duplicate category filtering and identical layout branches. Existing unrelated Money edits remain outside this task.
