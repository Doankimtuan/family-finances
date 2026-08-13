# Spacing And Layout

## Base Scale

Use the existing 4px scale from CSS variables.

| Token | Value | Primary use |
|---|---:|---|
| `space-1` | 4px | Label to value. |
| `space-2` | 8px | Field internals, icon gap. |
| `space-3` | 12px | Compact row content. |
| `space-4` | 16px | Default screen padding, list rows. |
| `space-5` | 20px | Form rhythm. |
| `space-6` | 24px | Section rhythm. |
| `space-8` | 32px | Region separation. |
| `space-10` | 40px | Large flow separation. |
| `space-12` | 48px | Empty-state or onboarding spacing. |
| `space-16` | 64px | Rare major state composition. |

## Page Rhythm

- App content uses 16px horizontal padding at 440px.
- Top app bar answers location, back, and one primary action.
- Primary action is bottom or sticky when the page is long.
- Fixed bottom navigation requires safe-area padding and scroll padding.

## Section Rhythm

- Section header to content: 12px to 16px.
- Section to section: 24px to 32px.
- Dense detail subgroups: 16px.
- Confirmation blocks: 20px to 24px.

## List Rhythm

- Standard row vertical padding: 12px.
- Touch target: minimum 44px.
- Use dividers or row gaps, not nested cards.
- Preserve scroll position when returning from details or Inbox.

## Form Rhythm

- Field label above input.
- Label to field: 8px.
- Field to helper or error: 6px to 8px.
- Field group to next field: 16px.
- Progressive step to next step: 24px.

## Compact Rhythm

Use compact rhythm for metadata, review rows, schedule rows, and source labels. Keep the relationship tight, but never below accessible touch and readability minimums.


## Application Shell Contract

The authenticated canvas is centered and capped at 440px on every viewport. Use `--page-gutter` through the shared `Page` pattern for canonical horizontal alignment. The shared shell is the only scroll owner and reserves persistent navigation space; `SafeArea` adds the device insets. Do not create desktop-only columns, arbitrary gutter overrides, nested viewport scrollers, or page-specific bottom-navigation spacers. See [app-shell.md](./app-shell.md) for the full contract.

## Global Polish Rhythm

The shared `Page` pattern begins content 12px after the header, separates standard body groups by 16px, and retains 20px of bottom composition space before the shell’s navigation reservation. This compact rhythm is the default for the constrained 440px canvas; increase spacing only to signal a real shift in hierarchy. Use tonal surfaces rather than extra nested padding and borders when a supporting group needs separation.
