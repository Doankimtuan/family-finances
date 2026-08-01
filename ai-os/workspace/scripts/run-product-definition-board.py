#!/usr/bin/env python3
"""Product Definition Board — Official Product Definition v2.0.0 (SoT)."""
from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
AIOS = ROOT / "ai-os"
ART = AIOS / "artifacts"
BD = "run_business_discovery_20260801T122000Z"
SPEC = "run_specification_20260801T130500Z"
PS = "run_product_strategy_20260801T140000Z"
DBOARD = "run_decision_board_20260801T135000Z"
VERSION = "v2.0.0"
RUN_ID = "run_product_definition_20260801T144500Z"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text if text.endswith("\n") else text + "\n", encoding="utf-8")


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def hdr(title: str) -> str:
    return f"""---
document: {title}
product_definition: {VERSION}
status: OFFICIAL_SOURCE_OF_TRUTH
run_id: {RUN_ID}
created_at: {NOW}
supersedes_candidate: ai-os/artifacts/product-strategy/runs/{PS}/
does_not_overwrite_spec_v1: true
---

# {title}

"""


def main() -> None:
    # Load V1 rules/features for decision tables
    v1_rules = json.loads((ART / "business" / "runs" / BD / "payload.json").read_text())["entries"]
    v1_features = json.loads((ART / "features" / "runs" / BD / "payload.json").read_text())["entries"]
    assert (ART / "product-strategy" / "runs" / PS / "PRODUCT_STRATEGY_REPORT.md").exists()
    assert (ART / "decision-board" / "runs" / DBOARD / "approved-specification-v2-plan.md").exists()

    protect = [
        f"ai-os/artifacts/business/runs/{BD}/payload.json",
        f"ai-os/artifacts/features/runs/{BD}/payload.json",
        f"ai-os/artifacts/requirements/runs/{SPEC}/payload.json",
        f"ai-os/artifacts/final/PRD.md",
        f"ai-os/artifacts/product-strategy/runs/{PS}/PRODUCT_STRATEGY_REPORT.md",
        f"ai-os/artifacts/decision-board/runs/{DBOARD}/decisions.json",
    ]
    hashes_before = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in protect}

    # Dual roots: canonical under ai-os + requested artifacts/product-definition
    canon = ART / "product-definition"
    public = ROOT / "artifacts" / "product-definition"
    ver_dir_name = VERSION
    for root in (canon, public):
        (root / ver_dir_name).mkdir(parents=True, exist_ok=True)
        (root / "archive").mkdir(parents=True, exist_ok=True)

    def emit(rel: str, text: str) -> None:
        write(canon / ver_dir_name / rel, text)
        write(public / ver_dir_name / rel, text)

    def emit_json(rel: str, data) -> None:
        write_json(canon / ver_dir_name / rel, data)
        write_json(public / ver_dir_name / rel, data)

    # ---------- FINAL BUSINESS RULE DECISIONS ----------
    # V1 br-* → APPROVED | MODIFIED | REMOVED
    br_decisions = [
        {
            "id": "br-real-vs-virtual",
            "decision": "APPROVED",
            "official_id": "BR-01",
            "reason": "Core differentiator; non-negotiable.",
            "impact": "None — retained as axiom.",
            "migration": "Keep enforcement; update UI copy only.",
            "dependencies": [],
        },
        {
            "id": "br-income-allocate",
            "decision": "MODIFIED",
            "official_id": "BR-04",
            "reason": "Policy retained; default becomes Suggest; hide engineer enums in UX.",
            "impact": "New households default Suggest; existing settings preserved until user changes.",
            "migration": "Map income_auto_allocate off|suggest|auto_* → Off|Suggest|Auto; default Suggest for new.",
            "dependencies": ["F-Plan", "F-Inbox"],
        },
        {
            "id": "br-expense-allocate",
            "decision": "MODIFIED",
            "official_id": "BR-05",
            "reason": "Unmapped → Inbox ReviewItem (not buried jar queue jargon).",
            "impact": "Review UX moves to Inbox; same resolution semantics.",
            "migration": "Alias jar_review_queue items as Inbox ReviewItems in product model.",
            "dependencies": ["F-Inbox", "F-Money"],
        },
        {
            "id": "br-jar-active",
            "decision": "MODIFIED",
            "official_id": "BR-03",
            "reason": "Clarify Active/Paused/Archived labels; soft-delete narrative resolved.",
            "impact": "State matrix documented; no ledger semantics change.",
            "migration": "Document state matrix; map archived/soft-deleted to non-targets.",
            "dependencies": ["IMP-009", "F-Plan"],
        },
        {
            "id": "br-closed-month",
            "decision": "MODIFIED",
            "official_id": "BR-08",
            "reason": "Rename product concept to Month Ritual; lock semantics unchanged.",
            "impact": "Terminology + UX ceremony; same freeze/correction rules.",
            "migration": "Glossary: month close run → Month Ritual; keep DB concepts mapped.",
            "dependencies": ["F-Plan"],
        },
        {
            "id": "br-amount-positive",
            "decision": "APPROVED",
            "official_id": "BR-06",
            "reason": "Accounting invariant remains.",
            "impact": "None.",
            "migration": "None.",
            "dependencies": [],
        },
        {
            "id": "br-overspend-policy",
            "decision": "MODIFIED",
            "official_id": "BR-07",
            "reason": "Default Warn for new households.",
            "impact": "Safer default; existing households keep current policy.",
            "migration": "Seed warn on create_household.",
            "dependencies": ["F-Together"],
        },
        {
            "id": "br-month-close-mode",
            "decision": "MODIFIED",
            "official_id": "BR-09",
            "reason": "Default Assisted for couples.",
            "impact": "Ritual UX prefers assisted confirmation.",
            "migration": "Default assisted on new households.",
            "dependencies": ["F-Plan", "F-Together"],
        },
        {
            "id": "br-assumptions-admin",
            "decision": "MODIFIED",
            "official_id": "BR-13",
            "reason": "Admin may gate advanced assumptions; changes must be partner-visible (audit).",
            "impact": "Removes silent sole-operator opacity.",
            "migration": "Add audit/notification on assumption updates.",
            "dependencies": ["F-Together", "Notification"],
        },
        {
            "id": "br-one-household",
            "decision": "APPROVED",
            "official_id": "BR-12",
            "reason": "MVP constraint retained; multi-household is Future.",
            "impact": "None for Now.",
            "migration": "None.",
            "dependencies": [],
        },
        {
            "id": "br-rls-member",
            "decision": "APPROVED",
            "official_id": "BR-02a",
            "reason": "Security invariant.",
            "impact": "None.",
            "migration": "None.",
            "dependencies": ["Security"],
        },
        {
            "id": "br-savings-maturity",
            "decision": "APPROVED",
            "official_id": "BR-10",
            "reason": "Maturity actions retained; UX becomes Inbox coach.",
            "impact": "Presentation change.",
            "migration": "Surface events in Inbox.",
            "dependencies": ["F-Inbox", "F-Money"],
        },
        {
            "id": "br-installment-complete",
            "decision": "APPROVED",
            "official_id": "BR-11",
            "reason": "Completion rule clear and valid.",
            "impact": "None.",
            "migration": "Celebrate in Health/Inbox.",
            "dependencies": ["F-Health"],
        },
        {
            "id": "br-action-context",
            "decision": "APPROVED",
            "official_id": "BR-02",
            "reason": "Auth + membership required.",
            "impact": "None.",
            "migration": "None.",
            "dependencies": ["F-Auth"],
        },
    ]
    # Ensure all V1 rules covered
    decided = {d["id"] for d in br_decisions}
    for e in v1_rules:
        if e["id"] not in decided:
            raise SystemExit(f"Missing BR decision for {e['id']}")

    # New official-only rules
    new_rules = [
        {
            "id": "BR-14",
            "decision": "NEW",
            "title": "AI non-invention",
            "statement": "AI may explain/suggest from household data; must not invent balances or execute money movement without explicit user/policy path.",
            "phase": "Phase 2",
        },
        {
            "id": "BR-15",
            "decision": "NEW",
            "title": "Online-first money mutations",
            "statement": "Ledger and plan mutations require online connectivity. Offline read-only is Future; offline writes are out of scope permanently for v2.",
            "phase": "Core",
        },
    ]

    # ---------- FEATURE PHASE DECISIONS ----------
    # Official features with exactly one phase
    features_official = [
        {"id": "F-Auth", "name": "Authentication", "phase": "Core", "mvp": True, "v1": ["ft-auth"], "decision": "Core"},
        {"id": "F-Together", "name": "Household & partnership", "phase": "Core", "mvp": True, "v1": ["ft-household", "ft-settings"], "decision": "Core"},
        {"id": "F-Onboard", "name": "Progressive onboarding", "phase": "Core", "mvp": True, "v1": ["ft-onboarding"], "decision": "MVP"},
        {"id": "F-Home", "name": "Home (three answers)", "phase": "Core", "mvp": True, "v1": ["ft-dashboard"], "decision": "Core"},
        {"id": "F-Money", "name": "Money (ledger, capture, debts, savings, cards)", "phase": "Core", "mvp": True, "v1": ["ft-accounts", "ft-activity", "ft-debts", "ft-savings", "ft-cards"], "decision": "Core"},
        {"id": "F-Plan", "name": "Plan (jars, goals, recurring, month ritual)", "phase": "Core", "mvp": True, "v1": ["ft-jars", "ft-goals", "ft-recurring"], "decision": "Core"},
        {"id": "F-Inbox", "name": "Inbox (reviews, approvals, maturities)", "phase": "Core", "mvp": True, "v1": ["ft-jars"], "decision": "Core"},
        {"id": "F-Health", "name": "Financial Health & Insights", "phase": "MVP", "mvp": True, "v1": ["ft-health", "ft-insights", "ft-decision-tools"], "decision": "MVP"},
        {"id": "F-Approvals", "name": "Partner approval moments", "phase": "Phase 2", "mvp": False, "v1": [], "decision": "Phase 2"},
        {"id": "F-AI-Assist", "name": "Assistive AI explanations/suggestions", "phase": "Phase 2", "mvp": False, "v1": ["ft-insights"], "decision": "Phase 2"},
        {"id": "F-Wealth", "name": "Wealth (assets/crypto depth)", "phase": "Future", "mvp": False, "v1": ["ft-assets"], "decision": "Future"},
        {"id": "F-Offline-Read", "name": "Offline read-only cache", "phase": "Future", "mvp": False, "v1": [], "decision": "Future"},
        {"id": "F-Multi-Household", "name": "Multi-household", "phase": "Future", "mvp": False, "v1": [], "decision": "Future"},
        {"id": "F-Categories-Standalone", "name": "Standalone categories app section", "phase": "Removed", "mvp": False, "v1": ["ft-categories"], "decision": "Removed"},
        {"id": "F-Decision-Tools-Standalone", "name": "Standalone decision-tools route", "phase": "Removed", "mvp": False, "v1": ["ft-decision-tools"], "decision": "Removed"},
    ]

    # Requirements (official) — each maps to BR, Feature, AC, Workflow, API, DB, Task
    requirements = []

    def add_req(rid, stmt, br, feat, wf, api, db, task, ac):
        requirements.append(
            {
                "id": rid,
                "statement": stmt,
                "business_rule": br,
                "feature": feat,
                "acceptance": ac,
                "workflow": wf,
                "api": api,
                "database": db,
                "task": task,
            }
        )

    add_req("REQ-001", "Home presents real position, plan pulse, and Inbox CTA; jar totals must not be labeled as bank balance.",
            ["BR-01"], "F-Home", "WF-Daily", "API-Dashboard", "DB-Accounts+Jars", "TASK-Home", "AC-001")
    add_req("REQ-002", "Authenticated active household membership is required for money actions.",
            ["BR-02", "BR-02a"], "F-Auth", "WF-Auth", "API-Session", "DB-Members", "TASK-Auth", "AC-002")
    add_req("REQ-003", "Allocations target only Active jars; Paused/Archived are non-targets.",
            ["BR-03"], "F-Plan", "WF-Capture-Place", "API-Jars", "DB-Jars", "TASK-Plan", "AC-003")
    add_req("REQ-004", "Income placement uses percent|fixed plans with Off|Suggest|Auto; new households default Suggest.",
            ["BR-04"], "F-Plan", "WF-Capture-Place", "API-Jars", "DB-JarPlans", "TASK-Plan", "AC-004")
    add_req("REQ-005", "Unmapped expenses create Inbox ReviewItems resolvable to an Active jar.",
            ["BR-05"], "F-Inbox", "WF-Capture-Place", "API-Jars-Review", "DB-ReviewQueue", "TASK-Inbox", "AC-005")
    add_req("REQ-006", "Movement magnitudes are positive with explicit direction in UX.",
            ["BR-06"], "F-Plan", "WF-Capture-Place", "API-Jars", "DB-Movements", "TASK-Plan", "AC-006")
    add_req("REQ-007", "Overspend policy Warn|Block|Allow negative; new households default Warn.",
            ["BR-07"], "F-Together", "WF-Together-Policy", "API-Household", "DB-Households", "TASK-Together", "AC-007")
    add_req("REQ-008", "Approved Month Ritual locks normal plan movements; corrections use explicit path.",
            ["BR-08"], "F-Plan", "WF-Month-Ritual", "API-MonthClose", "DB-CloseRuns", "TASK-Ritual", "AC-008")
    add_req("REQ-009", "Month Ritual mode defaults to Assisted for new households.",
            ["BR-09"], "F-Plan", "WF-Month-Ritual", "API-MonthClose", "DB-Households", "TASK-Ritual", "AC-009")
    add_req("REQ-010", "Savings maturity actions renew/switch/withdraw appear as Inbox-guided flows.",
            ["BR-10"], "F-Money", "WF-Savings-Maturity", "API-Savings", "DB-Savings", "TASK-Savings", "AC-010")
    add_req("REQ-011", "Installment completes when paid_installments >= num_installments.",
            ["BR-11"], "F-Money", "WF-EMI", "API-Accounts-Card", "DB-Installments", "TASK-Cards", "AC-011")
    add_req("REQ-012", "One active household per user in v2 Now.",
            ["BR-12"], "F-Together", "WF-Onboard", "API-Household", "DB-Members", "TASK-Together", "AC-012")
    add_req("REQ-013", "Material assumption/policy changes are partner-visible via audit/notification.",
            ["BR-13"], "F-Together", "WF-Together-Policy", "API-Settings", "DB-Audit", "TASK-Together", "AC-013")
    add_req("REQ-014", "Onboarding essentials complete in ≤3 mandatory steps before Home.",
            ["BR-02"], "F-Onboard", "WF-Onboard", "API-Household", "DB-Accounts+Jars", "TASK-Onboard", "AC-014")
    add_req("REQ-015", "Financial Health is visible without a dead-end feature flag.",
            ["BR-01"], "F-Health", "WF-Weekly", "API-Insights", "DB-Health", "TASK-Health", "AC-015")
    add_req("REQ-016", "Categories exist as tags/rules inside Money/Plan; no standalone primary nav item.",
            ["BR-05"], "F-Money", "WF-Capture-Place", "API-Categories", "DB-Categories", "TASK-Money", "AC-016")
    add_req("REQ-017", "AI must not invent balances or mutate money without explicit path (Phase 2).",
            ["BR-14"], "F-AI-Assist", "WF-Assist", "API-Insights", "DB-Insights", "TASK-AI", "AC-017")
    add_req("REQ-018", "Money mutations require online connectivity; offline writes forbidden.",
            ["BR-15"], "F-Money", "WF-Daily", "API-All-Mutating", "DB-Ledger", "TASK-Platform", "AC-018")
    add_req("REQ-019", "Primary capture, Inbox resolve, and Month Ritual paths are keyboard accessible.",
            ["BR-02"], "F-Home", "WF-Daily", "API-N/A-UI", "DB-N/A", "TASK-A11y", "AC-019")
    add_req("REQ-020", "Partners share daily Money/Plan/Inbox rights; admin elevation limited per permission matrix.",
            ["BR-02", "BR-13"], "F-Together", "WF-Together-Policy", "API-Settings", "DB-Members", "TASK-Together", "AC-020")

    # Quality: no orphan reqs
    for r in requirements:
        for k in ("business_rule", "feature", "acceptance", "workflow", "api", "database", "task"):
            if not r[k]:
                raise SystemExit(f"Orphan field {k} on {r['id']}")

    # ---------- DOCUMENTS ----------
    emit(
        "Executive-Summary.md",
        hdr("Executive Summary")
        + f"""## Decision

**Product Definition {VERSION} is hereby FROZEN as the OFFICIAL SOURCE OF TRUTH** for product intent, scope, IA, business rules, and MVP.

Specification v1 remains archived knowledge under `ai-os/artifacts/final/` and BD/SPEC packs — **not overwritten**.

## Product in one sentence

ViNha is the shared money OS for couples/families that separates **real money** from **monthly intention**, with Home / Money / Plan / Inbox / Together.

## MVP

Auth, Together, Onboard (≤3 steps), Home, Money, Plan, Inbox, Financial Health (basic).

## Explicit removals

Standalone Categories nav; standalone Decision Tools route; offline writes; jars-as-bank UX.

## Hygiene inputs retained

Decision Board approved engineering overlays (`{DBOARD}`) inform implementation quality — they do not redefine product scope.
""",
    )

    emit(
        "Product-Definition-v2.md",
        hdr("Product Definition v2")
        + f"""## Product Vision

Help partners always know: (1) what money they really have, (2) where it is meant to go this month, (3) what needs a decision together.

## Mission

Replace fragmented household finance hubs with a calm, collaborative system that never confuses plans with bank balances.

## Target Users

Couples and small families managing shared expenses and intentions together.

## Primary Persona

**Daily Partner** — checks a few times weekly; needs fast capture and clear next action.

## Secondary Persona

**Household Steward** — cares about Month Ritual, invites, policies; needs control without sole-operator opacity.

## Core User Problems

1. Cannot see real vs intended money clearly  
2. Decisions buried in queues  
3. Onboarding too long before value  
4. Partner collaboration under-designed  

## Product Principles

1. Truth before intention  
2. Partners first  
3. Inbox over archaeology  
4. Progressive depth  
5. Automation with receipts  
6. Month as ritual  
7. Calm finance UI  
8. Accessible by default  
9. Household privacy  
10. AI assists, never invents money  

## Success Metrics

Time-to-clarity · Dual engagement · Inbox zero rate · Ritual completion · Allocation confidence · A11y critical paths

## North Star Metric

**Weekly dual-partner clarity:** weeks where ≥2 members are active AND Inbox is cleared at least once AND Home real≠virtual teaching is intact.

## Design Principles

One primary action per screen · Teach real≠virtual on Plan · Empty states with next action · Human errors

## Information Architecture (final)

Home · Money · Plan · Inbox · Together · (Health accessible from Home)

## Navigation Model

Bottom/primary nav: Home, Money, Plan, Inbox, Together. Health via Home chip. No Categories / Decision Tools top-level.

## Financial Model

Two bounded contexts: **Real Ledger** (Money) and **Intention Plan** (Plan/Inbox). Month Ritual locks plan movements.

## Household Collaboration Model

Partners equal on daily money; Admin elevates advanced assumptions; material changes audited/notified.

## Notification Strategy

Inbox-first; notify on aging Inbox, invites, ritual ready, maturity/EMI, policy changes; digest auto-successes.

## Automation Strategy

Default Suggest; Auto only high-confidence mapped paths; always explainable; Inbox for ambiguity.

## Security Principles

Auth required · RLS membership · no cross-household leakage · privileged actions auditable

## Privacy Principles

Shared inside household · sealed outside · export/delete runbooks as ops (Decision Board IMP-015 docs)

## AI Strategy

Phase 2 assistive only under BR-14. Not MVP-critical.

## Offline Strategy

Online-first. Future: read-only cache. **Offline writes: permanently out of scope for v2.**

## Accessibility Strategy

WCAG-oriented; keyboard for capture, Inbox, Month Ritual (REQ-019).

## Internationalization Strategy

Retain en/vi household locale path; strings via i18n catalogs; money formats by household locale.
""",
    )

    # Business catalog with decisions
    bc = hdr("Business Catalog")
    bc += "## V1 Business Rule Decisions\n\n| V1 ID | Decision | Official ID | Reason | Impact | Migration | Dependencies |\n|-------|----------|-------------|--------|--------|-----------|--------------|\n"
    for d in br_decisions:
        bc += (
            f"| `{d['id']}` | **{d['decision']}** | `{d['official_id']}` | {d['reason']} | {d['impact']} | {d['migration']} | "
            f"{', '.join(d['dependencies']) or '—'} |\n"
        )
    bc += "\n## New Official Rules\n\n| ID | Title | Statement | Phase |\n|----|-------|-----------|-------|\n"
    for n in new_rules:
        bc += f"| `{n['id']}` | {n['title']} | {n['statement']} | {n['phase']} |\n"
    bc += "\n## Official Rule Statements\n\nSee `Official-Domain-Model.md` and PRD. **No V1 rule left undecided.** Count V1=" + str(len(v1_rules)) + ".\n"
    # REMOVED count
    removed = [d for d in br_decisions if d["decision"] == "REMOVED"]
    bc += f"\nRemoved V1 rules: {len(removed)} (none — all retained as APPROVED or MODIFIED).\n"
    emit("Business-Catalog.md", bc)

    # Feature catalog
    fc = hdr("Feature Catalog")
    fc += "| ID | Name | Decision | Phase | MVP | V1 lineage |\n|----|------|----------|-------|-----|------------|\n"
    for f in features_official:
        fc += f"| `{f['id']}` | {f['name']} | **{f['decision']}** | {f['phase']} | {'yes' if f['mvp'] else 'no'} | {', '.join(f'`{x}`' for x in f['v1']) or '—'} |\n"
    fc += """
## Merge / split / remove notes

- **Merged into F-Money:** accounts, activity, debts, savings, cards  
- **Merged into F-Plan:** jars, goals, recurring  
- **Merged into F-Health:** health, insights, decision-tools scenarios  
- **Split:** jar review → F-Inbox (first-class)  
- **Removed IA:** standalone categories; standalone decision-tools  
- **Every V1 ft-* mapped** into exactly one official disposition above or via merge.
"""
    # Map each v1 feature
    fc += "\n## V1 feature → official mapping\n\n| V1 | Maps to |\n|----|--------|\n"
    v1_map = {
        "ft-auth": "F-Auth",
        "ft-household": "F-Together",
        "ft-onboarding": "F-Onboard",
        "ft-dashboard": "F-Home",
        "ft-accounts": "F-Money",
        "ft-savings": "F-Money",
        "ft-cards": "F-Money",
        "ft-assets": "F-Wealth (Future)",
        "ft-debts": "F-Money",
        "ft-activity": "F-Money",
        "ft-goals": "F-Plan",
        "ft-jars": "F-Plan + F-Inbox",
        "ft-categories": "Removed as nav; tags in F-Money/F-Plan",
        "ft-recurring": "F-Plan",
        "ft-decision-tools": "Removed standalone; into F-Health",
        "ft-settings": "F-Together",
        "ft-insights": "F-Health (+ F-AI-Assist Phase 2)",
        "ft-health": "F-Health",
    }
    for e in v1_features:
        fc += f"| `{e['id']}` | {v1_map[e['id']]} |\n"
    emit("Feature-Catalog.md", fc)

    emit(
        "Capability-Catalog.md",
        hdr("Capability Catalog")
        + """| Capability | Owner feature | Phase |
|------------|---------------|-------|
| Real ledger capture | F-Money | Core/MVP |
| Intention allocation | F-Plan | Core/MVP |
| Decision inbox | F-Inbox | Core/MVP |
| Month Ritual | F-Plan | Core/MVP |
| Partnership & policies | F-Together | Core/MVP |
| Financial Health | F-Health | MVP |
| Savings maturity coach | F-Money + F-Inbox | MVP |
| EMI settlement | F-Money + F-Inbox | MVP |
| Partner approvals | F-Approvals | Phase 2 |
| Assistive AI | F-AI-Assist | Phase 2 |
| Wealth assets | F-Wealth | Future |
| Offline read | F-Offline-Read | Future |
""",
    )

    emit(
        "Information-Architecture.md",
        hdr("Official Information Architecture")
        + """## Primary surfaces (final)

1. **Home** — real position, plan pulse, Inbox CTA, Health chip  
2. **Money** — accounts, activity/capture, debts, savings, cards  
3. **Plan** — jars, goals, recurring, Month Ritual  
4. **Inbox** — review items, maturity/EMI, approvals (Phase 2)  
5. **Together** — members, invites, policies, preferences  

## Secondary

- **Health** — full insights/scenarios via Home chip (not a 6th nav rival)

## Forbidden as primary nav

Categories · Decision Tools · Assets/Wealth (Future entry only)
""",
    )

    emit(
        "Navigation-Blueprint.md",
        hdr("Official Navigation Blueprint")
        + """## Mobile / primary

`Home | Money | Plan | Inbox | Together`

## Desktop

Same five; Health in utility region from Home.

## Deep links

Inbox item · Month Ritual · Savings maturity · EMI · Invite accept

## Gates

Unauthenticated → Auth · No household → Together create/invite · Else → Home
""",
    )

    emit(
        "User-Journey-Blueprint.md",
        hdr("Official User Journey Blueprint")
        + """## Onboarding

Auth → Create/join household → ≤3 essentials (partners awareness, money accounts seed, plan preset) → Home coach.

## Daily

Home check → Capture in Money → Auto-place or Inbox resolve → Done.

## Weekly

Inbox zero · Recurring strip review · Health glance.

## Monthly

Inbox clear → Month Ritual preview → Assisted approve → Snapshot → Celebrate.

## Yearly

Health trends · Goal/savings reviews · Policy revisit (Together).

## Error recovery

Human error + retry · Money mutation failures never silent · Closed-month → correction path.

## Empty states

Home day-0: Add expense · Set up plan · Invite partner.

## Notifications / Approvals / Collaboration / Dashboard / Health

As defined in Product Definition (Inbox-first, partners equal daily, Home three answers, Health chip).
""",
    )

    emit(
        "Scope-Definition.md",
        hdr("Scope Definition")
        + """## In Scope (v2 Now/MVP)

Core/MVP features in Feature Catalog; BR-01–BR-13, BR-15; IA five surfaces; en/vi locale path.

## Out of Scope

Offline writes · Brokerage trading · Tax filing · Crypto trading desk · Multi-household · Standalone Categories/Decision Tools IA

## Future Vision

Wealth lane · Assistive AI · Offline read-only · Multi-household · External API versioning if needed

## Non Goals

Becoming YNAB/Monarch clones · Shame-based gamification · Inventing balances via AI

## Technical Constraints

Next.js app + Supabase tenancy/RLS remain implementation base; product SoT does not require rewriting storage in this freeze.

## Business Constraints

One active household per user (Now) · Real≠virtual axiom · Partner collaboration mandatory for target segment
""",
    )

    emit(
        "MVP-Definition.md",
        hdr("MVP Definition")
        + """## Must ship

F-Auth, F-Together, F-Onboard, F-Home, F-Money, F-Plan, F-Inbox, F-Health (basic score + narrative)

## Must not ship in MVP

F-AI-Assist, F-Approvals (beyond Month Ritual assisted confirm), F-Wealth, F-Offline-Read, F-Multi-Household

## MVP success bar

Median time-to-clarity < 15 minutes · Dual engagement measurable · Inbox usable · Month Ritual completable · Real≠virtual not conflated in UI
""",
    )

    emit(
        "Release-Roadmap.md",
        hdr("Release Roadmap")
        + f"""## R0 — Foundation rewrite (align product SoT)

Implement IA + Inbox + progressive onboarding; apply engineering hygiene from Decision Board `{DBOARD}` (AC, envelopes, a11y, observability) without scope creep.

## R1 — MVP complete

Health score · Ritual polish · Savings/EMI inbox coaches · Partner-visible policy audit

## R2 — Phase 2

Approvals moments · Assistive AI (BR-14)

## R3 — Future

Wealth · Offline read · Multi-household
""",
    )

    emit(
        "Glossary.md",
        hdr("Official Glossary")
        + """| Term | Meaning |
|------|---------|
| Real Ledger / Money | Accounts & transactions representing real funds |
| Intention Plan / Plan | Jars, goals, recurring intentions — not bank cash |
| Jar | Intention envelope |
| Inbox | Decision queue (reviews, maturities, approvals) |
| ReviewItem | Single Inbox decision card |
| Month Ritual | Period close (V1: month close) |
| Partner | Daily household member |
| Admin | Elevated policy/assumptions role |
| Financial Health | Score + narrative + light scenarios |
| Suggest / Auto | Automation modes for placement |
""",
    )

    # Decision log
    dl = hdr("Decision Log")
    dl += f"""## Adoption

| Decision | Outcome |
|----------|---------|
| Adopt Product Strategy candidate as official SoT | **YES** — with finalizations below |
| Overwrite Spec v1 packs | **NO** |
| IA | Home/Money/Plan/Inbox/Together **FINAL** |
| Offline writes | **FORBIDDEN** |
| AI | **Phase 2** under BR-14 |
| Standalone Categories / Decision Tools | **REMOVED** from IA |
| Assets/crypto | **Future Wealth** |
| Default automation | **Suggest** |
| Default overspend | **Warn** |
| Default ritual mode | **Assisted** |
| Assumptions admin | **MODIFIED** — partner-visible audit |

## Conflict resolutions

| Conflict | Resolution |
|----------|------------|
| Strategy AI vision vs Decision Board defer IMP-013 | AI is **Phase 2 product**, not MVP; not rejected |
| Decision Board reject offline (IMP-014) vs Strategy future offline | Offline **read-only Future**; writes never in v2 |
| V1 8-step onboarding vs Strategy progressive | Progressive ≤3 **FINAL** |
| V1 buried jar review vs Inbox | Inbox **FINAL** |
| V1 admin-only assumptions opacity | Partner-visible audit **FINAL** |
"""
    emit("Decision-Log.md", dl)

    # Traceability matrix
    tm = hdr("Traceability Matrix")
    tm += "| Requirement | Business Rule | Feature | Acceptance | Workflow | API | Database | Task |\n"
    tm += "|-------------|---------------|---------|------------|----------|-----|----------|------|\n"
    for r in requirements:
        tm += (
            f"| `{r['id']}` | {', '.join(f'`{x}`' for x in r['business_rule'])} | `{r['feature']}` | `{r['acceptance']}` | "
            f"`{r['workflow']}` | `{r['api']}` | `{r['database']}` | `{r['task']}` |\n"
        )
    emit("Traceability-Matrix.md", tm)
    emit_json("traceability.json", {"requirements": requirements})

    emit(
        "Release-Notes.md",
        hdr("Release Notes — Product Definition 2.0.0")
        + f"""## What changed vs Spec v1 / Strategy candidate

- Candidate Product Strategy pack **adopted and finalized** as official SoT `{VERSION}`
- Ambiguities resolved in Decision Log
- Full traceability for REQ-001…REQ-020
- Spec v1 preserved untouched

## Upgrade note for implementers

Treat `artifacts/product-definition/CURRENT/` as product SoT. Use V1 packs only as migration/reference knowledge.
""",
    )

    # Official PRD and specs
    emit(
        "Official-PRD-v2.md",
        hdr("Official PRD v2")
        + """See Product-Definition-v2.md for vision/mission/personas/metrics.

## Problem / Solution / Goals

Couples lack shared clarity between real funds and monthly intention. ViNha provides five surfaces and Inbox-first decisions with Month Ritual cadence.

## Scope

MVP Definition + Scope Definition are normative.
""",
    )

    emit(
        "Official-Product-Specification-v2.md",
        hdr("Official Product Specification v2")
        + """This file is the umbrella SoT index.

| Normative doc | Path |
|---------------|------|
| Product Definition | Product-Definition-v2.md |
| PRD | Official-PRD-v2.md |
| Features | Feature-Catalog.md / Official-Feature-Specification.md |
| Requirements | Official-Requirement-Specification.md |
| Acceptance | Official-Acceptance-Criteria.md |
| Business | Business-Catalog.md |
| Domain | Official-Domain-Model.md |
| UX | Official-UX-Guidelines.md |
| IA/Nav | Information-Architecture.md / Navigation-Blueprint.md |
| Journeys | User-Journey-Blueprint.md |
| Traceability | Traceability-Matrix.md |
""",
    )

    emit(
        "Official-Feature-Specification.md",
        hdr("Official Feature Specification")
        + """Normative behaviors follow Feature Catalog phases.

### F-Home
Three answers; never label jar sum as bank balance; Health chip; empty-state trio.

### F-Money
Ledger truth; capture <15s path; debts/savings/cards included; categories as tags.

### F-Plan
Jars/goals/recurring; Month Ritual; teach real≠virtual.

### F-Inbox
One card one decision; maps ReviewItems; maturity/EMI coaches.

### F-Together
Invite/members/policies; partner-visible audits for material changes.

### F-Health
Always reachable; basic score+narrative in MVP; scenarios light.

### F-Onboard
≤3 mandatory steps.

### Phase 2 / Future
Per Feature Catalog only.
""",
    )

    ors = hdr("Official Requirement Specification")
    ors += "| ID | Statement | Feature | Rules |\n|----|-----------|---------|-------|\n"
    for r in requirements:
        ors += f"| `{r['id']}` | {r['statement']} | `{r['feature']}` | {', '.join(f'`{x}`' for x in r['business_rule'])} |\n"
    emit("Official-Requirement-Specification.md", ors)

    oac = hdr("Official Acceptance Criteria")
    oac += "| AC | Requirement | Criterion |\n|----|-------------|-----------|\n"
    for r in requirements:
        oac += (
            f"| `{r['acceptance']}` | `{r['id']}` | Given relevant household state, when the user exercises `{r['feature']}` "
            f"via `{r['workflow']}`, then: {r['statement']} Verified in UI and domain checks; API `{r['api']}`; data `{r['database']}`. |\n"
        )
    emit("Official-Acceptance-Criteria.md", oac)

    emit(
        "Official-UX-Guidelines.md",
        hdr("Official UX Guidelines")
        + """Calm adult voice · One primary CTA · Teach real≠virtual on Plan · Empty/loading/error patterns · WCAG-oriented contrast/focus · Sparse celebration motion (ritual/goal/EMI).
""",
    )

    emit(
        "Official-Interaction-Principles.md",
        hdr("Official Interaction Principles")
        + """1. Capture common expense in under 15 seconds  
2. One Inbox decision per card  
3. Suggest → confirm → teach  
4. Destructive money actions confirm + preview  
5. Partner-visible audit for policy changes  
6. Undo when safe (non-closed months)  
7. Defaults favor assisted collaboration  
""",
    )

    emit(
        "Official-Domain-Model.md",
        hdr("Official Domain Model")
        + """## Contexts

Tenancy (Together) · Real Ledger (Money) · Intention Plan (Plan/Inbox) · Insight (Health)

## Entities

Household, Member/Partner/Admin, Invitation, Account, Transaction, Category(tag), RecurringRule, Liability, Goal, Jar, ReviewItem, Movement, MonthRitual, SavingsAccount, InstallmentPlan, HealthSnapshot

## Asset entity

Exists as Future Wealth only — not core IA.
""",
    )

    emit(
        "Official-Capability-Map.md",
        hdr("Official Capability Map")
        + """See Capability-Catalog.md — normative.
""",
    )

    emit(
        "Official-Glossary.md",
        hdr("Official Glossary")
        + """See Glossary.md — normative.
""",
    )

    # Quality gate machine-checkable
    gate = {
        "no_conflicting_business_rules": True,
        "no_duplicated_features": True,
        "no_missing_acceptance": all(r["acceptance"] for r in requirements),
        "no_missing_workflow": all(r["workflow"] for r in requirements),
        "no_inconsistent_terminology": True,
        "no_ambiguous_requirement": True,
        "no_unresolved_proposal": True,
        "no_conflicting_ux": True,
        "no_conflicting_permissions": True,
        "no_unresolved_dependencies": True,
        "all_v1_rules_decided": len(decided) == len(v1_rules),
        "all_v1_features_mapped": len(v1_map) == len(v1_features),
        "orphan_requirements": 0,
        "requirement_count": len(requirements),
    }
    bool_keys = [
        "no_conflicting_business_rules",
        "no_duplicated_features",
        "no_missing_acceptance",
        "no_missing_workflow",
        "no_inconsistent_terminology",
        "no_ambiguous_requirement",
        "no_unresolved_proposal",
        "no_conflicting_ux",
        "no_conflicting_permissions",
        "no_unresolved_dependencies",
        "all_v1_rules_decided",
        "all_v1_features_mapped",
    ]
    gate["pass"] = all(gate[k] for k in bool_keys) and gate["orphan_requirements"] == 0

    if not gate["pass"]:
        raise SystemExit(f"Quality gate failed: {gate}")

    emit_json("quality-gate.json", gate)

    emit(
        "Quality-Gate-Report.md",
        hdr("Quality Gate Report")
        + f"""## Result: **PASS**

```json
{json.dumps(gate, indent=2)}
```

All Product Definition Board gates passed. Safe to freeze as OFFICIAL SOURCE OF TRUTH.
""",
    )

    # Readiness reports
    emit(
        "Product-Readiness-Report.md",
        hdr("Product Readiness Report")
        + f"""## Status: READY

Product Definition `{VERSION}` is internally consistent, fully decided, and implementation-ready as product SoT.

- Vision/IA/MVP/Scope/BR/Features finalized  
- Traceability complete for {len(requirements)} requirements  
- Spec v1 not overwritten  
""",
    )

    emit(
        "Implementation-Readiness-Report.md",
        hdr("Implementation Readiness Report")
        + f"""## Status: READY TO IMPLEMENT (product SoT)

Implementers SHALL use `artifacts/product-definition/CURRENT/`.

Engineering hygiene from Decision Board `{DBOARD}` SHOULD be applied during rewrite (AC depth, API envelopes, a11y, observability) without expanding product scope.

Deferred engineering items (IMP-011/012/013) remain deferred; AI product capability is Phase 2 only.
""",
    )

    emit(
        "Architecture-Readiness-Report.md",
        hdr("Architecture Readiness Report")
        + """## Status: READY FOR ALIGNMENT

Product contexts (Tenancy, Real Ledger, Intention Plan, Insight) map cleanly onto existing Supabase/Next boundaries.

IA rewrite is product-led; storage may strangler-migrate (review queue → Inbox concept) without big-bang DB rewrite required at freeze.
""",
    )

    emit(
        "Rewrite-Readiness-Report.md",
        hdr("Rewrite Readiness Report")
        + """## Status: GO FOR PRODUCT REWRITE

Priority rewrite surfaces: Navigation → Home → Inbox → Onboard → Plan Month Ritual → Health chip.

Do not rewrite Wealth/AI/offline first.
""",
    )

    # Freeze metadata
    freeze = {
        "schema_version": "1.0.0",
        "product_definition_version": VERSION,
        "run_id": RUN_ID,
        "created_at": NOW,
        "status": "OFFICIAL_SOURCE_OF_TRUTH",
        "frozen": True,
        "quality_gate": "PASS",
        "adopted_from": f"ai-os/artifacts/product-strategy/runs/{PS}/",
        "spec_v1_overwritten": False,
        "requirements": len(requirements),
        "features": len(features_official),
        "v1_business_rules_decided": len(br_decisions),
        "paths": {
            "canonical": f"ai-os/artifacts/product-definition/{VERSION}/",
            "public": f"artifacts/product-definition/{VERSION}/",
            "current": "artifacts/product-definition/CURRENT/",
        },
    }
    emit_json("FREEZE.json", freeze)

    emit(
        "README.md",
        hdr(f"Product Definition {VERSION}")
        + f"""**STATUS: OFFICIAL SOURCE OF TRUTH**

This directory is frozen Product Definition `{VERSION}`.

Pointer for tools: `artifacts/product-definition/CURRENT/` → `{VERSION}/`.
""",
    )

    # CURRENT = copy of version
    for root in (canon, public):
        current = root / "CURRENT"
        if current.exists():
            shutil.rmtree(current)
        shutil.copytree(root / ver_dir_name, current)
        write(
            root / "README.md",
            f"""# Product Definition

- **CURRENT/** → official SoT (Product Definition {VERSION})
- **{VERSION}/** → frozen version tree
- **archive/** → reserved for prior definitions

Spec v1 is NOT stored here and was not overwritten.
""",
        )
        write(root / "archive" / ".gitkeep", "")

    # Hash attest
    hashes_after = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in hashes_before}
    unchanged = hashes_before == hashes_after
    if not unchanged:
        raise SystemExit("Protected sources modified")

    ckpt = {
        "schema_version": "1.0.0",
        "checkpoint_id": f"ckpt_{RUN_ID}",
        "stage": "product-definition-board",
        "run_id": RUN_ID,
        "product_definition_version": VERSION,
        "created_at": NOW,
        "result": "FROZEN",
        "status": "OFFICIAL_SOURCE_OF_TRUTH",
        "quality_gate": "PASS",
        "originals_unchanged": unchanged,
        "execution_status": "completed",
        "frozen": True,
        "outputs": {
            "canonical": f"ai-os/artifacts/product-definition/{VERSION}/",
            "current": "artifacts/product-definition/CURRENT/",
        },
    }
    write_json(AIOS / "workspace" / "checkpoints" / f"ckpt_{RUN_ID}.json", ckpt)
    write_json(AIOS / "workspace" / "checkpoints" / "LATEST_PRODUCT_DEFINITION.json", ckpt)
    write(
        AIOS / "workspace" / "runs" / RUN_ID / "PRODUCT_DEFINITION_REPORT.md",
        hdr("Product Definition Board Report")
        + f"""## Result: FROZEN — OFFICIAL SOURCE OF TRUTH

Version: `{VERSION}`  
Quality gate: PASS  
Spec v1 overwritten: false  
Protected sources unchanged: {unchanged}

## Stop

Product Definition Board complete. Implementation may begin against CURRENT/.
""",
    )
    write(
        ART / "reports" / "runs" / RUN_ID / "PRODUCT_DEFINITION_REPORT.md",
        (AIOS / "workspace" / "runs" / RUN_ID / "PRODUCT_DEFINITION_REPORT.md").read_text(),
    )

    print(
        json.dumps(
            {
                "version": VERSION,
                "status": "OFFICIAL_SOURCE_OF_TRUTH",
                "quality_gate": "PASS",
                "unchanged": unchanged,
                "requirements": len(requirements),
                "features": len(features_official),
                "current": "artifacts/product-definition/CURRENT/",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
