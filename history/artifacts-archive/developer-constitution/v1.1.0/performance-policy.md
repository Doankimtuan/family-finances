---
document: Performance Policy
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

# Performance Policy

1. Lazy load feature modules where route-level splitting helps.
2. Optimize images (Next.js Image; correct sizes).
3. Avoid unnecessary re-renders; keep client islands small.
4. Virtualize long lists.
5. Use Suspense where appropriate for streaming shells.
6. Target Core Web Vitals as release gate guidance: LCP < 2.5s, INP < 200ms, CLS < 0.1 (inside AppViewport experience).
7. Do not fetch in deep leaves; load near route boundaries.
