---
document: Implementation Checklist
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

# Implementation Checklist (Pre-Story STOP Gate)

**Before writing any code for a Story, the agent must verify every item.**

If **any** item fails → **STOP**. Do not implement. Request clarification or complete the missing prerequisite.

## Checklist

| # | Verify | Pass criteria |
|---|--------|---------------|
| 1 | Story selected | Story ID exists in Implementation Plan / active Sprint Planning pack |
| 2 | Requirements understood | Cited `REQ-*` read from Product SoT; no invented requirements |
| 3 | Acceptance Criteria understood | Cited `AC-*` mapped; verifiable outcomes known |
| 4 | Business Rules understood | Cited `BR-*` restated; no renamed rules |
| 5 | Existing reusable components checked | Searched `shared/ui`, `shared/patterns`, Engineering Review `reusable-components.md` |
| 6 | Existing reusable hooks checked | Searched `shared/hooks`, Engineering Review `reusable-hooks.md` |
| 7 | Existing reusable utilities checked | Searched `shared/lib`, `shared/utils`, `shared/i18n` |
| 8 | Existing reusable patterns checked | Searched Engineering Review form/layout patterns + `shared/patterns` |
| 9 | Existing Design Tokens checked | Tokens from Design System / Foundation; no hardcoded visual values planned |
| 9a | Existing constants checked | Searched `modules/*/application/*-constants.ts`, `shared/constants`, `shared/config` for the route/status/key needed before planning a new literal — see [Coding Standards / constants-policy.md](../../coding-standards/CURRENT/constants-policy.md) |
| 10 | Localization ready | Namespaces known; `en` + `vi` path clear per Localization Foundation |
| 11 | Accessibility ready | Keyboard/focus/labels plan for interactive UI; WCAG AA |
| 12 | Dark Mode ready | Token-based theme; next-themes compatible |
| 13 | Mobile-first ready | AppViewport 440px; no sidebar/desktop layout planned |
| 14 | Performance impact reviewed | RSC vs client, list size, split boundaries considered |
| 15 | Security reviewed | Authz, validation, secrets, RLS implications considered |

## Mandatory evidence in PR / agent notes

- Story ID
- REQ / AC / BR citations (or “shell-only / N/A” with reason)
- Reuse search summary (what was found / what will be created and why)
- Confirmation: checklist 1–15 all Pass

## Fail → STOP examples

- Story not in current sprint order
- AC ambiguous
- Duplicate of existing `shared/ui` primitive planned as a new kit
- Hardcoded English strings planned
- Money write offline queue planned (violates BR-15)
- A route/status/key literal planned instead of reusing or adding a [Coding Standards](../../coding-standards/CURRENT/constants-policy.md) constant
