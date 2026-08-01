# Consistency Audit

**Run:** `run_spec_evolution_20260801T134000Z`  
**Created:** 2026-08-01T13:39:19Z  
**Mode:** Report-only (originals unchanged)

## Findings summary

| Check | Result |
|-------|--------|
| Duplicated features | 0 groups |
| Duplicated requirements | 0 groups |
| requirement_id collisions | 0 |
| Conflicting business rules (soft) | 1 |
| Missing acceptance | 28 |
| Features without requirement | 0 |
| Business rules without requirement | 0 |
| Orphan API specs | 0 |
| Orphan API routes (path not in specs/reqs blob) | 0 |
| Unused domain entities (heuristic) | 0 |
| Unmapped UI pages (heuristic) | 0 |
| Redundant tasks | 0 |

## Missing acceptance (requirements)

- `req-br-amount-positive`
- `req-br-overspend-policy`
- `req-br-month-close-mode`
- `req-ft-household`
- `req-ft-dashboard`
- `req-ft-accounts`
- `req-ft-savings`
- `req-ft-cards`
- `req-ft-assets`
- `req-ft-debts`
- `req-ft-activity`
- `req-ft-goals`
- `req-ft-categories`
- `req-ft-recurring`
- `req-ft-decision-tools`
- `req-ft-settings`
- `req-ft-insights`
- `req-ft-health`
- `req-perm-auth-required`
- `req-perm-household-required`
- `req-perm-page-gate`
- `req-perm-rls-member`
- `req-perm-member-equality`
- `req-perm-admin-settings`
- `req-perm-bootstrap-partner`
- `req-perm-first-member`
- `req-perm-service-role`
- `req-perm-categories-system`

## Soft rule clarifications (do not remove)

- ['br-jar-active']: Active-jar constraint must stay consistent with soft-delete/archive semantics documented in BD soft notes — not a removal, clarify in solution specs.

## Specification smells

- **smell-acceptance-thin**: Acceptance (14) << Requirements (42)
- **smell-severity-skew**: Requirement severity distribution: {'medium': 14, 'unset': 28}

## Architecture smells

- **arch-smell-observability-gap**: Validated specs emphasize domain/API/security; structured product observability (metrics/traces/SLOs) is thin vs 2026 practice.
- **arch-smell-actions-vs-api**: Server Actions + Route Handlers dual surface increases contract sprawl; needs explicit API design standards without changing business rules.

## Machine-readable

See `smells.json`.
