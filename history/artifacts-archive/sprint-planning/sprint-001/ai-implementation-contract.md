# AI Implementation Contract — sprint-001

Binding for any agent implementing stories under this pack.

## Hard rules

1. **One story at a time** — Never multi-story parallel work. Order: `ST-E01-001` → `ST-E01-003` → `ST-E01-002` → `ST-E02-001` → `ST-E02-002` → `ST-E02-003`.
2. **Never redesign** — Follow Design System + Screen Blueprints; no new visual language.
3. **Never edit frozen SoTs** — Do not modify `artifacts/**/CURRENT` of other boards (Product, Architecture, Tech Spec, Design, Blueprints, Implementation Plan, Bootstrap, Localization, Constitution, Rewrite Readiness).
4. **Never invent requirements, business rules, or UI** — If not in SoT / blueprints / this pack, STOP and ask.
5. **Follow** Developer Constitution, Design System, Screen Blueprints, Technical Specification, Architecture Definition.
6. **i18n hard dependency** — Every new user-facing string → `messages/{locale}/*.json` (en + vi).
7. **No archive imports** — Never import from `archive/legacy-v1` or other archive paths.
8. **Ambiguity → STOP and ask** — Do not guess BR/AC/REQ meaning.
9. **E01 = verify/gap-close** — Do not rebuild shell from scratch.
10. **AC-002 scope** — Fail-closed membership for money actions only; do not build S2 onboard wizard.
11. **Env missing → STOP** — Do not fake Auth when Supabase env is unavailable.
12. **Quality gates** — Pass per-story gates before advancing.

## Allowed edits (implementation phase)

- Application code under `app/`, `shared/`, `modules/`, `messages/`, `i18n/`, `styles/`, tests, config as required by stories
- `supabase/` only if Tech Spec / Architecture **requires** a migration for S1 scope (default: Auth session needs none)

## Forbidden edits

- This sprint-planning freeze pack after `frozen: true` (unless a new board revision is explicitly opened)
- Other boards’ frozen CURRENT packs
- `archive/`

## Citation

Prefer linking SoT paths over copying content.
