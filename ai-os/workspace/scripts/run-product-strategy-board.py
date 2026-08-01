#!/usr/bin/env python3
"""Product Strategy Board — Product Vision & Spec Rewrite 2026 (V1 read-only)."""
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
REPO = "run_repository_discovery_20260801T132500Z"
DBOARD = "run_decision_board_20260801T135000Z"
EVO = "run_spec_evolution_20260801T134000Z"
RUN_ID = "run_product_strategy_20260801T140000Z"
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text if text.endswith("\n") else text + "\n", encoding="utf-8")


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_entries(pack: str, run: str) -> list[dict]:
    return json.loads((ART / pack / "runs" / run / "payload.json").read_text(encoding="utf-8"))["entries"]


def hdr(title: str) -> str:
    return f"""---
generated_by: Product Strategy Board
run_id: {RUN_ID}
status: PRODUCT_V2_CANDIDATE
source_of_truth: NOT_ADOPTED
v1_unchanged: true
created_at: {NOW}
---

# {title}

"""


def main() -> None:
    features = load_entries("features", BD)
    rules = load_entries("business", BD)
    journeys = load_entries("user-journeys", BD)
    workflows = load_entries("workflow", BD)
    perms = load_entries("permissions", BD)
    domain = load_entries("domain", BD)

    protect = [
        f"ai-os/artifacts/business/runs/{BD}/payload.json",
        f"ai-os/artifacts/features/runs/{BD}/payload.json",
        f"ai-os/artifacts/requirements/runs/{SPEC}/payload.json",
        f"ai-os/artifacts/final/PRD.md",
        f"ai-os/artifacts/decision-board/runs/{DBOARD}/approved-specification-v2-plan.md",
    ]
    hashes_before = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in protect}

    out = ART / "product-strategy" / "runs" / RUN_ID

    # ---------- FEATURE CHALLENGE ----------
    feature_stances = {
        "ft-auth": ("KEEP_INTENT", "REWRITE_UX", "Identity is required; login should feel like entering a shared home, not a SaaS gate."),
        "ft-household": ("KEEP_INTENT", "SIMPLIFY", "Household create/invite stays; reduce dead-end screens between signup and first value."),
        "ft-onboarding": ("REWRITE", "MERGE_PROGRESSIVE", "8 steps are too many before value. Essential: partners + money reality + first plan. Wealth/debts deepen later."),
        "ft-dashboard": ("REWRITE", "BECOME_HOME", "Replace aggregate dump with Home answering three questions: real money, plan health, decisions waiting."),
        "ft-accounts": ("KEEP_INTENT", "MERGE_INTO_MONEY", "Accounts remain real-ledger truth but live under Money, not a parallel universe from Activity."),
        "ft-savings": ("KEEP_INTENT", "SIMPLIFY", "Fixed-term savings stay; maturity actions need clearer guided rituals, less API-shaped UI."),
        "ft-cards": ("KEEP_INTENT", "SIMPLIFY", "Cards/installments stay for family cashflow reality; EMI should feel like a debt plan, not a billing dump."),
        "ft-assets": ("DE_SCOPE", "SECONDARY_WEALTH", "Assets/crypto are not core JTBD. Move to later Wealth lane; do not block onboarding or Home."),
        "ft-debts": ("KEEP_INTENT", "ELEVATE", "Debt is core family stress. Elevate alongside Money; stop treating as onboarding-only afterthought."),
        "ft-activity": ("KEEP_INTENT", "REWRITE_UX", "Activity becomes the ledger timeline with smart capture; primary daily write path."),
        "ft-goals": ("KEEP_INTENT", "MERGE_INTO_PLAN", "Goals belong in Plan next to jars/savings targets, not a disconnected trophy shelf."),
        "ft-jars": ("KEEP_INTENT", "REWRITE_UX", "Jars are the product differentiator—but review must become Inbox, not a buried queue."),
        "ft-categories": ("MERGE", "INTO_TAGGING", "Kill standalone category IA. Categories exist as tags + plan rules inside Activity/Plan."),
        "ft-recurring": ("KEEP_INTENT", "SIMPLIFY", "Recurring is high-frequency family need; surface predicted bills on Home/Inbox."),
        "ft-decision-tools": ("MERGE", "INTO_HEALTH_INSIGHTS", "Scenarios fold into Financial Health & Insights; stop orphan /decision-tools habit."),
        "ft-settings": ("KEEP_INTENT", "SPLIT_TOGETHER", "Profile vs Together (household/members/permissions) vs Preferences; admin gates stay explicit."),
        "ft-insights": ("REWRITE", "CORE_HEALTH", "Insights become always-on Financial Health, not a flagged side experiment."),
        "ft-health": ("MERGE", "WITH_INSIGHTS", "Health score is the north-star metric surface; unify with insights."),
    }

    fcm = hdr("Feature Challenge Matrix (V1 → Product v2)")
    fcm += """This board challenges every V1 feature. **Existence is not justification.**

| V1 ID | Statement (knowledge) | Stance | v2 disposition | Rationale |
|-------|----------------------|--------|----------------|-----------|
"""
    for e in features:
        fid = e["id"]
        stance, disp, why = feature_stances[fid]
        fcm += f"| `{fid}` | {e['statement'][:90]}… | {stance} | {disp} | {why} |\n"
    fcm += """
## Kill / merge summary

- **Kill as primary IA:** standalone Categories, Decision Tools route, Health-as-flag-only.
- **De-scope from core path:** deep Assets/crypto.
- **Elevate:** Inbox (from jar review), Debt, Recurring predictions, Financial Health.
- **Preserve intent:** real ledger, jars allocation, household partnership, savings/EMI rituals.
"""
    write(out / "analysis" / "Feature-Challenge-Matrix.md", fcm)

    # ---------- BR CHALLENGE ----------
    br_stances = {
        "br-real-vs-virtual": ("STILL_VALID", "KEEP_AS_AXIOM", "Non-negotiable differentiator. Rewrite in human language; never weaken."),
        "br-income-allocate": ("VALID_TOO_COMPLEX", "SIMPLIFY_UX", "Keep percent/fixed + suggest/auto policies; default to suggest with one-tap confirm; hide engineer enums."),
        "br-expense-allocate": ("VALID_TOO_COMPLEX", "SIMPLIFY_UX", "Auto-when-mapped stays; unmapped → Inbox item with plain choices, not queue jargon."),
        "br-jar-active": ("STILL_VALID", "CLARIFY_STATES", "Keep; publish Active / Paused / Archived matrix in product language."),
        "br-closed-month": ("STILL_VALID", "RITUALIZE", "Keep period lock; present as Month Ritual with corrections as first-class, not error path."),
        "br-amount-positive": ("STILL_VALID", "KEEP", "Accounting invariant; users see signed directions, system stores positive + direction."),
        "br-overspend-policy": ("STILL_VALID", "DEFAULT_SAFER", "Keep warn|block|allow_negative; default warn for new households; explain tradeoffs."),
        "br-month-close-mode": ("SIMPLIFY", "DEFAULT_ASSISTED", "Prefer assisted close for couples; manual remains power mode."),
        "br-assumptions-admin": ("CHALLENGE", "SOFTEN", "Inflation/growth assumptions: either both partners edit with audit, or guided wizard—not silent admin-only friction."),
        "br-one-household": ("CHALLENGE", "KEEP_V1_TEMP", "One active household OK for MVP focus; multi-household is Later, not Now."),
        "br-rls-member": ("STILL_VALID", "KEEP", "Security invariant; product promises shared private household space."),
        "br-savings-maturity": ("STILL_VALID", "GUIDED_FLOW", "Keep renew/switch/withdraw; wrap in maturity coach UI."),
        "br-installment-complete": ("STILL_VALID", "KEEP", "Clear completion rule; celebrate payoff in Health/Inbox."),
        "br-action-context": ("STILL_VALID", "KEEP", "Auth+membership required; invisible to users except clear login/household gates."),
    }

    brc = hdr("Business Rules Challenge")
    brc += """Every V1 rule is challenged. Intent may be preserved while **language, defaults, and edges** change.

| V1 ID | Still valid? | v2 approach | Notes |
|-------|--------------|-------------|-------|
"""
    for e in rules:
        rid = e["id"]
        valid, approach, notes = br_stances[rid]
        brc += f"| `{rid}` | {valid} | {approach} | {notes} |\n"
    brc += """
## Missing edges to address in Business Rules v2

- Partner disagreement on allocation (needs Approval / Together cues).
- Transfer-shaped activity vs jar intents (clarify without inventing fake ledger moves).
- Soft-delete vs archive vs pause for jars/accounts.
- What happens when one partner closes the month while the other still has Inbox items.
"""
    write(out / "analysis" / "Business-Rules-Challenge.md", brc)

    # ---------- UX PAIN ----------
    pain = hdr("UX Pain Points (from V1 journeys & IA)")
    pain += """## Reconstructed V1 journey friction

"""
    for j in journeys:
        pain += f"- `{j['id']}`: {j['statement']}\n"
    pain += """
## Pain points

1. **Too many primary hubs** — dashboard, accounts, activity, jars, goals, assets, recurring, settings compete for attention.
2. **Onboarding marathon** — eight steps before “first insight”; drop-off risk; wealth/debt forced early.
3. **Jar review buried** — highest cognitive work lives off the main path.
4. **Real vs virtual unexplained** — users can confuse jar balances with bank money.
5. **Weak empty states** — new households lack guided “what to do tonight.”
6. **Feedback gaps** — automation (auto-allocate) happens without teachable moments.
7. **Partner asymmetry** — admin assumptions feel political; daily collaboration under-designed.
8. **Insights/health flagged/orphan** — core value treated as experiment.
9. **Categories duplicated** — settings + standalone routes.
10. **Error/guidance** — technical failure modes leak into family money moments.

## v2 response themes

Inbox-first decisions · Home with three answers · Progressive onboarding · Teach real≠virtual · Health always on · Together permissions with empathy.
"""
    write(out / "analysis" / "UX-Pain-Points.md", pain)

    # Mark challenge done conceptually; continue all docs in one run
    write_json(
        out / "analysis" / "inputs.json",
        {
            "bd": BD,
            "spec": SPEC,
            "repo": REPO,
            "decision_board": DBOARD,
            "evolution": EVO,
            "counts": {
                "features": len(features),
                "business_rules": len(rules),
                "journeys": len(journeys),
                "workflows": len(workflows),
                "permissions": len(perms),
                "domain": len(domain),
            },
        },
    )

    # ===================== VISION =====================
    write(
        out / "vision" / "Product-Vision-2026.md",
        hdr("Product Vision 2026")
        + f"""## One-liner

**ViNha** is the shared money OS for couples and families who want clarity without spreadsheets—and intention without pretending virtual plans are bank balances.

## Job to be done

Help partners answer, every week:

1. **What money do we really have?** (real ledger)
2. **Where is it meant to go this month?** (virtual plan / jars)
3. **What needs a decision together?** (Inbox)

## Why V1 is not the vision

V1 proved the domain: household tenancy, real vs virtual separation, allocation engines, month close, savings and installments. It evolved as **feature hubs**. Users do not want hubs—they want answers and rituals.

## Competitive posture

Take the best *behaviors*:

- YNAB — intentional allocation discipline
- Monarch / Copilot — household sharing + insight calm
- Lunch Money — clean activity capture
- Splitwise — fairness between people

Remain focused on **family expense & plan management**, not brokerage, tax, or crypto trading.

## North-star outcome

Couples who close the month together with fewer arguments, fewer surprise overspends, and a shared sense of “we know where we stand.”

## Derived from V1 knowledge (intent only)

- Real ledger ≠ virtual jars (`br-real-vs-virtual`)
- Household partnership (`ft-household`, permissions)
- Allocation + review (`br-income-allocate`, `br-expense-allocate`)
- Period ritual (`br-closed-month`)

## Explicitly not V1 screens

Home · Money · Plan · Inbox · Together replace the fragmented route map as the product vision IA.
""",
    )

    write(
        out / "vision" / "Core-Principles.md",
        hdr("Core Principles")
        + """1. **Truth before intention** — Never imply a jar balance is spendable bank cash.
2. **Partners first** — Design for two adults by default; admin is elevation, not the daily identity.
3. **Inbox over archaeology** — Surface decisions; bury configuration.
4. **Progressive depth** — Earn complexity; do not force wealth/crypto before rent and groceries.
5. **Automation with receipts** — Suggest and auto only with explainable outcomes and undo/review.
6. **Month as ritual** — Closing a period is a ceremony, not a database status.
7. **Calm finance UI** — Reduce hubs, jargon, and engineer enums in the interface.
8. **Accessible by default** — WCAG-oriented interaction is product quality, not a patch.
9. **Privacy of the household** — Shared inside; sealed outside.
10. **AI assists, never invents money** — Explain and suggest; never fabricate balances or silent transfers.
""",
    )

    write(
        out / "vision" / "Target-Personas.md",
        hdr("Target Personas")
        + """## P1 — Daily Partner (primary)

- Shares expenses with a spouse/partner; checks money a few times a week.
- Needs: fast capture, “are we okay this month?”, clear next action.
- Pain: tools that feel like accounting homework.

## P2 — Household Steward (often admin)

- Cares about month close, assumptions, invites, policies.
- Needs: trustworthy controls without becoming the sole operator.
- Pain: political “only I can edit inflation” friction.

## P3 — New Couple Bootstrapping

- Just moved in together / merging finances.
- Needs: short path to shared clarity; invite partner; first plan.
- Pain: eight-step wizards and asset inventories before trust is built.

## P4 — Careful Planner

- Goals, savings terms, installments matter.
- Needs: guided maturity/EMI rituals and progress visibility on Home/Plan.
- Anti-need: trading terminal complexity.

## Non-persona (out of core)

Day traders, crypto degens, multi-entity CFOs—may touch Wealth later, not Home.
""",
    )

    # ===================== EXPERIENCE =====================
    write(
        out / "experience" / "User-Journey-v2.md",
        hdr("User Journey v2")
        + """## Primary IA

| Surface | Purpose |
|---------|---------|
| **Home** | Three answers: real position, plan health, decisions waiting |
| **Money** | Real ledger: accounts, activity capture, debts, savings |
| **Plan** | Virtual intention: jars, goals, recurring rules, month ritual |
| **Inbox** | Reviews, approvals, maturity/EMI decisions, partner prompts |
| **Together** | Members, invites, permissions, household policies |

## Journey A — New household (progressive)

1. Sign up → create household → invite partner (optional skip).
2. **Essentials onboarding (≤3 steps):** who shares money → where money lives (accounts) → first monthly plan (jars preset).
3. Land on Home with empty-state coach: add first expense OR connect first recurring bill.
4. Later cards: debts, savings, wealth—claimed when ready.

*Derived from `uj-new-household` / `wf-onboarding` but rewritten.*

## Journey B — Daily partner

1. Open Home → see plan pressure + Inbox count.
2. Capture expense in Money/Activity (smart category suggest).
3. If unmapped → Inbox item “Assign this expense” with 2–3 jar choices.
4. Optional: peek Plan health; no forced deep navigation.

## Journey C — Week / month ritual

1. Inbox zero push (both partners).
2. Plan → Month Ritual preview (overspend, rollovers).
3. Approve together (assisted default) → celebration + snapshot.
4. Corrections remain available without unlocking chaos.

## Journey D — Savings maturity / EMI

- Trigger appears in Inbox + Money detail.
- Guided choices (renew / switch / withdraw; settle installment).
- Completion feeds Financial Health.

## Journey E — Together settings

- Invite/revoke members; role elevation with explanation.
- Policies (overspend, automation) with plain-language tradeoffs.
""",
    )

    write(
        out / "experience" / "Dashboard-Concept.md",
        hdr("Dashboard Concept (Home)")
        + """Home is **not** a widget graveyard.

## Above the fold

1. **Real position** — Spendable/safe-to-spend narrative from ledger accounts (explicitly *not* jar totals).
2. **Plan pulse** — Month progress vs jars (intention health).
3. **Inbox CTA** — Count + top decision.

## Secondary

- Upcoming recurring (7 days)
- Goals/savings at risk
- Financial Health score chip → Insights

## Empty state (day 0)

Three buttons only: Add expense · Set up plan · Invite partner.

## Explicit anti-patterns

- Showing jar sum as “balance”
- Requiring /accounts hop to know if you’re okay
- Hiding review behind /jars/review
""",
    )

    write(
        out / "experience" / "UX-Guidelines.md",
        hdr("UX Guidelines")
        + """## Voice

Calm, concrete, adult-to-adult. Prefer “Assign to Groceries jar” over “resolveJarReviewItem”.

## Hierarchy

One primary action per screen. Secondary actions collapse.

## Teaching real ≠ virtual

Persistent microcopy on Plan surfaces: “Plans guide intention. Bank balances live in Money.”

## Empty / loading / error

- Empty: next best action
- Loading: skeleton, not spinners-only
- Error: human cause + retry + link to Inbox if decision needed

## Accessibility

- Keyboard complete paths for capture, Inbox resolve, month ritual
- Contrast and focus rings on all money CTAs
- Don’t rely on color alone for overspend

## Motion

Sparse; celebrate month close and goal/EMI completion only.
""",
    )

    write(
        out / "experience" / "Interaction-Principles.md",
        hdr("Interaction Principles")
        + """1. **Capture in under 15 seconds** for a common expense.
2. **One decision, one card** in Inbox—never multi-stage modals by default.
3. **Suggest → confirm → teach** for automation.
4. **Destructive money actions** require explicit confirm + consequence preview.
5. **Partner-visible audit** for policy and assumption changes.
6. **Undo windows** where technically safe (non-closed months).
7. **Defaults favor assisted collaboration** over silent auto.
""",
    )

    # ===================== DOMAIN =====================
    write(
        out / "domain" / "Domain-Model-v2.md",
        hdr("Domain Model v2")
        + """## Bounded contexts (preserved knowledge, clearer names)

| Context | Contains | User-facing name |
|---------|----------|------------------|
| Tenancy | Household, Member, Invitation | Together |
| Real Ledger | Account, Transaction, Debt/Liability, SavingsAccount, (Asset later) | Money |
| Intention Plan | Jar, Plan, Rules, Movement, ReviewItem, MonthRitual, Goal, Recurring | Plan + Inbox |
| Insight | HealthScore, Insight, Scenario | Health |

## Core entities (product language)

- **Household** — shared money space (currency, locale, policies)
- **Partner** — member with daily rights; **Admin** — elevated policies
- **Account** — real money container
- **Transaction** — real cashflow event
- **Jar** — intention envelope (not a bank)
- **ReviewItem** — decision object in Inbox
- **MonthRitual** — period close (was month close run)
- **Goal / Savings / Installment** — commitment objects
- **HealthSnapshot** — scored household state

## Deliberate de-emphasis

Asset/crypto detail is **Wealth (Later)**—entity may exist in knowledge, not core IA.

## Derived from

`dom-bounded-ledger`, `dom-bounded-jars`, `dom-bounded-tenancy`, and related V1 entities—**rewritten for product clarity**.
""",
    )

    write(
        out / "domain" / "Business-Rules-v2.md",
        hdr("Business Rules v2")
        + """Rules below are **product rules**. They retain V1 intent where still valid; wording and defaults are rewritten.

### BR2-01 Truth separation *(from br-real-vs-virtual)*

Jar/plan figures are intentions. Only Money/ledger balances represent real funds. UI must not conflate them.

### BR2-02 Membership gate *(from br-action-context, br-rls-member)*

All household money actions require an authenticated user with active membership.

### BR2-03 Active intention targets *(from br-jar-active)*

Allocations only target Active jars. Paused/Archived jars are non-targets (labels clarified).

### BR2-04 Income placement *(from br-income-allocate)*

Income is placed into the monthly plan via percent or fixed plan. Automation modes: Off · Suggest · Auto (high confidence). **Default: Suggest.**

### BR2-05 Expense placement *(from br-expense-allocate)*

Mapped expenses may auto-assign when automation ≠ Off. Unmapped expenses create Inbox decisions.

### BR2-06 Amounts *(from br-amount-positive)*

Stored movement magnitudes are positive; direction encodes in/out. Users see signed plain language.

### BR2-07 Overspend policy *(from br-overspend-policy)*

Household chooses Warn · Block · Allow negative. **Default for new households: Warn.**

### BR2-08 Month ritual lock *(from br-closed-month)*

After an approved Month Ritual, normal plan movements freeze; corrections use an explicit correction path.

### BR2-09 Ritual mode *(from br-month-close-mode)*

Assisted ritual is default; Manual is power-user.

### BR2-10 Savings maturity *(from br-savings-maturity)*

Maturity actions: renew same · switch plan · withdraw (partial/full) with terminal state guards.

### BR2-11 Installment completion *(from br-installment-complete)*

Plan completes when paid installments reach planned count.

### BR2-12 One household (MVP) *(from br-one-household)*

One active household per user in v2 Now. Multi-household is Later.

### BR2-13 Policy changes are visible *(evolves br-assumptions-admin)*

Material policy/assumption changes are partner-visible (audit). Admin elevation may still gate some edits, but silent sole-operator UX is rejected.

### BR2-14 AI non-invention *(product v2)*

AI may explain and suggest using household data. AI must not invent balances or execute money movement without an explicit user/policy path.
""",
    )

    write(
        out / "domain" / "Feature-Map-v2.md",
        hdr("Feature Map v2")
        + """## Primary features

| Feature | Description | V1 lineage |
|---------|-------------|------------|
| F-Home | Three-answer home | ft-dashboard rewrite |
| F-Money | Accounts, capture, debts, savings | ft-accounts, activity, debts, savings, cards |
| F-Plan | Jars, goals, recurring, month ritual | ft-jars, goals, recurring |
| F-Inbox | Reviews, approvals, maturities | ft-jars review + new |
| F-Together | Members, invites, policies | ft-household, settings |
| F-Health | Financial health + insights + light scenarios | ft-health, insights, decision-tools |
| F-Auth | Login/session | ft-auth |
| F-Onboard | Progressive essentials | ft-onboarding rewrite |

## Secondary / Later

| Feature | Notes |
|---------|-------|
| F-Wealth | Assets/crypto depth | from ft-assets de-scoped |
| F-Offline-Read | Read-only cache | product later; never offline writes |
| F-Multi-Household | Beyond MVP | challenges br-one-household later |

## Removed as primary IA

Standalone Categories app section; standalone Decision Tools app section; Health as hidden flag-only surface.
""",
    )

    write(
        out / "domain" / "Workflow-v2.md",
        hdr("Workflow v2")
        + """## WF2-Onboard-Essentials

Auth → Household → Invite(optional) → Accounts seed → Plan preset → Home coach.

## WF2-Capture-and-Place

Create transaction in Money → auto-place if mapped → else Inbox ReviewItem → resolve to jar movement.

## WF2-Inbox-Zero

List open ReviewItems/Approvals → resolve cards → optional partner notify.

## WF2-Month-Ritual

Preview pressures → partner confirmation (assisted) → lock → snapshot → celebrate → enable corrections lane.

## WF2-Savings-Maturity / WF2-EMI

Event → Inbox card → guided action → ledger/plan updates → Health signal.

## WF2-Together-Policy

Edit policy → preview impact → audit entry → both partners informed.
""",
    )

    write(
        out / "domain" / "Permission-Matrix-v2.md",
        hdr("Permission Matrix v2")
        + """| Action | Partner | Admin | Notes |
|--------|:------:|:-----:|-------|
| View Home/Money/Plan/Inbox/Health | ✓ | ✓ | Equal daily experience |
| Capture transactions | ✓ | ✓ | |
| Resolve Inbox items | ✓ | ✓ | |
| Edit jars/goals/recurring | ✓ | ✓ | |
| Run Month Ritual | ✓ | ✓ | Assisted encourages both |
| Invite/revoke members | ✓* | ✓ | *configurable; default both can invite |
| Edit overspend/automation policies | ✓ | ✓ | Audit required |
| Edit advanced assumptions (inflation etc.) | view | ✓ | Partner-visible audit; softens V1 sole-admin opacity |
| Service/aggregates | — | system | Unchanged security posture |

Membership + RLS remain mandatory (`perm-*` knowledge preserved).
""",
    )

    # ===================== CAPABILITIES =====================
    caps = {
        "Financial-Health-Model.md": """## Purpose

One score + narrative replacing flagged health and orphan decision-tools.

## Signals (illustrative)

Plan adherence · Inbox backlog · Debt pressure · Savings runway · Recurring coverage · Month ritual streak.

## Behaviors

- Always visible on Home chip
- Drill into Insights
- Scenarios (“what if we cut dining 10%”) live here—not a separate app island
""",
        "Savings-Strategy.md": """## Purpose

Guided fixed-term savings without API-shaped forms.

## Rituals

Open → track on Money/Plan → maturity Inbox coach (renew/switch/withdraw).

## Principle

Savings is real ledger; goals/jars may *point* at savings intentions but never fake the bank balance.
""",
        "Goal-Planning.md": """## Purpose

Goals live in Plan beside jars—targets with contributions and status.

## UX

Progress on Home when at risk; celebration on completion; link to funding jar/account explicitly.
""",
        "Expense-Management.md": """## Purpose

Fast capture + smart placement.

## Flow

Money timeline → suggest category/jar → auto or Inbox.

## Anti-pattern

Forcing category admin screens before first expense.
""",
        "Recurring-Payments.md": """## Purpose

Predictable family bills.

## UX

Upcoming strip on Home; rules edited in Plan; missed/unexpected amounts create Inbox prompts.
""",
        "Approval-Flow.md": """## Purpose

Partner trust for material changes and disputed allocations.

## Triggers (v2)

Policy changes · optional high-amount expense assignment · Month Ritual confirmation.

## Note

Not Splitwise bill-splitting; household-shared ledger with explicit together moments.
""",
        "Insights-Analytics.md": """## Purpose

Calm explanations of what changed and what to do next.

## Bound

Uses household data; feeds Health; no shame tone; actionable deep links to Inbox/Plan.
""",
        "Notification-Strategy.md": """## Channels

In-app Inbox · optional push/email later.

## Notify when

Inbox item aging · partner invite · ritual ready · savings maturity · EMI due · policy change.

## Quiet

No spam for every auto-success; digest instead.
""",
        "AI-Features.md": """## Allowed

- Explain “why Inbox asked this”
- Summarize month narrative
- Suggest jar for unmapped expense
- Draft plan presets from spending patterns

## Forbidden

- Invent balances
- Silent money movement
- Fake confidence on missing data

## Relationship to Decision Board

IMP-013 was deferred for Spec-v2 *implementation timing*. Product vision still includes assistive AI under BR2-14.
""",
    }
    for name, body in caps.items():
        write(out / "capabilities" / name, hdr(name.replace("-", " ").replace(".md", "")) + body)

    # ===================== SPECS =====================
    write(
        out / "specs" / "PRD-v2.md",
        hdr("PRD v2")
        + """## Product

ViNha — household money OS for partners (Family Finances product line).

## Problem

Couples lack a shared, low-friction system that separates **real money** from **monthly intention**, so they either spreadsheet, argue, or use personal tools that ignore partnership.

## Solution

Five surfaces—Home, Money, Plan, Inbox, Together—plus Financial Health. Automation suggests; Inbox decides; Month Ritual closes the loop.

## Goals

- Time-to-first shared clarity < 15 minutes
- Weekly active partners ≥ 2 for activated households
- Inbox zero at least weekly for active plans
- Month Ritual completion rate ↑ month over month

## Non-goals (Now)

Brokerage trading, tax filing, crypto desk, offline writes, multi-household.

## Success metrics

See Success-Metrics-and-KPIs.md.

## Trace

Built on V1 domain knowledge; **not** a copy of V1 PRD screens or route map.
""",
    )

    write(
        out / "specs" / "Business-Specification-v2.md",
        hdr("Business Specification v2")
        + """## Business object model

See Domain-Model-v2 and Business-Rules-v2.

## Policies

Overspend, automation, ritual mode, membership—plain language in Together.

## Compliance posture

Household privacy; partner-visible audits for material policy edits; no claim of regulated banking.

## Change from V1 business docs

Humanized rules, safer defaults, softened sole-admin assumptions UX, Inbox/Ritual vocabulary.
""",
    )

    write(
        out / "specs" / "Feature-Specification-v2.md",
        hdr("Feature Specification v2")
        + """Detailed behaviors for F-Home, F-Money, F-Plan, F-Inbox, F-Together, F-Health, F-Auth, F-Onboard as defined in Feature-Map-v2 and capability briefs.

Each feature MUST:

- Teach or respect real≠virtual where relevant
- Define empty, loading, error, success
- Define partner visibility
- Link to BR2 rules by ID
""",
    )

    # Requirements v2
    reqs = [
        ("REQ2-001", "Home shall present real position, plan pulse, and Inbox CTA without showing jar totals as bank balance.", ["BR2-01", "F-Home"]),
        ("REQ2-002", "Unmapped expenses shall create Inbox ReviewItems resolvable to an Active jar.", ["BR2-05", "BR2-03", "F-Inbox"]),
        ("REQ2-003", "Onboarding essentials shall complete in ≤3 mandatory steps before Home.", ["F-Onboard"]),
        ("REQ2-004", "Month Ritual approval shall lock normal plan movements and enable corrections path.", ["BR2-08", "F-Plan"]),
        ("REQ2-005", "Partners shall share daily Money/Plan/Inbox capabilities; admin elevation is limited to advanced assumptions/policies as per matrix.", ["F-Together"]),
        ("REQ2-006", "Automation default for new households shall be Suggest for income placement.", ["BR2-04"]),
        ("REQ2-007", "Financial Health shall be visible without a feature-flag dead-end.", ["F-Health"]),
        ("REQ2-008", "Savings maturity and EMI due events shall appear as Inbox cards with guided actions.", ["BR2-10", "BR2-11", "F-Inbox"]),
        ("REQ2-009", "Categories shall not require a standalone primary navigation destination.", ["F-Money", "F-Plan"]),
        ("REQ2-010", "AI suggestions shall never execute ledger mutations without explicit user or policy path.", ["BR2-14"]),
        ("REQ2-011", "Assets/crypto shall not block core activation journeys.", ["F-Wealth"]),
        ("REQ2-012", "Accessibility: primary capture, Inbox resolve, and Month Ritual paths shall be keyboard operable.", ["UX"]),
    ]
    req_md = hdr("Requirements v2") + "| ID | Requirement | Links |\n|----|-------------|-------|\n"
    for rid, stmt, links in reqs:
        req_md += f"| `{rid}` | {stmt} | {', '.join(f'`{x}`' for x in links)} |\n"
    req_md += "\n_These are Product v2 requirements—not reverse-engineered claims that V1 already ships them._\n"
    write(out / "specs" / "Requirements-v2.md", req_md)

    acc_md = hdr("Acceptance v2") + "| ID | Requirement | Acceptance |\n|----|-------------|------------|\n"
    for rid, stmt, _ in reqs:
        acc_md += (
            f"| `AC2-{rid[-3:]}` | `{rid}` | Given a household in the relevant state, when the user performs the described behavior, "
            f"then the system satisfies: {stmt} Measurable via UI assertions and BR2 checks. |\n"
        )
    write(out / "specs" / "Acceptance-v2.md", acc_md)

    write(
        out / "specs" / "Success-Metrics-and-KPIs.md",
        hdr("Success Metrics and KPIs")
        + """## Product KPIs

| KPI | Definition | Target (direction) |
|-----|------------|--------------------|
| Time-to-clarity | Signup → Home with ≥1 account + plan preset | ↓ < 15 min median |
| Dual engagement | Weeks with ≥2 active members | ↑ |
| Inbox zero rate | Active households clearing Inbox weekly | ↑ |
| Ritual completion | Approved Month Rituals / eligible months | ↑ |
| Allocation confidence | Share of expenses auto/suggest-accepted without reopen | ↑ quality, not blind auto |
| Teach mark | Users who correctly identify jar ≠ bank in in-app quiz/coach | ↑ |
| Accessibility tasks | Critical paths completable via keyboard in QA | 100% |

## Guardrails

- No KPI that rewards hiding debt or inflating virtual balances
- Error rate on money mutations monitored (ties to future observability hygiene)
""",
    )

    # ===================== ROADMAP =====================
    write(
        out / "roadmap" / "Future-Roadmap.md",
        hdr("Future Roadmap")
        + f"""## Now — Product foundation

- Ship IA: Home / Money / Plan / Inbox / Together
- Progressive onboarding
- BR2 defaults (Suggest, Warn)
- Financial Health v1 score + narrative
- Align engineering hygiene with Decision Board approvals (`{DBOARD}`) where helpful (AC depth, envelopes, a11y, observability)—**without** treating them as the product vision

## Next — Collaboration depth

- Approval moments for high-impact assignments
- Richer recurring predictions
- Savings/EMI coaches polished
- Partner-visible policy audits

## Later

- Wealth (assets/crypto) lane
- Assistive AI narratives (BR2-14)
- Read-only offline cache (never offline writes)
- Multi-household
- External API versioning if clients expand (Decision Board deferred IMP-012)

## Won’t

- Offline ledger writes
- Pretending jars are banks
- Trend features that dilute family expense focus
""",
    )

    # ===================== REPORT / FREEZE =====================
    report = hdr("Product Strategy Report") + f"""## Result

Product Vision 2026 + Product Spec v2 candidate pack generated.

**Run:** `{RUN_ID}`  
**V1 knowledge:** BD `{BD}`, SPEC `{SPEC}`, final composition  
**Decision Board (hygiene input):** `{DBOARD}`  
**Status:** NOT ADOPTED as system of truth

## Outputs written

- analysis/ (challenge matrices + UX pain)
- vision/ (vision, principles, personas)
- experience/ (journeys, dashboard, UX, interaction)
- domain/ (model, BR2, features, workflows, permissions)
- capabilities/ (9 briefs)
- specs/ (PRD, business, feature, requirements, acceptance, KPIs)
- roadmap/ (Now/Next/Later)

## Attestation

- V1/BD/SPEC/Decision Board source files were not modified.
- Product v2 is a redesign using V1 as knowledge, not a cleaned copy of V1 docs.
- Real≠virtual and household partnership intents preserved.
- Bad IA (8-step forced onboarding, buried review, hub sprawl, flagged health) challenged and replaced in vision.

## STOP

No application code changes. No V1 SoT mutation. Adoption requires a future explicit run.
"""
    write(out / "PRODUCT_STRATEGY_REPORT.md", report)

    hashes_after = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in hashes_before}
    unchanged = hashes_before == hashes_after
    if not unchanged:
        raise SystemExit("Protected V1 sources changed — abort")

    manifest = {
        "run_id": RUN_ID,
        "created_at": NOW,
        "originals_unchanged": unchanged,
        "protected_hashes": hashes_before,
        "thesis": "Household money OS: Home/Money/Plan/Inbox/Together; real≠virtual axiom",
        "documents": sorted(str(p.relative_to(out)) for p in out.rglob("*.md")),
    }
    write_json(out / "manifest.json", manifest)

    ckpt = {
        "schema_version": "1.0.0",
        "checkpoint_id": f"ckpt_{RUN_ID}",
        "stage": "product-strategy-board",
        "run_id": RUN_ID,
        "created_at": NOW,
        "result": "FROZEN",
        "adopted": False,
        "originals_unchanged": unchanged,
        "outputs": f"ai-os/artifacts/product-strategy/runs/{RUN_ID}/",
        "execution_status": "completed",
        "frozen": True,
        "modify_v1_specifications": False,
    }
    write_json(AIOS / "workspace" / "checkpoints" / f"ckpt_{RUN_ID}.json", ckpt)
    write_json(AIOS / "workspace" / "checkpoints" / "LATEST_PRODUCT_STRATEGY.json", ckpt)
    write(AIOS / "workspace" / "runs" / RUN_ID / "PRODUCT_STRATEGY_REPORT.md", report)
    write(ART / "reports" / "runs" / RUN_ID / "PRODUCT_STRATEGY_REPORT.md", report)

    mirror = ROOT / "artifacts" / "product-strategy" / "runs" / RUN_ID
    if mirror.exists():
        shutil.rmtree(mirror)
    shutil.copytree(out, mirror)
    write(
        ROOT / "artifacts" / "product-strategy" / "README.md",
        f"# Product Strategy\n\nCanonical: `ai-os/artifacts/product-strategy/runs/{RUN_ID}/`\n",
    )

    print(
        json.dumps(
            {
                "run_id": RUN_ID,
                "unchanged": unchanged,
                "md_count": len(manifest["documents"]),
                "features_challenged": len(features),
                "rules_challenged": len(rules),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
