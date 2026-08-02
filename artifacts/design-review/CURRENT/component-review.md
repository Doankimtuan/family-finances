---
document: Component Review
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

# Component Review

| Component | Verdict | Issue | Visual fix |
|-----------|---------|-------|------------|
| Button | Needs polish | Active scale via `.button` class may not apply to HeroUI root | Ensure press feedback + primary/secondary contrast |
| Input / TextField | Too generic | Thin wrapper; field radius/border/focus not locked | Tokenize field chrome; min-h-11 |
| Textarea / Select | Same as Input | Inherit field polish | Match Input tokens |
| Card | Too flat / generic | No radius/elevation rhythm | `--radius-lg`, soft border, elevation-1 |
| EmptyState | Sparse | No default icon; narrow description | Soft icon well + wider readable measure |
| LoadingState | OK | Mixed var() syntax | Align token class style |
| ErrorState | OK | Heading size can dominate | Tone down level styling |
| TopAppBar | Slightly heavy | Blur + shadow + border | Prefer hairline + softer shadow |
| BottomNavigation | Label too small | `text-[10px]` | `text-[11px]`/`text-xs`; keep IA |
| AuthScreenShell | OK | Can tighten max content width for forms | `max-w` inner column |
| Dialog / Sheet / Toast | Spot-check | Ensure radius/surface elevated | Token surfaces |
| Badge / Avatar / Skeleton | Light use | Keep Calm Ledger | Minor radius consistency |
| ProductStub | Stub-correct | Feels empty | Icon on EmptyState only |
