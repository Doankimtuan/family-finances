#!/usr/bin/env python3
"""AIOS structural migration Phase 2 → v0.13.0 (folder moves + reference rewrite)."""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # ai-os/
REPO = ROOT.parent
NOW = "2026-08-01T12:00:00Z"
VERSION = "0.13.0"

# Produce packs → artifacts/
ARTIFACT_PACKS = [
    "knowledge", "business", "features", "requirements", "acceptance",
    "specifications", "tasks", "roadmap", "implementation", "product",
    "product-architecture", "workflow", "architecture-v2", "tech-stack",
    "migration", "folder-structure", "redesign", "repository",
    "validation", "scores", "reports", "gaps", "execution",
]

# → governance/ (into existing governance/)
GOVERNANCE_PACKS = [
    "qualification", "policies", "reviews", "decisions",
    "recommendations", "improvements", "quality", "decision-records",
]

# → core/packages/
CORE_PACKAGES = [
    ("workers", "workers"),
    ("validators", "validators"),
    ("reviewers", "reviewers"),
    ("pipelines", "pipelines"),
    ("registry", "registry"),
    ("contracts", "contracts"),
    ("schemas", "schemas"),  # JSON schemas at ai-os/schemas
    ("templates", "templates"),  # ai-os/templates (not core/templates)
    ("roles", "roles"),
    ("configs", "configs"),
]

SKIP_DIR_NAMES = {
    "node_modules", ".git", ".next", "dist", "build", ".turbo",
    "Untitled",
}


def run(cmd: list[str], cwd: Path = REPO) -> None:
    subprocess.run(cmd, cwd=cwd, check=True)


def git_mv(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not src.exists():
        print(f"SKIP missing {src.relative_to(ROOT)}")
        return
    if dst.exists():
        # merge contents if destination exists (e.g. artifacts/)
        for child in list(src.iterdir()):
            target = dst / child.name
            if target.exists():
                if child.is_dir() and target.is_dir():
                    for sub in child.iterdir():
                        git_mv(sub, target / sub.name)
                    try:
                        child.rmdir()
                    except OSError:
                        shutil.rmtree(child, ignore_errors=True)
                else:
                    print(f"KEEP existing {target.relative_to(ROOT)}")
                    if child.is_file():
                        child.unlink()
            else:
                rel_src = child.relative_to(REPO)
                rel_dst = target.relative_to(REPO)
                try:
                    run(["git", "mv", str(rel_src), str(rel_dst)])
                except subprocess.CalledProcessError:
                    shutil.move(str(child), str(target))
        try:
            src.rmdir()
        except OSError:
            # untracked leftovers
            for child in list(src.iterdir()):
                shutil.move(str(child), str(dst / child.name))
            shutil.rmtree(src, ignore_errors=True)
        return
    rel_src = src.relative_to(REPO)
    rel_dst = dst.relative_to(REPO)
    try:
        run(["git", "mv", str(rel_src), str(rel_dst)])
    except subprocess.CalledProcessError:
        shutil.move(str(src), str(dst))


def move_all() -> None:
    packages = ROOT / "core" / "packages"
    packages.mkdir(parents=True, exist_ok=True)
    (ROOT / "docs" / "releases").mkdir(parents=True, exist_ok=True)
    (ROOT / "docs" / "guides").mkdir(parents=True, exist_ok=True)
    (ROOT / "workspace").mkdir(parents=True, exist_ok=True)

    # artifacts packs
    for name in ARTIFACT_PACKS:
        git_mv(ROOT / name, ROOT / "artifacts" / name)

    # governance packs
    for name in GOVERNANCE_PACKS:
        git_mv(ROOT / name, ROOT / "governance" / name)

    # core packages
    for src_name, dst_name in CORE_PACKAGES:
        git_mv(ROOT / src_name, packages / dst_name)

    # scaffold
    git_mv(ROOT / "framework-generator", packages / "scaffold")

    # top-level scripts → core/packages/scripts
    if (ROOT / "scripts").exists():
        git_mv(ROOT / "scripts", packages / "scripts")

    # docs
    git_mv(ROOT / "architecture", ROOT / "docs" / "architecture")
    git_mv(ROOT / "capabilities", ROOT / "docs" / "capabilities")

    for rn in ROOT.glob("RELEASE_NOTES_*.md"):
        git_mv(rn, ROOT / "docs" / "releases" / rn.name)


def build_replacements() -> list[tuple[str, str]]:
    """Longest-first textual path rewrites for content under ai-os/."""
    reps: list[tuple[str, str]] = []

    # Produce / governance (full path forms)
    for name in ARTIFACT_PACKS:
        reps.append((f"artifacts/{name}/", f"artifacts/{name}/"))  # noop guard
        reps.append((f"{name}/", f"artifacts/{name}/"))

    for name in GOVERNANCE_PACKS:
        reps.append((f"governance/{name}/", f"governance/{name}/"))
        reps.append((f"{name}/", f"governance/{name}/"))

    # Core packages
    core_map = {
        "workers": "core/packages/workers",
        "validators": "core/packages/validators",
        "reviewers": "core/packages/reviewers",
        "pipelines": "core/packages/pipelines",
        "registry": "core/packages/registry",
        "contracts": "core/packages/contracts",
        "schemas": "core/packages/schemas",
        "templates": "core/packages/templates",
        "roles": "core/packages/roles",
        "configs": "core/packages/configs",
        "scripts": "core/packages/scripts",
    }
    for old, new in core_map.items():
        reps.append((f"{new}/", f"{new}/"))
        reps.append((f"{old}/", f"{new}/"))

    reps.append(("framework-generator/", "core/packages/scaffold/"))
    reps.append(("architecture/", "docs/architecture/"))
    reps.append(("capabilities/", "docs/capabilities/"))
    reps.append(("RELEASE_NOTES_", "docs/releases/RELEASE_NOTES_"))

    # Sort by old length descending so longer keys win first when applying carefully
    # We'll apply in multiple passes with protected prefixes
    return reps


PROTECTED_PREFIXES = (
    "core/schemas/",  # Zod
    "core/templates/",  # TS template loader module
    "core/artifacts/",  # engine artifact store
    "core/packages/",  # already migrated
    "artifacts/",
    "governance/",
    "docs/",
    "runtime/",
    "skills/",
    "node_modules/",
)


def should_skip_file(path: Path) -> bool:
    rel = str(path.relative_to(ROOT))
    if any(part in SKIP_DIR_NAMES for part in path.parts):
        return True
    if path.suffix not in {
        ".md", ".json", ".yaml", ".yml", ".ts", ".tsx", ".py", ".csv", ".txt",
    }:
        return True
    # Don't rewrite Zod / engine internals incorrectly via blind replace on imports
    if rel.startswith("core/schemas/") or rel.startswith("core/lib/"):
        return False  # still may need docs path updates; handle carefully
    return False


def rewrite_text(text: str) -> str:
    """Rewrite path references with protection against double-prefixing and engine paths."""
    special = [
        ('path.join(this.aiosRoot, "schemas")', 'path.join(this.aiosRoot, "core/packages/schemas")'),
        ('path.join(this.aiosRoot, "templates")', 'path.join(this.aiosRoot, "core/packages/templates")'),
        ('path.join(this.aiosRoot, "workers")', 'path.join(this.aiosRoot, "core/packages/workers")'),
        ('path.join(this.aiosRoot, "pipelines")', 'path.join(this.aiosRoot, "core/packages/pipelines")'),
        ('path.join(this.aiosRoot, "architecture/', 'path.join(this.aiosRoot, "docs/architecture/'),
        ('"registry/', '"core/packages/registry/'),
        ("'registry/", "'core/packages/registry/"),
        ('"policies/', '"governance/policies/'),
        ("'policies/", "'governance/policies/"),
        ('overview: path.join(this.aiosRoot, "architecture/OVERVIEW.md")',
         'overview: path.join(this.aiosRoot, "docs/architecture/OVERVIEW.md")'),
        ('traceability: path.join(this.aiosRoot, "architecture/TRACEABILITY.md")',
         'traceability: path.join(this.aiosRoot, "docs/architecture/TRACEABILITY.md")'),
        ('migrations: path.join(this.aiosRoot, "architecture/MIGRATIONS.md")',
         'migrations: path.join(this.aiosRoot, "docs/architecture/MIGRATIONS.md")'),
        ('return path.join(this.aiosRoot, "templates")',
         'return path.join(this.aiosRoot, "core/packages/templates")'),
        # getPipeline style
        ('`pipelines/${', '`core/packages/pipelines/${'),
        ('"pipelines/" +', '"core/packages/pipelines/" +'),
        ("'pipelines/' +", "'core/packages/pipelines/' +"),
        ('path.join(root, "pipelines"', 'path.join(root, "core/packages/pipelines"'),
        ('path.join(root, "core/packages/workers"', 'path.join(root, "core/packages/workers"'),
        ('path.join(root, "registry"', 'path.join(root, "core/packages/registry"'),
        ('path.join(root, "validators"', 'path.join(root, "core/packages/validators"'),
        ('path.join(root, "reviewers"', 'path.join(root, "core/packages/reviewers"'),
        ('path.join(root, "schemas"', 'path.join(root, "core/packages/schemas"'),
        ('path.join(root, "contracts"', 'path.join(root, "core/packages/contracts"'),
        ('path.join(root, "capabilities"', 'path.join(root, "docs/capabilities"'),
        ('path.join(root, "qualification"', 'path.join(root, "governance/qualification"'),
        ('path.join(root, "framework-generator"', 'path.join(root, "core/packages/scaffold"'),
        ('path.join(root, "architecture"', 'path.join(root, "docs/architecture"'),
    ]
    for a, b in special:
        text = text.replace(a, b)

    # Protect engine subtrees by temporarily masking
    masks: list[tuple[str, str]] = []
    protect = [
        "core/knowledge/", "core/orchestrator/", "core/schemas/", "core/templates/",
        "core/artifacts/", "core/lib/", "core/memory/", "core/planner/", "core/scripts/",
        "core/configs/", "core/packages/", "runtime/", "skills/", "docs/", "artifacts/",
        "governance/", "workspace/",
    ]
    masked = text
    for i, p in enumerate(protect):
        token = f"__PROTECT_{i}__"
        masks.append((token, p))
        masked = masked.replace(p, token)

    pairs = [
        (r"(?<![\w/])pipelines/", "core/packages/pipelines/"),
        (r"(?<![\w/])workers/", "core/packages/workers/"),
        (r"(?<![\w/])validators/", "core/packages/validators/"),
        (r"(?<![\w/])reviewers/", "core/packages/reviewers/"),
        (r"(?<![\w/])registry/", "core/packages/registry/"),
        (r"(?<![\w/])contracts/", "core/packages/contracts/"),
        (r"(?<![\w/])schemas/", "core/packages/schemas/"),
        (r"(?<![\w/])templates/", "core/packages/templates/"),
        (r"(?<![\w/])roles/", "core/packages/roles/"),
        (r"(?<![\w/])configs/", "core/packages/configs/"),
        (r"(?<![\w/])framework-generator/", "core/packages/scaffold/"),
        (r"(?<![\w/])architecture/", "docs/architecture/"),
        (r"(?<![\w/])capabilities/", "docs/capabilities/"),
    ]
    for name in ARTIFACT_PACKS:
        pairs.append((rf"(?<![\w/-]){re.escape(name)}/", f"artifacts/{name}/"))
    for name in GOVERNANCE_PACKS:
        pairs.append((rf"(?<![\w/-]){re.escape(name)}/", f"governance/{name}/"))

    for pat, repl in pairs:
        masked = re.sub(pat, repl, masked)

    for token, p in masks:
        masked = masked.replace(token, p)

    fixes = [
        ("core/packages/core/packages/", "core/packages/"),
        ("artifacts/artifacts/", "artifacts/"),
        ("governance/governance/", "governance/"),
        ("docs/docs/", "docs/"),
        ("docs/architecture/docs/architecture/", "docs/architecture/"),
        ("core/packages/templates/loader", "core/templates/loader"),
        ('from "../core/packages/schemas/', 'from "../schemas/'),
        ('from "./core/packages/schemas/', 'from "./schemas/'),
        ('from "core/packages/schemas/', 'from "../schemas/'),
        # relative TS imports inside core that wrongly got packages prefix
        ("../packages/schemas/", "../schemas/"),
    ]
    for a, b in fixes:
        masked = masked.replace(a, b)

    return masked


def rewrite_tree() -> int:
    changed = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR_NAMES]
        for name in filenames:
            path = Path(dirpath) / name
            if should_skip_file(path):
                continue
            # Never rewrite this migration script mid-flight wrongly
            if path.name.startswith("migrate-aios-structure"):
                continue
            try:
                original = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            updated = rewrite_text(original)
            # Fix TypeScript imports that accidentally pointed at packages schemas
            if path.suffix == ".ts":
                updated = re.sub(
                    r'from "(\.\./)+core/packages/schemas/',
                    lambda m: m.group(0).replace("core/packages/schemas/", "schemas/"),
                    updated,
                )
                updated = updated.replace(
                    'from "../schemas/common"',
                    'from "../schemas/common"',
                )
                # knowledge base imports
                if "from \"../schemas/" in updated or "from '../schemas/" in updated:
                    pass
            if updated != original:
                path.write_text(updated, encoding="utf-8")
                changed += 1
    return changed


def write_anchors() -> None:
    (ROOT / "workspace" / "README.md").write_text(
        "# workspace/\n\nLocal run state (checkpoints, scratch logs). Not source of truth.\n",
        encoding="utf-8",
    )
    (ROOT / "workspace" / ".gitkeep").write_text("", encoding="utf-8")

    # Top-level AGENTS stub
    (ROOT / "AGENTS.md").write_text(
        f"""# AIOS Agent Entry Contract

**Framework {VERSION} — Capability-first.**

Canonical guide: [`docs/guides/AGENTS.md`](docs/guides/AGENTS.md)  
Simplified architecture: [`docs/architecture/SIMPLIFIED_ARCHITECTURE.md`](docs/architecture/SIMPLIFIED_ARCHITECTURE.md)  
Capabilities: [`docs/capabilities/README.md`](docs/capabilities/README.md)

## User / agent UX

```
@Run full
@Run incremental
@Run validate
@Run review
@Run benchmark
@Run resume
```

Do **not** manually invoke individual workers for normal operation.

## Layout (v0.13.0)

| Domain | Path |
|--------|------|
| Core packages | `core/packages/` |
| Runtime | `runtime/` |
| Skills | `skills/` |
| Artifacts | `artifacts/` |
| Governance | `governance/` |
| Docs | `docs/` |
| Workspace | `workspace/` |
""",
        encoding="utf-8",
    )

    guides = ROOT / "docs" / "guides"
    guides.mkdir(parents=True, exist_ok=True)
    # If AGENTS body was moved incorrectly, recover from docs if needed
    src_agents = ROOT / "docs" / "guides" / "AGENTS.md"
    if not src_agents.exists():
        # write full guide
        src_agents.write_text(
            f"""# AIOS Agent Guide (v{VERSION})

Capability-first operating model after structural migration.

## Domains

- `core/packages/` — workers, validators, reviewers, pipelines, registry, contracts, JSON schemas, templates
- `core/` — TypeScript engine (knowledge, orchestrator, Zod schemas)
- `runtime/` — execution / @Run
- `skills/` — skill packages
- `artifacts/` — all produce packs
- `governance/` — qualification, policies, reviews, decisions
- `docs/` — architecture, releases, capabilities, guides

## Smokes

See root `package.json` scripts `aios:*:smoke`.

## Refactoring

Board: `docs/architecture/REFACTORING_BOARD_REPORT.md`  
Migration: `docs/releases/MIGRATION_0.12_to_0.13.md`
""",
            encoding="utf-8",
        )

    (ROOT / "VERSION").write_text(VERSION + "\n", encoding="utf-8")

    (ROOT / "core" / "packages" / "README.md").write_text(
        """# core/packages

Framework packages (workers, validators, reviewers, pipelines, registry, contracts, JSON schemas, templates, scaffold).

TypeScript engine code remains in `core/` siblings (`knowledge/`, `orchestrator/`, Zod `core/schemas/`).
""",
        encoding="utf-8",
    )


def fix_get_pipeline_paths() -> None:
    """Ensure KnowledgeBase loads pipelines/registry from core/packages."""
    base = ROOT / "core" / "knowledge" / "base.ts"
    text = base.read_text(encoding="utf-8")
    text = text.replace(
        'return this.readJson("core/packages/registry/',
        'return this.readJson("core/packages/registry/',
    )
    # getPipeline typically uses pipelines/${id}
    text2 = rewrite_text(text)
    # Fix any broken Zod import
    text2 = text2.replace(
        'from "../core/packages/schemas/common"',
        'from "../schemas/common"',
    )
    text2 = text2.replace(
        'from "core/packages/schemas/common"',
        'from "../schemas/common"',
    )
    base.write_text(text2, encoding="utf-8")

    loader = ROOT / "core" / "templates" / "loader.ts"
    if loader.exists():
        t = loader.read_text(encoding="utf-8")
        t = t.replace(
            'return path.join(this.aiosRoot, "templates")',
            'return path.join(this.aiosRoot, "core/packages/templates")',
        )
        t = rewrite_text(t)
        loader.write_text(t, encoding="utf-8")


def write_release_notes() -> None:
    notes = ROOT / "docs" / "releases" / "RELEASE_NOTES_0.13.0.md"
    notes.write_text(
        f"""# AIOS Release Notes — 0.13.0

**Date:** 2026-08-01  
**Phase:** Structural migration Phase 2–5 (folder domains)

## Summary

Reorganized AIOS from ~50 mixed top-level folders into domain roots while preserving all worker/pipeline ids and capabilities.

## Layout

| Domain | Path |
|--------|------|
| Core packages | `core/packages/` |
| Runtime | `runtime/` |
| Skills | `skills/` |
| Artifacts | `artifacts/` |
| Governance | `governance/` |
| Docs | `docs/` |
| Workspace | `workspace/` |

## Compatibility

- Worker ids, pipeline ids, artifact types unchanged
- JSON schemas live in `core/packages/schemas/` (Zod remains `core/schemas/`)
- Capability model unchanged (paths under `docs/capabilities/`)

## Verification

```bash
npm run aios:capabilities:smoke
npm run aios:discovery:smoke
npm run aios:runtime-engine:smoke
npm run aios:qualification-framework:smoke
# …full battery in MIGRATION_0.12_to_0.13.md
```
""",
        encoding="utf-8",
    )

    mig = ROOT / "docs" / "releases" / "MIGRATION_0.12_to_0.13.md"
    mig.write_text(
        """# Migration 0.12.0 → 0.13.0

## What changed

Structural folder migration only. No worker MERGE/DELETE (Phase 3B still deferred).

## Path mapping (high level)

| Old | New |
|-----|-----|
| `workers/` | `core/packages/workers/` |
| `validators/` | `core/packages/validators/` |
| `reviewers/` | `core/packages/reviewers/` |
| `pipelines/` | `core/packages/pipelines/` |
| `registry/` | `core/packages/registry/` |
| `contracts/` | `core/packages/contracts/` |
| `schemas/` (JSON) | `core/packages/schemas/` |
| `templates/` | `core/packages/templates/` |
| `framework-generator/` | `core/packages/scaffold/` |
| produce packs (`features/`, …) | `artifacts/<pack>/` |
| `qualification/`, `reviews/`, … | `governance/<pack>/` |
| `architecture/` | `docs/architecture/` |
| `capabilities/` | `docs/capabilities/` |
| `RELEASE_NOTES_*.md` | `docs/releases/` |

## Phase 3B (deferred)

Physical micro-worker GENERALIZE/MERGE remains deferred until capability→worker runtime adapters exist.
""",
        encoding="utf-8",
    )


def patch_package_json() -> None:
    pkg = REPO / "package.json"
    data = json.loads(pkg.read_text())
    # smoke scripts still point at ai-os/core/scripts — unchanged
    pkg.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def update_migrations_doc() -> None:
    path = ROOT / "docs" / "architecture" / "MIGRATIONS.md"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    block = """## 0.12.0 → 0.13.0 (2026-08-01)

Structural domain migration (workers/pipelines not deleted).

| Change | Detail |
|--------|--------|
| core/packages | workers, validators, reviewers, pipelines, registry, contracts, JSON schemas, templates, scaffold |
| artifacts/ | all produce packs |
| governance/ | qualification, policies, reviews, decisions, quality, … |
| docs/ | architecture, capabilities, releases |
| workspace/ | local run scratch |

"""
    if "## 0.12.0 → 0.13.0" not in text:
        marker = "## 0.11.0 → 0.12.0"
        if marker in text:
            text = text.replace(marker, block + marker)
        else:
            text = block + text
        path.write_text(text, encoding="utf-8")


def main() -> None:
    print("Phase 2: moving folders…")
    move_all()
    print("Phase 2: rewriting references…")
    n = rewrite_tree()
    print(f"Rewrote {n} files")
    fix_get_pipeline_paths()
    write_anchors()
    write_release_notes()
    update_migrations_doc()
    patch_package_json()
    # Ensure docs/capabilities/registry still valid framework_version
    reg = ROOT / "docs" / "capabilities" / "registry.json"
    if reg.exists():
        data = json.loads(reg.read_text())
        data["framework_version"] = VERSION
        data["updated_at"] = NOW
        reg.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print("Done Phase 2 moves + rewrites")


if __name__ == "__main__":
    main()
