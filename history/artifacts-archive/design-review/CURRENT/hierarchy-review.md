---
document: Hierarchy Review
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

# Hierarchy Review

## Problems
1. Auth screens fight Heading variants with one-off `text-2xl`.
2. Welcome = EmptyState → same visual language as product empty → brand moment diluted.
3. Chrome elevation competes with content.

## Fixes (visual only)
1. Use Heading level tokens; auth titles `level={1}` without downsizing, or intentional `level={2}` for form pages.
2. Welcome: dedicated layout (still same strings) — larger title, secondary tagline, CTA stack — not EmptyState pattern.
3. Soften TopAppBar / BottomNav elevation so content owns hierarchy.
