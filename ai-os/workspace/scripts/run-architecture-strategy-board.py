#!/usr/bin/env python3
"""Architecture Strategy Board — candidates only; no final architecture decision."""
from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
AIOS = ROOT / "ai-os"
ART = AIOS / "artifacts"
RUN_ID = "run_architecture_strategy_20260801T150000Z"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
PD = "artifacts/product-definition/CURRENT"
VERSION_NOTE = "Product Definition v2.0.0 OFFICIAL SoT"


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text if text.endswith("\n") else text + "\n", encoding="utf-8")


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def hdr(title: str) -> str:
    return f"""---
generated_by: Architecture Strategy Board
run_id: {RUN_ID}
created_at: {NOW}
product_sot: {PD}
status: STRATEGY_ONLY
final_architecture_decision: false
implementation_architecture: false
---

# {title}

"""


def main() -> None:
    pd = ROOT / PD
    if not (pd / "Product-Definition-v2.md").exists():
        raise SystemExit("Product Definition CURRENT missing")
    pkg = json.loads((ROOT / "package.json").read_text())

    out = ART / "architecture-strategy" / "runs" / RUN_ID
    pub = ROOT / "artifacts" / "architecture-strategy" / "runs" / RUN_ID

    docs: dict[str, str] = {}

    docs["Architecture-Strategy-Report.md"] = hdr("Architecture Strategy Report") + f"""## Mandate

Serve **{VERSION_NOTE}**. Architecture follows product contexts (Tenancy, Real Ledger, Intention Plan, Insight) and IA (Home / Money / Plan / Inbox / Together). Legacy V1 code is evidence, not destiny.

## Legacy snapshot (current)

| Area | Today |
|------|-------|
| App | Next.js {pkg['dependencies'].get('next')} App Router + React {pkg['dependencies'].get('react')} |
| Auth/DB | Supabase SSR (`proxy.ts`) + Postgres/RLS |
| Mutations | Server Actions dominant + some `app/api` Route Handlers |
| Client state | TanStack Query + Zustand |
| Validation | Zod |
| UI | Tailwind 4 + Radix/shadcn-style |
| Domains | `lib/*` modules (jars, server, supabase, …) colocated with `app/*` routes |
| Control plane | `ai-os/` co-located (not product runtime) |

## Strategic findings

1. **Product rewrite needs clearer module boundaries** — V1 hubs map poorly to Home/Money/Plan/Inbox/Together; domain logic is usable but IA coupling is high.
2. **Dual mutation surfaces** (Actions + API routes) increase contract sprawl — Strategy Decision Board already flagged this.
3. **Bounded contexts exist in knowledge** (ledger vs jars vs tenancy) but are not enforced as deployable/module seams.
4. **5-year needs** from Product SoT: partner collaboration, Inbox scale, Health/insights, Phase-2 AI assist, Future wealth/offline-read — without offline writes.
5. **Keep what works:** Supabase RLS tenancy, SSR session proxy, Zod, RSC-friendly Next — unless a candidate explicitly replaces them.

## Analysis dimensions covered

Module/domain boundaries · BCs · FE/BE · API · DB · cache · authn/z · events · state · errors · observability · deploy · scale · maintainability · DX · testing · CI/CD · security

## Explicit non-actions

- **No final architecture selection** in this run  
- **No implementation architecture** (no folder trees as binding SoT, no ADR ratification)  
- Stop after strategy pack  

See sibling documents for candidates, tech options, trade-offs, migration, risks, and a non-binding recommendation summary.
"""

    docs["Architecture-Candidates.md"] = hdr("Architecture Candidates") + """## Candidate A — Simple (Evolve the modular monolith)

**Shape:** Remain a single Next.js deployable. Re-slice UI by product IA. Keep Supabase as BaaS (Auth+Postgres+RLS). Concentrate domain logic in clear packages inside the repo (`tenancy`, `ledger`, `plan`, `inbox`, `health`). Prefer Server Actions for app mutations; keep minimal Route Handlers for read APIs already used by the dashboard.

**Benefits**
- Fastest path to MVP IA rewrite
- Lowest ops burden
- Preserves working auth/RLS investment
- Team already fluent

**Trade-offs**
- Harder to scale independent workloads (insights/AI later)
- API-for-mobile still secondary
- Risk of UI↔domain leakage without discipline

**Complexity:** Low  
**Migration cost:** Low–Medium (re-nav + package seams; strangler Inbox over review queue)  
**Long-term maintainability:** Medium (depends on package discipline)  
**Operational cost:** Low  
**Learning curve:** Low  

**Best if:** Small team, MVP urgency, one web client for 1–2 years.

---

## Candidate B — Balanced (Modular monolith + explicit application services + optional workers)

**Shape:** Same Next+Supabase core as A, but enforce **hexagonal-ish application services** per bounded context (commands/queries). Introduce a thin **BFF/API layer** (`/api/v1` or tRPC/oRPC) shared by web and future clients. Extract **async jobs** (Health scoring, insight generation, notification fan-out) to a worker (Supabase Edge Functions, Inngest, Trigger.dev, or a small Node worker) with an outbox/events table.

**Benefits**
- Matches Product SoT contexts cleanly
- Ready for Phase-2 AI/approvals without rewriting MVP
- Better testability at service boundaries
- Controlled path to multi-client

**Trade-offs**
- More upfront design than A
- Worker/event infra to run and observe
- Slightly higher cognitive load

**Complexity:** Medium  
**Migration cost:** Medium (service extraction + event outbox + API facade; strangler from Actions)  
**Long-term maintainability:** High  
**Operational cost:** Medium  
**Learning curve:** Medium  

**Best if:** Plan for 3–5 years on one primary cloud, Phase-2 AI/Inbox load, possible second client.

---

## Candidate C — Highly Scalable (Service-oriented product platform)

**Shape:** Split deployables by bounded context over 5 years: **Identity/Tenancy**, **Ledger**, **Plan/Inbox**, **Insight/AI**, each with own API and data ownership (still Postgres initially via schemas or separate DBs). Edge BFF for web. Event bus (e.g. queue + pub/sub) for cross-context integration. CDN + regional read replicas as needed. Mobile BFF optional.

**Benefits**
- Independent scale/release for insights/AI and ledger
- Strongest isolation for security blast radius
- Clearest long-term team scaling

**Trade-offs**
- Highest complexity and migration cost from V1
- Distributed transactions / saga complexity around Month Ritual & allocations
- Overkill for current household scale if adopted immediately

**Complexity:** High  
**Migration cost:** High  
**Long-term maintainability:** High *if* platform investment sustained; otherwise brittle  
**Operational cost:** High  
**Learning curve:** High  

**Best if:** Multi-team, multi-client, heavy async insight/AI, growth beyond single-app ops within ~2 years.

---

## Mapping to Product Definition contexts

| Context | Candidate A | Candidate B | Candidate C |
|---------|-------------|-------------|-------------|
| Tenancy | module | module + services | Identity service |
| Real Ledger | module | module + services | Ledger service |
| Intention Plan / Inbox | module | module + services + jobs | Plan/Inbox service |
| Insight / Health | module (sync) | worker jobs | Insight service |
"""

    docs["Technology-Recommendation.md"] = hdr("Technology Recommendation") + f"""## Guidance posture

Recommendations below are **board preferences for evaluation**, not ratified ADRs. Final choice belongs to a later Architecture Decision Board.

## Baseline preference (biased to Candidate B, compatible with A)

| Concern | Recommendation | Notes |
|---------|----------------|-------|
| Frontend framework | **Next.js App Router (React 19)** | Already in stack ({pkg['dependencies'].get('next')}); RSC fits Home/Money |
| Backend framework | **Next server (Actions + Route Handlers) → evolve to app services** | Avoid greenfield Nest/Go for MVP unless choosing C now |
| Database | **Postgres via Supabase** | RLS aligns with household tenancy (BR-02a) |
| ORM / data access | **Supabase client + selective SQL; optional Drizzle for typed server repos** | Don't mandate Prisma rewrite for MVP |
| Authentication | **Supabase Auth SSR + proxy session refresh** | Keep; harden per Decision Board security overlays |
| State management | **RSC + TanStack Query + limited Zustand** | Server truth first; Zustand for ephemeral UI |
| API style | **A:** Actions-first · **B:** typed HTTP/RPC facade (`/api/v1` or oRPC) · **C:** per-service REST/gRPC | Product SoT forbids offline writes; online JSON/RPC fine |
| Validation | **Zod** (shared DTOs) | Keep |
| Testing | **Vitest/Jest unit · Playwright e2e · contract tests on services** | Align with Decision Board testing overlay |
| Deployment | **Vercel (or equivalent) for web · Supabase managed DB** | Simple ops for A/B |
| Infrastructure | **Managed first**; IaC (Terraform/Pulumi) when choosing C or multi-env rigor |
| Monitoring | **OpenTelemetry + vendor (e.g. Axiom/Datadog/Sentry)** | Product needs mutation/error visibility |
| Logging | **Structured JSON logs with request/household ids** | Never log secrets/PII raw |
| Analytics | **Product analytics (PostHog/etc.) separate from ops metrics** | KPIs: dual engagement, Inbox zero, ritual |
| Package manager | **npm or bun** (repo has both lock artifacts historically) — pick one as standard |
| Monorepo strategy | **A/B:** single app + `packages/*` domains · **C:** apps + services monorepo (Turborepo/pnpm) |
| Folder structure strategy | Slice by **bounded context + product surface**, not by V1 route hubs | e.g. `modules/plan`, `modules/inbox`, `app/(product)/...` |

## Mobile

Product SoT is web-first. Mobile Architect note: keep domain/API portable (Candidate B/C); do **not** invent React Native MVP unless roadmap changes.

## Explicit rejects for MVP (strategy advice)

- Microservices on day one (C immediate) without team/platform readiness  
- Replacing Supabase Auth mid-rewrite  
- Offline-first local DB (conflicts with BR-15 / offline writes ban)  
"""

    docs["Trade-off-Matrix.md"] = hdr("Trade-off Matrix") + """| Criterion (1–5, higher=better unless noted) | A Simple | B Balanced | C Scalable |
|---------------------------------------------|---------:|-----------:|-----------:|
| Time to Product MVP IA | 5 | 4 | 2 |
| Fit to bounded contexts | 3 | 5 | 5 |
| 5-year extensibility (AI/Inbox/multi-client) | 2 | 4 | 5 |
| Operational simplicity | 5 | 3 | 1 |
| Security isolation | 3 | 4 | 5 |
| DX for current team | 5 | 4 | 2 |
| Migration cost from V1 (higher=worse) | 2 | 3 | 5 |
| Cost at small scale (higher=worse) | 1 | 2 | 4 |
| Risk of over-engineering MVP | Low | Medium | High |
| Risk of under-investing for 5y | High | Medium | Low |

## Reading

- Optimize for **near-term Product Definition MVP** → lean A or B  
- Optimize for **declared Phase-2 AI + durable seams** → lean B  
- Optimize for **multi-team platform** → plan C as target, do not cut over immediately  
"""

    docs["Migration-Strategy.md"] = hdr("Migration Strategy") + """## Principles

1. Product SoT drives UI/IA first; storage can strangler.  
2. Never break real≠virtual or RLS tenancy during moves.  
3. No offline write paths.  
4. Prefer expand/contract over big-bang.

## Shared strangler sequence (applies to A/B; C extends)

### Phase M0 — Align to IA
- Re-route navigation to Home/Money/Plan/Inbox/Together  
- Introduce Inbox UI over existing `jar_review_queue`  
- Progressive onboarding without schema freeze

### Phase M1 — Domain packages
- Extract `tenancy`, `ledger`, `plan`, `inbox`, `health` modules with clear public APIs  
- Stop cross-importing UI into domain

### Phase M2 — Contracts
- Unify error envelopes / request ids (Decision Board IMP-002)  
- Catalog Actions vs Route Handlers; freeze DTOs in Zod

### Phase M3 — Async (Candidate B+)
- Outbox for Health/insights/notifications  
- Worker processes read models for Home/Health

### Phase M4 — Service split (Candidate C only)
- Separate deployables per BC when metrics justify (CPU/queue depth/team ownership)  
- Introduce integration events for Month Ritual & allocation outcomes  

## Data migration

- Prefer additive columns/views for Inbox/Health  
- Month Ritual is product name over month-close runs — map, don't rename recklessly mid-flight  

## Rollback

- Feature-flag IA surfaces  
- Keep legacy routes as redirects until Inbox parity  
"""

    docs["Risk-Assessment.md"] = hdr("Risk Assessment") + """| Risk | A | B | C | Mitigation |
|------|---|---|---|------------|
| IA rewrite stalls in hub sprawl | Med | Low | Low | Strict nav blueprint from Product SoT |
| Dual Actions/API drift | High | Med | Low | Contract catalog + one facade direction |
| Distributed Month Ritual inconsistency | N/A | Low | High | Saga/outbox; defer C until needed |
| Over-engineering delays MVP | Low | Med | High | Timebox B; forbid C cutover pre-MVP |
| Auth rewrite regression | Med | Med | High | Keep Supabase SSR; harden, don't replace |
| PII in logs/analytics | Med | Med | Med | Redaction policy + household-scoped IDs |
| AI Phase-2 couples into ledger writes | Med | Med | Med | BR-14 enforcement; no AI mutator without policy path |
| Team skill gap on events/services | Low | Med | High | Training; start with managed workers |
"""

    docs["Recommendation-Summary.md"] = hdr("Recommendation Summary (Non-Binding)") + """## Board leaning (NOT a final decision)

**Prefer Candidate B — Balanced** as the strategic target for a 5-year household finance product that must absorb Inbox load, Health scoring, and Phase-2 AI without premature microservices.

**Execute MVP closer to Candidate A tactics** (single deployable, fast IA strangler) **while laying Candidate B seams** (domain packages, app services, Zod contracts, optional worker spike for Health).

**Do not select Candidate C for immediate implementation** unless org constraints (multi-team, multi-client SLAs) appear; keep C as an evolutionary end-state from B's service boundaries.

## Why this leaning

- Matches Product Definition bounded contexts and roadmap (MVP now, AI Phase 2, Wealth/offline-read Future)  
- Controls migration cost vs V1 Next+Supabase reality  
- Avoids both under-investment (pure A forever) and over-investment (C now)

## Required follow-up (out of scope here)

A separate **Architecture Decision Board** must:

1. Ratify A/B/C (or hybrid)  
2. Publish ADRs + implementation architecture  
3. Freeze target folder/API standards  

## Stop

Architecture Strategy Board ends here — **no final decision, no implementation architecture.**
"""

    # Index
    docs["README.md"] = hdr("Architecture Strategy Pack") + """## Contents

1. Architecture-Strategy-Report.md  
2. Architecture-Candidates.md  
3. Technology-Recommendation.md  
4. Trade-off-Matrix.md  
5. Migration-Strategy.md  
6. Risk-Assessment.md  
7. Recommendation-Summary.md  

**Status:** Strategy only. Not SoT. Not ADRs.
"""

    meta = {
        "run_id": RUN_ID,
        "created_at": NOW,
        "product_sot": PD,
        "final_architecture_decision": False,
        "implementation_architecture": False,
        "candidates": ["A-Simple", "B-Balanced", "C-Highly-Scalable"],
        "non_binding_leaning": "B-with-A-tactics-for-MVP",
        "documents": sorted(docs.keys()),
    }

    for name, body in docs.items():
        write(out / name, body)
    write_json(out / "manifest.json", meta)

    if pub.exists():
        shutil.rmtree(pub)
    shutil.copytree(out, pub)
    write(
        ROOT / "artifacts" / "architecture-strategy" / "README.md",
        f"# Architecture Strategy\n\nLatest: `runs/{RUN_ID}/`\n\nStrategy only — no final architecture decision.\n",
    )

    ckpt = {
        "schema_version": "1.0.0",
        "checkpoint_id": f"ckpt_{RUN_ID}",
        "stage": "architecture-strategy-board",
        "run_id": RUN_ID,
        "created_at": NOW,
        "result": "COMPLETE",
        "final_architecture_decision": False,
        "implementation_architecture": False,
        "outputs": f"ai-os/artifacts/architecture-strategy/runs/{RUN_ID}/",
        "execution_status": "completed",
        "stop": True,
    }
    write_json(AIOS / "workspace" / "checkpoints" / f"ckpt_{RUN_ID}.json", ckpt)
    write_json(AIOS / "workspace" / "checkpoints" / "LATEST_ARCHITECTURE_STRATEGY.json", ckpt)
    write(
        AIOS / "workspace" / "runs" / RUN_ID / "ARCHITECTURE_STRATEGY_REPORT.md",
        docs["Architecture-Strategy-Report.md"],
    )
    write(
        ART / "reports" / "runs" / RUN_ID / "ARCHITECTURE_STRATEGY_REPORT.md",
        docs["Architecture-Strategy-Report.md"],
    )

    print(json.dumps({"run_id": RUN_ID, "docs": len(docs), "decision": False, "leaning": meta["non_binding_leaning"]}, indent=2))


if __name__ == "__main__":
    main()
