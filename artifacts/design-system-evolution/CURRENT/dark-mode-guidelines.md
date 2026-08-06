# Dark Mode Guidelines

## Rule

Dark mode is first-class. Every shared component, pattern, and screen must be designed and verified in light and dark modes.

## Existing Strategy

ViNha uses class-based dark mode through the theme system and semantic CSS variables. Components should use semantic tokens rather than raw palette values.

## Requirements

- Preserve hierarchy parity between light and dark.
- Keep primary actions recognizable.
- Maintain WCAG AA contrast for body text and controls.
- Avoid pure black backgrounds.
- Avoid low-contrast muted text on elevated surfaces.
- Ensure skeletons, dividers, borders, and focus rings are visible.
- Do not invert individual sections into a different theme.

## Financial States

Status colors must preserve meaning:

- Positive still reads positive.
- Caution still reads caution.
- Critical still reads critical.
- Informational still reads neutral guidance.

Do not make dark mode more alarming than light mode.

