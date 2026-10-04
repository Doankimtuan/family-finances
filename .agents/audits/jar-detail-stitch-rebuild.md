# Jar detail — canonical Stitch rebuild

Verified 2026-10-04 in the authenticated local app in Brave.

Route: `/vi/plan/jars/9e8660bf-c5c3-4587-b4bd-caeb1601b94e` and English equivalent.

## Source and scope

Stitch MCP retrieved project `16826760243481546078`, light screen `1c9f17d0b9ff44c3a988310b1f13daec`, and dark screen `d53a3a351eff4bceaa992e4e154250da`. Hosted HTML was downloaded using `curl -L` to `/tmp/plan-jar-reference/` and reviewed alongside the user screenshots. ViNha canonical artifacts and its persistent UI constitution remain authoritative. Ponytail and ui-ux-pro-max assisted execution; this task rebuilds one Jar detail flow.

## Rebuilt structure

- Compact back/title/subtitle header and circular privacy control.
- Neutral monthly limit card with semantic category artwork, period, kind, rollover, active status, prominent amount, and remaining context.
- Three budget columns, progress, used/remaining percentages, days left, and the intention invariant inside one card.
- Equal-width allocation and edit actions, linked category chips and compact add action, recent ledger activity, and compact monthly review strip.
- Allocation and lifecycle options remain available in disclosures beneath the reference content.

Real household names, categories, amounts, and ledger activities remain in place. The reference’s example numbers, transaction names, and total count were not substituted. Shared currency formatting preserves locale and canonical activity signs. The persistent bottom navigation and centered 440px shell follow the project constitution.

## Browser evidence

Saved screenshots and matrix: `/Users/doantuan/.codex/visualizations/2026/10/04/jar-detail-stitch/`.

| Locale     | Theme          | Widths              | Result                                                                |
| ---------- | -------------- | ------------------- | --------------------------------------------------------------------- |
| Vietnamese | Light and dark | 390, 440, 768, 1280 | Rendered, no document horizontal overflow; main width capped at 440px |
| English    | Light and dark | 390, 440, 768, 1280 | Rendered, translated product labels; user-authored names retained     |

Upper screenshots capture header, cards, actions, and category chips. `vi-light-440-lower.jpg` and `vi-dark-440-lower.jpg` show transactions, review strip, and disclosures.

Interaction evidence:

- Add category opens with the current Jar selected. Typed an unsaved draft, cancelled, reopened, and confirmed blank name with canonical Jar default. No save was submitted.
- Allocation action opens its existing virtual-capacity sheet. Cancelled without submitting.
- Edit opens persisted configuration. Cancelled without submitting.
- Keyboard Tab shows a visible focus ring on header privacy. Space masks hero, metrics, percentages, progress, and recent transaction amounts; Space restores visibility.
- Reduced-motion media emulation enabled during keyboard inspection, then cleared. Temporary viewport and theme overrides were reset through reload.
- Read-only inspection confirmed localized date/category/account rows and Jar-filtered View all route.

## Verification and review

- Full lint passed; final scoped lint and Prettier check cover this rebuild.
- Focused Plan tests: 4 files, 22 tests passed, including reallocation draft reset and Jar configuration.
- Full suite: 249 files passed, 3 failed; 1682 tests passed, 5 failed. Existing failures are Money catalog key parity, Money IA/privacy card wrapping, and three account presentation tests lacking their translation provider.
- Type checking reports only the existing HomeTranslator incompatibilities at `home/home-streaming-sections.tsx:99` and `:340`; no Plan diagnostics.
- `git diff --check` passed.
- Refactor review checked the Plan changed-file set: existing application commands and queries retained, no new financial calculation or persistence contract, no competing components/icons, no new unsafe casts, no extra effects or generic form machinery. Domain percentage scale reuses `JAR_BUDGET_PERCENT_SCALE`; read limit and filter parameter reuse application constants. Existing translator compatibility cast and existing form input cast were retained.

This evidence covers read-only UI and draft interactions, not saved financial mutations or a formal automated WCAG certification.
