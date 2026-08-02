---
document: Code Review Checklists
developer_constitution: v1.1.0
status: OFFICIAL_IMPLEMENTATION_CONSTITUTION
run_id: run_developer_constitution_20260802T151500Z
created_at: 2026-08-02T15:15:00Z
board: Developer Constitution Board
frozen: true
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
screen_blueprints_sot: artifacts/screen-blueprints/CURRENT
implementation_plan_sot: artifacts/implementation-plan/CURRENT
rewrite_readiness_sot: artifacts/rewrite-readiness/CURRENT
---

# Code Review Checklists

## Architecture Checklist

- [ ] Changes respect `modules/*` BC boundaries
- [ ] No forbidden cross-module imports
- [ ] UI does not touch Supabase / infrastructure
- [ ] API has DTO + validation + authz + error mapping + audit when required
- [ ] RLS assumptions preserved

## React Checklist

- [ ] Functional components only
- [ ] No deep prop drilling
- [ ] Composition used appropriately
- [ ] No components defined inside components
- [ ] Client components minimized

## Next.js Checklist

- [ ] Server Components by default
- [ ] Data loading near route boundaries
- [ ] Server Actions / route handlers authorize server-side
- [ ] No unnecessary client fetch waterfalls

## TypeScript Checklist

- [ ] Strict-safe; no `any`
- [ ] Public APIs explicitly typed
- [ ] Discriminated unions for results/errors where appropriate

## Design Checklist

- [ ] Tokens only; no hardcoded visual values
- [ ] HeroUI + Phosphor only
- [ ] AppViewport 440px preserved; no sidebar
- [ ] Primitives in `shared/ui`; features in `features/*`
- [ ] Matches Screen Blueprints / DS IDs

## Accessibility Checklist

- [ ] WCAG AA
- [ ] Keyboard + focus visible
- [ ] Labels / reduced motion

## Security Checklist

- [ ] Zod validation server-side
- [ ] No secrets in client
- [ ] Authz + audit on sensitive ops
- [ ] Idempotency on money mutations

## Testing Checklist

- [ ] Unit + integration as required
- [ ] AC/story mapping present
- [ ] E2E for critical journeys touched

## Performance Checklist

- [ ] No deep nested fetches
- [ ] Lists virtualized when long
- [ ] Client islands scoped

## Coding Standards Checklist

- [ ] No magic strings (routes, storage/query/mutation keys, statuses, roles, flags, cookies, locales — see [Coding Standards / magic-string-policy.md](../../coding-standards/CURRENT/magic-string-policy.md))
- [ ] No duplicated literals / interfaces / utilities
- [ ] No `rounded-[var(--radius-*)]` or unjustified arbitrary Tailwind values
- [ ] No new `any`; no unjustified native `enum`
- [ ] No relative import deeper than 2 levels
- [ ] Full gate: [Coding Standards / review-checklist.md](../../coding-standards/CURRENT/review-checklist.md)

## Review Checklist (meta)

- [ ] Constitution obeyed
- [ ] Frozen SoTs not redesigned
- [ ] No root `components/` growth
- [ ] Import graph legal
