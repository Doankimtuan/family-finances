# Bottom Navigation Redesign

## Status

The requested Stitch screen is the active navigation reference and is implemented. Browser verification is partial.

## References

- Canonical Stitch screen: `2b70f6125b134d3d9ca2499befaecf1b` — _ViNha Redesigned Bottom Navigation — Canonical System Specification & Live Preview_.
- Project: `16826760243481546078`, design system: ViNha Warm Precision.

## Design Rationale

The design uses five equal slots—Home, Money, centered Record, Plan, and Inbox. Record opens transaction capture and is not a route tab; Home's household shortcut opens Together. Selected route tabs use `aria-current`, a small label dot, a semibold label, and an emphasized icon. The 48px center action has a detached upper edge, localized label, and the existing offline-disabled behavior. The Inbox badge caps its visible count at `99+`. Light and dark use ViNha semantic tokens.

## Implementation Contract

- Preserve routes, nested-route matching, standalone-flow hiding, prefetch behavior, pending feedback, and navigation timing.
- Keep Record on the canonical transaction-create route; preserve its offline-disabled state and accessible label.
- Keep contextual create actions on Savings, Investments, Debts, and Loans lists; suppress the center action on those routes to prevent overlap.
- Use registered Stitch artwork through `AppIcon`, `SafeArea`, `FloatingActionButton`, and semantic tokens.
- Keep labels localized in English and Vietnamese. Route tabs retain 56px minimum targets; the action is 48px, with an 8px reserved upper clearance and the device safe area.

## Verification

In the existing signed-in local browser, the Home navigation rendered in English and Vietnamese, the light-mode desktop shell was visually reviewed, and the center action opened the Vietnamese transaction-create route. The required 390, 440, 768, and 1280px viewport sweep, dark mode, reduced motion, overlay, keyboard focus, and route/back behavior still need browser verification. The configured E2E bootstrap writes fixture data to a remote Supabase project, so it was not run for this visual check.
