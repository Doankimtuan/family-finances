# Application Shell and Navigation

## Canonical Product Canvas

ViNha is a mobile-native product at every viewport size. The authenticated shell is `width: 100%` with `max-width: 440px`; it uses the available width below that cap and remains centered above it. Desktop preserves the same single-column information architecture, route order, interaction model, density, and five-destination navigation. The outer canvas may use the semantic surface and atmosphere treatment, but it must not become a desktop dashboard, fake device frame, decorative marketing composition, or a second content area.

The shared `AppViewport` owns the viewport boundary, desktop presentation, overlay portal root, top safe area, and outer-canvas behavior. `ChromeShell` owns exactly one scroll region plus the persistent footer. Product pages must not add another independent viewport scroll container or arbitrary desktop-width wrapper.

## Page Container and Gutters

The canonical page gutter is `--page-gutter`, currently aliased to `--space-4` (16px). The shared `Page` pattern owns this horizontal alignment for headings, summaries, cards, lists, forms, and section headings. Deliberate full-bleed content, such as a chart or a carousel, must opt out explicitly; a page may not define its own arbitrary side padding.

The shell reserves bottom-navigation space through normal footer layout, while `SafeArea` adds device inset spacing. Individual pages must not add navigation spacer hacks. Use dynamic viewport units where a viewport height is required; do not rely only on legacy `100vh`.

## Header Patterns

`TopAppBar` is the shared page-header primitive. It is intentionally canvas-integrated rather than a default card or large sticky admin bar.

| Variant | Use | Required composition |
|---|---|---|
| `primary` | Top-level destinations | Compact title, optional eyebrow, optional supporting text, and only page-relevant trailing actions. |
| `detail` | Account, transaction, debt, saving, investment, and loan detail | Integrated accessible back action or back link, title, optional context/status, and optional trailing action. |
| `form` | Create and edit pages | Back or cancel when needed, compact title, optional contextual action, and no duplicated in-content form title. |

Headers should use the shared typography, `AppIcon`, `IconButton`, spacing, and semantic tokens. They must not be invented screen by screen, rely on all-uppercase metadata, consume unnecessary vertical space, or make every header sticky. Use a sticky treatment only when a specific long detail flow benefits from it and test it in the browser.

## Bottom Navigation

`BottomNavigation` is the only authenticated product navigation component. Its destinations and route ownership come from the information-architecture contract. It is data-driven through the stable tab registry so a future destination can be added without a new navigation implementation.

Navigation labels remain visible and come from the existing i18n system. Navigation icons are Hugeicons Free Stroke Rounded rendered by `AppIcon`, normally 22–24px. Selected state combines `aria-current`, a soft primary surface, primary foreground, strengthened label weight, and an emphasized stroke; it must never rely on filled/Pro icons or color alone. Motion is limited to the existing short press/color/surface transitions and is disabled or reduced for reduced-motion preferences.

The navigation is attached at small widths and may gain only restrained token-based surface separation inside the 440px shell on wider canvases. It must keep accessible tap targets, safe-area bottom padding, visible focus, and no content overlap.

## Action Hierarchy

Use a header icon action for high-frequency contextual utility, a header text action for short visible context, an in-content primary CTA for the page’s main task, and an anchored bottom action only for long task flows that require persistent completion. Do not introduce a global floating action button or mix action placement arbitrarily across screens.

## Required Verification

Every shared shell, header, or navigation change requires browser evidence at 390px, 440px, 768px, and 1280px; light and dark themes; English and Vietnamese; keyboard focus; reduced motion; a representative overlay; and route/back behavior. Preserve business behavior, route semantics, financial calculation, and form contracts while applying these patterns.

## Expressive Top-Level Headers

Top-level Home, Money, Plan, Inbox, and Together pages use the shared `TopAppBar` `contextual` variant when a page can explain the user's current financial situation rather than only naming a module. The composition is optional-slot based: eyebrow/context, expressive headline, supporting sentence, semantic Hugeicon, deterministic status pill, period/count meta, insight, and trailing action may be combined selectively. It must remain compact inside the 440px shell and must not become a rounded card or a marketing hero.

The primary headline should answer what is happening in the user's financial life now. Module identity belongs in the eyebrow or navigation state when a stronger contextual headline is available. Supporting copy is conversational and localized through `next-intl`; Vietnamese copy must be idiomatic rather than literal. Internal accounting/domain terminology remains secondary educational context only.

Contextual copy may use only existing deterministic data. Home may use the household-local greeting period and health state; Money may use account and recent-activity counts; Plan may use active/paused jar counts and ritual mode; Inbox may use open/clear/archived queue state; Together may use household member count, name, and role. Do not invent claims, generate financial advice, or introduce a personalization engine.

Expressiveness comes from typography, whitespace, a restrained 26–30px headline, one semantic icon accent, optional status/meta rhythm, and short reduced-motion-safe transitions. Typical contextual headers should remain approximately 90–150px tall; detail and form headers stay compact. Do not use emoji as interface icons, large illustrations, neon gradients, glassmorphism, giant blobs, or repeated header cards.
