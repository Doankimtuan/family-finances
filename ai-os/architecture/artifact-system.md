# Artifact System

## Definition

An **artifact** is a typed, versioned, durable unit of work with explicit metadata and dependencies.

Chat is not an artifact. Logs may reference artifacts but are not substitutes.

## Identity

| Field | Rule |
|-------|------|
| `artifact_id` | `art_…` only (see naming conventions) |
| `artifact_version` | Monotonic integer starting at `1` |
| `type` | Kebab id that **must exist** in `registry/artifact-types.json` `entries` |
| `content_hash` | `sha256:` + hex of **payload file bytes** only |

Path:

```
runtime/artifacts/<artifact_id>/v<artifact_version>/
  meta.json
  payload.json|payload.md|payload.patch|payload.bin
  ARTIFACT.md          # optional human companion
```

## Extensibility

`meta.type` is **not** a closed schema enum. It is an open `artifactTypeId` string.

To add a product type:

1. Add `entries.<type>` to `registry/artifact-types.json`
2. Optionally add `schemas/<type>.schema.json` for the payload
3. Do **not** edit `artifact.schema.json` type lists

Core types are seeded in the registry (`goal`, `plan`, `task`, …). Validators enforce registry membership.

## Required files

1. `meta.json` — `schemas/artifact.schema.json`
2. Exactly one canonical payload file matching `meta.payload.path` ∈ {`payload.json`,`payload.md`,`payload.patch`,`payload.bin`}

## Lifecycle (`ArtifactStatus`)

```
draft → ready → published → superseded → archived
```

Immutability: once `ready` or beyond, payload bytes must not change. Corrections create `artifact_version + 1`.

## Lineage

`depends_on[]` uses `artifactRef` from common defs.  
Relations: `requires` | `derived-from` | `reviews` | `validates` | `implements` | `informs`

## Consumption

1. Read only declared inputs.
2. Prefer `published`; `ready` only for same-run staging.
3. Never depend on `draft`/`archived` unless `allow_unstable: true`.

## Size

| Concern | Standard |
|---------|----------|
| `meta.json` | ≤ 64 KB |
| Markdown payload | Prefer ≤ 2,000 lines |
| Secrets | Forbidden — secret handles only |
