# Folder Structure

## Canonical tree

```
ai-os/
├── README.md
├── AGENTS.md
├── VERSION
├── architecture/
├── schemas/
├── templates/
├── contracts/
├── policies/               # Executable policy data (gate profiles)
├── registry/               # entries maps keyed by id
├── roles/
├── runtime/                # gitignored outputs (placeholders kept)
├── skills/                 # empty until skill phase
├── validators/
├── reviewers/
└── workers/                # docs only in framework phase
```

## Package layouts (future)

Unchanged from framework design: `manifest.json` + role doc + optional schemas/fixtures.

## Runtime layout

```
runtime/artifacts/<art_id>/v<n>/meta.json + payload.*
runtime/plans/     # optional convenience mirrors; source of truth is artifacts/
runtime/runs/
runtime/validations/
runtime/reviews/
runtime/logs/
```

Prefer writing under `runtime/artifacts/`. Convenience folders may symlink or copy refs later; do not create a second source of truth.

## Placement rules

| Content | Location |
|---------|----------|
| Conventions | `architecture/` |
| Machine contracts | `schemas/` |
| Policy data | `policies/` |
| Catalogs | `registry/` (`entries` maps) |
| Run outputs | `runtime/` (gitignored) |
| Capability packages | `skills/` `validators/` `reviewers/` |
| Executors | forbidden in framework phase |
