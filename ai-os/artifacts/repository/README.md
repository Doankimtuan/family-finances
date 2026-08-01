# repository — Soft Input (human / pre-step)

> **Ownership:** human author or external pre-step — **not** produced by Specification Engineering workers.  
> Soft-consumed as `repository-notes` (`required: false`). If absent, workers mark related facts `UNKNOWN: …`.

## Purpose

Capture validated repository layout notes useful for coding-standards / module / deployment specs without inventing structure.

## Runtime

`core/packages/schemas/repository-notes.schema.json` / `entry_kind`: layout | module-map | constraint | note | gap

## Example

See `examples/repo-notes.json`.
