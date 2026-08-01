# Review Finding Template

Type: `review-finding` under **`reviews/<worker_id>/`**.

Required: review_id, target, finding, evidence, impact, severity, recommendation, alternative_solution, confidence, traceability, unknowns, source_paths, **folder_mirror**.

- `statement` — one line
- `finding` — detailed rationale
- `impact` — engineering/business effect (not severity enum)

See `pipelines/review-engine/RACI.md` for owned entry_kinds.
