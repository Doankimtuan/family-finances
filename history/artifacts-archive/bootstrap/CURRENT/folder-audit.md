# Folder Audit — Sprint 0 Bootstrap

**Run:** `run_sprint0_bootstrap_20260801T234900Z`

## Protected (do not remove)

| Path | Status |
|------|--------|
| `archive/` | Present — legacy-v1 read-only |
| `artifacts/` | Present — frozen SoTs |
| `shared/` | Present — scaffold only (needs subdirs) |
| `modules/` | Present — BC scaffolds |
| `app/` | Present — rewrite stubs |
| `public/` | Present — empty scaffold |
| `supabase/` | Present — **empty** (migrations in archive) |
| `tests/` | Present — unit/integration/e2e scaffolds |
| `components/` | Present — legacy stub only (do not grow) |

## Constitution mandatory — missing at audit

| Path | Action |
|------|--------|
| `features/` | Create |
| `providers/` | Create |
| `styles/` | Create |
| `types/` | Create |
| `shared/ui/` | Create |
| `shared/patterns/` | Create |
| `shared/hooks/` | Create |
| `shared/lib/` | Create |
| `shared/utils/` | Create |

## Architecture placeholders (keep)

| Path | Status | Note |
|------|--------|------|
| `packages/` | Empty scaffold | Documented unused for MVP |
| `infrastructure/` | Empty scaffold | Deploy/CI adapters placeholder |
| `scripts/` | Empty scaffold | Keep |
| `modules/platform/` | Scaffold | Target for supabase clients |

## App surface

| Path | Status |
|------|--------|
| `app/layout.tsx` | Minimal — no providers |
| `app/page.tsx` | Placeholder landing |
| `app/(product)/{home,money,plan,inbox,together,health}` | Thin stub pages |
| `app/api/v1/` | README + gitkeep |
| `app/auth/` | README + gitkeep |
| `app/globals.css` | Placeholder — migrate tokens to `styles/` |
| `proxy.ts` | Empty stub |

## Obsolete / empty cleanup

| Finding | Decision |
|---------|----------|
| Empty folders under modules | Keep `.gitkeep` scaffolds — Architecture BC tree |
| Duplicate product trees at root | None — legacy retired |
| Temporary folders | None found |

## Forbidden growth

| Path | Rule |
|------|------|
| `components/` | Legacy alias only — no new files |
| `archive/` | Read-only |
| `ai-os/` | Do not regenerate; exclude from product TS |
