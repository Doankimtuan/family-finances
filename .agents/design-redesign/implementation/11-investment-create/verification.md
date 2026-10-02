# Investment creation UI verification

Verified 2026-10-02 at `/vi/money/investments/new` and `/en/money/investments/new`.

## Design source

Stitch project `16826760243481546078`, screens `3eefdaec2a0d406996d33cb93a621a19` (light) and `540e12aba7514a7894845caa82ae5869` (dark), retrieved through Stitch MCP. Hosted HTML and screenshots were downloaded with `curl -L` to `/tmp/vinha-add-investment-{light,dark}.{html,png}`.

The canonical screen depicts step 2. Its header, progress indicator, segmented entry mode, notices, asset identity, input cards, calculation summary, ownership section, and sticky footer are implemented across the existing three-step flow. Step 1 selects the asset and identity; step 2 enters quantities/prices; step 3 reviews before confirmation. No NAV synchronization claim or household member names are invented.

## Browser evidence

Real Brave browser evidence is in `evidence/`. Each step has light/dark screenshots at 390px, 440px, 768px, and 1280px; step 2 also has bottom-of-form captures. All measured widths had no document horizontal overflow. Desktop retains the centered 440px shell. English first-step evidence is `step1-en-dark-390.jpg`; date overlay evidence is `calendar-dark-440.jpg`.

Keyboard navigation progressed through the steps and opened/dismissed the HeroUI date dialog. Reduced motion was enabled during the responsive captures. Theme, media, and viewport overrides were restored afterward. The form was reopened with fresh defaults; no investment or cash transaction was saved.

The unsaved fund sample used 4,000 units, VND 25,000 cost per unit, and VND 30,000 current value per unit. The browser showed VND 100,000,000 basis, VND 120,000,000 valuation, and VND 20,000,000 / 20% gain. Historical imports retain optional unknown cost/valuation; purchases retain source-account cash semantics. Exact quantities, quoted currency, gold, and bond pricing contracts are preserved.

## Checks

- 18 focused unit tests passed: creation flow, opening UI, historical imports, and overview route. The creation-flow tests additionally cover identity validation, decimal quantity adjustments, zero recovery, scope payloads, unknown values, and purchase/import separation.
- 6 read-only route authentication smoke tests passed in English/Vietnamese.
- Lint and formatting for the changed files passed; `git diff --check` passed.
- Full unit suite: 1,594 passed, 5 existing failures (message parity, account identity wrapping, and credit-card tests missing an intl provider).
- Typecheck remains blocked by existing `HomeTranslator` incompatibilities in `home-streaming-sections.tsx` at lines 99 and 340; no investment type errors were reported.
- Final refactor review checked the touched UI, domain constants, translations, and tests. The implementation reuses shared controls, semantic tokens, Stitch icons, exact quantity helpers, and existing financial previews/server actions; no dependency was added.
