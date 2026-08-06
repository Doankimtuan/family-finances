---
document: Migration Summary
run_id: run_legacy_retirement_20260801T160000Z
created_at: 2026-08-01T15:08:42Z
---

# Migration Summary

## From → To

| From (legacy v1) | To |
|------------------|----|
| `app/*` (dashboard, jars, activity, …) | Archived → rewrite `app/(product)/{home,money,plan,inbox,together,health}` |
| `lib/*` | Archived → rewrite `modules/*/{domain,application,infrastructure}` |
| `components/*` | Archived → empty `components/` primitives |
| `proxy.ts` / Next redirects | Archived → stub `proxy.ts`, empty `next.config.ts` |
| `scripts/generate-favicons.mjs` | Archived |
| `supabase/migrations` | Live retained + archive copy |

## Recovery

1. Read-only tree: `archive/legacy-v1/`
2. Tarball: `archive/backups/legacy-v1-complete-run_legacy_retirement_20260801T160000Z.tar.gz`
3. Manifest: `archive/legacy-v1/MANIFEST.json`

## Not migrated (by design)

No business logic, UI, or utilities were ported into the rewrite scaffold.
