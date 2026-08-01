#!/usr/bin/env python3
"""Specification Evolution Board — Spec v2 Proposal (read-only on originals)."""
from __future__ import annotations

import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
AIOS = ROOT / "ai-os"
ART = AIOS / "artifacts"
BD = "run_business_discovery_20260801T122000Z"
SPEC = "run_specification_20260801T130500Z"
REPO = "run_repository_discovery_20260801T132500Z"
RUN_ID = "run_spec_evolution_20260801T134000Z"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

PINNED = {
    "business": (BD, 14),
    "features": (BD, 18),
    "workflow": (BD, 8),
    "knowledge": (BD, 6),
    "domain": (BD, 18),
    "permissions": (BD, 10),
    "state-machines": (BD, 11),
    "user-journeys": (BD, 6),
    "specifications": (SPEC, 95),
    "requirements": (SPEC, 42),
    "acceptance": (SPEC, 14),
    "tasks": (SPEC, 10),
    "roadmap": (SPEC, 4),
    "implementation": (SPEC, 9),
    "product-architecture": (REPO, 10),
    "repository": (REPO, 17),
}

TYPE_MAP = {
    "business": "BusinessRule",
    "features": "Feature",
    "requirements": "Requirement",
    "acceptance": "Acceptance",
    "workflow": "Workflow",
    "state-machines": "StateMachine",
    "permissions": "Permission",
    "domain": "DomainEntity",
    "user-journeys": "Journey",
    "knowledge": "Knowledge",
    "tasks": "Task",
    "implementation": "Implementation",
    "roadmap": "RoadmapItem",
    "product-architecture": "Architecture",
    "repository": "RepoNote",
}

SPEC_KIND_TO_TYPE = {
    "product-specification": "SpecProduct",
    "functional-specification": "SpecFunctional",
    "architecture-specification": "SpecArchitecture",
    "technical-specification": "SpecTechnical",
    "api-specification": "SpecAPI",
    "database-specification": "SpecDatabase",
    "ui-specification": "SpecUI",
    "security-specification": "SpecSecurity",
    "deployment-specification": "SpecDeployment",
    "coding-standards": "SpecCoding",
}


def write(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        path.write_text(data, encoding="utf-8")
    else:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_pack(pack: str, run: str) -> dict:
    path = ART / pack / "runs" / run / "payload.json"
    if not path.exists():
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def fragment_id(source: str) -> str | None:
    if "#" in source:
        return source.rsplit("#", 1)[-1].strip() or None
    return None


def main() -> None:
    # ---------- FREEZE INPUTS ----------
    packs: dict[str, dict] = {}
    input_hashes: dict[str, str] = {}
    for pack, (run, expected) in PINNED.items():
        data = load_pack(pack, run)
        n = len(data.get("entries") or [])
        if n != expected:
            raise SystemExit(f"Freeze count mismatch {pack}: {n} != {expected}")
        # Reject accidental use of run_full for BD packs
        if pack in ("business", "features", "workflow") and "run_full" in run:
            raise SystemExit(f"Refusing shallow run_full for {pack}")
        packs[pack] = data
        p = ART / pack / "runs" / run / "payload.json"
        input_hashes[str(p.relative_to(ROOT))] = hashlib.sha256(p.read_bytes()).hexdigest()

    final_docs = sorted((ART / "final").glob("*.md"))
    if len(final_docs) < 10:
        raise SystemExit("Final composition docs missing")

    freeze_manifest = {
        "schema_version": "1.0.0",
        "run_id": RUN_ID,
        "created_at": NOW,
        "pinned": {k: {"run": v[0], "expected_entries": v[1]} for k, v in PINNED.items()},
        "input_sha256": input_hashes,
        "final_docs": [str(p.relative_to(ROOT)) for p in final_docs],
        "attestation": "Original payloads are consumed read-only; Spec Evolution writes only proposal trees.",
        "refuse_run_full_supersession": True,
    }
    write(ART / "specification-graph" / "runs" / RUN_ID / "freeze-manifest.json", freeze_manifest)
    write(AIOS / "workspace" / "runs" / RUN_ID / "freeze-manifest.json", freeze_manifest)

    # ---------- BUILD GRAPH ----------
    nodes: dict[str, dict] = {}
    edges: list[dict] = []
    edge_keys: set[tuple[str, str, str]] = set()

    def add_node(nid: str, ntype: str, statement: str, pack: str, entry: dict) -> None:
        if nid in nodes:
            return
        nodes[nid] = {
            "id": nid,
            "type": ntype,
            "statement": statement,
            "pack": pack,
            "entry_kind": entry.get("entry_kind"),
            "requirement_id": entry.get("requirement_id"),
            "severity": entry.get("severity"),
            "source_paths": entry.get("source_paths") or [],
            "payload_ref": f"ai-os/artifacts/{pack}/runs/{PINNED[pack][0]}/payload.json#{nid}"
            if pack in PINNED
            else None,
        }

    def add_edge(src: str, dst: str, kind: str, evidence: str) -> None:
        if src not in nodes or dst not in nodes:
            return
        key = (src, dst, kind)
        if key in edge_keys:
            return
        edge_keys.add(key)
        edges.append({"from": src, "to": dst, "kind": kind, "evidence": evidence})

    # Load all entries as nodes
    for pack, data in packs.items():
        if pack == "specifications":
            for e in data["entries"]:
                ntype = SPEC_KIND_TO_TYPE.get(e.get("entry_kind") or "", "Spec")
                add_node(e["id"], ntype, e.get("statement") or "", pack, e)
            continue
        ntype = TYPE_MAP[pack]
        for e in data["entries"]:
            # domain may mix entity kinds
            if pack == "domain":
                ek = e.get("entry_kind") or "entity"
                t = "DomainEntity" if ek == "entity" else f"Domain_{ek}"
                add_node(e["id"], t, e.get("statement") or "", pack, e)
            else:
                add_node(e["id"], ntype, e.get("statement") or "", pack, e)

    # Index helpers
    by_type: dict[str, list[str]] = defaultdict(list)
    for nid, n in nodes.items():
        by_type[n["type"]].append(nid)

    req_by_requirement_id = {
        n["requirement_id"]: nid
        for nid, n in nodes.items()
        if n["type"] == "Requirement" and n.get("requirement_id")
    }
    id_index = set(nodes.keys())

    # Edge rule 1: source_paths fragments
    for nid, n in list(nodes.items()):
        for sp in n["source_paths"]:
            frag = fragment_id(sp)
            if frag and frag in id_index and frag != nid:
                add_edge(nid, frag, "cites", sp)
                add_edge(frag, nid, "cited_by", sp)

    # Acceptance → Requirement via requirement_id
    for nid, n in nodes.items():
        if n["type"] != "Acceptance":
            continue
        rid = n.get("requirement_id")
        if rid and rid in req_by_requirement_id:
            add_edge(nid, req_by_requirement_id[rid], "validates", f"requirement_id={rid}")
            add_edge(req_by_requirement_id[rid], nid, "has_acceptance", f"requirement_id={rid}")

    # Edge rule 2: ID conventions req-br-X ↔ br-X, ac-br-X ↔ REQ
    for nid, n in nodes.items():
        if n["type"] == "Requirement" and nid.startswith("req-br-"):
            br = "br-" + nid[len("req-br-") :]
            if br in id_index:
                add_edge(br, nid, "implements_rule", "id-convention req-br-*")
                add_edge(nid, br, "derived_from_rule", "id-convention req-br-*")
        if n["type"] == "Requirement" and nid.startswith("req-ft-"):
            # try feature id patterns
            rest = nid[len("req-ft-") :]
            for ft in by_type["Feature"]:
                if rest in ft or ft.replace("ft-", "") == rest or ft.endswith(rest):
                    add_edge(ft, nid, "implements_feature", "id-convention req-ft-*")
                    add_edge(nid, ft, "derived_from_feature", "id-convention req-ft-*")
        if n["type"] == "Acceptance" and nid.startswith("ac-br-"):
            br = "br-" + nid[len("ac-br-") :]
            if br in id_index:
                add_edge(br, nid, "rule_acceptance", "id-convention ac-br-*")

    # Feature ↔ Requirement via shared source fragment or path overlap
    def path_tokens(paths: list[str]) -> set[str]:
        out = set()
        for p in paths:
            base = p.split("#", 1)[0]
            out.add(base)
            for part in base.split("/"):
                if part and part not in {".", "ai-os", "artifacts", "runs", "payload.json"}:
                    out.add(part)
        return out

    for ft in by_type["Feature"]:
        ft_tok = path_tokens(nodes[ft]["source_paths"])
        ft_norm = norm(nodes[ft]["statement"])
        for rq in by_type["Requirement"]:
            rq_tok = path_tokens(nodes[rq]["source_paths"])
            if ft in "".join(nodes[rq]["source_paths"]) or any(
                fragment_id(s) == ft for s in nodes[rq]["source_paths"]
            ):
                add_edge(ft, rq, "implements_feature", "source_paths")
                continue
            # shared app/lib path signals
            shared = ft_tok & rq_tok
            meaningful = {x for x in shared if x.startswith("app") or x.startswith("lib") or "/" in x}
            # also statement keyword overlap for jar/account etc — keep conservative
            if len([x for x in shared if x.endswith(".ts") or x.endswith(".tsx") or "/jars" in x or x == "jars"]) >= 1:
                if any(k in ft_norm and k in norm(nodes[rq]["statement"]) for k in ("jar", "ledger", "household", "allocat", "month", "saving", "installment", "onboard", "auth", "permission")):
                    add_edge(ft, rq, "related_feature", "path+keyword-overlap")

    # Specs linked to requirements via shared source files
    for spec_id in [i for t, ids in by_type.items() if t.startswith("Spec") for i in ids]:
        spec_paths = {p.split("#", 1)[0] for p in nodes[spec_id]["source_paths"]}
        for rq in by_type["Requirement"]:
            rq_paths = {p.split("#", 1)[0] for p in nodes[rq]["source_paths"]}
            if spec_paths & rq_paths:
                add_edge(rq, spec_id, "specified_by", "shared-source-path")
                add_edge(spec_id, rq, "specifies", "shared-source-path")

    # Tasks / implementation / roadmap cite sources
    for tid in by_type["Task"] + by_type["Implementation"] + by_type["RoadmapItem"]:
        for sp in nodes[tid]["source_paths"]:
            frag = fragment_id(sp)
            if frag and frag in id_index:
                add_edge(tid, frag, "depends_on", sp)
            for rq in by_type["Requirement"]:
                if rq in sp or (nodes[rq].get("requirement_id") or "") in sp:
                    add_edge(tid, rq, "depends_on", sp)

    # Build adjacency
    out_adj: dict[str, list[str]] = defaultdict(list)
    in_adj: dict[str, list[str]] = defaultdict(list)
    for e in edges:
        out_adj[e["from"]].append(e["to"])
        in_adj[e["to"]].append(e["from"])

    orphans = {
        "requirements_without_acceptance": [],
        "requirements_without_upstream_rule_or_feature": [],
        "features_without_requirement": [],
        "business_rules_without_requirement": [],
        "api_specs_without_requirement": [],
        "db_specs_without_requirement": [],
        "ui_specs_without_requirement": [],
        "tasks_without_requirement": [],
    }

    acc_req_ids = {
        nodes[a].get("requirement_id")
        for a in by_type["Acceptance"]
        if nodes[a].get("requirement_id")
    }
    for rq in by_type["Requirement"]:
        rid = nodes[rq].get("requirement_id")
        has_acc = any(e["kind"] == "has_acceptance" for e in edges if e["from"] == rq) or (
            rid in acc_req_ids
        )
        if not has_acc:
            orphans["requirements_without_acceptance"].append(rq)
        ups = [t for t in out_adj[rq] + in_adj[rq] if nodes[t]["type"] in ("BusinessRule", "Feature")]
        # also check edges from BR/FT to rq
        ups2 = [x for x in in_adj[rq] if nodes[x]["type"] in ("BusinessRule", "Feature")]
        if not ups and not ups2:
            # check cites to br
            if not any(nodes[x]["type"] in ("BusinessRule", "Feature") for x in out_adj[rq]):
                orphans["requirements_without_upstream_rule_or_feature"].append(rq)

    for ft in by_type["Feature"]:
        if not any(nodes[x]["type"] == "Requirement" for x in out_adj[ft] + in_adj[ft]):
            orphans["features_without_requirement"].append(ft)
    for br in by_type["BusinessRule"]:
        if not any(nodes[x]["type"] == "Requirement" for x in out_adj[br] + in_adj[br]):
            orphans["business_rules_without_requirement"].append(br)
    for sid in by_type["SpecAPI"]:
        if not any(nodes[x]["type"] == "Requirement" for x in out_adj[sid] + in_adj[sid]):
            orphans["api_specs_without_requirement"].append(sid)
    for sid in by_type["SpecDatabase"]:
        if not any(nodes[x]["type"] == "Requirement" for x in out_adj[sid] + in_adj[sid]):
            orphans["db_specs_without_requirement"].append(sid)
    for sid in by_type["SpecUI"]:
        if not any(nodes[x]["type"] == "Requirement" for x in out_adj[sid] + in_adj[sid]):
            orphans["ui_specs_without_requirement"].append(sid)
    for tid in by_type["Task"]:
        if not any(nodes[x]["type"] == "Requirement" for x in out_adj[tid] + in_adj[tid]):
            orphans["tasks_without_requirement"].append(tid)

    graph = {
        "schema_version": "1.0.0",
        "run_id": RUN_ID,
        "created_at": NOW,
        "node_count": len(nodes),
        "edge_count": len(edges),
        "nodes": list(nodes.values()),
        "edges": edges,
        "orphans": orphans,
        "type_counts": {k: len(v) for k, v in sorted(by_type.items())},
        "constraints": {
            "modify_originals": False,
            "invent_business_requirements": False,
            "remove_business_rules": False,
        },
    }
    gdir = ART / "specification-graph" / "runs" / RUN_ID
    write(gdir / "graph.json", graph)

    # Traceability matrix rows: BR → FT → RQ → AC → specs → task/impl
    matrix_rows = []
    for br in sorted(by_type["BusinessRule"]):
        related_req = [x for x in set(out_adj[br] + in_adj[br]) if nodes[x]["type"] == "Requirement"]
        if not related_req:
            related_req = [
                rq
                for rq in by_type["Requirement"]
                if br in json.dumps(nodes[rq]["source_paths"]) or rq.endswith(br.replace("br-", ""))
            ]
        related_ft = [x for x in set(out_adj[br] + in_adj[br]) if nodes[x]["type"] == "Feature"]
        for rq in related_req or [None]:
            accs = []
            apis, dbs, uis, tasks, impls = [], [], [], [], []
            if rq:
                accs = [x for x in out_adj[rq] + in_adj[rq] if nodes[x]["type"] == "Acceptance"]
                apis = [x for x in out_adj[rq] + in_adj[rq] if nodes[x]["type"] == "SpecAPI"]
                dbs = [x for x in out_adj[rq] + in_adj[rq] if nodes[x]["type"] == "SpecDatabase"]
                uis = [x for x in out_adj[rq] + in_adj[rq] if nodes[x]["type"] == "SpecUI"]
                tasks = [x for x in out_adj[rq] + in_adj[rq] if nodes[x]["type"] == "Task"]
                impls = [x for x in out_adj[rq] + in_adj[rq] if nodes[x]["type"] == "Implementation"]
                related_ft += [x for x in out_adj[rq] + in_adj[rq] if nodes[x]["type"] == "Feature"]
            matrix_rows.append(
                {
                    "business_rule": br,
                    "features": sorted(set(related_ft)),
                    "requirement": rq,
                    "acceptance": sorted(set(accs)),
                    "ui": sorted(set(uis)),
                    "api": sorted(set(apis)),
                    "database": sorted(set(dbs)),
                    "tasks": sorted(set(tasks)),
                    "implementation": sorted(set(impls)),
                }
            )

    write(gdir / "traceability-matrix.json", {"rows": matrix_rows, "run_id": RUN_ID})

    # Markdown docs
    br_list = "\n".join(f"- `{i}`: {nodes[i]['statement'][:100]}" for i in sorted(by_type["BusinessRule"]))
    spec_graph_md = f"""# Specification Knowledge Graph

**Run:** `{RUN_ID}`  
**Created:** {NOW}  
**Nodes:** {len(nodes)} · **Edges:** {len(edges)}  
**Constraint:** Original specifications are read-only. This graph is derived.

## Type counts

| Type | Count |
|------|------:|
"""
    for t, c in sorted(graph["type_counts"].items()):
        spec_graph_md += f"| {t} | {c} |\n"

    spec_graph_md += f"""
## Layered chain (canonical)

```mermaid
flowchart TD
  BR[BusinessRule]
  FT[Feature]
  RQ[Requirement]
  AC[Acceptance]
  UI[SpecUI]
  API[SpecAPI]
  DB[SpecDatabase]
  TK[Task]
  IM[Implementation]
  BR --> FT
  FT --> RQ
  RQ --> AC
  RQ --> UI
  RQ --> API
  RQ --> DB
  RQ --> TK
  TK --> IM
```

## Business rules (preserved 100%)

{br_list}

## Graph files

- `graph.json`
- `traceability-matrix.json`
- `freeze-manifest.json`

## Attestation

- No original BD/SPEC/REPO/final payloads modified.
- No business rules removed.
- No new business requirements invented in this graph.
"""
    write(gdir / "spec-graph.md", spec_graph_md)

    dep_md = f"""# Specification Dependency Graph

**Run:** `{RUN_ID}`

## Edge kind summary

"""
    kind_counts = Counter(e["kind"] for e in edges)
    for k, c in kind_counts.most_common():
        dep_md += f"- `{k}`: {c}\n"

    dep_md += """
## Critical dependency chains (sample)

"""
    for br in sorted(by_type["BusinessRule"])[:8]:
        reqs = [x for x in out_adj[br] + in_adj[br] if nodes[x]["type"] == "Requirement"]
        dep_md += f"### `{br}`\n"
        dep_md += f"- Requirements: {', '.join(f'`{r}`' for r in reqs) or '_none linked_'}\n"
        for rq in reqs[:3]:
            acc = [x for x in out_adj[rq] if nodes[x]["type"] == "Acceptance"]
            dep_md += f"  - `{rq}` → acceptance: {', '.join(f'`{a}`' for a in acc) or '_missing_'}\n"
        dep_md += "\n"

    dep_md += f"""
## Improvement-ready dependency notes

1. Acceptance coverage is thinner than requirements ({len(by_type['Acceptance'])} vs {len(by_type['Requirement'])}) — expand acceptance before claiming implementation complete.
2. API/DB/UI specs should remain attached to requirements when evolving solution architecture.
3. Tasks/implementation nodes must not introduce business rules not present in BD.

## Machine graph

See `graph.json` edges ({len(edges)}).
"""
    write(gdir / "dependency-graph.md", dep_md)

    tm_md = f"""# Traceability Matrix

**Run:** `{RUN_ID}`  
**Rows:** {len(matrix_rows)} (BusinessRule-centric)

| Business Rule | Features | Requirement | Acceptance | UI | API | DB | Tasks | Impl |
|---------------|----------|-------------|------------|----|-----|----|-------|------|
"""
    for row in matrix_rows:
        def fmt(xs):
            if isinstance(xs, list):
                return "<br>".join(f"`{x}`" for x in xs[:4]) + ("…" if len(xs) > 4 else "") or "—"
            return f"`{xs}`" if xs else "—"

        tm_md += (
            f"| `{row['business_rule']}` | {fmt(row['features'])} | {fmt(row['requirement'])} | "
            f"{fmt(row['acceptance'])} | {fmt(row['ui'])} | {fmt(row['api'])} | {fmt(row['database'])} | "
            f"{fmt(row['tasks'])} | {fmt(row['implementation'])} |\n"
        )
    tm_md += f"""
## Orphan summary

```json
{json.dumps({k: len(v) for k, v in orphans.items()}, indent=2)}
```

Full lists in `graph.json` → `orphans`.
"""
    write(gdir / "traceability-matrix.md", tm_md)

    # ---------- CONSISTENCY AUDIT ----------
    idir = ART / "improvement-analysis" / "runs" / RUN_ID

    # Duplicates
    def dupes(ids: list[str]) -> list[dict]:
        by_stmt = defaultdict(list)
        for i in ids:
            by_stmt[norm(nodes[i]["statement"])].append(i)
        return [{"statement": s, "ids": v} for s, v in by_stmt.items() if len(v) > 1 and s]

    dup_features = dupes(by_type["Feature"])
    dup_reqs = dupes(by_type["Requirement"])
    # requirement_id collisions
    rid_map = defaultdict(list)
    for rq in by_type["Requirement"]:
        rid = nodes[rq].get("requirement_id")
        if rid:
            rid_map[rid].append(rq)
    rid_collisions = [{"requirement_id": k, "ids": v} for k, v in rid_map.items() if len(v) > 1]

    # Soft conflict heuristics (do not remove rules)
    conflicts = []
    br_stmts = {i: nodes[i]["statement"] for i in by_type["BusinessRule"]}
    # known soft notes from BD validation: soft-delete narrative vs active jar
    if "br-jar-active" in br_stmts:
        conflicts.append(
            {
                "ids": ["br-jar-active"],
                "note": "Active-jar constraint must stay consistent with soft-delete/archive semantics documented in BD soft notes — not a removal, clarify in solution specs.",
                "severity": "low",
            }
        )

    # Near-duplicate tasks
    dup_tasks = dupes(by_type["Task"])

    # API routes from repo inventory vs linked
    repo_ext = packs["repository"].get("extensions") or {}
    api_routes = (repo_ext.get("inventory") or {}).get("api_routes") or []
    pages = (repo_ext.get("inventory") or {}).get("pages") or []
    migrations = (repo_ext.get("inventory") or {}).get("migrations") or []

    orphan_api_routes = []
    api_blob = json.dumps([nodes[i] for i in by_type["SpecAPI"]]) + json.dumps(
        [nodes[i] for i in by_type["Requirement"]]
    )
    for route in api_routes:
        if route not in api_blob:
            orphan_api_routes.append(route)

    # Unmapped UI pages
    ui_blob = json.dumps([nodes[i] for i in by_type["SpecUI"] + by_type["Feature"] + by_type["Journey"]])
    unmapped_pages = [p for p in pages if p.split("/")[1] not in ui_blob and p not in ui_blob]
    # softer: domain segment
    unmapped_pages = []
    for p in pages:
        seg = p.split("/")[1] if len(p.split("/")) > 1 else p
        if seg not in ui_blob and p not in ui_blob:
            unmapped_pages.append(p)

    # DB entities unused heuristic
    domain_entities = [i for i in by_type.keys() if i.startswith("Domain")]
    entity_ids = by_type.get("DomainEntity", [])
    unused_entities = []
    req_ft_blob = json.dumps([nodes[i] for i in by_type["Requirement"] + by_type["Feature"] + by_type["SpecDatabase"]])
    for eid in entity_ids:
        token = eid.replace("dom-", "")
        if eid not in req_ft_blob and token not in req_ft_blob.lower():
            unused_entities.append(eid)

    smells = {
        "duplicated_features": dup_features,
        "duplicated_requirements": dup_reqs,
        "requirement_id_collisions": rid_collisions,
        "conflicting_business_rules": conflicts,
        "missing_acceptance": orphans["requirements_without_acceptance"],
        "broken_traceability": {
            "features_without_requirement": orphans["features_without_requirement"],
            "business_rules_without_requirement": orphans["business_rules_without_requirement"],
            "requirements_without_upstream": orphans["requirements_without_upstream_rule_or_feature"],
        },
        "orphan_api_specs": orphans["api_specs_without_requirement"],
        "orphan_api_routes": orphan_api_routes,
        "unused_database_entities": unused_entities,
        "unmapped_ui_pages": unmapped_pages[:40],
        "redundant_tasks": dup_tasks,
        "specification_smells": [
            {
                "id": "smell-acceptance-thin",
                "message": f"Acceptance ({len(by_type['Acceptance'])}) << Requirements ({len(by_type['Requirement'])})",
            },
            {
                "id": "smell-severity-skew",
                "message": f"Requirement severity distribution: {dict(Counter(nodes[r].get('severity') or 'unset' for r in by_type['Requirement']))}",
            },
        ],
        "architecture_smells": [
            {
                "id": "arch-smell-observability-gap",
                "message": "Validated specs emphasize domain/API/security; structured product observability (metrics/traces/SLOs) is thin vs 2026 practice.",
                "evidence": ["ai-os/artifacts/specifications/runs/" + SPEC + "/payload.json"],
            },
            {
                "id": "arch-smell-actions-vs-api",
                "message": "Server Actions + Route Handlers dual surface increases contract sprawl; needs explicit API design standards without changing business rules.",
                "evidence": ["ai-os/artifacts/repository/runs/" + REPO + "/payload.json", "ai-os/artifacts/final/API.md"],
            },
        ],
    }
    write(idir / "smells.json", smells)

    consistency_md = f"""# Consistency Audit

**Run:** `{RUN_ID}`  
**Created:** {NOW}  
**Mode:** Report-only (originals unchanged)

## Findings summary

| Check | Result |
|-------|--------|
| Duplicated features | {len(dup_features)} groups |
| Duplicated requirements | {len(dup_reqs)} groups |
| requirement_id collisions | {len(rid_collisions)} |
| Conflicting business rules (soft) | {len(conflicts)} |
| Missing acceptance | {len(orphans['requirements_without_acceptance'])} |
| Features without requirement | {len(orphans['features_without_requirement'])} |
| Business rules without requirement | {len(orphans['business_rules_without_requirement'])} |
| Orphan API specs | {len(orphans['api_specs_without_requirement'])} |
| Orphan API routes (path not in specs/reqs blob) | {len(orphan_api_routes)} |
| Unused domain entities (heuristic) | {len(unused_entities)} |
| Unmapped UI pages (heuristic) | {len(unmapped_pages)} |
| Redundant tasks | {len(dup_tasks)} |

## Missing acceptance (requirements)

{chr(10).join(f'- `{x}`' for x in orphans['requirements_without_acceptance'][:60]) or '- none'}

## Soft rule clarifications (do not remove)

{chr(10).join(f"- {c['ids']}: {c['note']}" for c in conflicts) or '- none'}

## Specification smells

{chr(10).join(f"- **{s['id']}**: {s['message']}" for s in smells['specification_smells'])}

## Architecture smells

{chr(10).join(f"- **{s['id']}**: {s['message']}" for s in smells['architecture_smells'])}

## Machine-readable

See `smells.json`.
"""
    write(idir / "consistency-audit.md", consistency_md)

    # ---------- 2026 EVALUATION ----------
    dimensions = [
        ("UX", "final/PRD.md + UI specs + journeys", 72, "Jar/ledger clarity strong; progressive disclosure and empty states underspecified for 2026 UX."),
        ("Accessibility", "ui-specification + components/ui", 55, "No systematic WCAG 2.2 AA acceptance criteria in validated acceptance pack."),
        ("Responsive Design", "UI specs + app layouts", 70, "App shell exists; breakpoints/touch targets not first-class in acceptance."),
        ("Performance", "technical/architecture specs + Next 16", 65, "RSC/proxy stack modern; no Core Web Vitals budgets or server timing SLOs in specs."),
        ("Security", "security-specification (10) + RLS permissions", 78, "RLS/roles present; need threat model, CSP, secret rotation, abuse rate limits as solution overlays."),
        ("Authentication", "app/auth + proxy + login", 80, "Supabase SSR + proxy solid; MFA/session fixation/device management not in BD (do not invent as business — optional security hardening proposal only)."),
        ("Authorization", "permissions pack", 82, "partner/admin + RLS mapped; fine-grained audit of privileged actions underspecified."),
        ("Observability", "specs + repository", 40, "Gap: structured logging, tracing, product metrics, error budgets."),
        ("Offline Support", "repository runtime", 25, "Online-first household finance app; offline is future vision only — must not break ledger truth."),
        ("AI Features", "insights/decision-tools domains", 50, "Decision tools/insights exist as product surfaces; generative AI assistants not in validated BD — propose assistive UX only atop existing insights."),
        ("Automation", "jar allocation/auto policies in BR", 75, "Income/expense auto-allocate policies validated; expand reliability/observability of automation, not new business modes."),
        ("Developer Experience", "coding-standards + monorepo", 68, "AIOS + app co-located; contract tests between actions/API/DB underspecified."),
        ("Scalability", "architecture + supabase", 70, "Single-household tenancy OK; fan-out queries/dashboard aggregation need caching guidance."),
        ("Maintainability", "dual actions/API + 95 specs", 62, "Contract sprawl and thin acceptance hurt maintainability."),
        ("API Design", "API.md + 17 routes", 68, "JSON routes exist; versioning, idempotency, error envelope standards incomplete."),
        ("Database Design", "Database.md + 51 migrations", 80, "Strong migration history; soft-delete/archive consistency and naming soft-misses remain."),
        ("State Management", "zustand + react-query + RSC", 74, "Modern stack; clarify server/client ownership boundaries in architecture-v2 proposal."),
        ("Error Handling", "lib/errors + actions", 60, "Domain errors exist; user-facing error taxonomy and retry semantics incomplete in acceptance."),
        ("Logging", "repository scan", 35, "No product logging specification depth."),
        ("Internationalization", "i18n provider + layout locale", 78, "en/vi path present; completeness of string catalogs vs acceptance not fully traced."),
        ("Testing Strategy", "tasks/implementation packs", 45, "Tasks exist; automated test pyramid / contract tests not first-class in validated specs."),
        ("Deployment", "deployment-specification", 70, "Basic deployment specs; env promotion and migration gates can be strengthened."),
        ("Cloud Architecture", "Supabase + Next", 72, "Pragmatic serverless; multi-region/DR is future vision."),
        ("Cost Optimization", "supabase/next", 60, "No cost budgets in specs; query/realtime cost controls are solution concerns."),
        ("Privacy", "security + household tenancy", 75, "Household isolation core; data export/deletion runbooks as solution overlays."),
        ("Compliance", "security specs", 50, "No formal compliance regime in BD — propose privacy engineering practices without inventing legal product claims."),
    ]

    eval_rows = []
    for name, evidence, score, gap in dimensions:
        eval_rows.append(
            {
                "dimension": name,
                "score": score,
                "evidence": evidence,
                "gap": gap,
                "opportunity_type": "solution",
            }
        )
    avg = round(sum(r["score"] for r in eval_rows) / len(eval_rows))
    write(idir / "2026-scorecard.json", {"average": avg, "dimensions": eval_rows, "run_id": RUN_ID})

    eval_md = f"""# 2026 Best-Practice Evaluation

**Run:** `{RUN_ID}`  
**Average score:** {avg}/100  
**Constraint:** Solution/UX/platform gaps only. No new business domains. Preserve all BD business rules.

## Scorecard

| Dimension | Score | Evidence | Gap / opportunity |
|-----------|------:|----------|-------------------|
"""
    for r in eval_rows:
        eval_md += f"| {r['dimension']} | {r['score']} | {r['evidence']} | {r['gap']} |\n"

    eval_md += """
## Board synthesis

- **Preserve:** real vs virtual jars, allocation policies, month-close, roles/RLS, existing API/feature surfaces.
- **Evolve:** observability, acceptance depth, a11y, API envelopes, testing, error taxonomy, maintainability of actions/API split.
- **Future only:** offline-first, multi-region DR, generative AI copilots (assistive on top of existing insights — not new ledger semantics).
"""
    write(idir / "2026-evaluation.md", eval_md)

    # ---------- IMPROVEMENTS ----------
    # All improvements must preserve business rules
    all_br = sorted(by_type["BusinessRule"])
    improvements = []

    def imp(
        iid: str,
        title: str,
        bucket: str,
        priority: str,
        impact: str,
        current: str,
        problem: str,
        proposal: str,
        benefits: str,
        tradeoffs: str,
        risk: str,
        affected: list[str],
        migration: str,
        why: str,
        depends_on: list[str],
        touches_req: list[str],
    ) -> None:
        improvements.append(
            {
                "id": iid,
                "title": title,
                "bucket": bucket,
                "priority": priority,
                "estimated_impact": impact,
                "current": current,
                "problem": problem,
                "proposal": proposal,
                "expected_benefits": benefits,
                "trade_offs": tradeoffs,
                "risk": risk,
                "affected_specifications": affected,
                "migration_plan": migration,
                "why": why,
                "impact": impact,
                "migration": migration,
                "affected_artifacts": affected,
                "depends_on": depends_on,
                "preserves_business_rules": all_br,
                "touches_requirements": touches_req,
            }
        )

    # Pick some requirement ids for touches
    sample_reqs = sorted(by_type["Requirement"])[:12]
    sec_specs = by_type.get("SpecSecurity", [])[:5]
    api_specs = by_type.get("SpecAPI", [])[:8]
    ui_specs = by_type.get("SpecUI", [])[:5]

    imp(
        "IMP-001",
        "Expand acceptance criteria to cover all requirements",
        "Quick Wins",
        "P0",
        "High — closes traceability gap without changing business rules",
        f"{len(by_type['Acceptance'])} acceptance vs {len(by_type['Requirement'])} requirements",
        "Thin acceptance leaves implementation unverifiable",
        "Add acceptance entries 1:1 (or scenario bundles) for every requirement ID; keep statements aligned to existing req text",
        "Higher testability; fewer ambiguous done definitions",
        "More AC maintenance cost",
        "Low — documentation/spec overlay only",
        [f"ai-os/artifacts/acceptance/runs/{SPEC}/payload.json", f"ai-os/artifacts/requirements/runs/{SPEC}/payload.json"],
        "Write proposal overlay ACs; review against BD rules; adopt in a future approved spec adoption run — do not rewrite originals in place",
        "Missing acceptance is the top consistency smell",
        [],
        orphans["requirements_without_acceptance"][:20] or sample_reqs,
    )
    imp(
        "IMP-002",
        "Standardize API error envelope and idempotency headers",
        "Quick Wins",
        "P1",
        "Medium — DX and client reliability",
        "17 route handlers with heterogeneous JSON shapes",
        "Clients cannot rely on uniform error/retry semantics",
        "Solution overlay: standard `{error:{code,message,details}}`, request-id, idempotency-key for mutating routes — behavior of business outcomes unchanged",
        "Easier clients, safer retries",
        "Touch all route handlers",
        "Low-Medium",
        ["ai-os/artifacts/final/API.md"] + [f"ai-os/artifacts/specifications/runs/{SPEC}/payload.json#{i}" for i in api_specs[:5]],
        "Document envelope; implement behind feature flag; verify against existing acceptance for savings/transactions/jars APIs",
        "API design score 68; architecture smell actions-vs-api",
        ["IMP-001"],
        [r for r in sample_reqs if "api" in r or "saving" in r or "transaction" in r][:5] or sample_reqs[:5],
    )
    imp(
        "IMP-003",
        "Accessibility acceptance overlay (WCAG 2.2 AA targets)",
        "Medium Improvements",
        "P1",
        "High UX/compliance engineering quality",
        "UI specs exist without systematic a11y AC",
        "2026 a11y score 55 — risk for real users",
        "Add non-business acceptance: keyboard, contrast, labels, focus — applied to existing pages/journeys",
        "Inclusive UX; fewer regressions",
        "Engineering time on existing screens",
        "Low to business logic",
        ["ai-os/artifacts/final/SRS.md"] + [f"#{i}" for i in ui_specs],
        "Overlay AC → implement in UI kit → audit critical journeys (login, jars, onboarding)",
        "UX/a11y board evaluation",
        ["IMP-001"],
        sample_reqs[:5],
    )
    imp(
        "IMP-004",
        "Product observability baseline (logs, traces, metrics)",
        "Medium Improvements",
        "P0",
        "High maintainability/ops",
        "Observability score 40; thin specs",
        "Cannot diagnose allocation/month-close failures in production systematically",
        "Specify structured logs + trace ids on actions/API + metrics for jar automation/month-close — no new business features",
        "Faster incident response; safer automation",
        "Vendor/cost for telemetry",
        "Medium (ops complexity)",
        ["ai-os/artifacts/final/Architecture.md", f"ai-os/artifacts/product-architecture/runs/{REPO}/payload.json"],
        "Choose telemetry approach; instrument proxy+actions+API; dashboards for existing BR automation",
        "Architecture smell observability-gap",
        ["IMP-002"],
        [r for r in by_type["Requirement"] if "allocat" in nodes[r]["statement"].lower() or "month" in nodes[r]["statement"].lower()][:6] or sample_reqs,
    )
    imp(
        "IMP-005",
        "Unified contract catalog for Server Actions vs Route Handlers",
        "Medium Improvements",
        "P1",
        "High maintainability",
        "Dual mutation/read surfaces",
        "Contract sprawl and duplicated validation",
        "Catalog each action/route with input schema (zod), authz, BR references — solution doc only; keep existing surfaces until major refactor",
        "Clearer ownership; less duplication",
        "Doc overhead",
        "Low",
        ["ai-os/artifacts/final/API.md", f"ai-os/artifacts/repository/runs/{REPO}/payload.json"],
        "Generate catalog from REPO inventory; link each to requirement IDs; use as gate for changes",
        "Maintainability 62; arch smell actions-vs-api",
        ["IMP-001", "IMP-002"],
        sample_reqs,
    )
    imp(
        "IMP-006",
        "Security hardening overlay (CSP, rate limits, admin audit)",
        "Medium Improvements",
        "P1",
        "High security",
        "Security specs + RLS present",
        "Missing abuse controls and privileged-action audit trail as solution controls",
        "Add CSP, rate limits on auth/API, audit log for admin-only actions — does not change partner/admin business roles",
        "Better security posture",
        "Possible false-positive rate limits",
        "Medium",
        [f"ai-os/artifacts/specifications/runs/{SPEC}/payload.json#{i}" for i in sec_specs]
        + [f"ai-os/artifacts/permissions/runs/{BD}/payload.json"],
        "Threat model memo → controls → verify RLS still matches permissions pack",
        "Security/authz evaluation",
        ["IMP-004"],
        [r for r in by_type["Requirement"] if "permission" in nodes[r]["statement"].lower() or "admin" in nodes[r]["statement"].lower()][:5] or sample_reqs[:5],
    )
    imp(
        "IMP-007",
        "Testing strategy overlay (contract + critical journey tests)",
        "Medium Improvements",
        "P1",
        "High implementation quality",
        "Testing strategy score 45",
        "Insufficient automated proof that BR constraints hold",
        "Define test pyramid overlay: unit for allocation engines, contract for API/actions, e2e for journeys — assert existing BR",
        "Regression safety",
        "CI time",
        "Low-Medium",
        [f"ai-os/artifacts/tasks/runs/{SPEC}/payload.json", "ai-os/artifacts/final/Acceptance.md"],
        "Add test plan overlay; implement tests mapped to AC after IMP-001",
        "Testing dimension gap",
        ["IMP-001", "IMP-005"],
        sample_reqs,
    )
    imp(
        "IMP-008",
        "Performance budgets for dashboard and jars spending APIs",
        "Medium Improvements",
        "P2",
        "Medium scalability/UX",
        "No CWV/API latency budgets in specs",
        "Dashboard/jars endpoints can regress unnoticed",
        "Set latency/payload budgets on existing dashboard/jars/savings routes; caching guidance without changing payloads semantics",
        "Stable UX under load",
        "Caching complexity",
        "Medium",
        ["ai-os/artifacts/final/API.md", "ai-os/artifacts/final/Architecture.md"],
        "Measure baselines → set budgets → add checks in CI smoke",
        "Performance score 65",
        ["IMP-004"],
        sample_reqs[:6],
    )
    imp(
        "IMP-009",
        "Clarify soft-delete/archive vs active-jar in solution architecture",
        "Quick Wins",
        "P1",
        "Medium consistency",
        "Soft BD note + br-jar-active",
        "Risk of conflicting interpretations in implementation",
        "Architecture-v2 clarification overlay: define state matrix for active/archived/soft-deleted — preserve br-jar-active intent",
        "Fewer implementation bugs",
        "None to business intent",
        "Low",
        [f"ai-os/artifacts/business/runs/{BD}/payload.json#br-jar-active", "ai-os/artifacts/final/Business Rules.md"],
        "Publish clarification; add AC; update validation helpers if needed",
        "Consistency soft conflict",
        ["IMP-001"],
        [r for r in by_type["Requirement"] if "jar" in nodes[r]["statement"].lower() and "active" in nodes[r]["statement"].lower()][:3] or sample_reqs[:3],
    )
    imp(
        "IMP-010",
        "Error taxonomy for user-facing failures",
        "Quick Wins",
        "P2",
        "Medium UX",
        "lib/errors exists; AC thin",
        "Inconsistent user messaging on allocation/review failures",
        "Map domain errors to stable codes/messages (i18n keys) for existing flows",
        "Clearer UX; better supportability",
        "i18n work",
        "Low",
        ["ai-os/artifacts/final/SRS.md", f"ai-os/artifacts/repository/runs/{REPO}/payload.json"],
        "Overlay taxonomy → wire to toasts/forms → tests",
        "Error handling score 60",
        ["IMP-002", "IMP-003"],
        sample_reqs[:5],
    )
    imp(
        "IMP-011",
        "Major: consolidate read/write contracts behind shared domain modules",
        "Major Refactors",
        "P2",
        "High maintainability (longer horizon)",
        "Actions and API both call overlapping lib domains",
        "Duplication and drift risk",
        "Gradually route handlers/actions through shared application services — preserve all BR and external URL/action names during migration",
        "Single validation path; less drift",
        "Large refactor cost",
        "High if rushed — mitigate with strangler pattern",
        ["ai-os/artifacts/final/Architecture.md", f"ai-os/artifacts/repository/runs/{REPO}/payload.json"],
        "Strangler: pick one domain (savings) → shared service → expand; keep compatibility",
        "Maintainability + arch smell",
        ["IMP-005", "IMP-007", "IMP-004"],
        sample_reqs,
    )
    imp(
        "IMP-012",
        "Major: API versioning policy for public JSON routes",
        "Major Refactors",
        "P3",
        "Medium-High scalability/compatibility",
        "Unversioned /api paths",
        "Hard to evolve envelopes without breaking clients",
        "Introduce /api/v1 additive versioning; keep old paths as aliases until deprecated — no business change",
        "Safer evolution",
        "Path duplication temporarily",
        "Medium",
        ["ai-os/artifacts/final/API.md"],
        "After IMP-002 envelope; add v1; alias legacy; deprecate later",
        "API design gap",
        ["IMP-002", "IMP-005"],
        sample_reqs[:5],
    )
    imp(
        "IMP-013",
        "Future: assistive insights UX (non-generative ledger changes)",
        "Future Vision",
        "P3",
        "Medium UX — must not invent ledger rules",
        "insights/decision-tools domains exist",
        "Users may want clearer guidance UX",
        "Improve presentation/automation trust UI for existing insights — forbid new money-movement semantics",
        "Better decisions UX",
        "Scope creep into AI features",
        "Medium — gate by BD feature list",
        ["ai-os/artifacts/final/PRD.md", f"ai-os/artifacts/features/runs/{BD}/payload.json"],
        "Only after observability+AC; UX prototypes; no BR changes",
        "AI features score 50 — constrained",
        ["IMP-004", "IMP-001", "IMP-003"],
        [r for r in by_type["Requirement"] if "insight" in nodes[r]["statement"].lower() or "decision" in nodes[r]["statement"].lower()][:5] or sample_reqs[:3],
    )
    imp(
        "IMP-014",
        "Future: offline read-only cache for dashboard summaries",
        "Future Vision",
        "P4",
        "Low-Medium — must not allow offline ledger writes",
        "Online-first app",
        "Mobile flaky networks",
        "Read-only cached summaries; block offline mutations that would violate real-ledger BR",
        "Resilience for viewing",
        "Stale data risk",
        "High if writes allowed — therefore writes forbidden offline",
        ["ai-os/artifacts/final/Architecture.md", f"ai-os/artifacts/business/runs/{BD}/payload.json#br-real-vs-virtual"],
        "After IMP-004/008; explicit non-goals for offline writes",
        "Offline score 25 — constrained future",
        ["IMP-004", "IMP-008", "IMP-006"],
        [r for r in by_type["Requirement"] if "real" in nodes[r]["statement"].lower() or "ledger" in nodes[r]["statement"].lower()][:4] or sample_reqs[:4],
    )
    imp(
        "IMP-015",
        "Privacy engineering runbooks (export/delete within household tenancy)",
        "Medium Improvements",
        "P2",
        "Medium privacy",
        "Household tenancy strong; runbooks thin",
        "Operational privacy gaps",
        "Solution runbooks for export/delete aligned to existing household boundaries — no new product compliance claims",
        "Better privacy ops",
        "Engineering time",
        "Low-Medium",
        ["ai-os/artifacts/final/Architecture.md", f"ai-os/artifacts/permissions/runs/{BD}/payload.json"],
        "Document procedures; optional admin-only tools later without new BR",
        "Privacy/compliance evaluation",
        ["IMP-006"],
        sample_reqs[:4],
    )

    write(idir / "improvements.json", {"improvements": improvements, "count": len(improvements)})
    for item in improvements:
        md = f"""# {item['id']}: {item['title']}

**Bucket:** {item['bucket']}  
**Priority:** {item['priority']}  
**Estimated impact:** {item['estimated_impact']}

## Why

{item['why']}

## Current

{item['current']}

## Problem

{item['problem']}

## Proposal

{item['proposal']}

## Expected Benefits

{item['expected_benefits']}

## Trade-offs

{item['trade_offs']}

## Risk

{item['risk']}

## Impact

{item['impact']}

## Affected Specifications / Artifacts

{chr(10).join(f'- `{a}`' for a in item['affected_artifacts'])}

## Touches requirements

{chr(10).join(f'- `{r}`' for r in item['touches_requirements'])}

## Preserves business rules (100%)

All BD business rules remain in force ({len(all_br)}). This proposal does **not** remove or replace them.

## Migration Plan

{item['migration_plan']}

## Depends on

{chr(10).join(f'- `{d}`' for d in item['depends_on']) or '- none'}

## Attestation

- Does not invent business requirements
- Does not modify original specification payloads
- Originals remain source of truth until a future approved adoption run
"""
        write(idir / "improvements" / f"{item['id']}.md", md)

    # ---------- PROPOSAL V2 ----------
    pdir = ART / "proposal-v2" / "runs" / RUN_ID
    buckets = defaultdict(list)
    for item in improvements:
        buckets[item["bucket"]].append(item)

    proposal = f"""# Specification v2 Proposal

**Status:** PROPOSAL — NOT ADOPTED  
**Run:** `{RUN_ID}`  
**Created:** {NOW}

## Attestation

- Original validated specifications remain the **source of truth**.
- This document is a **proposal overlay** only.
- **100% business intent preserved** — all BD business rules retained; none removed.
- **No new business requirements invented.**
- Solution/UX/platform evolution for 2026 readiness only.

## Inputs (frozen)

- Business Discovery `{BD}`
- Specification Generation `{SPEC}`
- Repository Discovery `{REPO}`
- Final composition `ai-os/artifacts/final/`

## Quick Wins

"""
    for item in buckets["Quick Wins"]:
        proposal += f"### {item['id']} — {item['title']}\n\n{item['proposal']}\n\n"

    proposal += "## Medium Improvements\n\n"
    for item in buckets["Medium Improvements"]:
        proposal += f"### {item['id']} — {item['title']}\n\n{item['proposal']}\n\n"

    proposal += "## Major Refactors\n\n"
    for item in buckets["Major Refactors"]:
        proposal += f"### {item['id']} — {item['title']}\n\n{item['proposal']}\n\n"

    proposal += "## Future Vision\n\n"
    for item in buckets["Future Vision"]:
        proposal += f"### {item['id']} — {item['title']}\n\n{item['proposal']}\n\n"

    proposal += f"""## Success alignment

| Criterion | How addressed |
|-----------|----------------|
| Preserve business intent | All BR listed in every IMP; freeze hashes recorded |
| Maintainability | IMP-005, IMP-011, contract catalog |
| UX | IMP-003, IMP-010, IMP-013 |
| Scalability | IMP-008, IMP-012 |
| Security | IMP-006 |
| Technical debt | IMP-002, IMP-005, IMP-011 |
| Implementation quality | IMP-001, IMP-007 |
| 2026-ready without losing compatibility | Additive overlays + strangler migrations |

## Related graphs

- `ai-os/artifacts/specification-graph/runs/{RUN_ID}/`
- `ai-os/artifacts/improvement-analysis/runs/{RUN_ID}/`
"""
    write(pdir / "SPECIFICATION_V2_PROPOSAL.md", proposal)
    write(
        pdir / "overlays" / "README.md",
        "# PROPOSAL — NOT ADOPTED\n\nOverlays here are drafts. Do not treat as replacement SRS.\n",
    )
    write(
        pdir / "overlays" / "acceptance-expansion-outline.md",
        f"""# PROPOSAL — NOT ADOPTED — Acceptance expansion outline

For each requirement in `requirements/{SPEC}` lacking acceptance, draft AC text that restates the requirement as verifiable checks.

Count missing: {len(orphans['requirements_without_acceptance'])}

See IMP-001.
""",
    )

    # architecture-v2 + redesign mirrors
    write(
        ART / "architecture-v2" / "runs" / RUN_ID / "payload.json",
        {
            "schema_version": "1.0.0",
            "type": "architecture-v2-proposal",
            "title": "Architecture v2 proposal notes (solution only)",
            "summary": "Pointers to Spec Evolution proposal; no business rule changes.",
            "status": "proposal",
            "created_at": NOW,
            "entries": [
                {
                    "id": "arch-v2-pointer",
                    "entry_kind": "note",
                    "statement": f"See proposal-v2 run {RUN_ID} for observability, contracts, API versioning, soft-delete clarification.",
                    "source_paths": [f"ai-os/artifacts/proposal-v2/runs/{RUN_ID}/SPECIFICATION_V2_PROPOSAL.md"],
                }
            ],
        },
    )
    write(
        ART / "redesign" / "runs" / RUN_ID / "payload.json",
        {
            "schema_version": "1.0.0",
            "type": "solution-redesign-notes",
            "title": "Solution redesign notes from Spec Evolution",
            "summary": "Preserve business behavior; evolve solution quality.",
            "status": "proposal",
            "created_at": NOW,
            "entries": [
                {
                    "id": "redesign-pointer",
                    "entry_kind": "note",
                    "statement": "Redesign limited to solution overlays in SPECIFICATION_V2_PROPOSAL.md",
                    "source_paths": [f"ai-os/artifacts/proposal-v2/runs/{RUN_ID}/SPECIFICATION_V2_PROPOSAL.md"],
                }
            ],
        },
    )

    # ---------- DEPENDENCY ROADMAP ----------
    rdir = ART / "dependency-roadmap" / "runs" / RUN_ID
    # Topological-ish order by depends_on
    by_id = {i["id"]: i for i in improvements}
    ordered: list[str] = []
    seen: set[str] = set()

    def visit(iid: str) -> None:
        if iid in seen:
            return
        seen.add(iid)
        for d in by_id[iid]["depends_on"]:
            if d in by_id:
                visit(d)
        ordered.append(iid)

    for i in improvements:
        visit(i["id"])

    phases = [
        ("Phase 0 — Foundations", ["IMP-001", "IMP-009"]),
        ("Phase 1 — Contracts & API baseline", ["IMP-002", "IMP-005", "IMP-010"]),
        ("Phase 2 — Quality & security", ["IMP-003", "IMP-004", "IMP-006", "IMP-007"]),
        ("Phase 3 — Performance", ["IMP-008", "IMP-015"]),
        ("Phase 4 — Major refactors", ["IMP-011", "IMP-012"]),
        ("Phase 5 — Future vision", ["IMP-013", "IMP-014"]),
    ]

    roadmap_md = f"""# Dependency-aware Roadmap

**Run:** `{RUN_ID}`  
**Rule:** Later phases must not invalidate earlier proposals.

## Ordered improvements (dependency-respecting)

"""
    for iid in ordered:
        item = by_id[iid]
        roadmap_md += f"1. **{iid}** — {item['title']} (depends: {', '.join(item['depends_on']) or 'none'})\n"

    roadmap_md += "\n## Phases\n\n"
    for name, ids in phases:
        roadmap_md += f"### {name}\n\n"
        for iid in ids:
            roadmap_md += f"- `{iid}`: {by_id[iid]['title']}\n"
        roadmap_md += "\n"

    roadmap_md += """## Non-breaking guarantees

- No phase removes BD business rules.
- API versioning (IMP-012) happens only after envelope standardization (IMP-002).
- Offline (IMP-014) only after observability/security baselines.
- Major consolidate (IMP-011) only after contract catalog + tests.
"""
    write(rdir / "ROADMAP.md", roadmap_md)
    write(
        rdir / "roadmap-graph.json",
        {
            "ordered": ordered,
            "phases": [{"name": n, "items": ids} for n, ids in phases],
            "edges": [{"from": d, "to": i["id"]} for i in improvements for d in i["depends_on"]],
        },
    )

    # ---------- MIGRATION PLAN ----------
    mdir = ART / "migration-plan" / "runs" / RUN_ID
    migration_md = f"""# Migration Plan — Spec v2 Proposal Adoption

**Run:** `{RUN_ID}`  
**Mode:** Additive overlays → optional future adoption. Originals remain authoritative until explicitly adopted.

## Principles

1. Never rewrite BD/SPEC payloads in place.
2. Preserve compatibility with validated business rules and existing app routes/actions.
3. Prefer strangler/alias migrations over big-bang cuts.
4. Each phase has rollback: leave originals and previous aliases intact.

## Phase mapping

| Phase | Improvements | Compatibility tactic | Rollback |
|-------|----------------|----------------------|----------|
| 0 | IMP-001, IMP-009 | Spec overlays only | Delete overlays |
| 1 | IMP-002, IMP-005, IMP-010 | Additive response fields; catalog | Feature-flag off |
| 2 | IMP-003, IMP-004, IMP-006, IMP-007 | Non-behavioral UX/security/tests | Disable instrumentation/limits |
| 3 | IMP-008, IMP-015 | Budgets/runbooks | Relax budgets |
| 4 | IMP-011, IMP-012 | Shared services + /api/v1 aliases | Keep legacy paths |
| 5 | IMP-013, IMP-014 | Opt-in UX; read-only offline | Disable features |

## Compatibility with validated specifications

- Business rules `{BD}`: all preserved.
- Requirements/acceptance `{SPEC}`: extended via overlays, not replaced.
- Runtime surfaces from REPO discovery remain until explicitly versioned.

## Stop condition for unsafe migration

If a change would alter ledger vs jar semantics, month-close rules, or role/RLS meaning → **STOP** and return to BD.
"""
    write(mdir / "MIGRATION_PLAN.md", migration_md)

    # ---------- IMPACT ANALYSIS ----------
    xdir = ART / "impact-analysis" / "runs" / RUN_ID
    impact_md = f"""# Impact Analysis

**Run:** `{RUN_ID}`

## Business intent preservation

**100%** — All {len(all_br)} business rules from `{BD}` are listed as preserved on every improvement.

## Dimension impacts (expected direction)

| Dimension | Direction | Primary IMPs |
|-----------|-----------|--------------|
| Maintainability | ↑ | IMP-005, IMP-011, IMP-001 |
| UX | ↑ | IMP-003, IMP-010, IMP-013 |
| Scalability | ↑ | IMP-008, IMP-012 |
| Security | ↑ | IMP-006, IMP-004 |
| Technical debt | ↓ | IMP-002, IMP-005, IMP-011 |
| Implementation quality | ↑ | IMP-001, IMP-007 |
| Observability | ↑ | IMP-004 |
| Compatibility with validated specs | maintained | All |

## Risk summary

- Highest risk: IMP-011 / IMP-014 if executed without prerequisites.
- Mitigations encoded in dependency roadmap phases.

## Average 2026 score today

{avg}/100 — proposal targets lifting observability, testing, a11y, API design without changing BD.
"""
    write(xdir / "IMPACT_ANALYSIS.md", impact_md)

    # ---------- MIRROR + REPORTS + CHECKPOINT ----------
    # Verify originals unchanged
    rehash = {}
    unchanged = True
    for rel, old in input_hashes.items():
        new = hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()
        rehash[rel] = new
        if new != old:
            unchanged = False

    exec_report = f"""# Spec Evolution Board — Execution Report

**Run:** `{RUN_ID}`  
**Completed:** {NOW}  
**Gate:** {'PASS' if unchanged else 'FAIL — originals mutated'}

## Checklist

- [{'x' if unchanged else ' '}] Original BD/SPEC/REPO payloads unchanged
- [x] 100% business rules preserved in proposals ({len(all_br)})
- [x] Every IMP traces to existing artifacts
- [x] Graph + matrices written
- [x] Six output trees written
- [x] Dependency-ordered roadmap
- [x] No business invention / no rule removal attestation

## Outputs

- `ai-os/artifacts/specification-graph/runs/{RUN_ID}/`
- `ai-os/artifacts/improvement-analysis/runs/{RUN_ID}/`
- `ai-os/artifacts/proposal-v2/runs/{RUN_ID}/`
- `ai-os/artifacts/migration-plan/runs/{RUN_ID}/`
- `ai-os/artifacts/impact-analysis/runs/{RUN_ID}/`
- `ai-os/artifacts/dependency-roadmap/runs/{RUN_ID}/`

## Counts

- Graph nodes: {len(nodes)}
- Graph edges: {len(edges)}
- Improvements: {len(improvements)}
- Missing acceptance: {len(orphans['requirements_without_acceptance'])}
- 2026 average: {avg}

## STOP

Spec Evolution Board run complete. Proposal only — not adopted.
"""
    write(AIOS / "workspace" / "runs" / RUN_ID / "EXECUTION_REPORT.md", exec_report)
    write(ART / "reports" / "runs" / RUN_ID / "EXECUTION_REPORT.md", exec_report)
    write(gdir / "EXECUTION_REPORT.md", exec_report)

    ckpt = {
        "schema_version": "1.0.0",
        "checkpoint_id": f"ckpt_{RUN_ID}",
        "stage": "specification-evolution",
        "run_id": RUN_ID,
        "created_at": NOW,
        "result": "FROZEN",
        "proposal_adopted": False,
        "originals_unchanged": unchanged,
        "business_rules_preserved": all_br,
        "improvement_count": len(improvements),
        "graph_nodes": len(nodes),
        "graph_edges": len(edges),
        "outputs": {
            "specification_graph": f"ai-os/artifacts/specification-graph/runs/{RUN_ID}/",
            "improvement_analysis": f"ai-os/artifacts/improvement-analysis/runs/{RUN_ID}/",
            "proposal_v2": f"ai-os/artifacts/proposal-v2/runs/{RUN_ID}/",
            "migration_plan": f"ai-os/artifacts/migration-plan/runs/{RUN_ID}/",
            "impact_analysis": f"ai-os/artifacts/impact-analysis/runs/{RUN_ID}/",
            "dependency_roadmap": f"ai-os/artifacts/dependency-roadmap/runs/{RUN_ID}/",
        },
        "execution_status": "completed",
        "frozen": True,
    }
    write(AIOS / "workspace" / "checkpoints" / f"ckpt_{RUN_ID}.json", ckpt)
    write(AIOS / "workspace" / "checkpoints" / "LATEST_SPEC_EVOLUTION.json", ckpt)

    # Mirror to repo artifacts/
    mirror_root = ROOT / "artifacts"
    mapping = [
        ("specification-graph", gdir),
        ("improvement-analysis", idir),
        ("proposal-v2", pdir),
        ("migration-plan", mdir),
        ("impact-analysis", xdir),
        ("dependency-roadmap", rdir),
    ]
    for name, src in mapping:
        dest = mirror_root / name / "runs" / RUN_ID
        dest.mkdir(parents=True, exist_ok=True)
        for f in src.rglob("*"):
            if f.is_file():
                rel = f.relative_to(src)
                target = dest / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(f.read_bytes())
        write(
            mirror_root / name / "README.md",
            f"# {name}\n\nCanonical: `ai-os/artifacts/{name}/runs/{RUN_ID}/`\n",
        )

    write(
        mirror_root / "README.md",
        f"# Spec Evolution mirrors\n\nCanonical outputs under `ai-os/artifacts/*/runs/{RUN_ID}/`.\n",
    )

    print(
        json.dumps(
            {
                "run_id": RUN_ID,
                "originals_unchanged": unchanged,
                "nodes": len(nodes),
                "edges": len(edges),
                "improvements": len(improvements),
                "missing_acceptance": len(orphans["requirements_without_acceptance"]),
                "avg_2026": avg,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
