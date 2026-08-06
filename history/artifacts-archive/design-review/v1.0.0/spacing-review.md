---
document: Spacing Review
design_review: v1.0.0
status: DESIGN_REVIEW_V1
run_id: run_design_review_20260802T061600Z
created_at: 2026-08-02T06:17:22Z
board: Design Director
frozen: true
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
constitution_sot: artifacts/developer-constitution/CURRENT
---

# Spacing Review

| Surface | Before | Target |
|---------|--------|--------|
| Auth shell gap | `--space-5` | Keep; add consistent section rhythm `--space-6` between major blocks |
| Form fields | `--space-4` | Keep; label→control `--space-2` (already) |
| OAuth stack | `--space-3` | Keep tighter than form |
| Product stub | pad `--space-4` | Keep; empty py reduce to `--space-8` with icon |
| Nav | `space-1` padding | Slightly increase horizontal comfort |

4px base grid respected. Prefer tokens over magic numbers.
