# Phase E1 - App Shell And Home Blueprint

Status: Canonical implementation blueprint.

Scope: App Shell, Home screen, and Home-owned lightweight interactions only. This document forecasts implementation work; it does not implement code or change business behavior.

Authorities used: Phase B IA, Phase C UX redesign, Phase D design system evolution, Phase E0/E0.1 calibration artifacts, current Home/App Shell source.

## 1. Current Surface Inspection

Reusable calibrated parts:

- `AppViewport` already owns the 440px constrained mobile canvas, portal containment, toast host, modal host, top safe area, and desktop centering.
- `ChromeShell` already separates scrollable main content from product footer chrome.
- `BottomNavigation` already enforces the five-tab model and uses Phosphor icons, semantic tokens, active state, focus rings, and bottom safe area.
- Home already composes `Page`, `TopAppBar`, `KpiBlock`, `Balance`, `QuickAction`, `HealthCard`, `StatusAlert`, and Home-local CTAs.
- Phase E0 calibrated Home sequence is present: top bar, load/error state, real position, plan pulse, inbox, health, day-zero actions.

Implementation-relevant issues:

- Home still needs explicit documented state ownership for loading, refreshing, stale, permission-limited, and partial-data states. Current source mainly covers load failure and day-zero.
- Home quick actions need one clear primary action per state. The day-zero trio should present three essentials, but only one action may be visually primary at a time.
- Home capture launches the canonical transaction-create route through `APP_PATH.MONEY_ADD`, whose value is canonical today but whose name reads like legacy compatibility. Future implementation should use a canonical constant name if added.
- Bottom navigation has a placeholder Inbox badge with no visible count. The blueprint must define badge behavior before implementation.
- Current Home hierarchy is useful but close to repeated KPI/card rhythm. Implementation should preserve the calibrated structure while avoiding additional card stacking.
- Authenticated Home browser evidence exists for 390px and 440px, light/dark, English/Vietnamese. True loading, stale, and long-list states remain unverified fixtures.

## 2. App Shell Contract

| Rule | Required behavior | Component owner | Prohibited behavior |
|---|---|---|---|
| Viewport boundary | Render product UI inside the constrained `AppViewport` mobile canvas, max 440px and full dynamic viewport height. Desktop centers the same mobile app shell. | `shared/patterns/AppViewport` | Desktop dashboard layouts, full-width product dashboards, duplicated viewport wrappers. |
| Mobile-first width | Design and verify at 390px and 440px before desktop. Use the same single-column shell on desktop. | `AppViewport`, `Page`, screen owner | Desktop-only responsive assumptions or multi-column Home. |
| Safe area | Apply top safe area around app content and bottom safe area around fixed navigation/action regions. | `AppViewport`, `BottomNavigation`, `BottomActionBar` when used | Fixed controls touching device edges or covering content. |
| Bottom navigation | Exactly five tabs: Home, Money, Plan, Inbox, Together. Height remains compact and thumb reachable; each tab has icon plus label. | `shared/patterns/BottomNavigation` | Adding Health, Settings, object routes, or hidden side navigation to the bottom bar. |
| Active tab state | Active tab is derived from the top-level product route; active item uses semantic accent wash, stronger label, and filled icon weight. | `BottomNavigation` | Module-specific random colors or active state based on last origin instead of current top-level route. |
| Inactive tabs | Inactive tabs stay muted, readable, and 44px minimum. Hover/press feedback is subtle and token-driven. | `BottomNavigation` | Icon-only navigation, emoji navigation, or labels that wrap into illegible fragments. |
| Badge behavior | Badge appears only when a tab has meaningful pending work. Inbox badge announces pending decision count; visual badge must have screen-reader equivalent. | `BottomNavigation`, Inbox/Home data provider | Decorative dots with no count/meaning, color-only urgency, badges for non-actionable facts. |
| Scroll ownership | `ChromeShell` main is the single vertical scroll container; product footer remains outside scroll. `Page` owns inner spacing and bottom padding. | `ChromeShell`, `Page` | Nested page scroll regions on Home, hidden scrollbars that trap content, sticky regions inside arbitrary cards. |
| Sticky regions | Bottom nav is fixed by shell. Sticky action bars are allowed for long forms, not Home summary. Home quick actions live inline unless a future canonical flow requires launcher behavior. | `ChromeShell`, `BottomNavigation`, `BottomActionBar` | Floating competing CTAs or sticky Home controls that fight the bottom nav. |
| Page entry | Product hub entry preserves scroll top unless returning from an origin-aware deep link, where the originating summary region may be restored. | App shell and route owner | Resetting context after cross-module return from Home-launched flows. |
| Back navigation | Hubs use browser/app history or no-op at root. Detail/action routes return to owner parent or preserved origin. | Route owner, shell helpers | Making Home a detail parent for Money/Plan/Inbox objects. |
| Focus restoration | Links, sheets, dialogs, and quick-action launchers restore focus to the invoking Home control when dismissed or when returning without navigation. | Overlay primitive, Home-local interaction component | Losing keyboard focus to the top of page after closing a Home sheet. |
| Reduced motion | Press and page/state motion honors `prefers-reduced-motion`. Financial values do not animate. | Shared primitives and screen owner | Parallax, scroll hijacking, looping decoration, bouncing money values. |
| Theme switching | Light/dark mode uses semantic tokens only and updates existing surfaces without one-off colors. | Theme provider, shared primitives | Hardcoded colors or token bypasses in Home/App Shell. |
| Locale switching | Locale changes preserve equivalent route and screen state where possible; labels come from translations. | Locale routing and screen owner | Hardcoded English/Vietnamese strings in Home or shell components. |
| Loading behavior | Initial app/product loading uses reserved skeleton shapes or clear loading copy. Refreshing preserves existing data with subtle status. | `Page`, `LoadingState`, route owner | Spinner-only dashboards or clearing known facts during refresh. |
| Global error behavior | Recoverable errors show calm `StatusAlert`/`ErrorState` with retry or safe route. Non-recoverable errors route to system state. | Product layout, system routes, screen owner | Blank screens, blame language, or retry controls that repeat unsafe writes. |

## 3. Home Information Hierarchy

Home answers progressively:

1. Where does my household stand?
2. What needs attention?
3. What is progressing?
4. What can I do now?
5. What changed recently?

Exact vertical order:

| Region | Purpose | Information shown | Priority | Pattern | Primary interaction | Secondary interaction | Destination | Visibility | Responsive behavior |
|---|---|---|---|---|---|---|---|---|---|
| Top app bar | Establish household context and screen identity. | ViNha mark, Home title, short contextual subtitle. | P0 | `TopAppBar` inside `Page` | None by default. | Future household switch only if approved by Together. | None. | Always visible at top of page content. | Single row title wraps/truncates only non-critical household name; subtitle wraps naturally. |
| Status lane | Qualify unavailable, stale, offline, or permission-limited facts before summaries. | Offline/read-only banner, stale timestamp/source, load/recoverable error. | P0 when present | `StatusAlert`, `MutationOfflineBanner`, future stale label | Retry/refresh when safe. | Open owner module for recovery. | Owner route. | Only when state requires qualification. | Full-width, before financial facts, no overlay. |
| Real position summary | Answer household standing with one dominant real-money fact. | Real balance/position, currency, freshness/source if not current. | P0 | `KpiBlock` or future `MoneySummary`, `Balance` | Capture transaction for returning users. | Open Money for details. | `/money/transactions/new`, `/money` | Always when data can be shown; in day-zero use as empty/zero state, not alarm. | Amount can wrap or scale down; preserve currency and meaning. |
| Attention summary | Show the one thing that needs a decision now. | Inbox open count and calm decision copy; critical Health only if meaningful. | P1 | `KpiBlock`, `HomeInboxCta`, `ReviewItem` summary if later needed | Open Inbox. | Open specific review item only if single high-priority item is approved. | `/inbox` or `/inbox/[id]` | Only when pending decisions exist, or shown as quiet clear state below Plan when no pending work. | Count remains tabular; copy wraps before count/action. |
| Planning/progress pulse | Show household intention progress without becoming analytics. | Active jar count, allocation mode, next ritual or plan status when available. | P1 | `KpiBlock`, `Progress` only if it answers setup/progress | Open Plan. | Open Jars/Goals/Ritual if deep link is contextually specific. | `/plan` | Hide advanced plan facts for day-zero until starter plan exists. | One compact grouped row; no chart unless answering a specific plan question. |
| Health context | Provide a read-only mirror of visible facts. | Health score/level narrative and completeness/stale qualification. | P2 | `HealthCard` / Health module component | Open Health overview. | Open source module from Health, not directly from Home. | `/health` | Hide or soften until enough facts; never primary on day-zero. | Compact tappable summary with text equivalent for score. |
| Quick actions | Let the household do one valid next thing. | Returning: capture. Day-zero: add money container, choose starter plan, invite partner. | P2 | `QuickAction`, `EmptyState`, future Home launcher if Rule of Three met | State-specific primary action. | Secondary actions visually quieter. | Owner routes only | Returning user: capture near real position. Day-zero: visible after explanation. | 44px rows; no floating action cluster. |
| Recent activity | Show what changed recently when enough facts exist. | 3 to 5 recent transactions or review/activity receipts with source labels. | P3 | `TransactionRow`, `ReviewCard`, `Section` | Open item owner detail. | Open Money/Inbox list. | Owner detail or list route | Only after household has data; absent on day-zero. | Rows keep amount aligned; preserve scroll return. |

## 4. Home Content Density

Above the fold:

- Top app bar.
- Status lane when present.
- One dominant real position summary.
- One state-appropriate primary action, usually capture for returning users or add first account for day-zero.
- A compact attention indicator only when there is actionable review work.

After first scroll:

- Planning/progress pulse.
- Inbox quiet state or open-count CTA.
- Health context when enough facts exist.
- Recent activity if available.

Only after disclosure:

- Explanation of how real money differs from planned use.
- Health factor details and source facts.
- Detailed Inbox item context.
- More than 3 recent activities.

Only when actionable:

- Inbox decision CTA.
- Stale refresh/review action.
- Permission recovery link.
- Offline mutation blocker.

Only when household has enough data:

- Health score/narrative.
- Recent activity.
- Progress visualization.
- Planning status beyond starter guidance.

Density rules:

- Home has one dominant financial summary. Do not add additional dominant amount cards.
- Do not duplicate values visible on Money/Plan unless the Home version is a summary with a route out.
- Do not add decorative charts. Charts require a specific user question and direct text labels.
- No nested cards. Use sections, tonal surfaces, rows, and progressive disclosure.
- Ordinary variance uses neutral/secondary styling. Caution/critical tokens are reserved for states needing review or recovery.
- At most one visually primary CTA in any state.

## 5. Home State Matrix

| State | Visible regions | Hidden regions | Primary action | Feedback | Recovery path | Skeleton/placeholder behavior |
|---|---|---|---|---|---|---|
| First household with no data | Top app bar, real position empty/zero summary, day-zero essentials. | Health score, recent activity, advanced plan/inbox details. | Add first account or money container. | Invitational empty copy, no alarm. | Money account/create owner route; Plan and Together secondary actions. | EmptyState plus stable summary shape. |
| Partially configured household | Top app bar, available real facts, missing-fact status, starter Plan pulse, relevant next action. | Health if insufficient facts; recent activity if absent. | Complete the next missing owner fact. | Missing data is labelled near the affected summary. | Open Money/Plan/Together owner route. | Preserve available facts; use placeholders only for missing facts. |
| Active normal household | Top app bar, real position, capture, plan pulse, inbox clear/pending, health, recent activity. | Day-zero setup trio. | Capture transaction. | Calm current facts and freshness. | Owner links for more detail. | No skeleton after ready. |
| Household requiring attention | Status/attention summary near top, real position still visible, Inbox CTA. | Decorative progress/detail regions that distract. | Open Inbox or specific approved owner recovery. | Caution text names source and consequence. | Inbox/owner route with origin preserved. | Existing facts remain visible. |
| Loading | Top shell and reserved Home summary skeletons. | Real values and action CTAs until data resolves. | None. | Loading announced only if blocking. | Automatic resolve; route error if failed. | Skeletons match final region dimensions; reduced motion static. |
| Refreshing | Existing data, subtle refresh/stale indicator. | Full-screen loading replacement. | Current primary action remains if safe. | Polite refresh status. | Retry if refresh fails. | No layout shift. |
| Stale data | Real position with freshness/source label, stale status lane, owner recovery. | Unqualified Health score if sources stale. | Refresh or review source. | Stale label uses text plus semantic tone. | Money/Plan/Health source route. | Preserve cached data with stale qualifier. |
| Recoverable error | Top app bar, StatusAlert/ErrorState, any safe cached facts. | Dependent regions that require failed data. | Retry. | Calm error copy and next step. | Retry, owner route, or system error route. | Error occupies the failed region, not an unrelated card. |
| Permission limitation | Top app bar, permission explanation, read-only safe facts if available. | Write CTAs and restricted details. | Open Together or request household access. | Access limit announced as status. | Together permissions/settings owner route. | No fake disabled dashboard. |
| Long Vietnamese content | Same regions as state requires. | Nothing important solely due to language length. | State primary action. | Labels wrap naturally. | N/A | Stable min heights where needed; avoid truncating financial meaning. |
| Large monetary values | Same regions as state requires. | None. | State primary action. | Full amount remains understandable. | Disclosure may show exact value if compact summary abbreviates. | Amount can reduce one step or wrap; screen-reader label includes exact currency. |
| Light mode | All visible regions token-driven. | N/A | State primary action. | WCAG AA contrast. | N/A | Skeleton uses semantic surface tokens. |
| Dark mode | Same hierarchy and contrast as light mode. | N/A | State primary action. | No shadow-dependent hierarchy. | N/A | Skeleton uses dark semantic surface tokens. |

## 6. Component Mapping

| Visible element | Existing shared primitive | Calibrated shared pattern | Home-local component | Missing component requiring implementation |
|---|---|---|---|---|
| App canvas | None | `AppViewport` | None | None |
| Product shell scroll/footer | None | `ChromeShell` | None | None |
| Bottom nav tabs | Link, Phosphor icons | `BottomNavigation`, `TABS` | None | Inbox badge data adapter if count becomes live |
| Home page frame | None | `Page` | None | None |
| Home header | `Heading`, `Text` | `TopAppBar`, `BrandMark` | None | None |
| Dominant real position | `Text` | `KpiBlock`, `Balance` | None | Future `MoneySummary` only after repeated use |
| Capture CTA | `Button` via pattern | `QuickAction` | `HomeCaptureAction` | Canonical route constant rename if desired |
| Plan pulse | `Text`, Link styling | `KpiBlock` | Inline Home composition | None |
| Inbox CTA | `Button` | `KpiBlock` | `HomeInboxCta` | Live nav badge count adapter |
| Health context | None | `HealthCard` | `HomeHealthChip` | Health partial/stale variant if not already supported |
| Day-zero setup | None | `EmptyState`, `QuickAction` | `HomeDayZeroTrio` | A Home-specific `SetupEssentials` component only if repeated or complexity grows |
| Status lane | `StatusAlert` | `ErrorState`, `LoadingState`, `MutationOfflineBanner` | Home placement only | Home stale/partial status composition |
| Recent activity | None | `TransactionRow`, `ReviewCard`, `Section` | Future Home local list adapter | None until data contract exists |
| Explanation sheet | None | `Sheet` | Future `HomeExplanationSheet` | Home-local sheet trigger/content |

Proposed new components:

| Component | Responsibility | Ownership | Inputs | Variants | States | Accessibility | Reason existing component is insufficient |
|---|---|---|---|---|---|---|---|
| `HomeStatusLane` | Place offline, stale, partial, permission, and recoverable error qualifiers in one predictable Home region. | `app/[locale]/(product)/home` | status kind, title, body, action label/href, freshness/source. | offline, stale, partial, permission, error. | hidden, visible, retrying. | Role/status based on severity; action labelled; placed before qualified facts. | `StatusAlert` is the primitive, but Home needs orchestration and placement rules. |
| `HomeSummaryDisclosure` | Explain a Home summary without navigating or exposing unrelated module detail. | `app/[locale]/(product)/home` | trigger label, title, summary facts, source labels. | real position, plan pulse, health. | closed, open. | Sheet/dialog focus trap, restore focus, headings, reduced motion. | Existing `Sheet` handles overlay mechanics, not financial explanation content. |
| `HomeRecentActivityPreview` | Show the latest 3 to 5 relevant changes after enough data exists. | `app/[locale]/(product)/home` | items, localized labels, destination builder, empty behavior. | transactions, review receipts, mixed. | ready, empty, stale. | Row links include object type and amount/date meaning. | Home needs a cross-module preview adapter; row primitives remain owner/shared. |

Do not promote these to `shared/patterns` until Rule of Three or platform-primitive criteria are met.

## 7. Interaction Blueprint

- Tap targets: all Home actions, nav tabs, disclosure triggers, and rows meet 44px minimum.
- Quick-action behavior: Home quick actions navigate to owner routes only. Home does not write directly. Capture goes to `/money/transactions/new`. Day-zero secondary actions go to Money, Plan, or Together owner routes.
- Quick-action launcher: if implemented, it is Home-owned and opens a short sheet with owner-route choices. It must not duplicate full create flows or perform writes.
- Disclosure behavior: explanations open in a sheet contained by `AppViewport`; sheet content explains visible facts, sources, and freshness only. Complex details route to owner screens.
- Cross-module navigation: add `origin=home` or equivalent context preservation where route helpers support it. Destination owns mutation and success receipt.
- Return context: returning from a Home-launched product detail restores Home scroll/summary position where practical.
- Scroll restoration: Home has one scroll container. Returning from activity/detail preserves position and focus when browser/history supports it.
- Loading feedback: initial load uses skeleton/reserved layout; refreshing preserves existing data; blocked user actions show loading on the control or local region.
- Success feedback: writes launched from Home show success in the destination owner flow, then return to the created detail/list or Home context according to owner contract.
- Error recovery: recoverable errors use retry plus safe owner route. Offline disables unsafe mutations and keeps read-only facts visible.
- Keyboard/focus: tab order follows vertical Home order. Sheet/dialog close restores trigger focus. Bottom nav follows document order after main content unless shell semantics specify otherwise.
- Reduced motion: only press, disclosure, and state-change motion; no animated amounts, parallax, scroll hijacking, or decorative loops.

## 8. Visual Blueprint

| Region | Hierarchy | Typography role | Surface type | Spacing rhythm | Alignment | Icon role | Semantic color | Data visualization | Motion intent |
|---|---|---|---|---|---|---|---|---|---|
| Top app bar | Quiet screen identity. | Page title plus supporting subtitle. | Canvas/no card. | Compact, sticky-compatible. | Start-aligned, title row can flex. | Brand mark only. | Text primary/secondary. | None. | None beyond theme transition. |
| Status lane | Interrupts only when facts need qualification. | Body/caption with specific action label. | Alert surface. | 12-16px internal, before summary. | Start-aligned. | Status icon if primitive provides it. | Info/caution/critical tokens by meaning. | None. | Optional reveal, reduced-motion safe. |
| Real position | Dominant answer. | Largest amount; title/hint small and factual. | Emphasized tonal surface. | 16px internal, 24px below. | Amount start-aligned; CTA reachable. | Capture icon only. | Accent wash for prominence; not profit/loss color. | None unless future trend question is explicit. | Button press only. |
| Attention | Decision relevance, not alarm by default. | Small body plus tabular count. | Surface or row group. | 12px compact stack. | Copy and count/action balanced; wrap copy first. | Inbox icon optional. | Caution only for time-sensitive review, accent for action. | Count only. | Press/state transition. |
| Plan pulse | Progress signal. | Medium label/value, quiet metadata. | Surface. | 12-16px internal. | Between row if labels fit; stack on overflow. | Planning icon only if helpful. | Accent/progress token, not random module color. | Linear progress only when a defined percent exists. | Expansion only if disclosure exists. |
| Health | Read-only context. | Score plus plain narrative. | Elevated/surface card only if HealthCard contract needs it. | 12-16px. | Start-aligned text with compact score. | Health/status icon. | Health semantic level with text label. | Score representation must have text equivalent. | Press only. |
| Quick actions | Action utility. | Short button/row labels. | Rows or light bounded setup group. | 12px row gap. | Icon + label start, chevron optional. | Phosphor action icons. | Primary action accent; secondary neutral. | None. | Press only. |
| Recent activity | Change awareness. | Row labels, caption dates/sources, tabular amounts. | Plain section with rows/dividers. | 12px rows, 24px section. | Amount right-aligned when space allows. | Row type/status icons optional. | Income/expense/status tokens with text meaning. | None. | Subtle insertion/removal only. |

Visual prohibitions:

- No glassmorphism, neon gradients, random module colors, decorative charts, oversized app heroes, scroll-driven marketing motion, or excessive pills.
- Do not turn Home into an analytics dashboard or banking cockpit.
- Color carries semantic meaning and must pass in light/dark themes.

## 9. Responsive And Localization Contract

At 390px:

- Home remains single column.
- Top title row preserves the brand mark and screen title; long household/context text wraps in subtitle or moves to disclosure.
- Amounts may reduce one display step or wrap onto a second line. Do not truncate meaningful currency values.
- Horizontal rows convert to stacked content before controls become cramped.
- Bottom nav labels may balance/wrap within each tab while keeping 44px targets.

At 440px:

- Use default app padding of 16px and calibrated section rhythm.
- Real position amount can use the large Home amount style if it fits with common VND values.
- Plan/inbox rows may use between alignment; test long Vietnamese strings.

Desktop constrained viewport:

- Render the same 440px app shell centered on the desktop canvas.
- No desktop-only Home dashboard, side nav, or expanded analytics grid.
- Pointer hover may add subtle surface feedback, but touch behavior remains primary.

Localization:

- All visible text comes from i18n messages.
- Vietnamese and English copy must avoid idioms and stay short enough for mobile.
- Long household names wrap or move to subtitle/disclosure; financial meaning is not truncated.
- Currency/date formatting uses shared locale utilities.
- Screen-reader labels include exact values, currency, source/freshness, and whether an amount is real, planned, estimated, due, or available.

Overflow policy:

- Wrap prose and labels first.
- Abbreviate only non-critical helper metadata.
- Disclose secondary details in a sheet.
- Reorder row content to stacked layout when amount/action would collide.
- Never truncate the only visible financial amount or decision consequence.

## 10. Accessibility Contract

- Landmark structure: product shell exposes one scrollable main region; bottom navigation is a named primary navigation landmark.
- Heading order: Home has one `h1` in `TopAppBar`; major Home sections use logical section labels without skipping levels.
- Screen-reader summary order: status qualifiers, real position, attention, plan pulse, health, quick actions, recent activity.
- Accessible names: nav tabs include visible label; icon-only controls require `aria-label` or tooltip; decorative icons are hidden.
- Focus order: follows visual order. Bottom nav is reachable after main content, and route changes place focus at the new screen heading or preserved origin.
- Navigation announcements: active tab uses `aria-current="page"`; cross-module launches identify destination in link/control label where needed.
- Badge announcements: Inbox badge announces pending decision count, not only a dot.
- Status announcements: recoverable error/offline/stale updates use appropriate alert/status role and avoid noisy repeated announcements.
- Non-color meaning: every caution, critical, stale, success, and disabled state has text/icon meaning beyond color.
- Touch target minimum: 44px for all navigation, quick actions, disclosure triggers, and row links.
- Reduced motion: all nonessential transitions removed; skeleton shimmer becomes static.
- Text scaling: content remains readable at user text scaling; controls can grow vertically.
- Monetary pronunciation: accessible labels include currency and meaning, for example real balance, planned capacity, estimated value, due amount, available credit.

## 11. Implementation Boundary

Files likely to change:

- `app/[locale]/(product)/home/page.tsx`
- `app/[locale]/(product)/home/home-capture-action.tsx`
- `app/[locale]/(product)/home/home-inbox-cta.tsx`
- `app/[locale]/(product)/home/home-health-chip.tsx`
- `app/[locale]/(product)/home/home-day-zero-trio.tsx`
- `shared/patterns/bottom-navigation.tsx`
- `shared/patterns/bottom-navigation-tabs.ts`
- `shared/patterns/page.tsx`
- `shared/patterns/chrome-shell.tsx`
- `shared/patterns/app-viewport.tsx`
- i18n message files for `home`, `navigation`, and `a11y`
- focused Home/App Shell Playwright specs and fixtures

Components likely to change:

- `BottomNavigation`
- `Page`
- `HomeCaptureAction`
- `HomeInboxCta`
- `HomeHealthChip`
- `HomeDayZeroTrio`

Components likely to be added:

- `HomeStatusLane`
- `HomeSummaryDisclosure`
- `HomeRecentActivityPreview`, only after a data contract exists
- Optional live Inbox badge adapter, if navigation receives pending counts

Routes that must remain unchanged:

- `/home`
- `/money`
- `/money/transactions/new`
- `/plan`
- `/inbox`
- `/inbox/[id]`
- `/together`
- `/health`

Business logic that must remain untouched:

- Ledger posting, correction, refund, and transaction immutability.
- Plan allocation, jar, goal, recurring, calendar, and ritual calculations.
- Inbox review item resolution policy and source ownership.
- Health read-only policy and no-write boundary.
- Tenancy membership, roles, policies, invitations, and account lifecycle rules.
- Supabase schema, migrations, RLS, and backend persistence.

Modules that must not be modified for this UI batch unless a compile break requires a narrow fix:

- `modules/ledger/domain`
- `modules/plan/domain`
- `modules/inbox/domain`
- `modules/health/domain`
- `modules/platform/supabase`
- Retired legacy code

## 12. Acceptance Criteria

Visual identity:

- Home renders as a calm household finance companion, not a banking/accounting/analytics dashboard, demonstrated by one dominant real-position summary and no decorative chart.
- All Home and shell colors use semantic tokens and pass light/dark inspection.
- Phosphor remains the sole icon family in Home/App Shell.

Hierarchy:

- Above the fold at 390px shows screen context and real position before secondary modules.
- There is no more than one visually primary CTA in day-zero, normal, attention, error, stale, or permission states.
- Home order matches: status if present, real position, attention, plan/progress, health, quick actions, recent activity.

Navigation:

- Bottom navigation contains exactly Home, Money, Plan, Inbox, Together.
- Health and Settings do not appear as bottom tabs.
- Active tab is correct for `/home`, `/money/*`, `/plan/*`, `/inbox/*`, and `/together/*`.
- Home quick actions navigate only to owner routes and do not perform writes directly.
- Returning from a Home-launched owner route preserves meaningful Home context where supported.

Responsive behavior:

- Home passes visual inspection at 390px and 440px.
- Desktop renders the constrained app shell, not a separate dashboard layout.
- Long amounts and Vietnamese strings do not overlap controls, nav labels, or adjacent content.
- Bottom nav and any fixed controls respect safe-area padding.

Theme and locale:

- Home and App Shell pass browser screenshots in light and dark mode.
- Home and App Shell pass browser screenshots in English and Vietnamese.
- Locale switching preserves route equivalence and does not expose hardcoded strings.

States:

- Loading state uses reserved skeleton/placeholder shapes and no success implication.
- Empty/day-zero state shows the three essentials with one primary action.
- Partial-data state labels missing facts and routes to owner recovery.
- Ready state shows real position, capture, plan pulse, Inbox, Health, and recent activity only when available.
- Stale state preserves cached facts with freshness/source labels and a recovery action.
- Recoverable error state shows retry or safe route without blanking the shell.
- Permission-limited state hides write CTAs and routes to Together/access recovery.

Accessibility:

- Home has one `h1`; section headings and DOM order match screen-reader summary order.
- Every interactive element is keyboard reachable, has a visible focus ring, and meets 44px touch target.
- Inbox badge exposes an accessible pending-count announcement.
- Status and error changes are announced appropriately.
- Monetary values include accessible labels with currency and financial meaning.
- Reduced motion removes nonessential transitions and animated skeleton shimmer.

Browser verification:

- Capture screenshots for Home at 390px light Vietnamese and 440px dark English.
- Verify navigation active states for all five tabs in a real browser.
- Verify long Vietnamese copy and large VND amount fixture in a real browser.
- Verify loading, empty, partial, ready, stale, recoverable error, and permission-limited states through fixtures or targeted mocks before marking implementation complete.

Regression protection:

- Typecheck passes.
- Lint passes without new warnings.
- Focused Home/App Shell Playwright tests cover navigation, state rendering, localization, theme, reduced motion, and safe-area behavior.
- No visible navigation points to compatibility routes.
- No imports are added from retired legacy code.
