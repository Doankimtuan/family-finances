---
document: Pull Request Template
implementation_governance: v1.1.0
status: OFFICIAL_IMPLEMENTATION_GOVERNANCE
run_id: run_implementation_governance_20260802T153000Z
created_at: 2026-08-02T15:30:00Z
board: Implementation Governance Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
engineering_patterns_sot: artifacts/engineering-review/CURRENT
localization_sot: artifacts/localization/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
---

# Pull Request Template

```markdown
## Story
- Story ID:
- Sprint:
- REQ / AC / BR:

## Pre-story gate
- [ ] implementation-checklist.md all Pass (link/notes)

## Reuse search
- Components checked:
- Hooks checked:
- Utils/patterns checked:
- Decision (reuse/create) + reason:

## Changes
-

## Localization
- [ ] en + vi catalogs updated
- Namespaces:

## Accessibility
- [ ] Keyboard / focus / labels verified

## Security / money
- [ ] Validation + authz server-side
- [ ] BR-15 / idempotency (if applicable)

## Tests
- [ ] Unit / integration / e2e as required
- [ ] AC mapping:

## Reviews
- [ ] Code / Architecture / Business / UI / A11y / i18n / Security / Performance

## Constitution / Governance
- [ ] No SoT redesign
- [ ] Folder + import rules obeyed
- [ ] DoD satisfied
- [ ] Coding Standards v1.0.0 review-checklist.md: Pass (or pre-existing debt cited from audit-report.md)
```
