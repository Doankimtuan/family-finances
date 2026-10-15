# Bottom navigation instant transition audit

Date: 2026-10-13, Asia/Ho_Chi_Minh. Scope: the shared Home → Money → Record → Plan → Inbox navigation flow. Existing unrelated worktree changes were preserved.

## Original root cause and baseline

This checkout already had optimistic active styling for its four route tabs. It did **not** wait for the pathname before highlighting Home, Money, Plan, or Inbox. The reported delay is therefore not uniformly an active-tab delay in this version.

The remaining navigation gaps were:

- Record called `router.push` without persistent requested-navigation feedback. Its pressed transform ended on release; no pending signal remained while the RSC request was outstanding.
- Cached navigation can skip `useLinkStatus`. The old pending destination remained in state after the pathname committed, and could wrongly highlight that old tab on a subsequent unrelated navigation. A regression test reproduced this before the fix.
- Tapping the currently committed tab while another destination was pending cancelled only the local highlight, not the other navigation. A regression test reproduced the suppressed navigation before the fix.
- The pending underline followed `useLinkStatus`, rather than the synchronous click intent.
- Record was excluded from the existing route-content fade. Other main destinations already faded; there was no need for another animation system.

The localized routes come from `APP_PATH` and next-intl navigation: `/vi/home`, `/vi/money`, `/vi/money/transactions/new`, `/vi/plan`, `/vi/inbox`, with equivalent `/en/` routes. Together is not in the bottom navigation. Record remains an action, with no `aria-current` selected-route state.

No asynchronous work runs before the tab's click feedback. Unprefetched server navigation leaves the old page visible until a safe destination segment arrives. Existing `loading.tsx` boundaries then render before financial reads finish. There is no client-side substitution of financial data.

## Files modified

- `shared/patterns/bottom-navigation.tsx`: synchronous requested underline, Record pending ring and busy semantics, Record React transition, cached pathname reconciliation, current-tab interruption fix.
- `shared/patterns/product-route-transition.tsx`: include Record; use the existing 150 ms duration/easing tokens for the opacity-only fade.
- `tests/unit/app-shell-foundation.test.tsx`: regression coverage for cached navigation, interruption, Record pending feedback/settlement and duplicate taps.
- `tests/unit/product-route-transition.test.tsx`: Record entry fade, streamed-child state preservation, disabled-motion and hydration policy coverage.
- This audit. No route, financial query, mutation, database, authentication, locale catalog, or prefetch configuration changed.

## New navigation lifecycle

1. A normal tab click synchronously stores its requested destination. The icon and underline react immediately; `aria-busy` communicates the request while `aria-current` continues to describe the actual route.
2. The existing localized Next.js Link navigates. Modified clicks retain normal browser behavior. Record stores the same UI intent, highlights its existing ring, and calls the localized router inside a React transition.
3. Next.js renders the existing destination loading boundary as soon as its server segment is available. Previous financial content is not relabeled as destination content.
4. The route-content wrapper fades from the existing opacity token to 1 over 150 ms. The bottom bar is outside that wrapper.
5. A pathname commit clears the requested state even when link status was skipped. Link settlement rolls failed/superseded requests back by destination; Record transition settlement clears only Record's request. History events clear optimistic state. Repeated pending-destination taps are suppressed; a new destination can supersede it.

No artificial delay, animation wait, new cache, or financial-query optimization was added.

## Loading shell and persistent navigation

All five destinations already have loading boundaries. Home uses its shared streaming fallbacks; Money mirrors its hero/accounts/product groups; Record mirrors its mode/amount/fields; Plan mirrors its period/pulse/jars; Inbox mirrors its summary/tabs/filters/rows.

Same-segment layouts load locale messages, not financial queries. Product layout retains `requireProductSession`; page-level household authorization and authoritative server reads are unchanged. Initial direct access can wait on the product authorization gate. No protected loading shell was moved above that gate.

The footer remains in the shared product layout, outside the content transition and scroll owner. SafeArea still owns the bottom inset. The central button keeps its existing absolute position, size, transform, and icon. Only its ring color changes while pending; no spinner or positional animation was added.

The captured navigation DOM node stayed connected across all 20 settled samples in each measured batch. Both bottom-bar and Record-button maximum sampled vertical displacement were **0 px** before and after. Initial unread-badge Suspense fallback replacement was not part of these settled measurements.

## Animation and accessibility

The content fade uses `motion/react`, existing `motionTokens.duration.fast` (150 ms), existing easing and opacity tokens. It animates only opacity, has no exit wait, and does not restart when streamed children update under the same pathname. Shared `useMotionPolicy` disables entry motion for reduced motion and low-end devices; initial server/hydrated output stays consistent.

Real Brave checks with reduced motion set **before reload** passed at 390, 440, 768, and 1280 px: content opacity 1 and zero scaled navigation spans. A live preference change in an already-mounted document did not immediately remove existing icon transforms; that is a limitation of the existing motion policy and was not expanded into a shared-motion refactor here.

Keyboard Enter activated Plan and retained focus on its link. Actual current route and pending intent remain separate accessibility states. Record's `aria-busy` is on its list item because the HeroUI button owns its internal busy semantics.

## Prefetch and RSC impact

`PRODUCT_LINK_PREFETCH = false` remains in place for all bottom route Links. Record performs no speculative prefetch. No Inbox prefetch was introduced.

The final measurement batch had 21 RSC requests for 20 transitions: 20 destination requests plus **one existing Home alternate-period prefetch** to `/vi/home?period=quarter`. Its lowercase `next-router-prefetch: 1` header and `home/home-period-transition.tsx` effect identify it. The baseline batch followed earlier Home visits, so that prefetch had already happened outside its measurement window and its count was 20. A fresh-document recheck reproduced the same one-time Home period prefetch; later visits had one destination request each. This is not a duplicate bottom-tab request. The earlier patched batch also had exactly 20 destination requests for 20 transitions. No increase in tab-triggered requests was observed.

No mutation invalidation, cross-household cache, or database query behavior changed.

## Production browser verification and timing

Both control and final code used `bun run build` followed by `bun run start` at localhost:3000, in the existing connected Brave browser and its already-authenticated session. No login, credential recovery, fixture setup, separate browser, or benchmark harness was used. The pre-change build was measured before replacing `.next`; it was not retained as a second runnable build.

Five settled warm cycles per measured destination, same 440 × 900 viewport and Vietnamese locale. Each click was followed by destination visibility and disappearance of loading skeletons before the next click. Temporary click-capture instrumentation sampled rendered-frame DOM state with `requestAnimationFrame`; CDP observed RSC requests. No financial values, credentials, or headers were saved in measurement artifacts.

Timings below are milliseconds, **p50 / p75**, nearest-rank quantiles, n=5. Feedback means the first sampled frame showing requested active/busy state, not a hardware display timestamp. Shell means pathname commit with the rendered destination shell. Completion is the approximate DOM milestone of destination page presence with no `main .skeleton`; it is not a claim that all background work finished. First-useful-financial-content time and physical 60 FPS were not precisely measured.

| Transition     | Feedback before              | Feedback after | Shell before | Shell after | Skeleton-free before | Skeleton-free after |
| -------------- | ---------------------------- | -------------- | ------------ | ----------- | -------------------- | ------------------- |
| Plan → Home    | 11.9 / 12.0                  | 11.8 / 12.6    | 53.1 / 55.0  | 57.2 / 65.0 | 1029.7 / 2075.2      | 967.3 / 1025.0      |
| Home → Money   | 9.9 / 10.7                   | 11.3 / 11.9    | 59.6 / 60.9  | 52.4 / 56.0 | 985.0 / 1071.3       | 868.0 / 908.8       |
| Money → Record | No persistent pending signal | 13.3 / 13.7    | 31.6 / 32.2  | 34.3 / 39.9 | 585.3 / 655.4        | 600.7 / 671.4       |
| Record → Plan  | 7.6 / 12.1                   | 8.2 / 8.7      | 45.5 / 45.9  | 46.1 / 47.9 | 1689.1 / 1719.9      | 1648.7 / 1681.2     |

Content fade began at the shell milestone in sampled animated transitions. Record had no entry fade in the baseline; it now does. The data timing differences are noise from server/network reads, not evidence of faster financial queries. Existing four-tab feedback was already immediate; the measurable addition is Record feedback and its fade, plus the reproduced state fixes.

Cold-ish final checks after a direct Home reload: Home → Money feedback 11.6 ms, shell 70.4 ms, skeleton-free 1173.6 ms; Money → Record feedback 12.8 ms, shell 30.7 ms, skeleton-free 687.3 ms. One sample each, not percentile claims.

Runtime checks:

- Home → Money → Record → Plan and reverse Money/Plan/Home navigation passed; no blank destination flash observed in sampled checks.
- Rapid Home → Money → Plan resolved to Plan, exactly one current/active tab and no busy state after settlement.
- Back restored Plan; Forward restored Money, with correct current-tab semantics.
- English Home → Money retained `/en/` links; Vietnamese routes retained `/vi/`.
- Refresh/direct protected access and Record form rendering passed. No form was submitted.
- 390/440/768/1280 px, light/dark visual evidence: shell width 390/440/440/440, no horizontal overflow. Screenshots captured on Plan with the shared bottom navigation.
- Reduced motion passed at all four widths after initialization. Keyboard activation/focus passed.
- Failure rollback is covered by component tests; no live network-failure injection was performed.

Local evidence: `output/bottom-navigation/measurements.json`, `cold-navigation.json`, and eight `<width>-<theme>.jpg` screenshots. Evidence is ignored local output, not a deployment. Temporary theme DOM overrides, media emulation, viewport override and instrumentation were cleared/reloaded after checks. Light screenshots were recaptured after a full light-theme initialization; the temporary stored-theme value was restored to its exact prior value before the final reload.

## Inbox safety and limitations

Production `/inbox` schedules `runInboxStalenessWorker` and `syncLoanDebtAttentionInboxItems` with `after()`. The existing read-only benchmark guard requires `NODE_ENV === development`; it does not make `next start` safe. **Inbox was not opened, prefetched, or clicked.** No guard was weakened to permit benchmarking. Its active-state/badge behavior is covered by shared component tests and its loading boundary was inspected statically. Plan → Inbox and Inbox → Home runtime timings remain unavailable.

Financial correctness and household isolation rely on unchanged server/application code plus existing auth tests; no transaction submission, cross-household login, or destructive E2E run was performed. One “destination stream closed early” message appeared in accumulated production-server output during interrupted navigation/server shutdown; no stuck navigation was observed, and its exact trigger was not isolated. Actual mobile hardware, physical safe-area/keyboard behavior, and a precise FPS trace were not tested. Content shell cannot precede the first safe server segment without prefetching; conservative authenticated prefetch remains intentional.

## Regression results and final review

Focused navigation/auth/loading/motion checks: **42 passed**, six files. The two new state regression tests failed on the original navigation and passed after the fix. Record duplicate taps and settle-without-commit rollback passed; streamed children retain their state and reduced/initial render avoids entry motion.

`bun run lint`, `bun run typecheck`, production builds, and diff whitespace check passed.

Full `bun run test`: **1850 passed, 5 failed**, 267 passing files and three failing files. Failures are outside this change's import graph:

- `i18n-messages.test.ts`: existing en/vi Money key mismatch (`savingsPage.summaryCaption`).
- `money-ia-privacy.test.tsx`: credit-card identity expects `break-words`, current component uses `truncate`.
- `phase-6-accounts-presentation.test.tsx`: three cases render InlineAlert without a NextIntlClientProvider.

Fixture-creating Playwright E2E was not run as requested. Changed-file Prettier check passed. Repository-wide `bun run format:check` found existing formatting drift in 194 files; none were reformatted outside this task.

Final `refactor-review`: route values reuse APP_PATH; no new domain literals, arbitrary colors/timings, unsafe casts, dependencies, financial logic, silent error catches, or speculative prefetch. State/refs each handle a specific navigation lifecycle gap. Scope is two shared production components and their tests; pre-existing edits remain intact.

**BOTTOM NAVIGATION IMPROVED — PARTIAL RUNTIME VERIFICATION**
