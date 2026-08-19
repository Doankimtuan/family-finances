# ViNha Home Motion Implementation — 07D

## Summary

- Removed Home’s independent section reveal cascade.
- Retained shared button, FilterChip, progress, and bottom-navigation feedback.
- Added one page-level Home entry and one keyed opacity transition for period-dependent content.
- Kept financial values, charts, and routine state changes static except for the surrounding period-content fade.

## Before → after motion ownership

Before, Home had six feature-level `MotionReveal` wrappers around the period control, financial pulse, cash flow, spending, Inbox, and Plan sections. Each used its own viewport observer and could replay as sections entered view.

After, Home has one page-level `MotionReveal` for the compact header and above-fold Home surface. Below-fold sections render statically. `MotionReveal` remains available to other screens; it was not removed globally.

The shell’s existing `MotionPageTransition` and bottom-navigation active indicator remain the owners of route and navigation motion.

## Page entry

The whole Home page enters once through the existing shared `MotionReveal`, using its shared small translate, opacity, standard easing, and gentle spring. There is no scale, bounce, delay, or section stagger.

## Period transition

`HomePeriodData` now uses `AnimatePresence` with stable semantic keys: the existing period-loading test identifier and the `HomeDashboardPeriod` value. Loading and ready content crossfade with the shared `fast` duration and standard easing; `popLayout` keeps the outgoing tree out of normal flow during the short overlap. The period control remains outside the transition and updates immediately.

The existing geometry-preserving skeletons remain unchanged. No layout properties, horizontal movement, or generic page layout animation were added.

## Financial values/chart

Amounts replace immediately inside the surrounding period-content transition. There is no count-up, digit animation, chart draw animation, point sequencing, or Y-axis animation. Recharts areas retain `isAnimationActive={false}`.

Spending rows remain static and are not staggered. Existing shared progress behavior remains the only progress-fill motion.

## Inbox / Plan / Status

Inbox, Plan, offline, and error lanes retain their existing immediate/static rendering. No Home-local bounce, scale, flash, or delayed warning motion was added. Their state semantics remain owned by the existing components.

## Reduced motion

When the shared policy reports reduced motion, Home renders the page and period content immediately with no transform or opacity transition. Conditional content remains present and focus is not moved.

## Low-end devices

The existing `useMotionPolicy` gate bypasses the Home period animation on low-end devices. The shared page reveal also bypasses non-essential motion through the same policy.

## Performance

Home now creates one reveal observer instead of six feature-level observers. There are no animated financial values, chart drawing effects, layout measurements, or scroll-linked effects.

## Browser verification

The repository’s authenticated Home fixture was not available in this environment. The Home browser smoke path passed against the workspace Next server at 3000: unauthenticated `/en/home` redirected to `/en/login`; the authenticated period-swap test was skipped because credentials were not configured. Authenticated Home states, locales, themes, widths, period swapping, and reduced-motion rendering require the configured E2E credentials.

## Deferred

- Chart point-by-point accessibility.
- Freshness and partial read-model contracts.
- Broader motion rollout to other modules.

## Validation

- Focused motion/Home tests: passed (9/9; motion foundation 5/5 and Home IA 4/4).
- Full unit suite: passed (122 files, 915 tests).
- Lint: passed; targeted changed-file lint also passed.
- Typecheck: passed.
- Production build: passed.
- Targeted changed-file Prettier check: passed.
- Repository-wide `format:check`: fails on 2,211 pre-existing files outside this change.
- Browser smoke: passed (1 unauthenticated test); authenticated test skipped without credentials.
