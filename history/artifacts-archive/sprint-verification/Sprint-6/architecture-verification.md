# Architecture Verification — Sprint 6

## Bounded contexts

| BC | Sprint 6 role | Boundary compliance |
|----|---------------|---------------------|
| `modules/health/` | Compute-on-read health scores, insights | **PASS** — leaf reader; no commands |
| `modules/platform/` | RO proxy, AI policy, audit (server-only) | **PASS** — cross-cutting infrastructure |
| Ledger / Plan / Inbox | Upstream fact providers | **PASS** — Health imports queries only |

## DDD layer check

```
UI (app/.../health/*)
  → Health application (getHealthDetail, buildHealthInsights)
    → Ledger / Plan / Inbox application queries (read)
    → Platform ai-policy (pure guards)
```

| Layer violation | Found? |
|-----------------|--------|
| Business logic in UI pages | No — pages render facts + i18n |
| Health importing commands | No — ESLint enforced |
| Health opening Supabase | No — restricted imports |
| Circular dependency | No |
| Platform re-exporting server-only audit | No — comment + separate import path |

## Key architectural decisions (validated)

1. **Health-RO as enforcement layer** (Proxy + lint + scan) vs new BC — **Valid** per execution architecture-review; matches gap-analysis closure at app tier.
2. **AI policy in Platform** — **Correct**; reusable by future inbox/plan assist.
3. **Compute-on-read Health** — **Aligned** with Architecture Definition v2.1 downstream subscriber pattern.

## Gaps vs Technical Spec / traceability

| Artifact | Issue |
|----------|-------|
| `GET /api/v2/health/score` | Not implemented; Next.js RSC reads instead — adapter drift, not a boundary violation |
| `HealthReadOnlyDbContext` (task name) | Delivered as `asReadOnlySupabaseClient` + contract module — naming drift |
| Proxy unused in Health | Defense-in-depth not activated; current architecture avoids Supabase in Health entirely |

## Constitution alignment

| Law | Result |
|-----|--------|
| Fixed BC set (no Health-RO BC invented) | PASS |
| Application service orchestration | PASS |
| No legacy imports | PASS |
| BR-24 zero-write Health | PASS |

## Architecture score contribution

**8.5 / 10** — Clean boundaries; minor traceability/naming drift; unused proxy.
