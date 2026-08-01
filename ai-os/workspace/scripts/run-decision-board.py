#!/usr/bin/env python3
"""Product Evolution Decision Board — decide Spec v2 inclusions (read-only on specs)."""
from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
AIOS = ROOT / "ai-os"
ART = AIOS / "artifacts"
EVO = "run_spec_evolution_20260801T134000Z"
RUN_ID = "run_decision_board_20260801T135000Z"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# Cost dimensions are "higher = worse" for composite formula
# Composite = 0.15B + 0.15U + 0.10DX + 0.10LT + 0.10R26 - 0.10Maint - 0.10Impl - 0.10Migr - 0.10Risk

DECISIONS = {
    "IMP-001": {
        "verdict": "APPROVE",
        "why": "Highest leverage for verified delivery; closes thin acceptance gap; low risk; no business-rule change.",
        "modifications": None,
        "scores": {
            "business_value": 88,
            "user_value": 70,
            "developer_experience": 92,
            "maintenance_cost": 35,
            "implementation_cost": 30,
            "migration_complexity": 20,
            "risk": 15,
            "long_term_value": 90,
            "relevance_2026": 85,
        },
    },
    "IMP-009": {
        "verdict": "APPROVE",
        "why": "Cheap architecture clarification protecting br-jar-active vs soft-delete/archive; prevents implementation drift.",
        "modifications": None,
        "scores": {
            "business_value": 80,
            "user_value": 55,
            "developer_experience": 85,
            "maintenance_cost": 20,
            "implementation_cost": 25,
            "migration_complexity": 15,
            "risk": 20,
            "long_term_value": 75,
            "relevance_2026": 70,
        },
    },
    "IMP-002": {
        "verdict": "APPROVE WITH MODIFICATIONS",
        "why": "Uniform errors improve DX and clients, but blanket idempotency on all routes is unnecessary complexity for a single Next client.",
        "modifications": "Approve uniform error envelope + request-id on all JSON routes. Limit idempotency-key to mutating savings/transactions routes only; do not require on GETs or all handlers.",
        "scores": {
            "business_value": 65,
            "user_value": 60,
            "developer_experience": 88,
            "maintenance_cost": 40,
            "implementation_cost": 45,
            "migration_complexity": 40,
            "risk": 35,
            "long_term_value": 80,
            "relevance_2026": 82,
        },
    },
    "IMP-005": {
        "verdict": "APPROVE",
        "why": "Documentation/catalog only; reduces dual-surface sprawl without runtime rewrite or breaking changes.",
        "modifications": None,
        "scores": {
            "business_value": 70,
            "user_value": 40,
            "developer_experience": 90,
            "maintenance_cost": 30,
            "implementation_cost": 35,
            "migration_complexity": 25,
            "risk": 20,
            "long_term_value": 88,
            "relevance_2026": 78,
        },
    },
    "IMP-003": {
        "verdict": "APPROVE",
        "why": "Closes 2026 accessibility gap (score 55); high user value; overlay ACs do not invent business features.",
        "modifications": None,
        "scores": {
            "business_value": 75,
            "user_value": 92,
            "developer_experience": 70,
            "maintenance_cost": 45,
            "implementation_cost": 50,
            "migration_complexity": 35,
            "risk": 25,
            "long_term_value": 85,
            "relevance_2026": 95,
        },
    },
    "IMP-010": {
        "verdict": "APPROVE",
        "why": "Stable user-facing error taxonomy improves UX/support without changing ledger semantics.",
        "modifications": None,
        "scores": {
            "business_value": 68,
            "user_value": 85,
            "developer_experience": 80,
            "maintenance_cost": 40,
            "implementation_cost": 40,
            "migration_complexity": 35,
            "risk": 25,
            "long_term_value": 78,
            "relevance_2026": 80,
        },
    },
    "IMP-004": {
        "verdict": "APPROVE",
        "why": "Critical 2026 gap (observability 40 / logging 35); enables safe ops for validated automation without new business modes.",
        "modifications": None,
        "scores": {
            "business_value": 82,
            "user_value": 50,
            "developer_experience": 88,
            "maintenance_cost": 50,
            "implementation_cost": 55,
            "migration_complexity": 45,
            "risk": 35,
            "long_term_value": 92,
            "relevance_2026": 95,
        },
    },
    "IMP-007": {
        "verdict": "APPROVE",
        "why": "Testing overlay proves BR constraints hold; justified cost vs regression risk on allocation/month-close.",
        "modifications": None,
        "scores": {
            "business_value": 85,
            "user_value": 55,
            "developer_experience": 90,
            "maintenance_cost": 45,
            "implementation_cost": 55,
            "migration_complexity": 40,
            "risk": 30,
            "long_term_value": 92,
            "relevance_2026": 88,
        },
    },
    "IMP-006": {
        "verdict": "APPROVE WITH MODIFICATIONS",
        "why": "Security hardening is warranted, but broad rate limits can harm legitimate household use and add operational noise.",
        "modifications": "Approve CSP + admin privileged-action audit. Scope rate limits to auth endpoints and sensitive mutations first; do not apply blanket limits to all reads.",
        "scores": {
            "business_value": 78,
            "user_value": 60,
            "developer_experience": 65,
            "maintenance_cost": 50,
            "implementation_cost": 55,
            "migration_complexity": 50,
            "risk": 45,
            "long_term_value": 85,
            "relevance_2026": 90,
        },
    },
    "IMP-008": {
        "verdict": "APPROVE WITH MODIFICATIONS",
        "why": "API budgets protect dashboard/jars UX; full CWV program is disproportionate cost for Spec v2.",
        "modifications": "Approve API latency/payload budgets for dashboard, jars spending, and savings routes. Defer full Core Web Vitals program outside Spec v2 critical path.",
        "scores": {
            "business_value": 70,
            "user_value": 75,
            "developer_experience": 72,
            "maintenance_cost": 40,
            "implementation_cost": 45,
            "migration_complexity": 35,
            "risk": 30,
            "long_term_value": 75,
            "relevance_2026": 80,
        },
    },
    "IMP-015": {
        "verdict": "APPROVE WITH MODIFICATIONS",
        "why": "Privacy ops runbooks add value within existing household tenancy; new admin product UI is unjustified scope for v2.",
        "modifications": "Approve documentation/runbooks only. Defer any new admin export/delete product UI or tools.",
        "scores": {
            "business_value": 72,
            "user_value": 55,
            "developer_experience": 60,
            "maintenance_cost": 35,
            "implementation_cost": 30,
            "migration_complexity": 25,
            "risk": 25,
            "long_term_value": 70,
            "relevance_2026": 75,
        },
    },
    "IMP-011": {
        "verdict": "DEFER",
        "why": "Major consolidate increases architectural risk and migration complexity before catalog+tests prove hotspots; little immediate Spec v2 need.",
        "modifications": None,
        "revisit_when": "After IMP-005 and IMP-007 land and duplicate validation paths are measured as hotspots.",
        "reject_or_defer_reasons": [
            "architectural risk",
            "migration complexity",
            "implementation cost not justified for Spec v2 adoption",
        ],
        "scores": {
            "business_value": 55,
            "user_value": 30,
            "developer_experience": 70,
            "maintenance_cost": 55,
            "implementation_cost": 85,
            "migration_complexity": 90,
            "risk": 80,
            "long_term_value": 75,
            "relevance_2026": 65,
        },
    },
    "IMP-012": {
        "verdict": "DEFER",
        "why": "API path versioning is premature for a single Next.js client; little business value now; risks churn without external consumers.",
        "modifications": None,
        "revisit_when": "External/mobile clients need stable public API contracts beyond the Next app.",
        "reject_or_defer_reasons": [
            "little business value",
            "unnecessary complexity",
            "premature / trend for single-client app",
        ],
        "scores": {
            "business_value": 35,
            "user_value": 25,
            "developer_experience": 55,
            "maintenance_cost": 60,
            "implementation_cost": 70,
            "migration_complexity": 75,
            "risk": 55,
            "long_term_value": 60,
            "relevance_2026": 50,
        },
    },
    "IMP-013": {
        "verdict": "DEFER",
        "why": "Assistive insights UX is nice-to-have; weak urgency vs foundations; avoid trend-led scope expansion.",
        "modifications": None,
        "revisit_when": "After acceptance, a11y, and observability baselines are adopted and insights surfaces show clear UX friction.",
        "reject_or_defer_reasons": [
            "little immediate business value vs foundations",
            "risk of trend-chasing AI UX",
        ],
        "scores": {
            "business_value": 45,
            "user_value": 65,
            "developer_experience": 50,
            "maintenance_cost": 50,
            "implementation_cost": 60,
            "migration_complexity": 45,
            "risk": 40,
            "long_term_value": 55,
            "relevance_2026": 60,
        },
    },
    "IMP-014": {
        "verdict": "REJECT",
        "why": "Offline cache near ledger/dashboard creates stale-data and architectural risk for little business value in an online household app; fails cost/risk test.",
        "modifications": None,
        "reject_or_defer_reasons": [
            "architectural risk near ledger domain",
            "unnecessary complexity",
            "little business value",
            "implementation cost not justified",
        ],
        "scores": {
            "business_value": 25,
            "user_value": 40,
            "developer_experience": 35,
            "maintenance_cost": 70,
            "implementation_cost": 80,
            "migration_complexity": 85,
            "risk": 90,
            "long_term_value": 30,
            "relevance_2026": 40,
        },
    },
}

PRIORITY_ORDER = [
    "IMP-001",
    "IMP-009",
    "IMP-002",
    "IMP-005",
    "IMP-003",
    "IMP-010",
    "IMP-004",
    "IMP-007",
    "IMP-006",
    "IMP-008",
    "IMP-015",
]


def write(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        path.write_text(data, encoding="utf-8")
    else:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def composite(s: dict) -> int:
    raw = (
        0.15 * s["business_value"]
        + 0.15 * s["user_value"]
        + 0.10 * s["developer_experience"]
        + 0.10 * s["long_term_value"]
        + 0.10 * s["relevance_2026"]
        - 0.10 * s["maintenance_cost"]
        - 0.10 * s["implementation_cost"]
        - 0.10 * s["migration_complexity"]
        - 0.10 * s["risk"]
    )
    return int(max(0, min(100, round(raw))))


def main() -> None:
    imps_path = ART / "improvement-analysis" / "runs" / EVO / "improvements.json"
    if not imps_path.exists():
        raise SystemExit(f"Missing improvements: {imps_path}")
    imps_data = json.loads(imps_path.read_text(encoding="utf-8"))
    imps = {i["id"]: i for i in imps_data["improvements"]}
    if set(imps) != set(DECISIONS):
        missing = set(imps) - set(DECISIONS)
        extra = set(DECISIONS) - set(imps)
        raise SystemExit(f"IMP mismatch missing={missing} extra={extra}")

    # Hash attest read-only sources (must remain unchanged by this script)
    protect = [
        f"ai-os/artifacts/business/runs/run_business_discovery_20260801T122000Z/payload.json",
        f"ai-os/artifacts/requirements/runs/run_specification_20260801T130500Z/payload.json",
        f"ai-os/artifacts/proposal-v2/runs/{EVO}/SPECIFICATION_V2_PROPOSAL.md",
        f"ai-os/artifacts/improvement-analysis/runs/{EVO}/improvements.json",
        "ai-os/artifacts/final/PRD.md",
    ]
    hashes_before = {
        p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in protect if (ROOT / p).exists()
    }

    out = ART / "decision-board" / "runs" / RUN_ID
    out.mkdir(parents=True, exist_ok=True)

    approved_verdicts = {"APPROVE", "APPROVE WITH MODIFICATIONS"}
    evaluations = []

    for iid, card in sorted(imps.items()):
        d = DECISIONS[iid]
        score = composite(d["scores"])
        deps = card.get("depends_on") or []
        deps_status = []
        for dep in deps:
            dv = DECISIONS[dep]["verdict"]
            deps_status.append(
                {
                    "id": dep,
                    "verdict": dv,
                    "approved_for_v2": dv in approved_verdicts,
                }
            )
        ev = {
            "id": iid,
            "title": card["title"],
            "bucket": card["bucket"],
            "evolution_priority": card.get("priority"),
            "depends_on": deps,
            "dependency_status": deps_status,
            "scores": {
                **d["scores"],
                "dependency_note": "See dependency_status; composite excludes binary dep gate.",
            },
            "composite_score": score,
            "verdict": d["verdict"],
            "why": d["why"],
            "modifications": d.get("modifications"),
            "revisit_when": d.get("revisit_when"),
            "reject_or_defer_reasons": d.get("reject_or_defer_reasons") or [],
            "preserves": {
                "business_rules": True,
                "domain_model": True,
                "validated_requirements": True,
                "accepted_architecture": True,
            },
            "breaking_changes": False,
            "source_imp_card": f"ai-os/artifacts/improvement-analysis/runs/{EVO}/improvements/{iid}.md",
        }
        write(out / "evaluations" / f"{iid}.json", ev)
        evaluations.append(ev)

    by_verdict = {
        "APPROVE": [],
        "APPROVE WITH MODIFICATIONS": [],
        "DEFER": [],
        "REJECT": [],
    }
    for ev in evaluations:
        by_verdict[ev["verdict"]].append(ev)

    # --- approved-improvements.md ---
    approved = by_verdict["APPROVE"] + by_verdict["APPROVE WITH MODIFICATIONS"]
    approved_md = f"""# Approved Improvements (Specification v2)

**Decision Board run:** `{RUN_ID}`  
**Source evolution:** `{EVO}`  
**Created:** {NOW}  
**Constraint:** Specs not modified. Spec v1 remains source of truth until a future adoption run.

## Summary

| ID | Verdict | Score | Title |
|----|---------|------:|-------|
"""
    for ev in sorted(approved, key=lambda e: PRIORITY_ORDER.index(e["id"]) if e["id"] in PRIORITY_ORDER else 99):
        approved_md += f"| `{ev['id']}` | {ev['verdict']} | {ev['composite_score']} | {ev['title']} |\n"

    approved_md += """
## Dimension scores (approved set)

| ID | Biz | User | DX | Maint↓ | Impl↓ | Migr↓ | Risk↓ | LT | 2026 | Score |
|----|----:|-----:|---:|-------:|------:|------:|------:|---:|-----:|------:|
"""
    for ev in sorted(approved, key=lambda e: e["id"]):
        s = ev["scores"]
        approved_md += (
            f"| `{ev['id']}` | {s['business_value']} | {s['user_value']} | {s['developer_experience']} | "
            f"{s['maintenance_cost']} | {s['implementation_cost']} | {s['migration_complexity']} | {s['risk']} | "
            f"{s['long_term_value']} | {s['relevance_2026']} | **{ev['composite_score']}** |\n"
        )

    approved_md += "\n## Decisions\n\n"
    for ev in sorted(approved, key=lambda e: PRIORITY_ORDER.index(e["id"]) if e["id"] in PRIORITY_ORDER else 99):
        approved_md += f"### {ev['id']} — {ev['title']}\n\n"
        approved_md += f"**Verdict:** {ev['verdict']}  \n**Score:** {ev['composite_score']}\n\n"
        approved_md += f"**Why:** {ev['why']}\n\n"
        if ev["modifications"]:
            approved_md += f"**Modifications required:** {ev['modifications']}\n\n"
        approved_md += f"**Dependencies:** {', '.join(f'`{d}`' for d in ev['depends_on']) or 'none'}\n\n"

    approved_md += """## Preserved constraints

- Business rules (BD): unchanged
- Domain model: unchanged
- Validated requirements: unchanged
- Accepted architecture: unchanged
- No breaking API path changes in approved Spec v2 set
"""
    write(out / "approved-improvements.md", approved_md)

    # --- rejected ---
    rejected_md = f"""# Rejected Improvements

**Decision Board run:** `{RUN_ID}`  
**Created:** {NOW}

Improvements below are **not** part of Specification v2.

"""
    for ev in by_verdict["REJECT"]:
        rejected_md += f"## {ev['id']} — {ev['title']}\n\n"
        rejected_md += f"**Verdict:** REJECT  \n**Score:** {ev['composite_score']}\n\n"
        rejected_md += f"**Why:** {ev['why']}\n\n"
        rejected_md += "**Reject reasons:**\n"
        for r in ev["reject_or_defer_reasons"]:
            rejected_md += f"- {r}\n"
        rejected_md += "\n"
        s = ev["scores"]
        rejected_md += (
            f"| Biz | User | DX | Maint | Impl | Migr | Risk | LT | 2026 | Score |\n"
            f"|----:|-----:|---:|------:|-----:|-----:|-----:|---:|-----:|------:|\n"
            f"| {s['business_value']} | {s['user_value']} | {s['developer_experience']} | "
            f"{s['maintenance_cost']} | {s['implementation_cost']} | {s['migration_complexity']} | "
            f"{s['risk']} | {s['long_term_value']} | {s['relevance_2026']} | {ev['composite_score']} |\n\n"
        )
    if not by_verdict["REJECT"]:
        rejected_md += "_None._\n"
    write(out / "rejected-improvements.md", rejected_md)

    # --- deferred ---
    deferred_md = f"""# Deferred Improvements

**Decision Board run:** `{RUN_ID}`  
**Created:** {NOW}

Deferred items may re-enter a later decision cycle. They are **excluded** from Spec v2 now.

"""
    for ev in by_verdict["DEFER"]:
        deferred_md += f"## {ev['id']} — {ev['title']}\n\n"
        deferred_md += f"**Verdict:** DEFER  \n**Score:** {ev['composite_score']}\n\n"
        deferred_md += f"**Why:** {ev['why']}\n\n"
        deferred_md += f"**Revisit when:** {ev.get('revisit_when') or 'TBD'}\n\n"
        deferred_md += "**Defer reasons:**\n"
        for r in ev["reject_or_defer_reasons"]:
            deferred_md += f"- {r}\n"
        deferred_md += "\n"
    write(out / "deferred-improvements.md", deferred_md)

    # --- priority roadmap (approved only) ---
    road_md = f"""# Priority Roadmap (Approved Spec v2 Only)

**Decision Board run:** `{RUN_ID}`  
**Created:** {NOW}  
**Rule:** Dependency-safe order; deferred/rejected removed from critical path.

| Order | ID | Verdict | Score | Depends on (must be approved) |
|------:|----|---------|------:|-------------------------------|
"""
    for idx, iid in enumerate(PRIORITY_ORDER, 1):
        ev = next(e for e in evaluations if e["id"] == iid)
        assert ev["verdict"] in approved_verdicts
        deps = ", ".join(f"`{d}`" for d in ev["depends_on"]) or "—"
        road_md += f"| {idx} | `{iid}` | {ev['verdict']} | {ev['composite_score']} | {deps} |\n"

    road_md += """
## Phase grouping (approved)

1. **Foundations:** IMP-001, IMP-009  
2. **Contracts & errors:** IMP-002 (mod), IMP-005, IMP-003, IMP-010  
3. **Ops quality:** IMP-004, IMP-007, IMP-006 (mod)  
4. **Perf & privacy docs:** IMP-008 (mod), IMP-015 (mod)

## Explicitly out of critical path

- Deferred: IMP-011, IMP-012, IMP-013  
- Rejected: IMP-014  
"""
    write(out / "priority-roadmap.md", road_md)

    # --- approved specification v2 plan ---
    plan_md = f"""# Approved Specification v2 Plan

**Status:** PLAN — NOT ADOPTED AS SYSTEM OF RECORD  
**Decision Board:** `{RUN_ID}`  
**Evolution source:** `{EVO}`  
**Created:** {NOW}

## Attestation

- This board **does not modify** Specification v1, BD, SPEC packs, or Spec Evolution proposal files.
- Spec v1 (`ai-os/artifacts/final/` + frozen packs) remains **source of truth** until a future explicit adoption run.
- **100% business rules, domain model, validated requirements, and accepted architecture preserved.**
- No breaking API path changes are included in the approved set.

## What Spec v2 includes

Overlays / solution improvements with board verdict APPROVE or APPROVE WITH MODIFICATIONS:

"""
    for iid in PRIORITY_ORDER:
        ev = next(e for e in evaluations if e["id"] == iid)
        plan_md += f"### {iid} — {ev['title']}\n\n"
        plan_md += f"- **Verdict:** {ev['verdict']}\n"
        plan_md += f"- **Score:** {ev['composite_score']}\n"
        plan_md += f"- **Why included:** {ev['why']}\n"
        if ev["modifications"]:
            plan_md += f"- **Required modifications:** {ev['modifications']}\n"
        plan_md += "\n"

    plan_md += """## What Spec v2 excludes

### Deferred (post-v2 backlog)

- **IMP-011** — shared domain consolidate (high migration/arch risk)
- **IMP-012** — `/api/v1` versioning (premature for single client)
- **IMP-013** — assistive insights UX (low urgency / trend risk)

### Rejected

- **IMP-014** — offline read-only cache (complexity, ledger-adjacent risk, low business value)

## Non-breaking guarantees

- No removal of validated business rules
- No invented business capabilities
- No mandatory API path renames in v2
- Idempotency, rate limits, and privacy UI scoped per modifications above

## Adoption note

Publishing this plan does **not** replace Spec v1. A separate adoption orchestration is required to merge overlays into authoritative specs.

## Related artifacts

- `approved-improvements.md`
- `rejected-improvements.md`
- `deferred-improvements.md`
- `priority-roadmap.md`
- `evaluations/*.json`
"""
    write(out / "approved-specification-v2-plan.md", plan_md)

    # --- report + decisions index ---
    write(
        out / "decisions.json",
        {
            "run_id": RUN_ID,
            "evolution_run": EVO,
            "created_at": NOW,
            "evaluations": evaluations,
            "counts": {k: len(v) for k, v in by_verdict.items()},
            "priority_order_approved": PRIORITY_ORDER,
        },
    )

    report = f"""# Decision Board Report

**Run:** `{RUN_ID}`  
**Completed:** {NOW}  
**Evolution input:** `{EVO}`

## Counts

| Verdict | Count |
|---------|------:|
| APPROVE | {len(by_verdict['APPROVE'])} |
| APPROVE WITH MODIFICATIONS | {len(by_verdict['APPROVE WITH MODIFICATIONS'])} |
| DEFER | {len(by_verdict['DEFER'])} |
| REJECT | {len(by_verdict['REJECT'])} |

## Outputs

- `approved-improvements.md`
- `rejected-improvements.md`
- `deferred-improvements.md`
- `priority-roadmap.md`
- `approved-specification-v2-plan.md`
- `evaluations/IMP-*.json`

## Protected sources unchanged

"""
    hashes_after = {
        p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in hashes_before
    }
    unchanged = hashes_before == hashes_after
    for p, h in hashes_before.items():
        ok = hashes_after.get(p) == h
        report += f"- `{'OK' if ok else 'CHANGED'}` {p}\n"
    report += f"\n**Originals unchanged:** {unchanged}\n\n## STOP\n\nDecision Board complete. Do not modify specifications. Do not implement code in this run.\n"
    write(out / "DECISION_BOARD_REPORT.md", report)
    write(AIOS / "workspace" / "runs" / RUN_ID / "DECISION_BOARD_REPORT.md", report)
    write(ART / "reports" / "runs" / RUN_ID / "DECISION_BOARD_REPORT.md", report)

    ckpt = {
        "schema_version": "1.0.0",
        "checkpoint_id": f"ckpt_{RUN_ID}",
        "stage": "product-evolution-decision-board",
        "run_id": RUN_ID,
        "evolution_run": EVO,
        "created_at": NOW,
        "result": "FROZEN",
        "originals_unchanged": unchanged,
        "counts": {k: len(v) for k, v in by_verdict.items()},
        "approved_ids": [e["id"] for e in approved],
        "deferred_ids": [e["id"] for e in by_verdict["DEFER"]],
        "rejected_ids": [e["id"] for e in by_verdict["REJECT"]],
        "outputs": f"ai-os/artifacts/decision-board/runs/{RUN_ID}/",
        "execution_status": "completed",
        "frozen": True,
        "modify_specifications": False,
    }
    write(AIOS / "workspace" / "checkpoints" / f"ckpt_{RUN_ID}.json", ckpt)
    write(AIOS / "workspace" / "checkpoints" / "LATEST_DECISION_BOARD.json", ckpt)

    # Mirror
    mirror = ROOT / "artifacts" / "decision-board" / "runs" / RUN_ID
    if mirror.exists():
        shutil.rmtree(mirror)
    shutil.copytree(out, mirror)
    write(
        ROOT / "artifacts" / "decision-board" / "README.md",
        f"# Decision Board\n\nCanonical: `ai-os/artifacts/decision-board/runs/{RUN_ID}/`\n",
    )

    if not unchanged:
        raise SystemExit("Protected sources were modified — abort")

    print(
        json.dumps(
            {
                "run_id": RUN_ID,
                "unchanged": unchanged,
                "counts": ckpt["counts"],
                "approved": ckpt["approved_ids"],
                "deferred": ckpt["deferred_ids"],
                "rejected": ckpt["rejected_ids"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
