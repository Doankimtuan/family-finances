# Skills package root

Reserved skill stubs for Discovery (`skills/discover-*`) and Product RE (`skills/product-*`, generator/extractor ids).

| Status | Meaning |
|--------|---------|
| `reserved` | Package exists; may be claimed only with `acceptReservedSkills` / explicit exception |
| `draft` / `active` | Later skill phases |

Follow `architecture/skill-conventions.md` and `templates/skill/` for new packages.

Do not add skill bodies that mutate the product repo.
Product RE skills must declare consume inputs (not goal-only) and must not treat `architecture/` as product architecture input.
