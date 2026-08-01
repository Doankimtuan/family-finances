# Quality Scores Template

`quality-scores` under `artifacts/scores/`.

## Required

All 9 `entry_kind`s with **`score_value`** (0–1):

overall, architecture, documentation, consistency, completeness, maintainability, extensibility, reliability, confidence

If unscorable: `result=skip`, `score_value=0`, `UNKNOWN:` reason — do not omit the kind.

Optional mirror: `governance/quality/validation-scorecard/` (never overwrite SA `governance/quality/` templates).
