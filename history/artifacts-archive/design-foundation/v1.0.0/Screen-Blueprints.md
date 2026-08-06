---
document: Screen Blueprints
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Screen Blueprints

Structure only — **no high-fidelity UI**. Layout zones, hierarchy, flow, content priority, navigation behavior.

## Shared chrome

- **Mobile:** top context (household/title) + content + bottom nav (5 IA)  
- **Desktop:** same five IA in side/top nav; content canvas  
- **Health:** not in primary nav  

```text
Auth → Onboard (≤3) → Home
Home ↔ Money | Plan | Inbox | Together
Home → Health (chip)
Money/Plan → Inbox (when ReviewItems)
Plan → Month Ritual
```

## Home

| Zone | Priority | Content |
|------|----------|---------|
| A Real position | 1 | What we really have (ledger) |
| B Plan pulse | 2 | Intention this month — labeled intention, never as bank |
| C Inbox CTA | 3 | Count + enter Inbox if >0 |
| D Health chip | 4 | Secondary entry to Health |
| E Empty trio | when empty | Add expense / Set up plan / Invite partner |

**Flow:** Glance → tap Inbox or capture entry → optional Health.  
**Nav:** Default landing when household exists.

## Money

| Zone | Priority |
|------|----------|
| Capture entry (primary) | 1 |
| Accounts / position | 2 |
| Activity list | 3 |
| Debts / savings / cards | 4 |

**Flow:** Capture <15s → optional place/Suggest → ambiguity to Inbox.  
**Nav:** Primary tab Money.

## Plan

| Zone | Priority |
|------|----------|
| Teaching strip real≠virtual | 1 |
| Active jars / goals | 2 |
| Recurring | 3 |
| Month Ritual entry | 4 |

**Flow:** Adjust intentions → Ritual when period ready → lock.  
**Nav:** Primary tab Plan.

## Inbox

| Zone | Priority |
|------|----------|
| Queue of ReviewItem cards | 1 |
| Filters (kind) | 2 |

**Flow:** Open card → one decision → next card. Aim Inbox zero weekly.  
**Nav:** Primary tab; badge on chrome.

## Together

| Zone | Priority |
|------|----------|
| Members | 1 |
| Invites | 2 |
| Policies / preferences | 3 |
| Admin assumptions (elevated) | 4 |

**Flow:** Invite → accept deep link → partner-visible policy changes.  
**Nav:** Primary tab; also onboard gate.

## Health

| Zone | Priority |
|------|----------|
| Score + narrative | 1 |
| Light scenarios | 2 |
| EMI/goal celebration hooks | 3 |

**Flow:** From Home chip; return to Home.  
**Nav:** Secondary only.

## Settings

Prefer **Together / preferences** for household settings. Profile/auth account settings adjacent to Together or account menu — not a sixth IA tab.

## Authentication

| Zone | Priority |
|------|----------|
| Sign in / magic link | 1 |
| Error recovery | 2 |

**Flow:** Unauth → Auth → household gate → Home.  
**Nav:** Outside product shell.

## Onboarding

≤3 mandatory steps before Home (create/join household, essential money or plan seed per Product MVP). Progressive depth after.
