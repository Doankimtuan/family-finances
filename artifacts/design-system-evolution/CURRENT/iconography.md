# Iconography

## Family

Use Hugeicons Free Stroke Rounded as the canonical icon family. Import icons only from `@hugeicons/core-free-icons` and render them through `AppIcon` when a reusable wrapper is useful.

Do not use Pro, solid, duotone, paid, or additional icon libraries. `AppIcon` is the low-level renderer; semantic registries are reserved for navigation, finance concepts, transaction types, and persisted category keys.

## Style

- Default stroke: subtle rounded stroke inherited from `currentColor`.
- Emphasis: a small stroke-weight increase or semantic tonal treatment for selected navigation, success, or important status.
- Avoid overly detailed icons below 20px.
- Avoid decorative icons that do not support scanning.

## Sizes

| Use | Size |
|---|---:|
| Inline text icon | 16px |
| Row/category icon | 20px |
| Button icon | 20px |
| Navigation icon | 22-24px |
| Empty-state icon | 40-56px |

## Status Icons

Status icons must pair with text. Never rely on icon or color alone.

## Financial Category Icons

Category icons are aids for recognition, not the category definition. They must remain consistent across Money, Plan, Inbox, and Health references.

## Forbidden

- Hand-drawn SVG paths for common icons.
- Emoji as core navigation.
- Random icon style per module.
- Phosphor imports in active application code.
- Pro, solid, duotone, or paid Hugeicons styles.
- Cute icons for serious warnings.
