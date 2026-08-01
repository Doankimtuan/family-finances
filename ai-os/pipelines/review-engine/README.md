# Review Engine Pipeline

**Version:** 0.1.1 · **Framework:** 0.8.1 (Board HOLD remediation) · **Reviews not executed**

| Wave | Workers | Produces |
|------|---------|----------|
| 0 | 9 `*-reviewer` | `reviews/<worker_id>/` |
| 1 | `review-orchestrator` | `review-status` + `review-scores` |
| 2 | `final-decision-board` | partitioned `governance-decision` |

Smoke: `npm run aios:review-engine:smoke` · Contract: `contracts/review-engine.md` · RACI: [RACI.md](./RACI.md)
