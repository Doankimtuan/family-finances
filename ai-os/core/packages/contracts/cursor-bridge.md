# Cursor ↔ AIOS Skill Bridge

## Layers

| Layer | Path | Purpose |
|-------|------|---------|
| Cursor agent skills | `.agents/skills/` | IDE how-to packages |
| AIOS skills | `ai-os/skills/` | OS-governed packages with manifests + registry |

## Mapping rules

1. A Cursor skill may *author* or *operate* an AIOS role; it does not replace AIOS manifests.
2. If a capability is orchestrated by AIOS, it MUST have an `ai-os/skills/<id>/manifest.json` and registry `entries.<id>`.
3. Cursor-only helpers (editor UX) stay in `.agents/skills/` and must not write AIOS runtime artifacts unless acting as a declared worker (future).
4. Naming: prefer the same kebab `id` when a Cursor skill mirrors an AIOS skill.

## Non-goals

- Auto-importing all `.agents/skills` into AIOS registries
- Treating Cursor skill markdown as a substitute for `skill-manifest.schema.json`
