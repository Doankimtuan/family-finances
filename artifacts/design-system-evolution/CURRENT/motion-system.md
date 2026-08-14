# Motion System

## Principles

Motion must communicate one of these:

- Navigation continuity.
- State change.
- Success.
- Expansion or collapse.
- Relationship between source and destination.
- Progress through a flow.

Do not animate because the screen feels static. Finance should feel steady.

## Timing

| Motion type | Duration |
|---|---:|
| Immediate feedback | 120-180ms |
| UI transition | 180-250ms |
| Expansion/collapse | 180-250ms |
| Meaningful completion | Up to 600ms |

Use the existing standard easing token where possible.

## Implementation Contract

- The canonical runtime library is `motion/react`; `framer-motion`, GSAP, anime.js, and react-spring are not permitted.
- JavaScript motion tokens and spring presets live in `shared/motion`. Existing CSS variables remain compatibility aliases for CSS-only transitions.
- Semantic durations are `instant` (80ms), `fast` (150ms), `normal` (200ms), `slow` (250ms), and `deliberate` (600ms only for meaningful completion).
- Easing, movement distance, scale, stiffness, and damping values must come from the shared motion contract.
- Prefer `transform` and `opacity`. Progress indicators use `scaleX` with a left transform origin; layout properties are not animated.
- `prefers-reduced-motion` disables transforms and leaves only short opacity fallbacks. Non-essential motion is skipped on low-end hardware.
- Motion stays in minimal client leaves. Initial server output must match the hydrated first render; use `initial={false}` or a safe post-mount opt-in where needed.
- Conditional content uses `AnimatePresence` with stable keys and explicit exit states. Scroll reveals use `viewport={{ once: true }}`.
- HeroUI owns Drawer, Modal, Popover, Select, and Button transitions where they already provide accessible behavior. Do not double-animate them.
- Do not animate money values, serious warnings, or decorative loops. Every animation must communicate feedback, state, hierarchy, or spatial continuity.
- The page transition primitive is opt-in. It is not installed globally around the product shell until scroll restoration and browser back behavior are validated.

## Allowed Motion

- Button press scale using the existing press token.
- Sheet and dialog enter/exit.
- Progressive form step transition.
- Success receipt reveal.
- Skeleton shimmer or static skeleton with reduced motion.
- Subtle list item insertion/removal.
- Theme transition already defined in the global theme system.

## Forbidden Motion

- Bouncing or spinning money values.
- Parallax.
- Excessive page transitions.
- Decorative looping animation.
- Motion during sensitive error states.
- Scroll hijacking.
- Random asymmetry or dramatic marketing transitions.

## Reduced Motion

All motion above basic hover/press must honor `prefers-reduced-motion`. Reduced motion uses instant state changes, static skeletons, and no repeated animation.
