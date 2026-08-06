# Component Governance

## Ownership

| Layer | Owns |
|---|---|
| `shared/ui` | Platform primitives with no business meaning. |
| `shared/patterns` | Reusable product patterns and cross-module financial UI. |
| Feature-local | Screen-specific composition and one-off behavior. |
| Module-local | Domain-owned financial patterns before promotion. |

## Promotion Criteria

Use Rule of Three unless the component is a mandatory platform primitive.

Promote to `shared/ui` when:

- It has no business meaning.
- It is used across modules.
- Accessibility behavior is stable.
- Theme and localization behavior are stable.

Promote to `shared/patterns` when:

- It encodes reusable product behavior.
- It appears in at least three places or is mandated by Phase C.
- It has a documented owner and test expectations.

Keep feature-local when:

- It serves one screen.
- Behavior is still changing.
- Promotion would leak domain assumptions.

## Deprecation Process

1. Mark the old component as deprecated in documentation.
2. Provide the replacement component or pattern.
3. Migrate one coherent flow at a time.
4. Remove only after no active imports remain.

## Required Checks

Every promoted component requires:

- Light and dark mode verification.
- Keyboard behavior.
- Screen reader labels for actions and financial meaning.
- 440px viewport verification.
- English and Vietnamese fit check.
- Visual regression evidence for affected screens.

## Constants

No magic strings, colors, routes, or financial labels inside components. Add missing constants at the documented home first.

