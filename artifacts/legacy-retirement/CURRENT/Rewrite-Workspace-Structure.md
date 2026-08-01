---
document: Rewrite Workspace Structure
run_id: run_legacy_retirement_20260801T160000Z
architecture_version: v2.0.0
created_at: 2026-08-01T15:08:42Z
---

# Rewrite Workspace Structure

Aligned to `artifacts/architecture-definition/CURRENT/Folder-Structure.md`.

```text
/
  app/
    (product)/
      home/
      money/
      plan/
      inbox/
      together/
      health/
    api/v1/
    auth/
    layout.tsx
    page.tsx
    globals.css
  modules/
    shared-kernel/{domain,application,infrastructure}/
    tenancy/{domain,application,infrastructure}/
    ledger/{domain,application,infrastructure}/
    plan/{domain,application,infrastructure}/
    inbox/{domain,application,infrastructure}/
    health/{domain,application,infrastructure}/
    platform/{supabase,observability,jobs}/
  components/          # UI primitives only
  shared/              # cross-cutting non-BC helpers (empty)
  infrastructure/      # deploy/CI adapters (empty)
  packages/            # N/A for MVP (README only)
  tests/{unit,integration,e2e}/
  scripts/
  public/
  docs/                # retained documentation
  archive/legacy-v1/   # READ-ONLY retired implementation
  artifacts/           # SoT packs
  ai-os/               # control plane
  supabase/            # live migrations (strangler)
  proxy.ts
  package.json
  next.config.ts
  tsconfig.json
```


## Notes

- `packages/` is present only as an explicit non-use marker (single deployable MVP).
- `shared/` must not become a dump of archived `lib/`.
- TypeScript `include` excludes `archive/` and `ai-os/`.
