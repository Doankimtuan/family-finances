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

