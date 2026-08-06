# Shape And Elevation

## Shape

| Element | Radius |
|---|---:|
| Small controls | 6px |
| Default controls | 10px |
| Cards and rows | 12px |
| Sheets and dialogs | 16px |
| Pills | Full radius, limited use |

## Usage Rules

- Use rounded-md controls as the product default.
- Use rounded-lg cards for bounded financial objects.
- Use rounded-xl sheets and dialogs for modal surfaces.
- Use pills only for compact filters, tabs, state labels, and segmented options.
- Avoid pill overload. A screen full of capsules feels trend-driven and hard to scan.

## Icon Containers

Icon containers use 10px radius for actions and categories. Circular containers are reserved for avatars, membership presence, or clear status marks.

## Elevation

Use elevation sparingly:

- `elevation-0`: page regions, rows, grouped content.
- `elevation-1`: cards and primary buttons where tokenized shadow already exists.
- `elevation-2`: app viewport, bottom sheets, larger popovers.
- `elevation-3`: rare modal emphasis.

Prefer:

- Borders for containment.
- Tonal surfaces for region hierarchy.
- Spacing for grouping.
- Shadow only when a surface truly floats.

