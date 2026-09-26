# Icon System Compatibility Audit

Date: 2026-09-26  
Scope: Active application code, canonical design artifacts, and the running Vietnamese app in Brave. No production code or UI was changed.

## 1. Executive Summary

The application can technically change its icon artwork through a mostly centralized renderer and semantic mappings. It already uses one general purpose icon family: Hugeicons Free Stroke Rounded. The main migration work would be preserving meaning, optical balance, and small control behavior across approximately 126 active TSX files that render `AppIcon`. A direct swap of the low-level renderer alone would miss feature-specific mappings and would risk the five-tab navigation and persisted icon keys.

**Visual compatibility with the proposed style cannot yet be established.** The supplied attachment contains the audit brief, but no icon reference image or link. The observations below describe the current product and state conditional compatibility criteria. No aesthetic rating of an unseen target is asserted.

## 2. Target Icon Language

No target visual was supplied. Provisional target specification:

| Property                                                                 | Target evidence |
| ------------------------------------------------------------------------ | --------------- |
| Grid, bounding box, internal padding, optical size                       | UNKNOWN         |
| Outline or fill, stroke weight, caps, joins, corners                     | UNKNOWN         |
| Geometric or organic construction, symmetry, perspective, dimensionality | UNKNOWN         |
| Detail, density, negative space, solid areas, duotone or monotone        | UNKNOWN         |
| Playful or utilitarian character                                         | UNKNOWN         |
| Default, navigation, inline sizes                                        | UNKNOWN         |
| Filled, active, and dark mode behavior                                   | UNKNOWN         |

The **current** language is rounded outline artwork, `currentColor`, a 14/16/20/24/32/40px size scale, and 1.5px default or 1.9px emphasized stroke (`shared/ui/app-icon.tsx`). This is a baseline for comparison, not a claim about the absent target.

## 3. Existing Icon Architecture

```text
@hugeicons/core-free-icons artwork
  → AppIcon / HugeiconsIcon renderer
  → shared semantic registries and feature-specific mappings
  → IconContainer, IconButton, shared patterns
  → feature screens and five-tab shell
```

`shared/ui/icon-registry.ts` owns navigation, finance, Plan, category, action, utility, and savings-provider mappings. `AppIcon` owns dimensions, stroke, and SVG accessibility attributes. `IconContainer` owns tonal background and 32/40px container sizing. `IconButton` enforces an accessible name and 44px minimum target. `shared/patterns/bottom-navigation-tabs.ts` connects the five semantic destinations to routes and icon elements.

The architecture is **partially centralized**: rendering and much of the vocabulary are shared, while 25 active files outside the registry import Hugeicons directly. Most of these still render through `AppIcon`, so this is semantic ownership spread, not evidence of multiple competing general purpose families. Feature mappings exist for investment asset classes, loan types, and transaction tags.

## 4. Current Dependencies

`package.json` declares `@hugeicons/core-free-icons` and `@hugeicons/react`. `@heroui/react` supplies controls and may draw its own internal affordances. `recharts` draws financial charts; chart SVG paths are data visualization, not a substitute icon family. No active application imports of Lucide, Heroicons, Radix icons, Phosphor, or `react-icons` were found in the inspected TS/TSX/CSS tree. No icon font was found.

The Google and Apple provider glyphs are two inline SVGs in `shared/patterns/social-button.tsx`. Their distinct shapes/colors represent third-party brands. `BrandMark` uses PNG assets; `public/brand` and `artifacts/branding` contain brand/logo SVG exports. These identity assets should stay outside the product icon migration. The CSS and active component search found no separate CSS-generated product-icon system or emoji navigation.

## 5. Icon Inventory

| Surface                                | Current meaningful roles and examples                                                                     | Ownership                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Bottom navigation                      | Five destination icons: Home, Money, Plan, Inbox, Together; Inbox count badge                             | `bottom-navigation.tsx`, `bottom-navigation-tabs.ts`                |
| Top navigation                         | Back, contextual destination icon, trailing actions and status pill                                       | `top-app-bar.tsx`                                                   |
| Home                                   | Financial pulse, Inbox attention, Plan pulse, cash-flow direction, product shortcuts, transaction capture | `home/*`, shared registries                                         |
| Money / Accounts / Transactions        | Account/cash/card, transfer/income/expense, account actions, category and tag marks                       | `money/*`, `money-account-visuals.ts`, `transaction-tag-visuals.ts` |
| Savings / Investments / Loans / Debts  | Product identity, provider/asset/loan type, rows, detail heroes, histories, add/edit/more                 | Feature maps plus finance registry                                  |
| Plan                                   | Jar, goal, recurring, calendar, ritual, recommendations, row actions                                      | Plan registry and `plan/*`                                          |
| Inbox                                  | Attention/source semantic icons, read state and row navigation                                            | `inbox/*`                                                           |
| Together / onboarding                  | Household/member, invitation, ownership, setup concepts                                                   | `together/*`, onboarding, shared patterns                           |
| Auth / system                          | Mail, lock, welcome concepts, third-party provider marks, error/offline/permission states                 | Auth/system screens; `social-button.tsx`                            |
| Settings / forms / controls            | Settings, theme, visibility, date/time, select chevrons, search/filter, close, check, delete              | Shared UI and patterns; some direct Hugeicons imports               |
| Cards / empty states / alerts / sheets | 40px empty/error marks, 16/20px leading marks and utility actions                                         | `empty-state.tsx`, `error-state.tsx`, shared UI                     |
| Charts / statuses                      | Direction icons beside financial text; Recharts SVG is chart geometry                                     | `financial-delta.tsx`, Home chart                                   |

Role classification: destination icons are **navigation**; add/edit/delete/search/filter/back/chevron/close are **actions**; income/expense/warning/success are **semantic**; provider, account, category, tag, jar, and household marks are **entity/category**; the few welcome illustrations/brand marks are **decorative or identity**. There is no evidence that an icon alone defines a transaction category: labels and stored semantic keys remain primary.

## 6. Existing Size / Stroke / Color Rules

`AppIcon` supports `xs=14`, `sm=16`, `md=20`, `lg=24`, `xl=32`, `display=40`. The default is 20px. This is a useful existing semantic scale; no new size API is needed. In the active JSX search, 16px and 40px dominate; 14px appears in micro-controls. The canonical `iconography.md` suggests 22–24px navigation and 40–56px empty states, while implementation uses 24px navigation and 40px empty/error states. No 22px or 48/56px `AppIcon` size is defined.

Stroke is centralized at 1.5px or 1.9px emphasized. Most icons inherit `currentColor` from semantic Tailwind/token classes. `IconContainer` maps neutral, primary, income, expense, transfer, investment, savings, info, debt, and refund roles to tonal token classes. Sizes and tones are centralized, but individual screens choose placements and sometimes choose their own emphasis. The bottom navigation uses semantic token colors, a soft active surface, stronger label weight, and emphasized stroke. Focus/disabled styling lives in shared controls such as `IconButton`.

Observed 440px dark mode: row icons sit in soft tonal containers, while navigation icons sit above visible labels. The 40px display icon can read much larger than dense utility marks by design. A heavier target could crowd 16px controls and 24px navigation; an especially fine target could disappear on muted dark surfaces. These are test conditions, not verdicts about an unseen reference.

## 7. Visual Compatibility

The current product uses Geist Sans, tabular money figures, a centered 440px single-column shell, 10px control/icon-container radii, 12px cards, mostly flat transaction rows, soft semantic surfaces, restrained shadows, and light/dark token themes (`.agents/design-system.md`, `styles/globals.css`, canonical design artifacts). Icons are secondary to financial values and written labels. In Brave at 440px dark mode, Home and Money show this hierarchy in practice: a large balance hero, low-emphasis row icons, and a prominent teal Add Transaction pill above the navigation.

Whether the absent target would feel natural, too heavy/weak, playful/corporate, detailed/generic, rounded/sharp, or unsuitable for finance is **UNKNOWN**. A compatible target must remain legible at 14–16px, avoid competing with balance numbers, fit 32/40px containers without clipping, retain recognizable micro-controls, and work with semantic colors in both themes. Perspective, broad solid masses, or elaborate internal detail would need evidence at actual rendered sizes before acceptance.

There is documentation drift: `visual-foundation.md` still names Phosphor, while the current `iconography.md`, app shell rules, code, and root `AGENTS.md` specify Hugeicons. `app-shell.md` says not to introduce a global floating action button, while the running Home and Money screens contain the existing Add Transaction floating action. These are design-document conflicts to resolve during planning; they do not imply a code change in this audit.

## 8. Financial UX Compatibility

The semantic range needed is already explicit: real cash, account, card, income, expense, transfer, savings, investment, debt/loan, and Plan intention. Text distinguishes categories that similar artwork might otherwise collapse: a jar is a plan for money, not cash in an account; investments are estimates; debt is an obligation. The future artwork must keep these distinctions visible at 16–24px and preserve labels in both English and Vietnamese.

Quick recognition is most critical for transaction direction, card debt vs usable money, warnings, and Inbox decisions. Generic bank/wallet arrows may be acceptable when paired with labels; custom artwork is worth considering only if the reference style cannot clearly distinguish household planning from money held. The application should not use cute or illustrative warnings for serious financial states.

## 9. Bottom Navigation Compatibility

The shell has exactly five tabs and no center action. The Add Transaction control is a separate floating pill above the navigation. `BottomNavigation` uses 24px icons, visible localized labels, a minimum 56px tab height, `aria-current="page"`, a soft active background, active text/weight, and a 1.9px emphasized stroke. In the running 440px dark viewport, each tab measured about 82×59px; the rendered SVGs measured 24×24px and used `stroke="currentColor"`. The Inbox badge is separately named for assistive technology. Active indicator and icon scale motion come from shared tokens and respect the motion policy.

A new family must supply equally recognizable Home, Money, Plan, Inbox, Together shapes at 24px and fit the existing 82px-wide tab cell and label rhythm. Distinct silhouettes matter: Money and Plan must not become visually interchangeable. Existing selected treatment should remain surface + label weight + stroke/color + `aria-current`; outline-to-filled should only be considered if the target reference has a complete, matching free/license-compatible filled set and the canonical design authority changes.

## 10. Light / Dark Mode Compatibility

The current SVGs inherit `currentColor`; CSS theme tokens supply active, muted, financial, caution, and destructive colors. This is compatible with a monochrome target family. Duotone, fixed-fill, or multicolor target artwork would require per-theme palette and contrast work and would increase migration effort. The inline Google glyph is deliberately brand-colored; Apple inherits color. Brand assets are independent.

Brave evidence was collected in dark mode at desktop width and 440px. Light mode was inspected through theme/token code and canonical rules, **not visually verified in this audit**. Any future implementation needs real-browser checks at 390/440/768/1280, light/dark, focus, reduced motion, and overlays before claiming parity.

## 11. Accessibility Findings

`AppIcon` defaults to decorative SVG with `aria-hidden`; a supplied label gives it `role="img"` and an accessible name. `IconButton` requires `aria-label` and at least a 44px target. The bottom nav has visible labels and `aria-current`, and the floating Add Transaction action has visible text. Status guidance requires icon + label/context rather than color alone. `TopAppBar` back controls carry explicit labels.

Migration risks: an icon-only control could lose its parent accessible name if rewritten outside `IconButton`; filled active art could imply selection only by color; a detailed shape could become unintelligible at 14/16px; tooltips must not be the only name; and new SVG wrappers must preserve decorative hiding. `savings-catalog-manager.tsx` includes a button and child icon with the same label; this may produce redundant announcement and merits focused screen-reader checking during implementation, not a speculative production edit now.

## 12. Technical Architecture Findings

The existing `AppIcon` already provides the useful low-level boundary; a new `name/size/tone` component is not needed to prove feasibility. If the chosen target uses compatible SVG data/components, keep `AppIcon` and map semantic names to artwork. Import concrete icons statically to preserve tree shaking. Avoid a runtime import of an entire library or a dynamic string lookup that bloats the client bundle. The current wrapper is a client component; the icon registry itself contains static values and can be imported by server-rendered screens. Any replacement must be checked against Next.js Server Component import rules and hydration behavior.

TypeScript `IconSvgElement` constrains current mappings. A different library may change that type at the registry boundary and feature maps. Persisted transaction-tag and savings-provider icon keys must remain stable; artwork can change behind those keys. The transaction tag input schema validates allowed keys, and the UI map supplies a fallback. Accessibility remains at the rendering/control boundary.

## 13. Fragmentation / Inconsistency

- Shared registry is broad, but direct Hugeicons imports in 25 other active files create more review points. Direct import does **not** currently create a second visual family.
- `transaction-tag-visuals.ts`, `investment-asset-icon.ts`, and `loan-type-icon.ts` maintain feature-specific semantic mappings. These are valid domain ownership but must be included in migration inventory.
- The current `PLAN_ICONS.jar` maps to a wallet shape; `PLAN_ICONS.goal` maps to a safe box. Both are meaningful candidates for a future icon recognition test.
- `FINANCE_ICONS.account` and `FINANCE_ICONS.loan` both map to a bank shape. Text currently disambiguates; a new visual language should not make this overlap less clear.
- `CATEGORY_ICONS.food` uses a restaurant shape while the transaction-tag food key maps to coffee. Money and tag surfaces can represent the same concept with different drawings.
- The canonical `iconography.md` and older `visual-foundation.md` disagree on Phosphor vs Hugeicons; the current implementation follows Hugeicons.
- OAuth SVGs and brand marks are intentional distinct systems and should not be mechanically restyled.

## 14. Generic vs Product-Specific Icons

Common arrows, chevrons, close, plus, edit, delete, visibility, search, filter, calendar, info, warning, check, mail, and lock should remain generic within one coherent micro-icon family. Product-specific candidates are the Plan jar (intention rather than balance), household/shared finance, the app identity mark, and perhaps a distinct account/loan pair. Custom work is justified by failed recognizability at real sizes, not merely by a desire for novelty. Logo/OAuth marks retain their own identity treatment.

## 15. Migration Risk

| Risk                                                           | Level            | Reason                                                                                                                     |
| -------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Low: same-family artwork substitutions in labeled rows/actions | Low              | `AppIcon` already controls size, stroke and decorative state.                                                              |
| Active/inactive tab change                                     | Medium           | Must keep five silhouettes, labels, selected surface, pending animation and `aria-current`.                                |
| 14/16px micro-icons, date/select affordances                   | Medium           | Internal detail and baseline alignment can fail at small sizes.                                                            |
| Financial/category/tag meaning                                 | Medium           | Persisted keys and overlapping mappings need semantic review, especially jar, account vs loan, food.                       |
| New library API and bundle                                     | Medium to high   | Renderer/types/client imports and static tree shaking must be verified.                                                    |
| A heavily filled, multicolor, or illustrative target           | Potentially high | Could conflict with current quiet hierarchy and require theme, status, layout and contrast changes. Actual target unknown. |

Layout, accessibility, dark-mode, and visual-hierarchy risks are concentrated in the bottom nav, tonal icon containers, status marks, small form controls, and hero/empty-state extremes. There is no evidence that a database migration is inherently required if persisted semantic keys are preserved.

## 16. Recommended Future Icon Architecture

Keep the current shape of the system unless the supplied reference proves it insufficient: static icon assets/components → `AppIcon` → existing semantic registries and feature maps → shared controls/screens. Consolidate only duplicated meaning found during migration. Avoid one universal registry for every incidental chevron, and do not add a second library alongside the first. A custom ViNha subset can coexist as statically imported artwork behind the same semantic mapping if needed.

Strategy comparison, conditional on the reference:

| Strategy                                  | Fidelity                                                   | Effort / bundle                                          | Ownership / accessibility                                                      |
| ----------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A. Existing Hugeicons Free Stroke Rounded | High only if reference matches its rounded outline grammar | Lowest; installed, static imports                        | Current wrapper and labels retained; library license/style constraints remain. |
| B. New library                            | Unknown until visual match is demonstrated                 | Medium/high; replace renderer and types, audit bundle    | Another dependency and migration burden; avoid mixed families.                 |
| C. Small custom ViNha SVG family          | Potentially highest for distinctive concepts               | Highest drawing/QA cost; small static subset can be lean | Full long-term ownership and optical/a11y QA obligation.                       |

No strategy can be selected responsibly from the missing target reference. Existing-library customization is the lowest-risk baseline, while a **small** custom subset is more plausible than redrawing every micro-icon if only jars/household concepts need distinction.

## 17. Recommended Icon Design Tokens

Keep the existing semantic sizes unless visual trials demonstrate a problem: `xs 14` for dense micro-controls, `sm 16` for rows/form adornments, `md 20` for buttons/category identity, `lg 24` for navigation and contextual header marks, `xl 32` for rare feature anchors, and `display 40` for empty/error heroes. Container sizes remain 32 or 40px as appropriate. Stroke is 1.5 default / 1.9 emphasized **for the current family**; any target-specific stroke, cap, join, fill and padding token remains UNKNOWN until the visual reference is inspected. Use semantic `currentColor` and existing theme classes, with no raw per-screen color values.

## 18. Proposed Semantic Icon Taxonomy

Retain the current registry domains: `navigation` (home, money, plan, inbox, together), `finance` (account, wallet, cash, card, income, expense, transfer, investment, savings, debt, loan, refund), `plan` (jar, goal, recurring, calendar, ritual), `category/tag` (persisted stable keys), `action` (add, edit, delete, back, forward, more, search, filter, check), and `utility/status` (notification, settings, visibility, info, success, warning). Feature maps may own loan type, investment asset class and provider variants. Persist meaning keys, never SVG paths or library component names. Artwork names such as `BankIcon` and `PiggyBankIcon` should stay implementation details behind `loan`, `account`, `savings`, etc.

## 19. Migration Plan

1. Obtain the missing target reference and test its grammar at 14, 16, 20, 24 and 40px in the existing light/dark UI.
2. Audit semantic recognizability of the five tabs and the financially ambiguous pairs (jar/wallet, account/loan, income/expense, category/tag food).
3. Compare A/B/C with a small, **non-production** contact sheet using real labels, tonal containers and both themes; choose one family and any justified custom subset.
4. If approved for implementation later, change the renderer/semantic maps first, then feature-specific direct imports and persisted-key maps without changing key values. Include micro-icons, auth/system screens, and overlay controls.
5. Verify five-tab active/pending states, 44px controls, accessible names, English/Vietnamese labels, 390/440/768/1280 widths, both themes and reduced motion in a real browser. Run repo validation. This audit grants no approval to implement.

## 20. Open Questions

1. What is the actual icon reference image/link? Without it, all target-style properties and visual compatibility remain unknown.
2. Does the target include matching 14–16px utility icons and a complete five-tab set, or only larger illustrative samples?
3. Does it include filled/selected variants and a dark-mode treatment, and what license applies?
4. Should the canonical design authority permit a new library/custom subset if the target conflicts with Hugeicons Free Stroke Rounded? The current constitution forbids a competing library and ad hoc SVG icons.
5. Which of the existing documentation conflicts (Phosphor mention, floating action rule) should be corrected before using documents as migration acceptance criteria?

## Compatibility Matrix

Compatibility here describes current architecture readiness. Target-style visual fit is unknown until the reference is supplied.

| Area                        | Current system                                                | Target-style compatibility       | Migration effort | Notes                                                  |
| --------------------------- | ------------------------------------------------------------- | -------------------------------- | ---------------- | ------------------------------------------------------ |
| Bottom Nav                  | Five mapped 24px SVGs, visible labels, multi-cue active state | Unknown; architecture ready      | Medium           | Preserve five distinct silhouettes and `aria-current`. |
| Home                        | Shared finance/action icons and tonal containers              | Unknown; architecture ready      | Medium           | Balance hierarchy limits icon weight.                  |
| Money                       | Broad finance icons plus asset/loan maps                      | Unknown; architecture ready      | Medium           | Distinguish cash, estimate, debt.                      |
| Plan                        | Semantic map; jar currently wallet shaped                     | Unknown; semantic test needed    | Medium/high      | Intention versus cash meaning is crucial.              |
| Inbox                       | Semantic row marks and count badge                            | Unknown; architecture ready      | Medium           | Keep status readable without color alone.              |
| Together                    | Household/member and invitation marks                         | Unknown; architecture ready      | Medium           | Potential product-specific concept.                    |
| Forms / auth                | 14–16px adornments, brand OAuth marks                         | Unknown; small-size test needed  | Medium           | Preserve control labels; leave provider brands intact. |
| Actions / micro-icons       | Shared action map plus direct imports                         | Unknown; full-set test needed    | Medium           | Chevrons, close, search, date must match.              |
| Financial categories / tags | Semantic and persisted keys; some drawing overlap             | Unknown; recognition test needed | Medium/high      | Never migrate persisted keys to artwork names.         |
| Empty / error / system      | 40px display icons                                            | Unknown; architecture ready      | Low/medium       | Status tone and text stay primary.                     |

## Final Verdict

```text
ICON SYSTEM AUDIT

Target style:
UNKNOWN — no visual reference accompanied the brief.

Current icon architecture:
PARTIALLY CENTRALIZED

Visual compatibility:
UNKNOWN — cannot rate HIGH / MEDIUM / LOW without the target.

Technical migration complexity:
MEDIUM for a compatible monochrome outline family; potentially HIGH for a different visual grammar.

Custom icons likely required:
UNKNOWN; PARTIALLY plausible for jar/household concepts if generic shapes fail recognition.

Major blockers:
Missing target reference; unresolved style-authority change if the reference conflicts with canonical Hugeicons rules.

Recommended migration architecture:
Retain AppIcon, static imports, semantic registries and persisted meaning keys; replace artwork only after reference tests and implementation approval.

Safe to proceed to icon redesign:
NO — target-specific visual fit is unassessed. This does not authorize icon replacement.

Required work before redesign:
1. Provide the reference image or link.
2. Test it in the five-tab shell, small controls, financial concepts and both themes.
3. Resolve any conflict with canonical icon rules and approve an implementation strategy.
```
